import {readFile} from 'node:fs/promises';
import {z} from 'zod';
import {companiesQaQuery as query,cleanupCompaniesQa} from './companies-qa-cleanup.mjs';
const ids=a=>a.map(id=>`'${z.uuid().parse(id)}'::uuid`).join(',')||'null::uuid';
export async function cleanupExchangesQa(input){
 const f=z.object({exchange_ids:z.array(z.uuid()),exchange_command_ids:z.array(z.uuid()),company_ids:z.array(z.uuid()),contact_ids:z.array(z.uuid()),company_command_ids:z.array(z.uuid()),relation_command_ids:z.array(z.uuid()),contact_command_ids:z.array(z.uuid())}).strict().parse(input);
 const secret=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),owner_id:z.uuid()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));const owner=`'${secret.owner_id}'::uuid`;
 const registry=await query(`select owner_id=${owner} as ok from private.crm_owner where singleton;`);if(!registry[0]?.ok)throw new Error('Cible QA incorrecte');
 const receipts=await query(`select command_id,result->'exchange'->>'id' id from private.exchange_command_receipts where owner_id=${owner} and command_id in (${ids(f.exchange_command_ids)}) and command->>'operation'='create' and result->>'status'='success';`);
 const proven=new Set(receipts.map(r=>z.uuid().parse(r.id)));
 const existingExchanges=await query(`select id from public.exchanges where id in (${ids(f.exchange_ids)});`);
 if(existingExchanges.some(row=>!proven.has(row.id)))throw new Error('Provenance échange non démontrée');
 // Validate contact/company provenance before delegating exact cleanup.
 for(const [table,key,entities,commands] of [['contact_command_receipts','contact',f.contact_ids,f.contact_command_ids],['company_command_receipts','company',f.company_ids,f.company_command_ids]]){
  const rows=await query(`select result->'${key}'->>'id' id from private.${table} where owner_id=${owner} and command_id in (${ids(commands)}) and command->>'operation'='create' and result->>'status'='success';`);
  const set=new Set(rows.map(r=>r.id));
  const entityTable=key==='contact'?'contacts':'companies';
  const existing=await query(`select id from public.${entityTable} where id in (${ids(entities)});`);
  if(existing.some(row=>!set.has(row.id)))throw new Error('Provenance fixture non démontrée');
 }
 await query(`begin;delete from public.exchanges where owner_id=${owner} and id in (${ids([...proven])});delete from private.exchange_command_receipts where owner_id=${owner} and command_id in (${ids(f.exchange_command_ids)});commit;`);
 const {exchange_ids,exchange_command_ids,...companies}=f;await cleanupCompaniesQa(companies);
 const remaining=await query(`select (select count(*) from public.exchanges where id in (${ids([...proven])}))+(select count(*) from private.exchange_command_receipts where command_id in (${ids(exchange_command_ids)})) remaining;`);
 if(Number(remaining[0].remaining)!==0)throw new Error('Nettoyage échange incomplet');return {exchanges:proven.size,remaining:0};
}
