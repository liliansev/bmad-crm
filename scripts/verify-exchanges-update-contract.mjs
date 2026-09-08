import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {exchangeCommandSchema,exchangeResultSchema} from '../lib/validations/exchanges.ts';
const checks=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push({name,passed:true});};
const command={operation:'update',command_id:randomUUID(),exchange_id:randomUUID(),fields:{notes:''},base_versions:{notes:3}};
check('Effacement ciblé accepté',exchangeCommandSchema.safeParse(command).success);
for(const [name,change] of [
 ['Patch vide',{fields:{},base_versions:{}}],
 ['Version manquante',{base_versions:{}}],
 ['Version superflue',{base_versions:{notes:3,channel:1}}],
 ['Version fractionnaire',{base_versions:{notes:1.2}}],
 ['Version nulle',{base_versions:{notes:0}}],
 ['Métadonnée interdite',{fields:{notes:'x',created_at:'2026-01-01T00:00:00Z'}}],
 ['Contact null',{fields:{contact_id:null},base_versions:{contact_id:1}}],
 ['Notes trop longues',{fields:{notes:'😀'.repeat(20001)}}],
 ['Surrogate isolé',{fields:{notes:'\ud800'}}],
 ['NUL',{fields:{notes:'\u0000'}}],
])check(name+' refusé',!exchangeCommandSchema.safeParse({...command,...change}).success);
check('Société null acceptée',exchangeCommandSchema.safeParse({...command,fields:{company_id:null},base_versions:{company_id:1}}).success);
const exchange={id:command.exchange_id,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z',revision:1,field_versions:{contact_id:1,company_id:1,occurred_at:1,channel:1,notes:1},contact_id:randomUUID(),company_id:null,occurred_at:'2026-01-01T00:00:00Z',channel:'phone',notes:''};
const receipt={status:'success',exchange};
assert.deepEqual(exchangeResultSchema.parse(receipt),receipt);check('Ancien reçu create inchangé',true);
check('Conflit ciblé reçu',exchangeResultSchema.safeParse({status:'conflict',exchange,conflicting_fields:['notes'],message:'Conflit'}).success);
check('Projection affected reçue',exchangeResultSchema.safeParse({...receipt,affected:{contact_ids:[exchange.contact_id],company_ids:[]}}).success);
await mkdir('_bmad-output/implementation-artifacts/verification/2-5',{recursive:true});
await writeFile('_bmad-output/implementation-artifacts/verification/2-5/exchanges-update-contract.json',JSON.stringify({success:true,checks},null,2));
console.log(`PASS ${checks.length} contrôles du contrat update/create`);
