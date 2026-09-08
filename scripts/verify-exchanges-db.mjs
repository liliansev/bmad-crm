import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {companiesQaQuery as query} from './companies-qa-cleanup.mjs';
import {cleanupExchangesQa} from './exchanges-qa-cleanup.mjs';
import {signOutQaSession,deleteQaAuthUser} from './contacts-qa-cleanup.mjs';
const secret=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),anon_key:z.string(),service_role_key:z.string(),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
const endpoint=`https://${secret.project_ref}.supabase.co`,options={auth:{persistSession:false,autoRefreshToken:false}};
const owner=createClient(endpoint,secret.anon_key,options),anon=createClient(endpoint,secret.anon_key,options),admin=createClient(endpoint,secret.service_role_key,options);
const path='.local/exchanges-db-fixtures.json',proof='_bmad-output/implementation-artifacts/verification/2-4';
const f={exchange_ids:[],exchange_command_ids:[],company_ids:[],contact_ids:[],company_command_ids:[],relation_command_ids:[],contact_command_ids:[]};
let outsider,outsiderId,baseline,cleanup,failure;let fixturesActive=false,assertionsCompleted=false,baselinePreserved=false;const cleanupErrors=[];const checks=[];const check=(name,condition)=>{checks.push({name,passed:!!condition});if(!condition)throw new Error(name);console.log('PASS '+name);};
const manifest=()=>writeFile(path,JSON.stringify(f),{mode:0o600});
async function rpc(name,command,client=owner){const key=name==='exchange_command'?'exchange':name==='company_command'?'company':name==='contact_company_command'?'relation':'contact';if(command.command_id){f[key+'_command_ids'].push(command.command_id);await manifest();}const {data,error}=await client.rpc(name,{p_command:command});if(error)throw new Error(`RPC ${name} unavailable`);if(data.status==='success'&&command.operation==='create'){f[key+'_ids'].push(data[key].id);await manifest();}return data;}
const exchange=(contact,company,extra={})=>({operation:'create',command_id:randomUUID(),fields:{contact_id:contact,company_id:company,occurred_at:'2026-01-01T10:00:00.000Z',channel:'phone',notes:'Notes fictives',...extra}});
// A previous interrupted finalizer may already have deleted some rows and
// receipts. Omit only demonstrably absent entities; surviving IDs must still
// pass the cleanup helper's receipt-provenance verification before deletion.
async function cleanupFixtures(input){
 const pending={...input};
 for(const [table,key] of [['exchanges','exchange_ids'],['contacts','contact_ids'],['companies','company_ids']]){
  const ids=z.array(z.uuid()).parse(pending[key]);
  if(!ids.length)continue;
  const sqlIds=ids.map(id=>`'${id}'::uuid`).join(',');
  const existing=await query(`select id from public.${table} where id in (${sqlIds});`);
  const present=new Set(existing.map(row=>z.uuid().parse(row.id)));
  pending[key]=ids.filter(id=>present.has(id));
 }
 return cleanupExchangesQa(pending);
}
async function snapshot(){return query(`select 'contacts' kind,id::text id,md5(to_jsonb(c)::text) fingerprint from public.contacts c union all select 'companies',id::text,md5(to_jsonb(c)::text) from public.companies c union all select 'exchanges',id::text,md5(to_jsonb(c)::text) from public.exchanges c union all select 'contact_receipts',command_id::text,md5(to_jsonb(c)::text) from private.contact_command_receipts c union all select 'company_receipts',command_id::text,md5(to_jsonb(c)::text) from private.company_command_receipts c union all select 'relation_receipts',command_id::text,md5(to_jsonb(c)::text) from private.contact_company_command_receipts c union all select 'exchange_receipts',command_id::text,md5(to_jsonb(c)::text) from private.exchange_command_receipts c order by kind,id;`);}
async function history(contact,company,page=1){const {data,error}=await owner.rpc('exchanges_read',{p_contact_id:contact,p_company_id:company,p_page:page});if(error)throw new Error('Lecture refusée');return data;}
try{
 await mkdir(proof,{recursive:true});try{await cleanupFixtures(JSON.parse(await readFile(path,'utf8')));await rm(path);}catch(e){if(e.code!=='ENOENT')throw e;}
 check('Identité propriétaire',(await admin.auth.admin.getUserById(secret.owner_id)).data.user?.email===secret.owner_email);
 check('Authentification réelle',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);baseline=await snapshot();fixturesActive=true;
 const a=(await rpc('company_command',{operation:'create',command_id:randomUUID(),fields:{name:'Échanges société A fictive'}})).company;
 const b=(await rpc('company_command',{operation:'create',command_id:randomUUID(),fields:{name:'Échanges société B fictive'}})).company;
 const c=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Échanges',last_name:'Recette',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;
 check('Vrai vide',(await history(c.id,null)).total===0&&(await history(c.id,null)).last_interaction===null);
 await rpc('contact_company_command',{command_id:randomUUID(),contact_id:c.id,company_id:a.id,base_version:1});
 const command=exchange(c.id,a.id);const [one,two]=await Promise.all([rpc('exchange_command',command),rpc('exchange_command',command)]);
 check('Commande simultanée idempotente',one.status==='success'&&one.exchange.id===two.exchange.id);
 check('Valeurs relues',one.exchange.contact_id===c.id&&one.exchange.company_id===a.id&&one.exchange.notes===command.fields.notes&&Date.parse(one.exchange.occurred_at)===Date.parse(command.fields.occurred_at)&&one.exchange.channel==='phone');
 check('Clé altérée refusée',(await rpc('exchange_command',{...command,fields:{...command.fields,notes:'Autre'}})).status==='validation');
 await rpc('contact_company_command',{command_id:randomUUID(),contact_id:c.id,company_id:b.id,base_version:2});
 check('Historique immuable A après déplacement B',(await history(null,a.id)).total===1&&(await history(null,b.id)).total===0&&(await history(c.id,null)).total===1);
 check('Date future refusée serveur',(await rpc('exchange_command',exchange(c.id,null,{occurred_at:'2099-01-01T00:00:00Z'}))).field==='occurred_at');
 check('Date invalide refusée serveur',(await rpc('exchange_command',exchange(c.id,null,{occurred_at:'2026-02-30T00:00:00Z'}))).status==='validation');
 check('Date sans offset refusée',(await rpc('exchange_command',exchange(c.id,null,{occurred_at:'2026-03-29T02:30:00'}))).status==='validation');
 for(const occurred_at of ['2026-01-01T24:00:00Z','2026-01-01T00:00:60Z'])check('Normalisation refusée '+occurred_at,(await rpc('exchange_command',exchange(c.id,null,{occurred_at}))).field==='occurred_at');
 check('Canal explicite requis',(await rpc('exchange_command',exchange(c.id,null,{channel:''}))).field==='channel');
 check('Contact inconnu refusé',(await rpc('exchange_command',exchange(randomUUID(),null))).status==='not_found');
 check('Société inconnue refusée',(await rpc('exchange_command',exchange(c.id,randomUUID()))).status==='not_found');
 check('20 000 points Unicode',(await rpc('exchange_command',exchange(c.id,null,{notes:'😀'.repeat(20000)}))).status==='success');
 check('20 001 points refusés',(await rpc('exchange_command',exchange(c.id,null,{notes:'😀'.repeat(20001)}))).field==='notes');
 for(let i=0;i<26;i++)await rpc('exchange_command',exchange(c.id,a.id));
 const p1=await history(c.id,null),p2=await history(c.id,null,2);check('Pagination 25 et total global',p1.exchanges.length===25&&p2.exchanges.length===3&&p1.total===28&&p2.total===28);
 check('Maximum global indépendant page',p1.last_interaction.id===p2.last_interaction.id&&p1.last_interaction.id===p1.exchanges[0].id);
 const ordered=[...p1.exchanges,...p2.exchanges];check('Tri instant création UUID décroissants',ordered.every((e,i)=>i===0||Date.parse(ordered[i-1].occurred_at)>Date.parse(e.occurred_at)||ordered[i-1].occurred_at===e.occurred_at&&(ordered[i-1].created_at>e.created_at||ordered[i-1].created_at===e.created_at&&ordered[i-1].id>e.id)));
 await rpc('contact_command_v2',{version:2,operation:'update',command_id:randomUUID(),contact_id:c.id,fields:{notes:'Note libre récente'},base_versions:{notes:1}});
 check('Note libre sans effet',(await history(c.id,null)).last_interaction.id===p1.last_interaction.id);
 const rights=await query(`select not has_function_privilege('anon','public.exchange_command(jsonb)','EXECUTE') and not has_function_privilege('anon','public.exchanges_read(uuid,uuid,integer)','EXECUTE') and not has_table_privilege('authenticated','public.exchanges','INSERT,UPDATE,DELETE') protected;`);check('Droits directs fermés',rights[0].protected);
 const evil=await admin.auth.admin.createUser({email:`exchanges-qa-${randomUUID()}@example.invalid`,password:randomUUID()+'!Aa1',email_confirm:true});outsiderId=evil.data.user?.id;check('Compte test étranger',!!outsiderId);outsider=createClient(endpoint,secret.anon_key,options);const link=await admin.auth.admin.generateLink({type:'magiclink',email:evil.data.user.email});await outsider.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});
 check('RLS non propriétaire',(await outsider.from('exchanges').select('id')).data?.length===0);check('RPC mutation non propriétaire',(await rpc('exchange_command',exchange(c.id,null),outsider)).status==='forbidden');check('RPC lecture non propriétaire',(await outsider.rpc('exchanges_read',{p_contact_id:c.id})).data?.status==='forbidden');check('Anonyme RPC refusée',!!(await anon.rpc('exchange_command',{p_command:exchange(c.id,null)})).error);
 assertionsCompleted=true;
}catch(error){failure=error;
}finally{
 // Each finalizer runs even when assertions or another finalizer fail. Only a
 // confirmed cleanup removes the manifest; failed runs remain recoverable.
 if(fixturesActive){
  try{cleanup=await cleanupFixtures(f);check('Nettoyage exact',cleanup.remaining===0);check('Nettoyage répété idempotent',(await cleanupFixtures(f)).remaining===0);await rm(path,{force:true});}
  catch(error){cleanupErrors.push({step:'business-fixtures',message:error instanceof Error?error.message:'Nettoyage incomplet'});}
  try{baselinePreserved=JSON.stringify(await snapshot())===JSON.stringify(baseline);check('Empreintes préexistantes intactes',baselinePreserved);}
  catch(error){cleanupErrors.push({step:'baseline',message:error instanceof Error?error.message:'Vérification indisponible'});}
 }
 for(const [step,finalize] of [
  ['outsider-session',async()=>{if(outsider)await signOutQaSession(outsider);}],
  ['outsider-account',async()=>{if(outsiderId)await deleteQaAuthUser(admin,outsiderId,secret.owner_id);}],
  ['owner-session',async()=>{await signOutQaSession(owner);}],
 ]){try{await finalize();}catch(error){cleanupErrors.push({step,message:error instanceof Error?error.message:'Finalisation incomplète'});}}
 const success=assertionsCompleted&&!failure&&cleanupErrors.length===0&&cleanup?.remaining===0&&baselinePreserved;
 await mkdir(proof,{recursive:true});
 await writeFile(`${proof}/exchanges-db.json`,JSON.stringify({success,assertionsCompleted,checks,cleanup,baselinePreserved,cleanupErrors,...(failure?{failure:failure instanceof Error?failure.message:'Recette interrompue'}:{})},null,2));
 if(!success)process.exitCode=1;
}
if(failure)throw failure;
if(cleanupErrors.length)throw new Error('Recette échanges : finalisation incomplète, consulter la preuve et le manifeste.');
