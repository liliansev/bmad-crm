import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const metadata={executed_at:new Date().toISOString(),node:process.version,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {companiesQaQuery as query} from './companies-qa-cleanup.mjs';
import {cleanupOpportunitiesQa} from './opportunities-qa-cleanup.mjs';
import {signOutQaSession,deleteQaAuthUser} from './contacts-qa-cleanup.mjs';
const secret=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),anon_key:z.string(),service_role_key:z.string(),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
const endpoint=`https://${secret.project_ref}.supabase.co`,options={auth:{persistSession:false,autoRefreshToken:false}};
const owner=createClient(endpoint,secret.anon_key,options),anon=createClient(endpoint,secret.anon_key,options),admin=createClient(endpoint,secret.service_role_key,options);
const targeted=process.argv.includes('--pagination-review'),finalizeOnly=process.argv.includes('--finalize-only'),injectFinalizer=targeted&&process.argv.includes('--inject-finalizer-failure');
const path=targeted?'.local/opportunities-db-review-fixtures.json':'.local/opportunities-db-fixtures.json',proof='_bmad-output/implementation-artifacts/verification/3-1';
const f={opportunity_ids:[],opportunity_command_ids:[],exchange_ids:[],exchange_command_ids:[],company_ids:[],contact_ids:[],company_command_ids:[],relation_command_ids:[],contact_command_ids:[]};
let outsider,outsiderId,baseline,cleanup,failure;let active=false,completed=false,preserved=false;const cleanupErrors=[],checks=[];
const check=(name,condition)=>{checks.push({name,passed:!!condition});if(!condition)throw new Error(name);console.log('PASS '+name);};
const manifest=()=>writeFile(path,JSON.stringify(f),{mode:0o600});
async function rpc(name,command,client=owner){const key=name==='opportunity_command'?'opportunity':name==='exchange_command'?'exchange':name==='company_command'?'company':name==='contact_company_command'?'relation':'contact';if(command.command_id){f[key+'_command_ids'].push(command.command_id);await manifest();}const {data,error}=await client.rpc(name,{p_command:command});if(error)throw new Error(`RPC ${name} unavailable`);if(data.status==='success'&&command.operation==='create'){f[key+'_ids'].push(data[key].id);await manifest();}return data;}
const create=(fields={})=>({operation:'create',command_id:randomUUID(),fields:{title:'Recette opportunité fictive',amount_cents:null,notes:'',company_id:null,primary_contact_id:null,...fields}});
const patch=(o,fields)=>({operation:'update',command_id:randomUUID(),opportunity_id:o.id,fields,base_versions:Object.fromEntries(Object.keys(fields).map(k=>[k,o.field_versions[k]]))});
const transition=(o,stage)=>({operation:'transition',command_id:randomUUID(),opportunity_id:o.id,stage,base_workflow_revision:o.workflow_revision});
const read=async(id,client=owner)=>(await client.rpc('opportunity_read',{p_id:id})).data;
async function page(context={},p_page=1){const {data,error}=await owner.rpc('opportunities_page',{p_page,p_contact_id:null,p_company_id:null,...context});if(error)throw new Error('Lecture indisponible');return data;}
async function snapshot(){return query(`select 'contacts' kind,id::text id,md5(to_jsonb(c)::text) fingerprint from public.contacts c union all select 'companies',id::text,md5(to_jsonb(c)::text) from public.companies c union all select 'exchanges',id::text,md5(to_jsonb(c)::text) from public.exchanges c union all select 'opportunities',id::text,md5(to_jsonb(c)::text) from public.opportunities c union all select 'contact_receipts',command_id::text,md5(to_jsonb(c)::text) from private.contact_command_receipts c union all select 'company_receipts',command_id::text,md5(to_jsonb(c)::text) from private.company_command_receipts c union all select 'relation_receipts',command_id::text,md5(to_jsonb(c)::text) from private.contact_company_command_receipts c union all select 'exchange_receipts',command_id::text,md5(to_jsonb(c)::text) from private.exchange_command_receipts c union all select 'opportunity_receipts',command_id::text,md5(to_jsonb(c)::text) from private.opportunity_command_receipts c order by kind,id;`);}
try{
 await mkdir(proof,{recursive:true});try{const existing=JSON.parse(await readFile(path,'utf8'));if(finalizeOnly)Object.assign(f,existing);else {await cleanupOpportunitiesQa(existing);await rm(path);}}catch(e){if(e.code!=='ENOENT'||finalizeOnly)throw e;}
 check('Identité propriétaire',(await admin.auth.admin.getUserById(secret.owner_id)).data.user?.email===secret.owner_email);
 check('Authentification réelle',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);baseline=await snapshot();active=true;
 if(targeted){
  if(!finalizeOnly){
   const company=(await rpc('company_command',{operation:'create',command_id:randomUUID(),fields:{name:'Pagination revue fictive'}})).company;
   const fixtures=[];
   for(let i=0;i<28;i++){const result=await rpc('opportunity_command',create({title:`Pagination fictive ${i}`,company_id:company.id}));if(result.status!=='success')throw new Error('Fixture pagination refusée');fixtures.push({id:result.opportunity.id,created_at:i<24?'2020-03-01T10:00:00.000Z':'2020-02-01T10:00:00.000Z'});}
   const ids=fixtures.map(x=>`'${z.uuid().parse(x.id)}'::uuid`).join(',');
   const commands=f.opportunity_command_ids.map(x=>`'${z.uuid().parse(x)}'::uuid`).join(',');
   const branches=fixtures.map(x=>`when '${x.id}'::uuid then '${x.created_at}'::timestamptz`).join(' ');
   const dated=await query(`begin;with changed as (update public.opportunities o set created_at=case o.id ${branches} end where o.owner_id='${secret.owner_id}'::uuid and o.id in (${ids}) and exists(select 1 from private.opportunity_command_receipts r where r.owner_id=o.owner_id and r.command_id in (${commands}) and r.command->>'operation'='create' and r.result->>'status'='success' and r.result->'opportunity'->>'id'=o.id::text) returning id) select count(*)::integer changed from changed;commit;`);
   check('Dates exactes sur les seules fixtures prouvées',dated[0]?.changed===28);
   const expected=fixtures.toSorted((a,b)=>b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
   const pages=[await page({p_company_id:company.id},1),await page({p_company_id:company.id},2)];
   check('Pagination revue comptes25 et3',pages.every(x=>x.status==='success'&&x.total===28)&&pages[0].opportunities.length===25&&pages[1].opportunities.length===3);
   check('Page1 ordre date décroissante UUID croissant',JSON.stringify(pages[0].opportunities.map(x=>x.id))===JSON.stringify(expected.slice(0,25).map(x=>x.id)));
   check('Page2 ordre indépendant exact',JSON.stringify(pages[1].opportunities.map(x=>x.id))===JSON.stringify(expected.slice(25).map(x=>x.id)));
   check('Égalité date de part et autre frontière25',expected[24].created_at===expected[25].created_at&&expected[24].id<expected[25].id);
   check('Dates relues exactement',pages.flatMap(x=>x.opportunities).every(x=>new Date(x.created_at).toISOString()===fixtures.find(f=>f.id===x.id).created_at));
   metadata.pagination={expected:expected.map(x=>({id:x.id,created_at:x.created_at})),actual:pages.map(x=>x.opportunities.map(o=>o.id))};
  }else check('Manifeste conservé repris par finaliseur réel',f.opportunity_ids.length===28&&f.company_ids.length===1);
 }else{
 const a=(await rpc('company_command',{operation:'create',command_id:randomUUID(),fields:{name:'Opportunités société A fictive'}})).company;
 const b=(await rpc('company_command',{operation:'create',command_id:randomUUID(),fields:{name:'Opportunités société B fictive'}})).company;
 const c=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Opportunités',last_name:'Recette',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;
 const d=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Affaire',last_name:'Destination',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;
 await rpc('contact_company_command',{command_id:randomUUID(),contact_id:c.id,company_id:a.id,base_version:1});
 const exchange=(await rpc('exchange_command',{operation:'create',command_id:randomUUID(),fields:{contact_id:c.id,company_id:a.id,occurred_at:'2025-01-01T10:00:00Z',channel:'phone',notes:'Historique fictif'}})).exchange;
 const cmd=create({title:'  Affaire 123 😀  ',amount_cents:'9223372036854775807',primary_contact_id:c.id,company_id:b.id});
 const [first,retry]=await Promise.all([rpc('opportunity_command',cmd),rpc('opportunity_command',cmd)]);const original=first.opportunity;
 check('Création simultanée idempotente',first.status==='success'&&JSON.stringify(first)===JSON.stringify(retry));
 check('Texte trim chiffres et montant exact',original.title==='Affaire 123 😀'&&original.amount_cents==='9223372036854775807');
 check('Initialisation et liens indépendants',original.stage==='qualifying'&&original.workflow_revision===1&&original.company_id===b.id&&original.primary_contact_id===c.id);
 check('Lecture exacte chaîne',(await read(original.id)).opportunity.amount_cents==='9223372036854775807');
 check('Clé et autre empreinte refusée',(await rpc('opportunity_command',{...cmd,fields:{...cmd.fields,title:'Autre'}})).status==='validation');
 const updated=await rpc('opportunity_command',patch(original,{notes:'Locale'}));
 check('Patch ciblé sans workflow',updated.status==='success'&&updated.opportunity.workflow_revision===1&&updated.opportunity.field_versions.title===1&&updated.opportunity.field_versions.notes===2);
 const independent=await rpc('opportunity_command',patch(original,{amount_cents:'1'}));
 check('Champ indépendant accepté',independent.status==='success'&&independent.opportunity.notes==='Locale'&&independent.opportunity.amount_cents==='1');
 const conflict=await rpc('opportunity_command',patch(original,{notes:'Obsolète',company_id:a.id}));
 check('Conflit atomique',conflict.status==='conflict'&&conflict.conflicting_fields.join(',')==='notes'&&(await read(original.id)).opportunity.company_id===b.id);
 const won=await rpc('opportunity_command',transition(original,'won'));
 check('Workflow indépendant des notes',won.status==='success'&&won.opportunity.workflow_revision===2&&won.opportunity.notes==='Locale');
 check('Transition ancienne refusée',(await rpc('opportunity_command',transition(original,'lost'))).status==='conflict');
 const closed=await rpc('opportunity_command',patch(won.opportunity,{title:'Close éditable',company_id:a.id,primary_contact_id:d.id,amount_cents:'0'}));
 check('Close entièrement éditable',closed.status==='success'&&closed.opportunity.stage==='won'&&closed.opportunity.amount_cents==='0'&&closed.opportunity.workflow_revision===2);
 check('Anciennes nouvelles projections',!(await page({p_contact_id:c.id})).opportunities.some(x=>x.id===original.id)&&(await page({p_contact_id:d.id})).opportunities.some(x=>x.id===original.id)&&closed.affected.company_ids.includes(b.id)&&closed.affected.company_ids.includes(a.id));
 const historical=(await owner.rpc('exchange_read',{p_id:exchange.id})).data.exchange;
 check('Historique immuable',historical.contact_id===c.id&&historical.company_id===a.id&&historical.revision===1);
 let current=closed.opportunity;for(const stage of ['lost','qualifying','discussing','proposal','won']){const r=await rpc('opportunity_command',transition(current,stage));check('Transition '+stage,r.status==='success'&&r.opportunity.stage===stage);current=r.opportunity;}
 const noop=await rpc('opportunity_command',transition(current,current.stage));check('Étape inchangée sans révision',noop.opportunity.revision===current.revision&&noop.opportunity.workflow_revision===current.workflow_revision);
 check('Ancien reçu immuable',JSON.stringify(await rpc('opportunity_command',cmd))===JSON.stringify(first)&&(await read(original.id)).opportunity.revision===current.revision);
 const empty=await rpc('opportunity_command',create());check('Minimum null distinct zéro',empty.status==='success'&&empty.opportunity.amount_cents===null&&empty.opportunity.company_id===null&&empty.opportunity.primary_contact_id===null);
 for(const amount_cents of ['-1','1.2','1e3','01','9223372036854775808',1])check('Montant invalide '+amount_cents,(await rpc('opportunity_command',create({amount_cents}))).status==='validation');
 for(const fields of [{title:'   '},{title:'😀'.repeat(201)},{notes:'😀'.repeat(20001)},{company_id:randomUUID()},{primary_contact_id:randomUUID()}])check('Champ invalide '+Object.keys(fields)[0],['validation','not_found'].includes((await rpc('opportunity_command',create(fields))).status));
 check('Bornes Unicode acceptées',(await rpc('opportunity_command',create({title:'😀'.repeat(200),notes:'😀'.repeat(20000)}))).status==='success');
 check('Patch vide refusé',(await rpc('opportunity_command',patch(current,{}))).status==='validation');
 check('Étape via patch refusée',(await rpc('opportunity_command',{...patch(current,{title:'x'}),fields:{stage:'qualifying'},base_versions:{stage:1}})).status==='validation');
 check('Versions exactes requises',(await rpc('opportunity_command',{...patch(current,{notes:'x'}),base_versions:{notes:2,title:1}})).status==='validation');
 for(let i=0;i<26;i++)await rpc('opportunity_command',create({primary_contact_id:c.id}));
 const pages=[await page({p_contact_id:c.id}),await page({p_contact_id:c.id},2)];check('Pagination 25 et compteur global',pages[0].total===26&&pages[0].opportunities.length===25&&pages[1].opportunities.length===1&&new Set([...pages[0].opportunities,...pages[1].opportunities].map(o=>o.id)).size===26);
 const evil=await admin.auth.admin.createUser({email:`opportunities-qa-${randomUUID()}@example.invalid`,password:randomUUID()+'!Aa1',email_confirm:true});outsiderId=evil.data.user?.id;check('Compte étranger fictif',!!outsiderId);outsider=createClient(endpoint,secret.anon_key,options);const link=await admin.auth.admin.generateLink({type:'magiclink',email:evil.data.user.email});await outsider.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});
 check('RPC étranger refusé',(await rpc('opportunity_command',patch(current,{notes:'attaque'}),outsider)).status==='forbidden');
 check('Lecture étrangère refusée',(await read(original.id,outsider)).status==='forbidden');
 check('Anonyme RPC refusé',!!(await anon.rpc('opportunity_read',{p_id:original.id})).error);
 check('RLS étrangère vide',(await outsider.from('opportunities').select('id')).data?.length===0);
 check('Écriture table propriétaire refusée',!!(await owner.from('opportunities').update({notes:'attaque'}).eq('id',original.id)).error);
 check('RLS pas de fuite étrangère',(await page({p_contact_id:randomUUID()})).status==='not_found');
 }
 completed=true;
}catch(error){failure=error;}finally{
 if(active){try{cleanup=await cleanupOpportunitiesQa(f);check('Nettoyage exact',cleanup.remaining===0);check('Nettoyage répété', (await cleanupOpportunitiesQa(f)).remaining===0);}catch(error){cleanupErrors.push({step:'fixtures',message:error.message});}try{preserved=JSON.stringify(await snapshot())===JSON.stringify(baseline);check('Empreintes préexistantes intactes',preserved);}catch(error){cleanupErrors.push({step:'baseline',message:error.message});}}
 for(const [step,finalize] of [['outsider-session',async()=>{if(outsider)await signOutQaSession(outsider);}],['outsider-account',async()=>{if(outsiderId)await deleteQaAuthUser(admin,outsiderId,secret.owner_id);}],['owner-session',async()=>{await signOutQaSession(owner);}]]){try{await finalize();if(injectFinalizer&&step==='owner-session')throw new Error('Injected local failure after successful session revocation');}catch(error){cleanupErrors.push({step,message:error.message});}}
 const success=completed&&!failure&&cleanupErrors.length===0&&cleanup?.remaining===0&&preserved;if(success)await rm(path,{force:true});let manifestPreserved=false;try{manifestPreserved=JSON.stringify(JSON.parse(await readFile(path,'utf8')))===JSON.stringify(f);}catch{}const resultName=targeted?(finalizeOnly?'opportunities-db-review-finalizer-retry':injectFinalizer?'opportunities-db-review-injected':'opportunities-db-review'):'opportunities-db';await mkdir(proof,{recursive:true});await writeFile(`${proof}/${resultName}.json`,JSON.stringify({metadata,success,completed,checks,cleanup,preserved,cleanupErrors,manifestPreserved,injectedFinalizer:injectFinalizer,...(failure?{failure:failure.message}:{})},null,2));if(!success)process.exitCode=1;
}
if(failure)throw failure;if(cleanupErrors.length)throw new Error('Finalisation incomplète.');
