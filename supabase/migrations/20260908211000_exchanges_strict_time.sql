begin;
create or replace function public.exchange_command(p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
 if substring(v_fields->>'occurred_at' from 1 for 4)::integer<1 or substring(v_fields->>'occurred_at' from 12 for 2)::integer>23 or substring(v_fields->>'occurred_at' from 15 for 2)::integer>59 or substring(v_fields->>'occurred_at' from 18 for 2)::integer>59 then return jsonb_build_object('status','validation','field','occurred_at','message','Date invalide.');end if;
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
commit;
