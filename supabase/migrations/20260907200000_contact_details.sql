begin;

-- Additive storage: the historical two-key field_versions stays untouched.
alter table public.contacts
  add column email text not null default '',
  add column job_title text not null default '',
  add column linkedin_url text not null default '',
  add column notes text not null default '',
  add column details_versions jsonb not null default '{"email":1,"job_title":1,"linkedin_url":1,"notes":1}'::jsonb;

-- Same ordinary email syntax as the application, with an explicit empty value.
create function private.contact_email_valid(value text)
returns boolean language sql immutable strict set search_path = ''
as $email$
  select value = '' or (char_length(value) <= 254
    and value !~ '^\.' and value !~ '\.\.'
    and value ~ '^[A-Za-z0-9_+''.-]*[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$'
    and split_part(value, '@', 1) !~ '\.$');
$email$;
revoke all on function private.contact_email_valid(text) from public, anon, authenticated;

-- WHATWG special hosts interpret an all-numeric final label as IPv4, including
-- abbreviated, hexadecimal and legacy octal forms. Validate before storing so
-- direct RPC calls cannot insert an address rejected by the browser URL parser.
create function private.contact_ipv4_valid(value text)
returns boolean language plpgsql immutable strict set search_path = ''
as $ipv4$
declare
  v_parts text[] := string_to_array(regexp_replace(value, '\.$', ''), '.');
  v_part text;
  v_number bigint;
  v_digit integer;
  v_base integer;
  v_i integer;
  v_j integer;
begin
  if cardinality(v_parts) > 4 then return false; end if;
  for v_i in 1..cardinality(v_parts) loop
    v_part := lower(v_parts[v_i]);
    if v_part = '' then return false; end if;
    v_base := 10;
    if left(v_part, 2) = '0x' then v_base := 16; v_part := substr(v_part, 3);
    elsif length(v_part) > 1 and left(v_part, 1) = '0' then v_base := 8; v_part := substr(v_part, 2);
    end if;
    v_number := 0;
    for v_j in 1..length(v_part) loop
      v_digit := strpos('0123456789abcdef', substr(v_part, v_j, 1)) - 1;
      if v_digit < 0 or v_digit >= v_base then return false; end if;
      v_number := v_number * v_base + v_digit;
      if v_number > 4294967295 then return false; end if;
    end loop;
    if v_i < cardinality(v_parts) and v_number > 255 then return false; end if;
    if v_i = cardinality(v_parts) and v_number >= power(256::numeric, 5 - cardinality(v_parts)) then return false; end if;
  end loop;
  return true;
end;
$ipv4$;
revoke all on function private.contact_ipv4_valid(text) from public, anon, authenticated;

create function private.contact_linkedin_valid(value text)
returns boolean language plpgsql immutable strict set search_path = ''
as $url$
declare
  v_authority text;
  v_host text;
  v_port text;
  v_last text;
  v_address inet;
  v_bytes bytea := ''::bytea;
  v_i integer;
begin
  if value = '' then return true; end if;
  if char_length(value) > 2048 or value !~* '^https?://[^/?#[:space:]]+([/?#][^[:space:]]*)?$'
    or value ~ '[[:cntrl:]]' or position(chr(92) in value) > 0 then
    return false;
  end if;
  v_authority := regexp_replace(split_part(split_part(split_part(regexp_replace(value, '^https?://', '', 'i'), '/', 1), '?', 1), '#', 1), '^.*@', '');
  if left(v_authority, 1) = '[' then
    if v_authority !~ '^\[[0-9A-Fa-f:.]+\](:[0-9]*)?$' then return false; end if;
    v_host := split_part(substr(v_authority, 2), ']', 1);
    begin
      v_address := v_host::inet;
      if family(v_address) <> 6 then return false; end if;
    exception when invalid_text_representation then return false;
    end;
    v_port := nullif(regexp_replace(v_authority, '^\[[^]]+\]:?', ''), '');
  else
    if v_authority !~ '^[^[:space:][:cntrl:]:@\[\]<>^|]+(:[0-9]*)?$' then return false; end if;
    v_host := split_part(v_authority, ':', 1);
    v_port := nullif(split_part(v_authority, ':', 2), '');
    if v_host = '' then return false; end if;
    -- Percent escapes in a special hostname are decoded before checking it.
    -- Reject malformed UTF-8, escaped forbidden delimiters, and malformed escapes.
    v_i := 1;
    while v_i <= char_length(v_host) loop
      if substr(v_host, v_i, 1) = '%' then
        if substr(v_host, v_i + 1, 2) !~ '^[A-Fa-f0-9]{2}$' then return false; end if;
        v_bytes := v_bytes || decode(substr(v_host, v_i + 1, 2), 'hex');
        v_i := v_i + 3;
      else
        v_bytes := v_bytes || convert_to(substr(v_host, v_i, 1), 'UTF8');
        v_i := v_i + 1;
      end if;
    end loop;
    begin
      v_host := normalize(convert_from(v_bytes, 'UTF8'), NFKC);
    exception when character_not_in_repertoire or untranslatable_character then return false;
    end;
    v_host := translate(v_host, U&'\3002\FF61', '..');
    if v_host = '' or v_host ~ '[[:space:][:cntrl:]%/:?#@\[\]<>^|]'
      or position(chr(92) in v_host) > 0 then return false; end if;
    v_last := regexp_replace(v_host, '\.$', '');
    v_last := reverse(split_part(reverse(v_last), '.', 1));
    if v_last ~ '^[0-9]+$' or v_last ~* '^0x[0-9a-f]*$' then
      if not private.contact_ipv4_valid(v_host) then return false; end if;
    end if;
  end if;
  if v_port is not null and v_port::numeric > 65535 then return false; end if;
  return true;
