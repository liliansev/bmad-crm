-- Additive rule: no historical rows or receipts are rewritten.
begin;

-- Unicode 17.0 Nd, identical to lib/validations/contact-name-digits.ts.
create function private.contact_name_valid(value text)
returns boolean language sql immutable strict set search_path = ''
as $$ select value !~ '[0-9٠-٩۰-۹߀-߉०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯෦-෯๐-๙໐-໙༠-༩၀-၉႐-႙០-៩᠐-᠙᥆-᥏᧐-᧙᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙꘠-꘩꣐-꣙꤀-꤉꧐-꧙꧰-꧹꩐-꩙꯰-꯹０-９𐒠-𐒩𐴰-𐴹𐵀-𐵉𑁦-𑁯𑃰-𑃹𑄶-𑄿𑇐-𑇙𑋰-𑋹𑑐-𑑙𑓐-𑓙𑙐-𑙙𑛀-𑛉𑛐-𑛣𑜰-𑜹𑣠-𑣩𑥐-𑥙𑯰-𑯹𑱐-𑱙𑵐-𑵙𑶠-𑶩𑷠-𑷩𑽐-𑽙𖄰-𖄹𖩠-𖩩𖫀-𖫉𖭐-𖭙𖵰-𖵹𜳰-𜳹𝟎-𝟿𞅀-𞅉𞋰-𞋹𞓰-𞓹𞗱-𞗺𞥐-𞥙🯰-🯹]'; $$;
revoke all on function private.contact_name_valid(text) from public, anon, authenticated;

