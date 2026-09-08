begin;
create type public.opportunity_stage as enum ('qualifying','discussing','proposal','won','lost');
create table public.opportunities (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references private.crm_owner(owner_id),
 title text not null check(title=private.contact_trim(title) and char_length(title) between 1 and 200),
 amount_cents bigint check(amount_cents>=0), notes text not null default '' check(char_length(notes)<=20000),
 company_id uuid, primary_contact_id uuid, stage public.opportunity_stage not null default 'qualifying',
 revision integer not null default 1 check(revision between 1 and 2147483646), workflow_revision integer not null default 1 check(workflow_revision between 1 and 2147483646),
 field_versions jsonb not null default '{"title":1,"amount_cents":1,"notes":1,"company_id":1,"primary_contact_id":1}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),unique(owner_id,id),
 foreign key(owner_id,company_id) references public.companies(owner_id,id),foreign key(owner_id,primary_contact_id) references public.contacts(owner_id,id),
 check(jsonb_typeof(field_versions)='object' and field_versions ?& array['title','amount_cents','notes','company_id','primary_contact_id'] and field_versions-array['title','amount_cents','notes','company_id','primary_contact_id']='{}'::jsonb)
);
alter table public.opportunities add constraint opportunities_title_version check(jsonb_typeof(field_versions->'title')='number' and (field_versions->>'title')::numeric between 1 and 2147483646 and (field_versions->>'title')::numeric=trunc((field_versions->>'title')::numeric));
alter table public.opportunities add constraint opportunities_amount_cents_version check(jsonb_typeof(field_versions->'amount_cents')='number' and (field_versions->>'amount_cents')::numeric between 1 and 2147483646 and (field_versions->>'amount_cents')::numeric=trunc((field_versions->>'amount_cents')::numeric));
alter table public.opportunities add constraint opportunities_notes_version check(jsonb_typeof(field_versions->'notes')='number' and (field_versions->>'notes')::numeric between 1 and 2147483646 and (field_versions->>'notes')::numeric=trunc((field_versions->>'notes')::numeric));
alter table public.opportunities add constraint opportunities_company_id_version check(jsonb_typeof(field_versions->'company_id')='number' and (field_versions->>'company_id')::numeric between 1 and 2147483646 and (field_versions->>'company_id')::numeric=trunc((field_versions->>'company_id')::numeric));
alter table public.opportunities add constraint opportunities_primary_contact_id_version check(jsonb_typeof(field_versions->'primary_contact_id')='number' and (field_versions->>'primary_contact_id')::numeric between 1 and 2147483646 and (field_versions->>'primary_contact_id')::numeric=trunc((field_versions->>'primary_contact_id')::numeric));
create index opportunities_owner_order on public.opportunities(owner_id,created_at desc,id);
create index opportunities_contact_order on public.opportunities(owner_id,primary_contact_id,created_at desc,id);
create index opportunities_company_order on public.opportunities(owner_id,company_id,created_at desc,id);
alter table public.opportunities enable row level security;
revoke all on public.opportunities from public,anon,authenticated;
grant select on public.opportunities to authenticated;
grant all on public.opportunities to service_role;
create policy opportunities_owner_select on public.opportunities for select to authenticated using((select private.is_crm_owner()) and owner_id=(select auth.uid()));
create table private.opportunity_command_receipts(owner_id uuid not null references private.crm_owner(owner_id),command_id uuid not null,command jsonb not null,result jsonb not null,created_at timestamptz not null default now(),primary key(owner_id,command_id));
revoke all on private.opportunity_command_receipts from public,anon,authenticated;
-- Every public projection replaces bigint with text before crossing JSON.
create function private.opportunity_json(p public.opportunities) returns jsonb language sql stable set search_path='' as $$
 select (to_jsonb(p)-'owner_id'-'amount_cents')||jsonb_build_object('amount_cents',p.amount_cents::text,'company_name',(select name from public.companies where owner_id=p.owner_id and id=p.company_id),'contact_name',(select private.contact_trim(first_name||' '||last_name) from public.contacts where owner_id=p.owner_id and id=p.primary_contact_id));
