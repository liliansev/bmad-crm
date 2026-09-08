begin;
alter table public.contacts add constraint contacts_owner_id_unique unique(owner_id,id);
create type public.exchange_channel as enum ('phone','email','video','other');
create table public.exchanges (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references private.crm_owner(owner_id),
 contact_id uuid not null,company_id uuid,occurred_at timestamptz not null check(isfinite(occurred_at)),channel public.exchange_channel not null,notes text not null default '' check(char_length(notes)<=20000),
 field_versions jsonb not null default '{"contact_id":1,"company_id":1,"occurred_at":1,"channel":1,"notes":1}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),
 foreign key(owner_id,contact_id) references public.contacts(owner_id,id),foreign key(owner_id,company_id) references public.companies(owner_id,id),unique(owner_id,id)
);
create index exchanges_contact_history on public.exchanges(owner_id,contact_id,occurred_at desc,created_at desc,id desc);
create index exchanges_company_history on public.exchanges(owner_id,company_id,occurred_at desc,created_at desc,id desc);
alter table public.exchanges enable row level security;
revoke all on public.exchanges from public,anon,authenticated;
grant select on public.exchanges to authenticated;
grant all on public.exchanges to service_role;
create policy exchanges_owner_select on public.exchanges for select to authenticated using((select private.is_crm_owner()) and owner_id=(select auth.uid()));
create table private.exchange_command_receipts(like private.company_command_receipts including all);
revoke all on private.exchange_command_receipts from public,anon,authenticated;
create function public.exchange_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=auth.uid();v_command uuid;v_contact uuid;v_company uuid;v_date timestamptz;v_fields jsonb;v_receipt private.exchange_command_receipts%rowtype;v_exchange public.exchanges%rowtype;v_result jsonb;
begin
 if v_owner is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if jsonb_typeof(p_command) is distinct from 'object' or p_command-array['operation','command_id','fields']<>'{}'::jsonb or p_command->>'operation' is distinct from 'create' or jsonb_typeof(p_command->'command_id') is distinct from 'string' or (p_command->>'command_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
 v_command:=(p_command->>'command_id')::uuid;v_fields:=p_command->'fields';
 if jsonb_typeof(v_fields) is distinct from 'object' or not v_fields ?& array['contact_id','company_id','occurred_at','channel','notes'] or v_fields-array['contact_id','company_id','occurred_at','channel','notes']<>'{}'::jsonb or jsonb_typeof(v_fields->'contact_id') is distinct from 'string' or jsonb_typeof(v_fields->'company_id') not in ('null','string') or jsonb_typeof(v_fields->'occurred_at') is distinct from 'string' or jsonb_typeof(v_fields->'channel') is distinct from 'string' or jsonb_typeof(v_fields->'notes') is distinct from 'string' then raise invalid_parameter_value;end if;
 if (v_fields->>'contact_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or (v_fields->>'company_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
 v_contact:=(v_fields->>'contact_id')::uuid;v_company:=(v_fields->>'company_id')::uuid;
 if v_fields->>'channel' not in ('phone','email','video','other') then return jsonb_build_object('status','validation','field','channel','message','Choisissez un canal.');end if;
 if char_length(v_fields->>'notes')>20000 then return jsonb_build_object('status','validation','field','notes','message','Maximum 20 000 caractères.');end if;
 -- An explicit offset is mandatory: PostgreSQL must never infer a timezone or normalize DST.
 if (v_fields->>'occurred_at') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then return jsonb_build_object('status','validation','field','occurred_at','message','Date et décalage UTC requis.');end if;
 begin v_date:=(v_fields->>'occurred_at')::timestamptz;exception when others then return jsonb_build_object('status','validation','field','occurred_at','message','Date invalide.');end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('exchange:'||v_owner::text||':'||v_command::text,0));
 select * into v_receipt from private.exchange_command_receipts where owner_id=v_owner and command_id=v_command;
 if found then if v_receipt.command<>p_command then return jsonb_build_object('status','validation','message','Commande déjà utilisée avec une autre saisie.');end if;return v_receipt.result;end if;
 if not isfinite(v_date) or v_date>clock_timestamp() then return jsonb_build_object('status','validation','field','occurred_at','message','La date ne peut pas être future.');end if;
 if not exists(select 1 from public.contacts where owner_id=v_owner and id=v_contact) then return jsonb_build_object('status','not_found','message','Contact introuvable.');end if;
 if v_company is not null and not exists(select 1 from public.companies where owner_id=v_owner and id=v_company) then return jsonb_build_object('status','not_found','message','Société introuvable.');end if;
 insert into public.exchanges(owner_id,contact_id,company_id,occurred_at,channel,notes) values(v_owner,v_contact,v_company,v_date,(v_fields->>'channel')::public.exchange_channel,v_fields->>'notes') returning * into v_exchange;
 v_result:=jsonb_build_object('status','success','exchange',to_jsonb(v_exchange)-'owner_id');
 insert into private.exchange_command_receipts(owner_id,command_id,command,result) values(v_owner,v_command,p_command,v_result);return v_result;
 exception when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then return jsonb_build_object('status','validation','message','Commande non valide.');
end;$$;
create function public.exchanges_read(p_contact_id uuid default null,p_company_id uuid default null,p_page integer default 1) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_total bigint;v_last jsonb;v_rows jsonb;
begin
 if auth.uid() is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if p_page is null or p_page<1 or p_page>100000 or (p_contact_id is null)=(p_company_id is null) then return jsonb_build_object('status','validation','message','Lecture non valide.');end if;
 if p_contact_id is not null and not exists(select 1 from public.contacts where owner_id=auth.uid() and id=p_contact_id) or p_company_id is not null and not exists(select 1 from public.companies where owner_id=auth.uid() and id=p_company_id) then return jsonb_build_object('status','not_found','message','Fiche introuvable.');end if;
 select count(*) into v_total from public.exchanges where owner_id=auth.uid() and (p_contact_id is null or contact_id=p_contact_id) and (p_company_id is null or company_id=p_company_id);
 select to_jsonb(e)-'owner_id' into v_last from public.exchanges e where owner_id=auth.uid() and (p_contact_id is null or contact_id=p_contact_id) and (p_company_id is null or company_id=p_company_id) order by occurred_at desc,created_at desc,id desc limit 1;
 select coalesce(jsonb_agg(to_jsonb(e)-'owner_id'),'[]'::jsonb) into v_rows from (select * from public.exchanges where owner_id=auth.uid() and (p_contact_id is null or contact_id=p_contact_id) and (p_company_id is null or company_id=p_company_id) order by occurred_at desc,created_at desc,id desc limit 25 offset (p_page-1)*25) e;
 return jsonb_build_object('status','success','exchanges',v_rows,'total',v_total,'page',p_page,'last_interaction',v_last);
end;$$;
create function public.contacts_last_interactions(p_ids uuid[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_crm_owner() then return '{}'::jsonb;end if;
 if cardinality(p_ids)>25 then raise invalid_parameter_value;end if;
 return coalesce((select jsonb_object_agg(id,occurred_at) from (select c.id,(select e.occurred_at from public.exchanges e where e.owner_id=auth.uid() and e.contact_id=c.id order by e.occurred_at desc,e.created_at desc,e.id desc limit 1) occurred_at from public.contacts c where c.owner_id=auth.uid() and c.id=any(p_ids)) projections),'{}'::jsonb);
end;$$;
revoke all on function public.exchange_command(jsonb),public.exchanges_read(uuid,uuid,integer),public.contacts_last_interactions(uuid[]) from public,anon,authenticated;
grant execute on function public.exchange_command(jsonb),public.exchanges_read(uuid,uuid,integer),public.contacts_last_interactions(uuid[]) to authenticated;
commit;