create or replace function public.contact_command(p_command jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_command_id uuid;
  v_contact_id uuid;
  v_operation text;
  v_fields jsonb;
  v_versions jsonb;
  v_field text;
  v_first text;
  v_last text;
  v_contact public.contacts%rowtype;
  v_receipt private.contact_command_receipts%rowtype;
  v_result jsonb;
  v_conflicts text[] := array[]::text[];
begin
  if v_owner is null then
    return jsonb_build_object('status', 'unauthenticated', 'message', 'Reconnectez-vous pour enregistrer.');
  end if;
  if not private.is_crm_owner() then
    return jsonb_build_object('status', 'forbidden', 'message', 'Cet espace est privé.');
  end if;
  if jsonb_typeof(p_command) is distinct from 'object' then
    return jsonb_build_object('status', 'validation', 'message', 'Commande invalide.');
  end if;
  v_operation := p_command ->> 'operation';
  v_fields := p_command -> 'fields';
  if v_operation is null or v_operation not in ('create', 'update')
    or jsonb_typeof(p_command -> 'command_id') is distinct from 'string'
    or (p_command ->> 'command_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or jsonb_typeof(v_fields) is distinct from 'object' then
    return jsonb_build_object('status', 'validation', 'message', 'Commande invalide.');
  end if;
  v_command_id := (p_command ->> 'command_id')::uuid;
  if v_fields = '{}'::jsonb or v_fields - array['first_name', 'last_name'] <> '{}'::jsonb then
    return jsonb_build_object('status', 'validation', 'message', 'Champs de contact invalides.');
  end if;
  for v_field in select jsonb_object_keys(v_fields) loop
    if jsonb_typeof(v_fields -> v_field) is distinct from 'string' then
      return jsonb_build_object('status', 'validation', 'message', 'Le prénom et le nom doivent être du texte.');
    end if;
    if char_length(private.contact_trim(v_fields ->> v_field)) > 200 then
      return jsonb_build_object('status', 'validation', 'message', 'Maximum 200 caractères par champ.');
    end if;
  end loop;
  if v_operation = 'create' then
    if p_command - array['operation', 'command_id', 'fields'] <> '{}'::jsonb
      or not (v_fields ?& array['first_name', 'last_name']) then
      return jsonb_build_object('status', 'validation', 'message', 'Commande de création invalide.');
    end if;
  else
    v_versions := p_command -> 'base_versions';
    if p_command - array['operation', 'command_id', 'contact_id', 'fields', 'base_versions'] <> '{}'::jsonb
      or jsonb_typeof(p_command -> 'contact_id') is distinct from 'string'
      or (p_command ->> 'contact_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(v_versions) is distinct from 'object' then
      return jsonb_build_object('status', 'validation', 'message', 'Commande de correction invalide.');
    end if;
    v_contact_id := (p_command ->> 'contact_id')::uuid;
    if (select array_agg(k order by k) from jsonb_object_keys(v_fields) k)
      is distinct from (select array_agg(k order by k) from jsonb_object_keys(v_versions) k) then
      return jsonb_build_object('status', 'validation', 'message', 'Versions requises pour chaque champ modifié.');
    end if;
    for v_field in select jsonb_object_keys(v_versions) loop
      if jsonb_typeof(v_versions -> v_field) is distinct from 'number' then
        return jsonb_build_object('status', 'validation', 'message', 'Version de champ invalide.');
      end if;
      if (v_versions ->> v_field)::numeric < 1 or (v_versions ->> v_field)::numeric > 2147483646
        or (v_versions ->> v_field)::numeric <> trunc((v_versions ->> v_field)::numeric) then
        return jsonb_build_object('status', 'validation', 'message', 'Version de champ invalide.');
      end if;
    end loop;
  end if;

  -- A shared lock key serializes simultaneous retries before either creates a contact.
  -- A hash collision only serializes unrelated commands, never changes equality checks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner::text || ':' || v_command_id::text, 0));
  select * into v_receipt from private.contact_command_receipts
    where owner_id = v_owner and command_id = v_command_id;
  if found then
    if v_receipt.command <> p_command then
      return jsonb_build_object('status', 'validation', 'message', 'Cette commande a déjà été utilisée avec une autre saisie.');
    end if;
    return v_receipt.result;
  end if;

  -- Replays above retain their immutable receipt; only newly supplied names are checked.
  for v_field in select jsonb_object_keys(v_fields) loop
    if v_field in ('first_name', 'last_name') and not private.contact_name_valid(v_fields ->> v_field) then
      return jsonb_build_object('status', 'validation', 'message', 'Le prénom et le nom ne doivent pas contenir de chiffres.', 'field', v_field);
    end if;
  end loop;

  if v_operation = 'create' then
    v_first := private.contact_trim(v_fields ->> 'first_name');
    v_last := private.contact_trim(v_fields ->> 'last_name');
  else
    select * into v_contact from public.contacts where id = v_contact_id and owner_id = v_owner for update;
    if not found then
      v_result := jsonb_build_object('status', 'not_found', 'message', 'Ce contact est introuvable.');
    else
      for v_field in select jsonb_object_keys(v_fields) loop
        if (v_versions ->> v_field)::integer <> (v_contact.field_versions ->> v_field)::integer then
          v_conflicts := array_append(v_conflicts, v_field);
        end if;
      end loop;
      if cardinality(v_conflicts) > 0 then
        v_result := jsonb_build_object('status', 'conflict', 'contact', private.contact_projection_v1(v_contact),
          'message', 'Ce champ a été modifié dans une autre fenêtre.', 'fields', to_jsonb(v_conflicts));
      else
        v_first := case when v_fields ? 'first_name' then private.contact_trim(v_fields ->> 'first_name') else v_contact.first_name end;
        v_last := case when v_fields ? 'last_name' then private.contact_trim(v_fields ->> 'last_name') else v_contact.last_name end;
      end if;
    end if;
  end if;

  if v_result is null then
    if v_first = '' and v_last = '' then
      v_result := jsonb_build_object('status', 'validation', 'message', 'Indiquez un prénom ou un nom.');
    elsif v_operation = 'create' then
      insert into public.contacts(owner_id, first_name, last_name) values (v_owner, v_first, v_last) returning * into v_contact;
    else
      update public.contacts set first_name = v_first, last_name = v_last,
        field_versions = jsonb_build_object(
          'first_name', (field_versions ->> 'first_name')::integer + case when v_fields ? 'first_name' then 1 else 0 end,
          'last_name', (field_versions ->> 'last_name')::integer + case when v_fields ? 'last_name' then 1 else 0 end),
        revision = revision + 1, updated_at = clock_timestamp()
        where id = v_contact_id and owner_id = v_owner returning * into v_contact;
    end if;
    if v_result is null then
      v_result := jsonb_build_object('status', 'success', 'contact', private.contact_projection_v1(v_contact));
    end if;
  end if;
  insert into private.contact_command_receipts(owner_id, command_id, operation, command, result)
    values (v_owner, v_command_id, v_operation, p_command, v_result);
  return v_result;
end;
$$;
revoke all on function public.contact_command(jsonb) from public, anon, authenticated;
grant execute on function public.contact_command(jsonb) to authenticated;


-- Explicit v2 contract; same advisory lock and receipt namespace as v1.
create or replace function public.contact_command_v2(p_command jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_command_id uuid;
  v_contact_id uuid;
  v_operation text;
  v_fields jsonb;
  v_versions jsonb;
  v_field text;
  v_first text;
  v_last text;
  v_value text;
  v_email text;
  v_job_title text;
  v_linkedin_url text;
  v_notes text;
  v_contact public.contacts%rowtype;
  v_receipt private.contact_command_receipts%rowtype;
  v_result jsonb;
  v_conflicts text[] := array[]::text[];
begin
  if v_owner is null then
    return jsonb_build_object('status', 'unauthenticated', 'message', 'Reconnectez-vous pour enregistrer.');
  end if;
  if not private.is_crm_owner() then
    return jsonb_build_object('status', 'forbidden', 'message', 'Cet espace est privé.');
  end if;
  if jsonb_typeof(p_command) is distinct from 'object' then
    return jsonb_build_object('status', 'validation', 'message', 'Commande invalide.');
  end if;
  if p_command -> 'version' is distinct from '2'::jsonb then
    return jsonb_build_object('status', 'validation', 'message', 'Version de commande invalide.');
  end if;
  v_operation := p_command ->> 'operation';
  v_fields := p_command -> 'fields';
  if v_operation is null or v_operation not in ('create', 'update')
    or jsonb_typeof(p_command -> 'command_id') is distinct from 'string'
    or (p_command ->> 'command_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or jsonb_typeof(v_fields) is distinct from 'object' then
    return jsonb_build_object('status', 'validation', 'message', 'Commande invalide.');
  end if;
  v_command_id := (p_command ->> 'command_id')::uuid;
  if v_fields = '{}'::jsonb or v_fields - array['first_name', 'last_name', 'email', 'job_title', 'linkedin_url', 'notes'] <> '{}'::jsonb then
    return jsonb_build_object('status', 'validation', 'message', 'Champs de contact invalides.');
  end if;
  for v_field in select jsonb_object_keys(v_fields) loop
    if jsonb_typeof(v_fields -> v_field) is distinct from 'string' then
      return jsonb_build_object('status', 'validation', 'message', 'Chaque champ doit être du texte.', 'field', v_field);
    end if;
    v_value := case when v_field = 'notes' then v_fields ->> v_field else private.contact_trim(v_fields ->> v_field) end;
    if char_length(v_value) > (case v_field when 'email' then 254 when 'linkedin_url' then 2048 when 'notes' then 20000 else 200 end) then
      return jsonb_build_object('status', 'validation', 'message', 'La longueur maximale du champ est dépassée.', 'field', v_field);
    end if;
    if v_field = 'email' and not private.contact_email_valid(v_value) then
      return jsonb_build_object('status', 'validation', 'message', 'Indiquez une adresse e-mail valide.', 'field', v_field);
    end if;
    if v_field = 'linkedin_url' and not private.contact_linkedin_valid(v_value) then
      return jsonb_build_object('status', 'validation', 'message', 'Indiquez une URL absolue HTTP ou HTTPS valide.', 'field', v_field);
    end if;
  end loop;
  if v_operation = 'create' then
    if p_command - array['version', 'operation', 'command_id', 'fields'] <> '{}'::jsonb
      or not (v_fields ?& array['first_name', 'last_name']) then
      return jsonb_build_object('status', 'validation', 'message', 'Commande de création invalide.');
    end if;
  else
    v_versions := p_command -> 'base_versions';
    if p_command - array['version', 'operation', 'command_id', 'contact_id', 'fields', 'base_versions'] <> '{}'::jsonb
      or jsonb_typeof(p_command -> 'contact_id') is distinct from 'string'
      or (p_command ->> 'contact_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or jsonb_typeof(v_versions) is distinct from 'object' then
      return jsonb_build_object('status', 'validation', 'message', 'Commande de correction invalide.');
    end if;
    v_contact_id := (p_command ->> 'contact_id')::uuid;
    if (select array_agg(k order by k) from jsonb_object_keys(v_fields) k)
      is distinct from (select array_agg(k order by k) from jsonb_object_keys(v_versions) k) then
      return jsonb_build_object('status', 'validation', 'message', 'Versions requises pour chaque champ modifié.');
    end if;
    for v_field in select jsonb_object_keys(v_versions) loop
      if jsonb_typeof(v_versions -> v_field) is distinct from 'number' then
        return jsonb_build_object('status', 'validation', 'message', 'Version de champ invalide.');
      end if;
      if (v_versions ->> v_field)::numeric < 1 or (v_versions ->> v_field)::numeric > 2147483646
        or (v_versions ->> v_field)::numeric <> trunc((v_versions ->> v_field)::numeric) then
        return jsonb_build_object('status', 'validation', 'message', 'Version de champ invalide.');
      end if;
    end loop;
  end if;

  -- A shared lock key serializes simultaneous retries before either creates a contact.
  -- A hash collision only serializes unrelated commands, never changes equality checks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner::text || ':' || v_command_id::text, 0));
  select * into v_receipt from private.contact_command_receipts
    where owner_id = v_owner and command_id = v_command_id;
  if found then
    if v_receipt.command <> p_command then
      return jsonb_build_object('status', 'validation', 'message', 'Cette commande a déjà été utilisée avec une autre saisie.');
    end if;
    return v_receipt.result;
  end if;

  -- Replays above retain their immutable receipt; only newly supplied names are checked.
  for v_field in select jsonb_object_keys(v_fields) loop
    if v_field in ('first_name', 'last_name') and not private.contact_name_valid(v_fields ->> v_field) then
      return jsonb_build_object('status', 'validation', 'message', 'Le prénom et le nom ne doivent pas contenir de chiffres.', 'field', v_field);
    end if;
  end loop;

  if v_operation = 'create' then
    v_first := private.contact_trim(v_fields ->> 'first_name');
    v_last := private.contact_trim(v_fields ->> 'last_name');
    v_email := private.contact_trim(coalesce(v_fields ->> 'email', ''));
    v_job_title := private.contact_trim(coalesce(v_fields ->> 'job_title', ''));
    v_linkedin_url := private.contact_trim(coalesce(v_fields ->> 'linkedin_url', ''));
    v_notes := coalesce(v_fields ->> 'notes', '');
  else
    select * into v_contact from public.contacts where id = v_contact_id and owner_id = v_owner for update;
    if not found then
      v_result := jsonb_build_object('status', 'not_found', 'message', 'Ce contact est introuvable.');
    else
      for v_field in select jsonb_object_keys(v_fields) loop
        if (v_versions ->> v_field)::integer <> ((v_contact.field_versions || v_contact.details_versions) ->> v_field)::integer then
          v_conflicts := array_append(v_conflicts, v_field);
        end if;
      end loop;
      if cardinality(v_conflicts) > 0 then
        v_result := jsonb_build_object('status', 'conflict', 'contact', private.contact_projection_v2(v_contact),
          'message', 'Ce champ a été modifié dans une autre fenêtre.', 'fields', to_jsonb(v_conflicts));
      else
        v_first := case when v_fields ? 'first_name' then private.contact_trim(v_fields ->> 'first_name') else v_contact.first_name end;
        v_last := case when v_fields ? 'last_name' then private.contact_trim(v_fields ->> 'last_name') else v_contact.last_name end;
        v_email := case when v_fields ? 'email' then private.contact_trim(v_fields ->> 'email') else v_contact.email end;
        v_job_title := case when v_fields ? 'job_title' then private.contact_trim(v_fields ->> 'job_title') else v_contact.job_title end;
        v_linkedin_url := case when v_fields ? 'linkedin_url' then private.contact_trim(v_fields ->> 'linkedin_url') else v_contact.linkedin_url end;
        v_notes := case when v_fields ? 'notes' then v_fields ->> 'notes' else v_contact.notes end;
      end if;
    end if;
  end if;

  if v_result is null then
    if v_first = '' and v_last = '' then
      v_result := jsonb_build_object('status', 'validation', 'message', 'Indiquez un prénom ou un nom.');
    elsif v_operation = 'create' then
      insert into public.contacts(owner_id, first_name, last_name, email, job_title, linkedin_url, notes)
        values (v_owner, v_first, v_last, v_email, v_job_title, v_linkedin_url, v_notes) returning * into v_contact;
    else
      update public.contacts set first_name = v_first, last_name = v_last,
        email = v_email, job_title = v_job_title, linkedin_url = v_linkedin_url, notes = v_notes,
        field_versions = jsonb_build_object(
          'first_name', (field_versions ->> 'first_name')::integer + case when v_fields ? 'first_name' then 1 else 0 end,
          'last_name', (field_versions ->> 'last_name')::integer + case when v_fields ? 'last_name' then 1 else 0 end),
        details_versions = jsonb_build_object(
          'email', (details_versions ->> 'email')::integer + case when v_fields ? 'email' then 1 else 0 end,
          'job_title', (details_versions ->> 'job_title')::integer + case when v_fields ? 'job_title' then 1 else 0 end,
          'linkedin_url', (details_versions ->> 'linkedin_url')::integer + case when v_fields ? 'linkedin_url' then 1 else 0 end,
          'notes', (details_versions ->> 'notes')::integer + case when v_fields ? 'notes' then 1 else 0 end),
        revision = revision + 1, updated_at = clock_timestamp()
        where id = v_contact_id and owner_id = v_owner returning * into v_contact;
    end if;
    if v_result is null then
      v_result := jsonb_build_object('status', 'success', 'contact', private.contact_projection_v2(v_contact));
    end if;
  end if;
  insert into private.contact_command_receipts(owner_id, command_id, operation, command, result)
    values (v_owner, v_command_id, v_operation, p_command, v_result);
  return v_result;
end;
$$;
revoke all on function public.contact_command_v2(jsonb) from public, anon, authenticated;
grant execute on function public.contact_command_v2(jsonb) to authenticated;



commit;