$$;
revoke all on function private.opportunity_json(public.opportunities) from public,anon,authenticated;
create function public.opportunity_read(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v jsonb;
begin
 if auth.uid() is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 select private.opportunity_json(o) into v from public.opportunities o where owner_id=auth.uid() and id=p_id;
 if v is null then return jsonb_build_object('status','not_found','message','Opportunité introuvable.');end if;
 return jsonb_build_object('status','success','opportunity',v);
end;$$;
create function public.opportunities_page(p_page integer,p_contact_id uuid default null,p_company_id uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v jsonb;v_count bigint;
begin
 if auth.uid() is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if p_page is null or p_page not between 1 and 100000 or (p_contact_id is not null and p_company_id is not null) then return jsonb_build_object('status','validation','message','Page invalide.');end if;
 if p_contact_id is not null and not exists(select 1 from public.contacts where owner_id=auth.uid() and id=p_contact_id) then return jsonb_build_object('status','not_found','message','Contact introuvable.');end if;
 if p_company_id is not null and not exists(select 1 from public.companies where owner_id=auth.uid() and id=p_company_id) then return jsonb_build_object('status','not_found','message','Société introuvable.');end if;
 select count(*) into v_count from public.opportunities where owner_id=auth.uid() and (p_contact_id is null or primary_contact_id=p_contact_id) and (p_company_id is null or company_id=p_company_id);
 select coalesce(jsonb_agg(private.opportunity_json(o) order by o.created_at desc,o.id),'[]'::jsonb) into v from (select * from public.opportunities where owner_id=auth.uid() and (p_contact_id is null or primary_contact_id=p_contact_id) and (p_company_id is null or company_id=p_company_id) order by created_at desc,id limit 25 offset (p_page-1)*25) o;
 return jsonb_build_object('status','success','opportunities',v,'total',v_count,'page',p_page);
end;$$;
create function public.opportunity_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_owner uuid:=auth.uid();v_command uuid;v_id uuid;v_op text;v_fields jsonb;v_versions jsonb;v_key text;v_result jsonb;v_conflicts text[]:='{}';v_next_versions jsonb;
 v_before public.opportunities%rowtype;v_after public.opportunities%rowtype;v_receipt private.opportunity_command_receipts%rowtype;
 v_contact uuid;v_company uuid;v_stage public.opportunity_stage;v_workflow integer;
begin
 if v_owner is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if jsonb_typeof(p_command) is distinct from 'object' or jsonb_typeof(p_command->'command_id') is distinct from 'string' or (p_command->>'command_id')!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
 v_command:=(p_command->>'command_id')::uuid;v_op:=p_command->>'operation';
 if v_op is null or v_op not in ('create','update','transition') then raise invalid_parameter_value;end if;
 if v_op='create' then
  if p_command-array['operation','command_id','fields']<>'{}'::jsonb then raise invalid_parameter_value;end if;
 elsif jsonb_typeof(p_command->'opportunity_id') is distinct from 'string' or (p_command->>'opportunity_id')!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;
 else v_id:=(p_command->>'opportunity_id')::uuid;end if;
 if v_op='transition' then
  if p_command-array['operation','command_id','opportunity_id','stage','base_workflow_revision']<>'{}'::jsonb or jsonb_typeof(p_command->'stage') is distinct from 'string' or jsonb_typeof(p_command->'base_workflow_revision') is distinct from 'number' or (p_command->>'base_workflow_revision')!~'^[1-9][0-9]*$' then raise invalid_parameter_value;end if;
  v_stage:=(p_command->>'stage')::public.opportunity_stage;v_workflow:=(p_command->>'base_workflow_revision')::integer;
  if v_workflow>2147483646 then raise invalid_parameter_value;end if;
 else
  v_fields:=p_command->'fields';v_versions:=p_command->'base_versions';
  if jsonb_typeof(v_fields) is distinct from 'object' or v_fields='{}'::jsonb or v_fields-array['title','amount_cents','notes','company_id','primary_contact_id']<>'{}'::jsonb then raise invalid_parameter_value;end if;
  if v_op='create' and not v_fields ?& array['title','amount_cents','notes','company_id','primary_contact_id'] then raise invalid_parameter_value;end if;
  if v_op='update' then
   if p_command-array['operation','command_id','opportunity_id','fields','base_versions']<>'{}'::jsonb or jsonb_typeof(v_versions) is distinct from 'object' then raise invalid_parameter_value;end if;
   if (select array_agg(k order by k) from jsonb_object_keys(v_fields) k) is distinct from (select array_agg(k order by k) from jsonb_object_keys(v_versions) k) then raise invalid_parameter_value;end if;
  end if;
  for v_key in select jsonb_object_keys(v_fields) loop
   if v_op='update' and (jsonb_typeof(v_versions->v_key) is distinct from 'number' or (v_versions->>v_key)!~'^[1-9][0-9]*$' or (v_versions->>v_key)::numeric>2147483646) then raise invalid_parameter_value;end if;
   if v_key in ('title','notes') then
    if jsonb_typeof(v_fields->v_key) is distinct from 'string' then raise invalid_parameter_value;end if;
   elsif jsonb_typeof(v_fields->v_key) not in ('null','string') then raise invalid_parameter_value;end if;
   if v_key in ('company_id','primary_contact_id') and (v_fields->>v_key)!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
  end loop;
  if v_fields?'title' and char_length(private.contact_trim(v_fields->>'title')) not between 1 and 200 then return jsonb_build_object('status','validation','field','title','message','Indiquez un titre de 1 à 200 caractères.');end if;
  if v_fields?'notes' and char_length(v_fields->>'notes')>20000 then return jsonb_build_object('status','validation','field','notes','message','Maximum 20 000 caractères.');end if;
  if v_fields?'amount_cents' and v_fields->>'amount_cents' is not null then
   if (v_fields->>'amount_cents')!~'^(0|[1-9][0-9]*)$' or char_length(v_fields->>'amount_cents')>19 or (v_fields->>'amount_cents')::numeric>9223372036854775807 then return jsonb_build_object('status','validation','field','amount_cents','message','Montant non valide.');end if;
  end if;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('opportunity:'||v_owner::text||':'||v_command::text,0));
 select * into v_receipt from private.opportunity_command_receipts where owner_id=v_owner and command_id=v_command;
 if found then if v_receipt.command<>p_command then return jsonb_build_object('status','validation','message','Commande déjà utilisée avec une autre saisie.');end if;return v_receipt.result;end if;
 if v_op<>'create' then
  select * into v_before from public.opportunities where owner_id=v_owner and id=v_id for update;
  if not found then return jsonb_build_object('status','not_found','message','Opportunité introuvable.');end if;
  if v_op='transition' then
   if v_before.workflow_revision<>v_workflow then v_conflicts:=array['stage'];end if;
  else
   v_next_versions:=v_before.field_versions;
   for v_key in select jsonb_object_keys(v_fields) loop
    if v_versions->v_key is distinct from v_before.field_versions->v_key then v_conflicts:=array_append(v_conflicts,v_key);end if;
    v_next_versions:=jsonb_set(v_next_versions,array[v_key],to_jsonb((v_before.field_versions->>v_key)::integer+1));
   end loop;
  end if;
  if cardinality(v_conflicts)>0 then return jsonb_build_object('status','conflict','opportunity',private.opportunity_json(v_before),'conflicting_fields',v_conflicts,'message','Ces champs ont changé. Choisissez la valeur à conserver.');end if;
 end if;
 if v_op<>'transition' then
  v_company:=case when v_fields?'company_id' then (v_fields->>'company_id')::uuid else v_before.company_id end;
  v_contact:=case when v_fields?'primary_contact_id' then (v_fields->>'primary_contact_id')::uuid else v_before.primary_contact_id end;
  if v_company is not null and not exists(select 1 from public.companies where owner_id=v_owner and id=v_company) then return jsonb_build_object('status','not_found','message','Société introuvable.');end if;
  if v_contact is not null and not exists(select 1 from public.contacts where owner_id=v_owner and id=v_contact) then return jsonb_build_object('status','not_found','message','Contact introuvable.');end if;
 end if;
 if v_op='create' then
  insert into public.opportunities(owner_id,title,amount_cents,notes,company_id,primary_contact_id) values(v_owner,private.contact_trim(v_fields->>'title'),(v_fields->>'amount_cents')::bigint,v_fields->>'notes',v_company,v_contact) returning * into v_after;
 elsif v_op='update' then
  update public.opportunities set title=case when v_fields?'title' then private.contact_trim(v_fields->>'title') else title end,amount_cents=case when v_fields?'amount_cents' then (v_fields->>'amount_cents')::bigint else amount_cents end,notes=case when v_fields?'notes' then v_fields->>'notes' else notes end,company_id=v_company,primary_contact_id=v_contact,revision=revision+1,field_versions=v_next_versions,updated_at=clock_timestamp() where owner_id=v_owner and id=v_id returning * into v_after;
 elsif v_before.stage=v_stage then v_after:=v_before;
 else update public.opportunities set stage=v_stage,revision=revision+1,workflow_revision=workflow_revision+1,updated_at=clock_timestamp() where owner_id=v_owner and id=v_id returning * into v_after;end if;
 v_result:=jsonb_build_object('status','success','opportunity',private.opportunity_json(v_after),'affected',jsonb_build_object('contact_ids',(select coalesce(jsonb_agg(distinct x) filter(where x is not null),'[]'::jsonb) from unnest(array[v_before.primary_contact_id,v_after.primary_contact_id]) x),'company_ids',(select coalesce(jsonb_agg(distinct x) filter(where x is not null),'[]'::jsonb) from unnest(array[v_before.company_id,v_after.company_id]) x)));
 insert into private.opportunity_command_receipts(owner_id,command_id,command,result) values(v_owner,v_command,p_command,v_result);return v_result;
 exception when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range or check_violation then return jsonb_build_object('status','validation','message','Commande non valide.');
end;$$;
revoke all on function public.opportunity_read(uuid),public.opportunities_page(integer,uuid,uuid),public.opportunity_command(jsonb) from public,anon,authenticated;
grant execute on function public.opportunity_read(uuid),public.opportunities_page(integer,uuid,uuid),public.opportunity_command(jsonb) to authenticated;
commit;
