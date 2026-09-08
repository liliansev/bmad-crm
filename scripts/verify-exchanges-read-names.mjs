import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {cleanupExchangesQa} from './exchanges-qa-cleanup.mjs';
import {companiesQaQuery as query} from './companies-qa-cleanup.mjs';
import {exchangeResultSchema,exchangesPageSchema,exchangeCommandSchema} from '../lib/validations/exchanges.ts';
const secret=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),anon_key:z.string(),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
const client=createClient(`https://${secret.project_ref}.supabase.co`,secret.anon_key,{auth:{persistSession:false,autoRefreshToken:false}});
const f={exchange_ids:[],exchange_command_ids:[],company_ids:[],contact_ids:[],company_command_ids:[],relation_command_ids:[],contact_command_ids:[]};
const manifest='.local/exchanges-read-names-fixtures.json',checks=[];let success=false,assertionsCompleted=false;
const check=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
async function rpc(name,command){const kind=name==='exchange_command'?'exchange':name==='company_command'?'company':'contact';f[kind+'_command_ids'].push(command.command_id);await writeFile(manifest,JSON.stringify(f),{mode:0o600});const {data,error}=await client.rpc(name,{p_command:command});assert.equal(error,null);assert.equal(data.status,'success');f[kind+'_ids'].push(data[kind].id);await writeFile(manifest,JSON.stringify(f),{mode:0o600});return data;}
try{
 try{await cleanupExchangesQa(JSON.parse(await readFile(manifest,'utf8')));await rm(manifest);}catch(error){if(error.code!=='ENOENT')throw error;}
 assert.equal((await client.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).data.user?.id,secret.owner_id);
 const company=(await rpc('company_command',{operation:'create',command_id:randomUUID(),fields:{name:'Projection société fictive'}})).company;
 const contact=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Projection',last_name:'Fictive',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;
 const command={operation:'create',command_id:randomUUID(),fields:{contact_id:contact.id,company_id:company.id,occurred_at:'2026-01-01T10:00:00Z',channel:'email',notes:''}};
 const receipt=await rpc('exchange_command',command);check('Create contract unchanged',!('contact_name' in receipt.exchange)&&exchangeResultSchema.safeParse(receipt).success);
 check('Readonly names rejected in commands',!exchangeCommandSchema.safeParse({...command,fields:{...command.fields,contact_name:'Injected'}}).success);
 const before=await query(`select md5(to_jsonb(r)::text) fingerprint from private.exchange_command_receipts r where command_id='${command.command_id}';`);
 const {data:history,error}=await client.rpc('exchanges_read',{p_company_id:company.id,p_page:1});assert.equal(error,null);
 check('Company history identifies contact and historic company',exchangesPageSchema.safeParse(history).success&&history.exchanges[0].contact_name==='Projection Fictive'&&history.exchanges[0].company_name==='Projection société fictive');
 check('Last interaction carries same identities',history.last_interaction.contact_name==='Projection Fictive'&&history.last_interaction.company_name==='Projection société fictive');
 assert.deepEqual(await query(`select md5(to_jsonb(r)::text) fingerprint from private.exchange_command_receipts r where command_id='${command.command_id}';`),before);check('Original receipt preserved',true);
 for(const key of ['exchange_command_ids','contact_command_ids','company_command_ids']){await assert.rejects(cleanupExchangesQa({...f,[key]:[]}),/Provenance/);check('Cleanup refuses surviving fixture without '+key,true);}
 check('Rejected cleanup preserves exchange',(await client.from('exchanges').select('id').eq('id',receipt.exchange.id)).data?.length===1);
 check('Exact helper cleanup',(await cleanupExchangesQa(f)).remaining===0);
 check('Repeated helper cleanup accepts proven absences',(await cleanupExchangesQa(f)).remaining===0);
 assertionsCompleted=true;
}finally{
 try{await cleanupExchangesQa(f);await rm(manifest,{force:true});success=assertionsCompleted;}finally{
  try{const signedOut=await client.auth.signOut({scope:'local'});if(signedOut.error)success=false;}catch{success=false;}
  if(!success)process.exitCode=1;await mkdir('_bmad-output/implementation-artifacts/verification/2-4',{recursive:true});await writeFile('_bmad-output/implementation-artifacts/verification/2-4/exchanges-read-names.json',JSON.stringify({success,checks},null,2));
 }
}
