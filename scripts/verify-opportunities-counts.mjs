import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {z} from 'zod';
import {companiesQaQuery as query} from './companies-qa-cleanup.mjs';
const {owner_id}=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),owner_id:z.uuid()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
const outsider=randomUUID();const checks=['empty','max25','max26_refused','null_refused','missing_contact_refused','global26','count_only','permutation','move_old_new','remove_link','foreign_owner_refused'];
const snapshot=()=>query(`select 'contacts' kind,id::text id,md5(to_jsonb(t)::text) fingerprint from public.contacts t union all select 'opportunities',id::text,md5(to_jsonb(t)::text) from public.opportunities t union all select 'contact_receipts',command_id::text,md5(to_jsonb(t)::text) from private.contact_command_receipts t union all select 'opportunity_receipts',command_id::text,md5(to_jsonb(t)::text) from private.opportunity_command_receipts t order by kind,id;`);
const baseline=await snapshot();let result,failure;
try{result=await query(`begin;
set local role authenticated;
do $$
declare c uuid;d uuid;o jsonb;v jsonb;command jsonb;ok boolean;ids uuid[]:='{}';failure text;
begin
 perform pg_catalog.set_config('request.jwt.claim.sub','${owner_id}',true);
 begin
  v:=public.contacts_opportunity_counts('{}'::uuid[]);if v<>'{}'::jsonb then raise exception 'empty';end if;
  ok:=false;begin perform public.contacts_opportunity_counts(null);exception when invalid_parameter_value then ok:=true;end;if not ok then raise exception 'null_refused';end if;
  ok:=false;begin perform public.contacts_opportunity_counts(array[gen_random_uuid()]);exception when insufficient_privilege then ok:=true;end;if not ok then raise exception 'missing_contact_refused';end if;
  command:=jsonb_build_object('version',2,'operation','create','command_id',gen_random_uuid(),'fields',jsonb_build_object('first_name','Compteurs','last_name','Fictifs','email','','job_title','','linkedin_url','','notes',''));
  v:=public.contact_command_v2(command);c:=(v->'contact'->>'id')::uuid;if c is null then raise exception 'contact fixture';end if;
  command:=jsonb_set(command,'{command_id}',to_jsonb(gen_random_uuid()));v:=public.contact_command_v2(command);d:=(v->'contact'->>'id')::uuid;if d is null then raise exception 'second fixture';end if;
  v:=public.contacts_opportunity_counts(array_fill(c,array[25]));if v->>c::text is distinct from '0' then raise exception 'max25';end if;
  ok:=false;begin perform public.contacts_opportunity_counts(array_fill(c,array[26]));exception when invalid_parameter_value then ok:=true;end;if not ok then raise exception 'max26_refused';end if;
  for i in 1..26 loop
   v:=public.opportunity_command(jsonb_build_object('operation','create','command_id',gen_random_uuid(),'fields',jsonb_build_object('title','Compteur fictif '||i,'amount_cents',null,'notes','Notes non projetées','company_id',null,'primary_contact_id',c)));
   if v->>'status' is distinct from 'success' then raise exception 'opportunity fixture';end if;ids:=array_append(ids,(v->'opportunity'->>'id')::uuid);
  end loop;
  v:=public.contacts_opportunity_counts(array[c,d]);if v->>c::text is distinct from '26' or v->>d::text is distinct from '0' then raise exception 'global26';end if;
  if v is distinct from public.contacts_opportunity_counts(array[d,c]) then raise exception 'permutation';end if;
  if (select count(*) from jsonb_each(v))<>2 or exists(select 1 from jsonb_each(v) e where jsonb_typeof(e.value)<>'number') then raise exception 'count_only';end if;
  for i in 1..3 loop
   o:=public.opportunity_read(ids[i])->'opportunity';
   v:=public.opportunity_command(jsonb_build_object('operation','update','command_id',gen_random_uuid(),'opportunity_id',ids[i],'fields',jsonb_build_object('primary_contact_id',d),'base_versions',jsonb_build_object('primary_contact_id',o->'field_versions'->'primary_contact_id')));if v->>'status' is distinct from 'success' then raise exception 'move fixture';end if;
  end loop;
  v:=public.contacts_opportunity_counts(array[c,d]);if v->>c::text is distinct from '23' or v->>d::text is distinct from '3' then raise exception 'move_old_new';end if;
  o:=public.opportunity_read(ids[1])->'opportunity';v:=public.opportunity_command(jsonb_build_object('operation','update','command_id',gen_random_uuid(),'opportunity_id',ids[1],'fields',jsonb_build_object('primary_contact_id',null),'base_versions',jsonb_build_object('primary_contact_id',o->'field_versions'->'primary_contact_id')));
  v:=public.contacts_opportunity_counts(array[c,d]);if v->>c::text is distinct from '23' or v->>d::text is distinct from '2' then raise exception 'remove_link';end if;
  perform pg_catalog.set_config('request.jwt.claim.sub','${outsider}',true);ok:=false;begin perform public.contacts_opportunity_counts(array[c]);exception when insufficient_privilege then ok:=true;end;if not ok then raise exception 'foreign_owner_refused';end if;
 exception when others then failure:=sqlerrm;end;
 perform pg_catalog.set_config('qa.opportunity_counts_result',jsonb_build_object('success',failure is null,'failure',failure)::text,true);
end;$$;
select current_setting('qa.opportunity_counts_result')::jsonb result;
rollback;`);
}catch(error){failure=error.message;}
const after=await snapshot(),preserved=JSON.stringify(after)===JSON.stringify(baseline);
const outcome=result?.find(row=>row.result)?.result;const success=outcome?.success===true&&preserved&&!failure;
await mkdir('_bmad-output/implementation-artifacts/verification/3-1',{recursive:true});await writeFile('_bmad-output/implementation-artifacts/verification/3-1/opportunities-counts.json',JSON.stringify({success,metadata:{executed_at:new Date().toISOString(),node:process.version,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()},mode:'authenticated SQL transaction rolled back',checks:checks.map(name=>({name,passed:outcome?.success===true})),preserved,outcome,failure},null,2));console.log({success,preserved,checks:checks.length,failure:failure??outcome?.failure});if(!success)process.exitCode=1;