end;
$url$;
revoke all on function private.contact_linkedin_valid(text) from public, anon, authenticated;

alter table public.contacts
  add constraint contacts_details_valid check (
    email = private.contact_trim(email) and private.contact_email_valid(email)
    and job_title = private.contact_trim(job_title) and char_length(job_title) <= 200
    and linkedin_url = private.contact_trim(linkedin_url) and private.contact_linkedin_valid(linkedin_url)
    and char_length(notes) <= 20000
  ),
  add constraint contacts_details_versions_valid check (
    jsonb_typeof(details_versions) = 'object'
    and details_versions ?& array['email', 'job_title', 'linkedin_url', 'notes']
    and details_versions - array['email', 'job_title', 'linkedin_url', 'notes'] = '{}'::jsonb
    and jsonb_typeof(details_versions -> 'email') = 'number'
    and jsonb_typeof(details_versions -> 'job_title') = 'number'
    and jsonb_typeof(details_versions -> 'linkedin_url') = 'number'
    and jsonb_typeof(details_versions -> 'notes') = 'number'
    and (details_versions ->> 'email')::numeric between 1 and 2147483647
    and (details_versions ->> 'job_title')::numeric between 1 and 2147483647
    and (details_versions ->> 'linkedin_url')::numeric between 1 and 2147483647
    and (details_versions ->> 'notes')::numeric between 1 and 2147483647
    and (details_versions ->> 'email')::numeric = trunc((details_versions ->> 'email')::numeric)
    and (details_versions ->> 'job_title')::numeric = trunc((details_versions ->> 'job_title')::numeric)
    and (details_versions ->> 'linkedin_url')::numeric = trunc((details_versions ->> 'linkedin_url')::numeric)
    and (details_versions ->> 'notes')::numeric = trunc((details_versions ->> 'notes')::numeric)
  );

-- Non-unique: a duplicate warning never blocks saving.
create index contacts_owner_email on public.contacts(owner_id, lower(email)) where email <> '';

create function private.contact_projection_v1(value public.contacts)
returns jsonb language sql stable set search_path = ''
as $$
  select jsonb_build_object('id', value.id, 'first_name', value.first_name,
    'last_name', value.last_name, 'field_versions', value.field_versions,
    'revision', value.revision, 'created_at', value.created_at, 'updated_at', value.updated_at);
$$;
revoke all on function private.contact_projection_v1(public.contacts) from public, anon, authenticated;

create function private.contact_projection_v2(value public.contacts)
returns jsonb language sql stable set search_path = ''
as $$
  select private.contact_projection_v1(value) || jsonb_build_object(
    'email', value.email, 'job_title', value.job_title, 'linkedin_url', value.linkedin_url,
    'notes', value.notes, 'field_versions', value.field_versions || value.details_versions);
$$;
revoke all on function private.contact_projection_v2(public.contacts) from public, anon, authenticated;

-- Only future v1 results use the explicit historical projection. Existing receipts
-- are returned verbatim; no receipt or pending-command fingerprint is rewritten.
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
create function public.contact_command_v2(p_command jsonb)
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


-- One aggregate result bypasses PostgREST row limits. Count and page share a single
-- statement snapshot; explicit pagination can reach every matching private contact.
create function public.contact_email_duplicates(p_email text, p_exclude_id uuid default null, p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_email text;
  v_result jsonb;
begin
  if auth.uid() is null or not private.is_crm_owner() then
    if auth.uid() is null then
      return jsonb_build_object('status', 'unauthenticated', 'message', 'Reconnectez-vous pour consulter vos contacts.');
    end if;
    return jsonb_build_object('status', 'forbidden', 'message', 'Cet espace est privé.');
  end if;
  if p_email is null or p_page is null or p_page < 1 then
    return jsonb_build_object('status', 'validation', 'message', 'Recherche de doublons invalide.');
  end if;
  v_email := private.contact_trim(p_email);
  if not private.contact_email_valid(v_email) then
    return jsonb_build_object('status', 'validation', 'message', 'Adresse e-mail invalide.');
  end if;
  with matches as materialized (
    select c.id, c.first_name, c.last_name
    from public.contacts c
    where c.owner_id = (select auth.uid()) and v_email <> ''
      and lower(c.email) = lower(v_email)
      and (p_exclude_id is null or c.id <> p_exclude_id)
  ), page_rows as (
    select * from matches order by last_name collate public.contact_fr, first_name collate public.contact_fr, id
    limit 25 offset ((p_page::bigint - 1) * 25)
  )
  select jsonb_build_object('status', 'success', 'contacts', coalesce((select jsonb_agg(to_jsonb(p) order by p.last_name collate public.contact_fr, p.first_name collate public.contact_fr, p.id) from page_rows p), '[]'::jsonb),
    'total', (select count(*) from matches), 'page', p_page)
    into v_result;
  return v_result;
end;
$$;
revoke all on function public.contact_email_duplicates(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.contact_email_duplicates(text, uuid, integer) to authenticated;

commit;
