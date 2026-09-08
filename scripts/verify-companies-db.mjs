import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {companiesQaQuery as query,cleanupCompaniesQa} from './companies-qa-cleanup.mjs';
import {signOutQaSession,deleteQaAuthUser} from './contacts-qa-cleanup.mjs';
const project='otadrkhrjxafutocstzo',endpoint=`https://${project}.supabase.co`,opts={auth:{persistSession:false,autoRefreshToken:false}};
const f={company_ids:[],contact_ids:[],company_command_ids:[],relation_command_ids:[],contact_command_ids:[]};
const checks=[],path='.local/companies-db-fixtures.json',proof='_bmad-output/implementation-artifacts/verification/2-3';
const check=(name,condition)=>{checks.push({name,passed:Boolean(condition)});if(!condition)throw new Error(name);console.log('PASS '+name);};
const secret=z.object({project_ref:z.literal(project),anon_key:z.string(),service_role_key:z.string(),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
const owner=createClient(endpoint,secret.anon_key,opts),anon=createClient(endpoint,secret.anon_key,opts),admin=createClient(endpoint,secret.service_role_key,opts);let outsider,outsiderId,baseline,cleanup;
const manifest=()=>writeFile(path,JSON.stringify(f),{mode:0o600});
const companyCommand=(name,base)=>({operation:base?'update':'create',command_id:randomUUID(),fields:{name},...(base?{company_id:base.id,base_versions:base.field_versions}:{})});
async function rpc(name,command,client=owner){const arr=name==='company_command'?'company_command_ids':name==='contact_company_command'?'relation_command_ids':'contact_command_ids';if(command?.command_id&&z.uuid().safeParse(command.command_id).success)f[arr].push(command.command_id);await manifest();const {data,error}=await client.rpc(name,{p_command:command});if(error)throw new Error('RPC '+name+' unavailable');if(data.status==='success'&&command.operation==='create'){f[name==='company_command'?'company_ids':'contact_ids'].push(data[name==='company_command'?'company':'contact'].id);await manifest();}return data;}
const relation=(id,company,version)=>({command_id:randomUUID(),contact_id:id,company_id:company,base_version:version});
async function snapshot(){return query(`select 'contact' kind,id::text id,md5(to_jsonb(c)::text) fingerprint from public.contacts c union all select 'legacy',command_id::text,md5(to_jsonb(r)::text) from private.contact_command_receipts r union all select 'company',id::text,md5(to_jsonb(s)::text) from public.companies s union all select 'company_receipt',command_id::text,md5(to_jsonb(r)::text) from private.company_command_receipts r union all select 'relation_receipt',command_id::text,md5(to_jsonb(r)::text) from private.contact_company_command_receipts r order by kind,id;`);}
try{
 await mkdir(proof,{recursive:true});try{await cleanupCompaniesQa(JSON.parse(await readFile(path,'utf8')));await rm(path);}catch(e){if(e.code!=='ENOENT')throw e;}
 const identity=await admin.auth.admin.getUserById(secret.owner_id);check('Cible et identité propriétaire',identity.data.user?.email===secret.owner_email);
 check('Authentification réelle',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);
 baseline=await snapshot();
 const privileges=await query(`select not has_function_privilege('anon','public.company_command(jsonb)','EXECUTE') and not has_function_privilege('anon','public.contact_company_command(jsonb)','EXECUTE') and not has_table_privilege('authenticated','public.companies','INSERT,UPDATE,DELETE') as protected;`);check('Droits RPC et écriture directe',privileges[0].protected);
 const aCommand=companyCommand('  Société 42 fictive  ');const [a,repeat]=await Promise.all([rpc('company_command',aCommand),rpc('company_command',aCommand)]);check('Création canonique et retry simultané unique',a.status==='success'&&a.company.id===repeat.company.id&&a.company.name==='Société 42 fictive');
 const a0=a.company;check('Clé réutilisée avec autre contenu refusée',(await rpc('company_command',{...aCommand,fields:{name:'Autre'}})).status==='validation');
 check('Nom vide refusé',(await rpc('company_command',companyCommand('  '))).status==='validation');
 check('200 points Unicode acceptés',(await rpc('company_command',companyCommand('😀'.repeat(200)))).status==='success');check('201 points refusés',(await rpc('company_command',companyCommand('😀'.repeat(201)))).status==='validation');
 const renamed=await rpc('company_command',companyCommand('Société 43 fictive',a0));check('Renommage réel',(await owner.from('companies').select('name').eq('id',a0.id).single()).data.name==='Société 43 fictive');
 check('Conflit nom ciblé',(await rpc('company_command',companyCommand('Périmé',a0))).status==='conflict');
 check('Société absente',(await rpc('company_command',companyCommand('Absent',{...a0,id:randomUUID()}))).status==='not_found');
 const b=(await rpc('company_command',companyCommand('B société fictive'))).company;
 const contact=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Recette',last_name:'Sociétés',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;
 const linkCommand=relation(contact.id,a0.id,1);const linked=await rpc('contact_company_command',linkCommand);check('Rattachement canonique A',linked.status==='success'&&linked.relation.company.id===a0.id&&linked.relation.version===2);
 check('Retry relation immuable',JSON.stringify(await rpc('contact_company_command',linkCommand))===JSON.stringify(linked));
 check('Note indépendante compatible',(await rpc('contact_command_v2',{version:2,operation:'update',command_id:randomUUID(),contact_id:contact.id,fields:{notes:'Note indépendante'},base_versions:{notes:1}})).status==='success');
 const changed=await rpc('contact_company_command',relation(contact.id,b.id,2));check('Remplacement B après note',changed.status==='success'&&changed.relation.version===3);
 check('Relation périmée refusée',(await rpc('contact_company_command',relation(contact.id,null,2))).status==='conflict');
 check('Société inconnue refusée',(await rpc('contact_company_command',relation(contact.id,randomUUID(),3))).status==='not_found');
 check('Retrait société',(await rpc('contact_company_command',relation(contact.id,null,3))).relation.company===null);
 check('Ancien client noms fonctionne',(await rpc('contact_command',{operation:'update',command_id:randomUUID(),contact_id:contact.id,fields:{first_name:'Historique'},base_versions:{first_name:1}})).status==='success');
 const evil=await admin.auth.admin.createUser({email:`companies-qa-${randomUUID()}@example.invalid`,password:randomUUID()+'!aA1',email_confirm:true});outsiderId=evil.data.user?.id;check('Compte non propriétaire créé',!!outsiderId);outsider=createClient(endpoint,secret.anon_key,opts);const recovery=await admin.auth.admin.generateLink({type:'magiclink',email:evil.data.user.email});await outsider.auth.verifyOtp({token_hash:recovery.data.properties.hashed_token,type:'magiclink'});
 check('RLS masque sociétés',(await outsider.from('companies').select('id')).data?.length===0);check('RPC non propriétaire refusée',(await rpc('company_command',companyCommand('Interdit'),outsider)).status==='forbidden');check('Relation non propriétaire refusée',(await rpc('contact_company_command',relation(contact.id,a0.id,4),outsider)).status==='forbidden');check('Anonyme refuse RPC',Boolean((await anon.rpc('company_command',{p_command:companyCommand('Interdit')})).error));
 for(let i=0;i<26;i++)await rpc('company_command',companyCommand(`Pagination fictive ${String(i).padStart(2,'0')}`));
 const first=await owner.from('companies').select('id',{count:'exact'}).order('name').order('id').range(0,24),second=await owner.from('companies').select('id',{count:'exact'}).order('name').order('id').range(25,49);check('Pagination sociétés 25 et total global',first.data.length===25&&second.data.length>0&&first.count===second.count);
 for(let i=0;i<26;i++){const c=(await rpc('contact_command_v2',{version:2,operation:'create',command_id:randomUUID(),fields:{first_name:'Recette',last_name:'Pagination',email:'',job_title:'',linkedin_url:'',notes:''}})).contact;await rpc('contact_company_command',relation(c.id,b.id,1));}
 const links=await owner.from('contacts').select('id',{count:'exact'}).eq('company_id',b.id).range(25,49);check('Contacts liés seconde page et total',links.count===26&&links.data.length===1);
 cleanup=await cleanupCompaniesQa(f);check('Nettoyage exact',cleanup.remaining===0);check('Données et reçus préexistants intacts',JSON.stringify(await snapshot())===JSON.stringify(baseline));await rm(path);
}finally{if(outsider){await signOutQaSession(outsider);}if(outsiderId)await deleteQaAuthUser(admin,outsiderId,secret.owner_id);await signOutQaSession(owner);await writeFile(`${proof}/companies-db.json`,JSON.stringify({checks,cleanup,baseline},null,2));}
