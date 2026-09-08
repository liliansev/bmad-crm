begin;
create table public.companies (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references private.crm_owner(owner_id),
 name text collate public.contact_fr not null check(name=private.contact_trim(name) and char_length(name) between 1 and 200),
 field_versions jsonb not null default '{"name":1}'::jsonb check(jsonb_typeof(field_versions)='object' and field_versions ? 'name' and field_versions - 'name'='{}'::jsonb and jsonb_typeof(field_versions->'name')='number' and (field_versions->>'name')::numeric between 1 and 2147483646 and (field_versions->>'name')::numeric=trunc((field_versions->>'name')::numeric)),
 revision integer not null default 1 check(revision>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(owner_id,id)
);
create index companies_owner_order on public.companies(owner_id,name,id);
alter table public.companies enable row level security;
revoke all on public.companies from public,anon,authenticated;
grant select on public.companies to authenticated;
grant all on public.companies to service_role;
create policy companies_owner_select on public.companies for select to authenticated using((select private.is_crm_owner()) and owner_id=(select auth.uid()));
alter table public.contacts add column company_id uuid,add column company_version integer not null default 1 check(company_version>0),add constraint contacts_company_owner_fk foreign key(owner_id,company_id) references public.companies(owner_id,id);
create index contacts_company_order on public.contacts(owner_id,company_id,last_name,first_name,id);
create table private.company_command_receipts(owner_id uuid not null references private.crm_owner(owner_id),command_id uuid not null,command jsonb not null,result jsonb not null,created_at timestamptz not null default now(),primary key(owner_id,command_id));
create table private.contact_company_command_receipts(like private.company_command_receipts including all);
revoke all on private.company_command_receipts,private.contact_company_command_receipts from public,anon,authenticated;
create function public.company_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=auth.uid();v_id uuid;v_command uuid;v_name text;v_company public.companies%rowtype;v_receipt private.company_command_receipts%rowtype;v_result jsonb;v_op text;v_version numeric;
begin
 if v_owner is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if jsonb_typeof(p_command) is distinct from 'object' then raise invalid_parameter_value;end if;
 v_op:=p_command->>'operation';
 if v_op is null or v_op not in ('create','update') or jsonb_typeof(p_command->'command_id') is distinct from 'string' or (p_command->>'command_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(p_command->'fields') is distinct from 'object' or (p_command->'fields')-'name'<>'{}'::jsonb or jsonb_typeof(p_command->'fields'->'name') is distinct from 'string' then raise invalid_parameter_value;end if;
 v_command:=(p_command->>'command_id')::uuid;v_name:=private.contact_trim(p_command->'fields'->>'name');
 if char_length(v_name) not between 1 and 200 then return jsonb_build_object('status','validation','message','Indiquez un nom de société de 1 à 200 caractères.');end if;
 if v_op='create' then
 if p_command-array['operation','command_id','fields']<>'{}'::jsonb then raise invalid_parameter_value;end if;
 else
 if p_command-array['operation','command_id','fields','company_id','base_versions']<>'{}'::jsonb or jsonb_typeof(p_command->'company_id') is distinct from 'string' or (p_command->>'company_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(p_command->'base_versions') is distinct from 'object' or (p_command->'base_versions')-'name'<>'{}'::jsonb or jsonb_typeof(p_command->'base_versions'->'name') is distinct from 'number' then raise invalid_parameter_value;end if;
 v_id:=(p_command->>'company_id')::uuid;v_version:=(p_command->'base_versions'->>'name')::numeric;if v_version not between 1 and 2147483646 or v_version<>trunc(v_version) then raise invalid_parameter_value;end if;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('company:'||v_owner::text||':'||v_command::text,0));
 select * into v_receipt from private.company_command_receipts where owner_id=v_owner and command_id=v_command;
 if found then if v_receipt.command<>p_command then return jsonb_build_object('status','validation','message','Commande déjà utilisée avec une autre saisie.');end if;return v_receipt.result;end if;
 if v_op='create' then insert into public.companies(owner_id,name) values(v_owner,v_name) returning * into v_company;
 else
 select * into v_company from public.companies where owner_id=v_owner and id=v_id for update;
 if not found then v_result:=jsonb_build_object('status','not_found','message','Société introuvable.');
 elsif (v_company.field_versions->>'name')::numeric<>v_version then v_result:=jsonb_build_object('status','conflict','company',to_jsonb(v_company)-'owner_id','message','Le nom a été modifié dans une autre fenêtre.');
 else update public.companies set name=v_name,field_versions=jsonb_build_object('name',v_version+1),revision=revision+1,updated_at=clock_timestamp() where id=v_id returning * into v_company;end if;
 end if;
 if v_result is null then v_result:=jsonb_build_object('status','success','company',to_jsonb(v_company)-'owner_id');end if;
 insert into private.company_command_receipts(owner_id,command_id,command,result) values(v_owner,v_command,p_command,v_result);return v_result;
 exception when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then return jsonb_build_object('status','validation','message','Commande non valide.');
end;$$;
create function public.contact_company_read(p_contact_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if auth.uid() is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 select jsonb_build_object('status','success','relation',jsonb_build_object('contact_id',c.id,'version',c.company_version,'company',case when s.id is null then null else jsonb_build_object('id',s.id,'name',s.name) end)) into v_result from public.contacts c left join public.companies s on s.owner_id=c.owner_id and s.id=c.company_id where c.owner_id=auth.uid() and c.id=p_contact_id;
 return coalesce(v_result,jsonb_build_object('status','not_found','message','Contact introuvable.'));
end;$$;
create function public.contact_company_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=auth.uid();v_id uuid;v_company uuid;v_command uuid;v_version numeric;v_contact public.contacts%rowtype;v_receipt private.contact_company_command_receipts%rowtype;v_result jsonb;
begin
 if v_owner is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if jsonb_typeof(p_command) is distinct from 'object' or p_command-array['command_id','contact_id','company_id','base_version']<>'{}'::jsonb or not p_command ?& array['command_id','contact_id','company_id','base_version'] or jsonb_typeof(p_command->'command_id') is distinct from 'string' or jsonb_typeof(p_command->'contact_id') is distinct from 'string' or jsonb_typeof(p_command->'base_version') is distinct from 'number' or jsonb_typeof(p_command->'company_id') not in ('string','null') then raise invalid_parameter_value;end if;
 if (p_command->>'command_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or (p_command->>'contact_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or (p_command->>'company_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
 v_command:=(p_command->>'command_id')::uuid;v_id:=(p_command->>'contact_id')::uuid;v_company:=(p_command->>'company_id')::uuid;v_version:=(p_command->>'base_version')::numeric;
 if v_version not between 1 and 2147483646 or v_version<>trunc(v_version) then raise invalid_parameter_value;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('contact-company:'||v_owner::text||':'||v_command::text,0));
 select * into v_receipt from private.contact_company_command_receipts where owner_id=v_owner and command_id=v_command;
 if found then if v_receipt.command<>p_command then return jsonb_build_object('status','validation','message','Commande déjà utilisée avec une autre sélection.');end if;return v_receipt.result;end if;
 select * into v_contact from public.contacts where owner_id=v_owner and id=v_id for update;
 if not found then v_result:=jsonb_build_object('status','not_found','message','Contact introuvable.');
 elsif v_company is not null and not exists(select 1 from public.companies where id=v_company and owner_id=v_owner) then v_result:=jsonb_build_object('status','not_found','message','Société introuvable.');
 elsif v_contact.company_version<>v_version then v_result:=public.contact_company_read(v_id)||jsonb_build_object('status','conflict','message','La société a été modifiée dans une autre fenêtre.');
 else update public.contacts set company_id=v_company,company_version=company_version+1,revision=revision+1,updated_at=clock_timestamp() where id=v_id;v_result:=public.contact_company_read(v_id);end if;
 insert into private.contact_company_command_receipts(owner_id,command_id,command,result) values(v_owner,v_command,p_command,v_result);return v_result;
 exception when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then return jsonb_build_object('status','validation','message','Commande non valide.');
end;$$;
revoke all on function public.company_command(jsonb),public.contact_company_read(uuid),public.contact_company_command(jsonb) from public,anon,authenticated;
grant execute on function public.company_command(jsonb),public.contact_company_read(uuid),public.contact_company_command(jsonb) to authenticated;
commit;
