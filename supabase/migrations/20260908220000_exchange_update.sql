begin;
-- Preserve the exact create path and its immutable historical receipts.
alter function public.exchange_command(jsonb) rename to exchange_create_command_v1;
revoke all on function public.exchange_create_command_v1(jsonb) from public,anon,authenticated;
create function public.exchange_read(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_exchange jsonb;
begin
 if auth.uid() is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 select (to_jsonb(e)-'owner_id')||jsonb_build_object('contact_name',private.contact_trim(c.first_name||' '||c.last_name),'company_name',s.name) into v_exchange from public.exchanges e join public.contacts c on c.owner_id=e.owner_id and c.id=e.contact_id left join public.companies s on s.owner_id=e.owner_id and s.id=e.company_id where e.owner_id=auth.uid() and e.id=p_id;
 if v_exchange is null then return jsonb_build_object('status','not_found','message','Échange introuvable.');end if;
 return jsonb_build_object('status','success','exchange',v_exchange);
end;$$;
create function public.exchange_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_owner uuid:=auth.uid();v_command uuid;v_id uuid;v_fields jsonb;v_versions jsonb;v_key text;
 v_receipt private.exchange_command_receipts%rowtype;v_before public.exchanges%rowtype;v_after public.exchanges%rowtype;
 v_conflicts text[]:='{}';v_contact uuid;v_company uuid;v_date timestamptz;v_next_versions jsonb;v_result jsonb;
begin
 if v_owner is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if p_command->>'operation'='create' then return public.exchange_create_command_v1(p_command);end if;
 if jsonb_typeof(p_command) is distinct from 'object' or p_command-array['operation','command_id','exchange_id','fields','base_versions']<>'{}'::jsonb or p_command->>'operation' is distinct from 'update' or jsonb_typeof(p_command->'command_id') is distinct from 'string' or jsonb_typeof(p_command->'exchange_id') is distinct from 'string' or (p_command->>'command_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or (p_command->>'exchange_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
 v_command:=(p_command->>'command_id')::uuid;v_id:=(p_command->>'exchange_id')::uuid;v_fields:=p_command->'fields';v_versions:=p_command->'base_versions';
 if jsonb_typeof(v_fields) is distinct from 'object' or v_fields='{}'::jsonb or v_fields-array['contact_id','company_id','occurred_at','channel','notes']<>'{}'::jsonb or jsonb_typeof(v_versions) is distinct from 'object' then raise invalid_parameter_value;end if;
 if (select array_agg(k order by k) from jsonb_object_keys(v_fields) k) is distinct from (select array_agg(k order by k) from jsonb_object_keys(v_versions) k) then raise invalid_parameter_value;end if;
 for v_key in select jsonb_object_keys(v_fields) loop
  if jsonb_typeof(v_versions->v_key) is distinct from 'number' or (v_versions->>v_key)!~'^[1-9][0-9]*$' then raise invalid_parameter_value;end if;
  if v_key='company_id' then
   if jsonb_typeof(v_fields->v_key) not in ('null','string') then raise invalid_parameter_value;end if;
  elsif jsonb_typeof(v_fields->v_key) is distinct from 'string' then raise invalid_parameter_value;end if;
  if v_key in ('company_id','contact_id') and (v_fields->>v_key)!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
 end loop;
 if v_fields?'channel' and v_fields->>'channel' not in ('phone','email','video','other') then return jsonb_build_object('status','validation','field','channel','message','Choisissez un canal.');end if;
 if v_fields?'notes' and char_length(v_fields->>'notes')>20000 then return jsonb_build_object('status','validation','field','notes','message','Maximum 20 000 caractères.');end if;
 if v_fields?'occurred_at' then
  if (v_fields->>'occurred_at') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then return jsonb_build_object('status','validation','field','occurred_at','message','Date et décalage UTC requis.');end if;
  if substring(v_fields->>'occurred_at' from 1 for 4)::integer<1 or substring(v_fields->>'occurred_at' from 12 for 2)::integer>23 or substring(v_fields->>'occurred_at' from 15 for 2)::integer>59 or substring(v_fields->>'occurred_at' from 18 for 2)::integer>59 then return jsonb_build_object('status','validation','field','occurred_at','message','Date invalide.');end if;
  begin v_date:=(v_fields->>'occurred_at')::timestamptz;exception when others then return jsonb_build_object('status','validation','field','occurred_at','message','Date invalide.');end;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('exchange:'||v_owner::text||':'||v_command::text,0));
 select * into v_receipt from private.exchange_command_receipts where owner_id=v_owner and command_id=v_command;
 if found then if v_receipt.command<>p_command then return jsonb_build_object('status','validation','message','Commande déjà utilisée avec une autre saisie.');end if;return v_receipt.result;end if;
 select * into v_before from public.exchanges where owner_id=v_owner and id=v_id for update;
 if not found then return jsonb_build_object('status','not_found','message','Échange introuvable.');end if;
 v_next_versions:=v_before.field_versions;
 for v_key in select jsonb_object_keys(v_fields) loop
  if v_versions->v_key is distinct from v_before.field_versions->v_key then v_conflicts:=array_append(v_conflicts,v_key);end if;
  v_next_versions:=jsonb_set(v_next_versions,array[v_key],to_jsonb((v_before.field_versions->>v_key)::integer+1));
 end loop;
 if cardinality(v_conflicts)>0 then return jsonb_build_object('status','conflict','exchange',public.exchange_read(v_id)->'exchange','conflicting_fields',v_conflicts,'message','Certains champs ont changé. Choisissez la valeur à conserver.');end if;
 if v_fields?'occurred_at' and (not isfinite(v_date) or v_date>clock_timestamp()) then return jsonb_build_object('status','validation','field','occurred_at','message','La date ne peut pas être future.');end if;
 v_contact:=case when v_fields?'contact_id' then (v_fields->>'contact_id')::uuid else v_before.contact_id end;
 v_company:=case when v_fields?'company_id' then (v_fields->>'company_id')::uuid else v_before.company_id end;
 if not exists(select 1 from public.contacts where owner_id=v_owner and id=v_contact) then return jsonb_build_object('status','not_found','message','Contact introuvable.');end if;
 if v_company is not null and not exists(select 1 from public.companies where owner_id=v_owner and id=v_company) then return jsonb_build_object('status','not_found','message','Société introuvable.');end if;
 update public.exchanges set contact_id=v_contact,company_id=v_company,occurred_at=case when v_fields?'occurred_at' then v_date else occurred_at end,channel=case when v_fields?'channel' then (v_fields->>'channel')::public.exchange_channel else channel end,notes=case when v_fields?'notes' then v_fields->>'notes' else notes end,field_versions=v_next_versions,revision=revision+1,updated_at=clock_timestamp() where owner_id=v_owner and id=v_id returning * into v_after;
 v_result:=jsonb_build_object('status','success','exchange',public.exchange_read(v_id)->'exchange','affected',jsonb_build_object('contact_ids',(select jsonb_agg(distinct x) from unnest(array[v_before.contact_id,v_after.contact_id]) x),'company_ids',(select coalesce(jsonb_agg(distinct x) filter(where x is not null),'[]'::jsonb) from unnest(array[v_before.company_id,v_after.company_id]) x)));
 insert into private.exchange_command_receipts(owner_id,command_id,command,result) values(v_owner,v_command,p_command,v_result);
 return v_result;
 exception when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then return jsonb_build_object('status','validation','message','Commande non valide.');
end;$$;
revoke all on function public.exchange_command(jsonb),public.exchange_read(uuid) from public,anon,authenticated;
grant execute on function public.exchange_command(jsonb),public.exchange_read(uuid) to authenticated;
commit;
