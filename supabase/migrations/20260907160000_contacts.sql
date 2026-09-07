begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Bootstrap separately using the already verified Auth UUID. No identity in migrations.
create table private.crm_owner (
  singleton boolean primary key default true check (singleton),
  owner_id uuid not null unique references auth.users(id)
);
revoke all on private.crm_owner from public, anon, authenticated;

create function private.is_crm_owner()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.crm_owner o
    where o.singleton and o.owner_id = (select auth.uid())
  );
$$;
revoke all on function private.is_crm_owner() from public, anon, authenticated;
grant execute on function private.is_crm_owner() to authenticated;

-- Match JavaScript String.trim(), including NBSP, BOM and Unicode whitespace.
create function private.contact_trim(value text)
returns text language sql immutable strict set search_path = ''
as $$
  select pg_catalog.btrim(value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
$$;
revoke all on function private.contact_trim(text) from public, anon, authenticated;

-- Level 2 keeps accent distinctions and ignores case; UUID supplies a stable tie-break.
create collation public.contact_fr (provider = icu, locale = 'fr-u-ks-level2', deterministic = false);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references private.crm_owner(owner_id),
  first_name text collate public.contact_fr not null default '',
  last_name text collate public.contact_fr not null default '',
  field_versions jsonb not null default '{"first_name":1,"last_name":1}'::jsonb,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_names_valid check (
    first_name = private.contact_trim(first_name)
    and last_name = private.contact_trim(last_name)
    and char_length(first_name) <= 200 and char_length(last_name) <= 200
    and (first_name <> '' or last_name <> '')
  ),
  constraint contacts_versions_valid check (
    jsonb_typeof(field_versions) = 'object'
    and field_versions ?& array['first_name', 'last_name']
    and field_versions - array['first_name', 'last_name'] = '{}'::jsonb
    and jsonb_typeof(field_versions -> 'first_name') = 'number'
    and jsonb_typeof(field_versions -> 'last_name') = 'number'
    and (field_versions ->> 'first_name')::numeric between 1 and 2147483647
    and (field_versions ->> 'last_name')::numeric between 1 and 2147483647
    and (field_versions ->> 'first_name')::numeric = trunc((field_versions ->> 'first_name')::numeric)
    and (field_versions ->> 'last_name')::numeric = trunc((field_versions ->> 'last_name')::numeric)
  )
);
create index contacts_owner_order on public.contacts(owner_id, last_name, first_name, id);
alter table public.contacts enable row level security;
revoke all on public.contacts from public, anon, authenticated;
grant select on public.contacts to authenticated;
grant all on public.contacts to service_role;
create policy contacts_owner_select on public.contacts for select to authenticated
using ((select private.is_crm_owner()) and owner_id = (select auth.uid()));

create table private.contact_command_receipts (
  owner_id uuid not null references private.crm_owner(owner_id),
  command_id uuid not null,
  operation text not null check (operation in ('create', 'update')),
  -- jsonb is the canonical exact fingerprint: no probabilistic hash comparison.
  command jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, command_id)
);
revoke all on private.contact_command_receipts from public, anon, authenticated;

create function public.contact_command(p_command jsonb)
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
        v_result := jsonb_build_object('status', 'conflict', 'contact', to_jsonb(v_contact) - 'owner_id',
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
      v_result := jsonb_build_object('status', 'success', 'contact', to_jsonb(v_contact) - 'owner_id');
    end if;
  end if;
  insert into private.contact_command_receipts(owner_id, command_id, operation, command, result)
    values (v_owner, v_command_id, v_operation, p_command, v_result);
  return v_result;
end;
$$;
revoke all on function public.contact_command(jsonb) from public, anon, authenticated;
grant execute on function public.contact_command(jsonb) to authenticated;

commit;
