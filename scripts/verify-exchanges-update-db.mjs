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
const path='.local/exchanges-update-db-fixtures.json',proof='_bmad-output/implementation-artifacts/verification/2-5';
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
 const d=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Correction',last_name:'Destination',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;
 await rpc('contact_company_command',{command_id:randomUUID(),contact_id:c.id,company_id:a.id,base_version:1});
 const previous=(await rpc('exchange_command',exchange(c.id,a.id,{occurred_at:'2025-01-01T10:00:00Z'}))).exchange;
 const originalCommand=exchange(c.id,a.id);const original=(await rpc('exchange_command',originalCommand)).exchange;
 const read=async(id,client=owner)=>(await client.rpc('exchange_read',{p_id:id})).data;
 const patch=(e,fields)=>({operation:'update',command_id:randomUUID(),exchange_id:e.id,fields,base_versions:Object.fromEntries(Object.keys(fields).map(k=>[k,e.field_versions[k]]))});
 const firstCommand=patch(original,{notes:'Corrigée',occurred_at:'2024-01-01T10:00:00Z'});
 const [first,retry]=await Promise.all([rpc('exchange_command',firstCommand),rpc('exchange_command',firstCommand)]);
 check('Update simultané idempotent',first.status==='success'&&JSON.stringify(first)===JSON.stringify(retry)&&first.exchange.revision===2);
 check('Identité et création conservées',first.exchange.id===original.id&&first.exchange.created_at===original.created_at);
 check('Ancien maximum retrouvé',(await history(c.id,null)).last_interaction.id===previous.id);
 check('Versions ciblées seulement',first.exchange.field_versions.notes===2&&first.exchange.field_versions.occurred_at===2&&first.exchange.field_versions.contact_id===1);
 check('Reçu create inchangé après update',JSON.stringify(await rpc('exchange_command',originalCommand))===JSON.stringify({status:'success',exchange:original}));
 check('Clé cross-op refusée',(await rpc('exchange_command',{...patch(first.exchange,{notes:'autre'}),command_id:originalCommand.command_id})).status==='validation');
 const independent=await rpc('exchange_command',patch(original,{channel:'email'}));
 check('Patch indépendant compatible',independent.status==='success'&&independent.exchange.notes==='Corrigée');
 const stale=await rpc('exchange_command',patch(original,{notes:'Locale',company_id:b.id}));
 check('Conflit ciblé atomique',stale.status==='conflict'&&stale.conflicting_fields.join(',')==='notes'&&(await read(original.id)).exchange.company_id===a.id);
 const concurrent=await rpc('exchange_command',patch(independent.exchange,{notes:'Distante',channel:'video'}));
 const mixed=await rpc('exchange_command',patch(concurrent.exchange,{notes:'Locale',company_id:b.id}));
 check('Résolution mixte et champs indépendants',mixed.status==='success'&&mixed.exchange.notes==='Locale'&&mixed.exchange.channel==='video'&&mixed.exchange.company_id===b.id);
 const moved=await rpc('exchange_command',patch(mixed.exchange,{contact_id:d.id}));
 check('Contact déplacé société historique préservée',moved.status==='success'&&moved.exchange.company_id===b.id&&moved.affected.contact_ids.includes(c.id)&&moved.affected.contact_ids.includes(d.id));
 check('Lecture unitaire hors historique',!(await history(c.id,null)).exchanges.some(e=>e.id===original.id)&&(await read(original.id)).exchange.contact_id===d.id);
 const noCompany=await rpc('exchange_command',patch(moved.exchange,{company_id:null,notes:''}));
 check('Retrait société et effacement notes',noCompany.status==='success'&&noCompany.exchange.company_id===null&&noCompany.exchange.notes===''&&noCompany.affected.company_ids.includes(b.id));
 const relations=await query(`select company_id from public.contacts where id='${c.id}'::uuid;`);
 check('Employeur intact',relations[0].company_id===a.id);
 check('Autre échange intact',JSON.stringify((await read(previous.id)).exchange.field_versions)===JSON.stringify(previous.field_versions));
 const lastMove=await rpc('exchange_command',patch(previous,{contact_id:d.id}));
 check('Ancien contact vide maximum null',(await history(c.id,null)).total===0&&(await history(c.id,null)).last_interaction===null);
 check('Nouveau contact maximum global',(await history(d.id,null)).last_interaction.id===previous.id);
 check('Reçu ancien rejoué sans mutation',JSON.stringify(await rpc('exchange_command',firstCommand))===JSON.stringify(first)&&(await read(original.id)).exchange.revision===noCompany.exchange.revision);
 for(const occurred_at of ['2099-01-01T00:00:00Z','2026-02-30T00:00:00Z','2026-01-01T24:00:00Z','2026-01-01T00:00:60Z','2026-03-29T02:30:00'])check('Date refusée '+occurred_at,(await rpc('exchange_command',patch(noCompany.exchange,{occurred_at}))).status==='validation');
 for(const fields of [{contact_id:null},{contact_id:randomUUID()},{company_id:randomUUID()},{channel:''},{notes:'😀'.repeat(20001)}])check('Champ invalide '+Object.keys(fields)[0],['validation','not_found'].includes((await rpc('exchange_command',patch(noCompany.exchange,fields))).status));
 check('Patch vide refusé',(await rpc('exchange_command',patch(noCompany.exchange,{}))).status==='validation');
 check('Versions exactes requises',(await rpc('exchange_command',{...patch(noCompany.exchange,{notes:'x'}),base_versions:{notes:noCompany.exchange.field_versions.notes,channel:1}})).status==='validation');
 check('20 000 points Unicode acceptés',(await rpc('exchange_command',patch(noCompany.exchange,{notes:'😀'.repeat(20000)}))).status==='success');
 for(let i=0;i<26;i++)await rpc('exchange_command',exchange(d.id,null));
 const pages=[await history(d.id,null),await history(d.id,null,2)];check('Pagination et maximum global',pages[0].total===28&&pages[0].exchanges.length===25&&pages[1].exchanges.length===3&&pages[0].last_interaction.id===pages[1].last_interaction.id);
 const evil=await admin.auth.admin.createUser({email:`exchanges-update-qa-${randomUUID()}@example.invalid`,password:randomUUID()+'!Aa1',email_confirm:true});outsiderId=evil.data.user?.id;check('Compte test étranger',!!outsiderId);outsider=createClient(endpoint,secret.anon_key,options);const authLink=await admin.auth.admin.generateLink({type:'magiclink',email:evil.data.user.email});await outsider.auth.verifyOtp({token_hash:authLink.data.properties.hashed_token,type:'magiclink'});
 check('Update étranger refusé',(await rpc('exchange_command',patch(noCompany.exchange,{notes:'attaque'}),outsider)).status==='forbidden');
 check('Lecture unitaire étrangère refusée',(await read(original.id,outsider)).status==='forbidden');
 check('Anonyme lecture refusée',!!(await anon.rpc('exchange_read',{p_id:original.id})).error);
 check('RLS étrangère vide',(await outsider.from('exchanges').select('id')).data?.length===0);
 const rights=await query(`select not has_function_privilege('authenticated','public.exchange_create_command_v1(jsonb)','EXECUTE') and not has_table_privilege('authenticated','public.exchanges','INSERT,UPDATE,DELETE') protected;`);check('Ancien chemin privé et writes fermés',rights[0].protected);
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
 await writeFile(`${proof}/exchanges-update-db.json`,JSON.stringify({success,assertionsCompleted,checks,cleanup,baselinePreserved,cleanupErrors,...(failure?{failure:failure instanceof Error?failure.message:'Recette interrompue'}:{})},null,2));
 if(!success)process.exitCode=1;
}
if(failure)throw failure;
if(cleanupErrors.length)throw new Error('Recette échanges : finalisation incomplète, consulter la preuve et le manifeste.');
