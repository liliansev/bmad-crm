import {readFile} from 'node:fs/promises';
import {z} from 'zod';
import {companiesQaQuery as query} from './companies-qa-cleanup.mjs';
import {cleanupExchangesQa} from './exchanges-qa-cleanup.mjs';
const ids=a=>a.map(id=>`'${z.uuid().parse(id)}'::uuid`).join(',')||'null::uuid';
export async function cleanupOpportunitiesQa(input){
 const f=z.object({opportunity_ids:z.array(z.uuid()),opportunity_command_ids:z.array(z.uuid()),exchange_ids:z.array(z.uuid()),exchange_command_ids:z.array(z.uuid()),company_ids:z.array(z.uuid()),contact_ids:z.array(z.uuid()),company_command_ids:z.array(z.uuid()),relation_command_ids:z.array(z.uuid()),contact_command_ids:z.array(z.uuid())}).strict().parse(input);
 const secret=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),owner_id:z.uuid()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));const owner=`'${secret.owner_id}'::uuid`;
 const registry=await query(`select owner_id=${owner} as ok from private.crm_owner where singleton;`);if(!registry[0]?.ok)throw new Error('Cible QA incorrecte');
 const receipts=await query(`select result->'opportunity'->>'id' id from private.opportunity_command_receipts where owner_id=${owner} and command_id in (${ids(f.opportunity_command_ids)}) and command->>'operation'='create' and result->>'status'='success';`);
 const proven=new Set(receipts.map(r=>z.uuid().parse(r.id)));
 const existing=await query(`select id from public.opportunities where id in (${ids(f.opportunity_ids)});`);
 if(existing.some(row=>!proven.has(row.id)))throw new Error('Provenance opportunité non démontrée');
 // Delete only IDs backed by these exact successful creation receipts.
 await query(`begin;delete from public.opportunities where owner_id=${owner} and id in (${ids([...proven])});delete from private.opportunity_command_receipts where owner_id=${owner} and command_id in (${ids(f.opportunity_command_ids)});commit;`);
 const {opportunity_ids,opportunity_command_ids,...other}=f;await cleanupExchangesQa(other);
 const remaining=await query(`select (select count(*) from public.opportunities where id in (${ids([...proven])}))+(select count(*) from private.opportunity_command_receipts where owner_id=${owner} and command_id in (${ids(opportunity_command_ids)})) remaining;`);
 if(Number(remaining[0].remaining)!==0)throw new Error('Nettoyage opportunité incomplet');return {opportunities:proven.size,remaining:0};
}
