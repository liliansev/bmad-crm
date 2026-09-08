import { alphabetic, fixtureMarker } from './contacts-qa-marker.mjs';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cleanupContactsQa, deleteQaAuthUser, signOutQaSession } from './contacts-qa-cleanup.mjs';

// Execute only after the parent confirms the additive migration on this project.
// No preexisting contact is mutated. Exact fixture UUIDs survive failures in a local manifest.
const project = 'otadrkhrjxafutocstzo';
const endpoint = `https://${project}.supabase.co`;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const proof = resolve(process.env.NAMES_PROOF_DIR || '_bmad-output/implementation-artifacts/verification/2-2');
const manifestPath = resolve('.local/contact-details-db-cleanup.json');
const exec = promisify(execFile);
const fixtureIds = new Set(), commandIds = new Set(), results = [];
const marker = fixtureMarker('Details-DB-fictif');
const empty = { first_name: '', last_name: '', email: '', job_title: '', linkedin_url: '', notes: '' };
const names = ['first_name', 'last_name'];
const details = ['email', 'job_title', 'linkedin_url', 'notes'];
let secret, admin, owner, outsider, outsiderId, managementToken, baseline, stage = 'préparation', succeeded = false;
const check = (name, passed) => { stage=name; results.push({name,passed:!!passed}); if(!passed)throw new Error(name); console.log(`PASS ${name}`); };
const client = () => createClient(endpoint, secret.anon_key, options);
const uuidSql = value => `'${z.uuid().parse(value)}'::uuid`;
let manifestWrite=Promise.resolve();
async function manifest() { const body=JSON.stringify({contact_ids:[...fixtureIds],command_ids:[...commandIds]},null,2);manifestWrite=manifestWrite.then(()=>writeFile(manifestPath,body,{mode:0o600}));await manifestWrite; }
function command(operation, fields, rest={}, version=2) {
  const value={...(version===2?{version:2}:{}),operation,command_id:randomUUID(),fields,...rest}; commandIds.add(value.command_id); return value;
}
async function rpc(value, session=owner) {
  if(value?.operation==='update' && !fixtureIds.has(value.contact_id))throw new Error('Mutation hors fixture interdite');
  if(value?.command_id && z.uuid().safeParse(value.command_id).success)commandIds.add(value.command_id);
  await manifest();
  const result=await session.rpc(value?.version===2?'contact_command_v2':'contact_command',{p_command:value});
  if(result.error)throw new Error('Transport RPC indisponible');
  if(result.data?.status==='success' && value?.operation==='create')fixtureIds.add(z.uuid().parse(result.data.contact.id));
  await manifest();return result.data;
}
async function read(id) {
  const {data,error}=await owner.from('contacts').select('*').eq('id',z.uuid().parse(id)).single();
  if(error)throw new Error('Lecture fixture impossible');return data;
}
async function query(sql) {
  const response=await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${managementToken}`,'Content-Type':'application/json'},body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Administration DB indisponible');const data=await response.json();if(!Array.isArray(data))throw new Error('Réponse DB invalide');return data;
}
async function snapshot() {
  const excluded=[...fixtureIds].map(uuidSql).join(',')||'null::uuid';
  const commands=[...commandIds].map(uuidSql).join(',')||'null::uuid';
  // Hashes keep existing contact text and historical command payloads out of reports/logs.
  return query(`select 'contact' as kind,id::text as id,md5(to_jsonb(c)::text) as fingerprint from public.contacts c where not (id = any(array[${excluded}]::uuid[]))
    union all select 'receipt',command_id::text,md5(to_jsonb(r)::text) from private.contact_command_receipts r where not (command_id = any(array[${commands}]::uuid[])) order by kind,id;`.replaceAll('not (id = any(array[null::uuid]::uuid[]))','true').replaceAll('not (command_id = any(array[null::uuid]::uuid[]))','true'));
}
async function duplicates(email,exclude=null,page=1,session=owner) {
  const response=await session.rpc('contact_email_duplicates',{p_email:email,p_exclude_id:exclude,p_page:page});if(response.error)throw new Error('RPC doublons refusée');return response.data;
}
async function update(id,fields) {
  const current=await read(id);return rpc(command('update',fields,{contact_id:id,base_versions:Object.fromEntries(Object.keys(fields).map(field=>[field,current.field_versions[field]??current.details_versions[field]]))}));
}
try {
  check('Node 24',process.versions.node.startsWith('24.'));
  await mkdir(proof,{recursive:true});await mkdir(resolve('.local'),{recursive:true});
  secret=z.object({project_ref:z.literal(project),anon_key:z.string().min(1),service_role_key:z.string().min(1),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string().min(1)}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
  try {const previous=JSON.parse(await readFile(manifestPath,'utf8'));await cleanupContactsQa(previous);await rm(manifestPath);}catch(error){if(error?.code!=='ENOENT')throw error;}
  managementToken=process.env.SUPABASE_ACCESS_TOKEN;
  if(!managementToken){const {stdout}=await exec('security',['find-generic-password','-s','Supabase CLI','-a','access-token','-w']);managementToken=stdout.trim();if(managementToken.startsWith('go-keyring-encoded:'))managementToken=Buffer.from(managementToken.split(':')[1],'hex').toString();else if(managementToken.startsWith('go-keyring-base64:'))managementToken=Buffer.from(managementToken.split(':')[1],'base64').toString();}
  admin=createClient(endpoint,secret.service_role_key,options);
  const identity=await admin.auth.admin.getUserById(secret.owner_id);
  check('Cible et identité propriétaire confirmées',!identity.error&&identity.data.user.email===secret.owner_email);
  const registry=await query(`select owner_id=${uuidSql(secret.owner_id)} as correct from private.crm_owner where singleton;`);
  check('Registre privé du propriétaire confirmé',registry.length===1&&registry[0].correct);
  const schema=await query(`select
    not has_function_privilege('anon','public.contact_command_v2(jsonb)','EXECUTE') as anonymous_command_denied,
    not has_function_privilege('anon','public.contact_email_duplicates(text,uuid,integer)','EXECUTE') as anonymous_duplicates_denied,
    not has_table_privilege('authenticated','public.contacts','INSERT,UPDATE,DELETE') as direct_write_denied,
    (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='public.contact_command_v2(jsonb)'::regprocedure) as hardened_v2,
    (select relrowsecurity from pg_class where oid='public.contacts'::regclass) as rls_enabled;`);
  check('Migration v2 : RLS, droits et RPC durcie',schema.length===1&&Object.values(schema[0]).every(Boolean));
  owner=client();check('Session propriétaire réelle',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);
  baseline=await snapshot();

  const unicodePoints=new Set([65,233,0x674e,0x639,0x10400,0x2167,0xb2]);
  for(let cp=1;cp<0x10ffff;cp++) if(/\p{Nd}/u.test(String.fromCodePoint(cp))) {unicodePoints.add(cp-1);unicodePoints.add(cp);unicodePoints.add(cp+1);}
  const parityRows=[...unicodePoints].map(cp=>`(${cp},${!/\p{Nd}/u.test(String.fromCodePoint(cp))})`).join(',');
  const parity=await query(`select count(*) as tested,bool_and(private.contact_name_valid(chr(cp))=expected) as parity from (values ${parityRows}) checks(cp,expected);`);
  check('Unicode Nd : chiffres, voisins et lettres identiques entre JS et SQL',parity[0].tested===unicodePoints.size&&parity[0].parity);
  for (const version of [1, 2]) {
    const original = command('create', version === 2 ? {...empty,first_name:'Historique',last_name:marker} : {first_name:'Historique',last_name:marker}, {}, version);
    const confirmed = await rpc(original); check('Fixture historique créée',confirmed.status==='success');
    const fixtureId=confirmed.contact.id;
    // Simulate an exact pre-rule fixture receipt, never a preexisting business record.
    const historical={...original,fields:{...original.fields,first_name:'Historique2'}};
    await query(`update public.contacts set first_name='Historique2' where id=${uuidSql(fixtureId)} and owner_id=${uuidSql(secret.owner_id)};
      update private.contact_command_receipts set command=jsonb_set(command,'{fields,first_name}','"Historique2"'), result=jsonb_set(result,'{contact,first_name}','"Historique2"') where command_id=${uuidSql(original.command_id)} and owner_id=${uuidSql(secret.owner_id)};`);
    const before=await read(fixtureId), replay=await rpc(historical);
    check(`v${version} reçu historique rejouable sans mutation`,replay.status==='success'&&replay.contact.first_name==='Historique2'&&JSON.stringify(await read(fixtureId))===JSON.stringify(before));
    for (const field of names) for (const value of ['Jean2','123','ع٢','全２','𝟚']) {
      const fields=version===2?{...empty,first_name:'Camille',last_name:marker,[field]:value}:{first_name:'Camille',last_name:marker,[field]:value};
      const rejected=await rpc(command('create',fields,{},version));
      check(`v${version} création ${field} chiffre refusée`,rejected.status==='validation'&&rejected.field===field);
      const patched=await rpc(command('update',{[field]:value},{contact_id:fixtureId,base_versions:{[field]:before.field_versions[field]}},version));
      check(`v${version} correction ${field} chiffre refusée`,patched.status==='validation'&&patched.field===field&&JSON.stringify(await read(fixtureId))===JSON.stringify(before));
    }
    const corrected=await rpc(command('update',{last_name:'O’Connor'},{contact_id:fixtureId,base_versions:{last_name:before.field_versions.last_name}},version));
    check(`v${version} nom historique inchangé toléré`,corrected.status==='success'&&corrected.contact.first_name==='Historique2');
  }

  const legacyCreate=command('create',{first_name:`  ${marker}  `,last_name:'Ancien client'}, {},1);
  const legacy=await rpc(legacyCreate);
  check('Client v1 : création encore acceptée',legacy.status==='success');
  const id=legacy.contact.id;
  const legacyKeys=['id','first_name','last_name','field_versions','revision','created_at','updated_at'].sort();
  check('Client v1 : projection stricte historique sans nouvelles colonnes',JSON.stringify(Object.keys(legacy.contact).sort())===JSON.stringify(legacyKeys)&&JSON.stringify(Object.keys(legacy.contact.field_versions).sort())===JSON.stringify(names.toSorted()));
  const initial=await read(id);
  check('Ancien contact : nouveaux champs vides et versions séparées',details.every(field=>initial[field]===''&&initial.details_versions[field]===1)&&Object.keys(initial.field_versions).sort().join()===names.toSorted().join());
  const note='  Première ligne fictive\nDeuxième ligne <b>texte brut</b>\n\nFin avec espaces  ';
  const values={email:`  QA-${marker}@example.invalid  `,job_title:'  Consultante fictive  ',linkedin_url:'  https://www.linkedin.com/in/fixture-contact  ',notes:note};
  const changed=await update(id,values);
  check('Quatre champs enregistrés : trim sélectif et note brute',changed.status==='success'&&changed.contact.email===values.email.trim()&&changed.contact.job_title===values.job_title.trim()&&changed.contact.linkedin_url===values.linkedin_url.trim()&&changed.contact.notes===note);
  check('Projection v2 : six versions fusionnées sans propriétaire',Object.keys(changed.contact.field_versions).sort().join()===[...names,...details].sort().join()&&!('owner_id'in changed.contact)&&!('details_versions'in changed.contact));
  check('Les nouveaux champs ne changent pas les versions des noms',names.every(field=>changed.contact.field_versions[field]===legacy.contact.field_versions[field]));
  const legacyUpdate=command('update',{last_name:'Ancien client corrigé'},{contact_id:id,base_versions:{last_name:legacy.contact.field_versions.last_name}},1);
  const oldChanged=await rpc(legacyUpdate);
  check('Client v1 : correction toujours strictement compatible',oldChanged.status==='success'&&Object.keys(oldChanged.contact).sort().join()===legacyKeys.join());
  const afterLegacy=await read(id);
  check('Client v1 : nouveaux champs conservés',details.every(field=>(field==='notes'?note:values[field].trim())===afterLegacy[field]));
  check('Reçu v1 historique inchangé après enrichissement',JSON.stringify(await rpc(legacyCreate))===JSON.stringify(legacy));
  check('Reçu v1 update rejoué identiquement',JSON.stringify(await rpc(legacyUpdate))===JSON.stringify(oldChanged));
  const crossVersion={...legacyCreate,version:2,fields:{...empty,...legacyCreate.fields}};
  check('Même UUID reçu v1 avec commande v2 différente refusé',(await rpc(crossVersion)).status==='validation');

  for(const [field,value] of [['email','incorrect'],['linkedin_url','javascript:alert(1)'],['linkedin_url','ftp://example.invalid'],['linkedin_url','/relative'],['job_title','x'.repeat(201)],['notes','x'.repeat(20001)]]) {
    check(`Format ou limite ${field} refusé sans perte`,(await update(id,{[field]:value})).status==='validation'&&(await read(id)).notes===note);
  }
  const unicode='🙂'.repeat(20000);
  check('Notes : limite mesurée en points de code',(await update(id,{notes:unicode})).status==='success'&&(await read(id)).notes===unicode);
  check('LinkedIn HTTP accepté',(await update(id,{linkedin_url:'http://example.invalid/contact'})).status==='success');
  check('Notes multiligne et texte HTML restaurés brut',(await update(id,{notes:note})).status==='success'&&(await read(id)).notes===note);
  const exotic='https://\u200d.example.invalid/';let whatwgRejected=false;try{new URL(exotic);}catch{whatwgRejected=true;}
  check('Fixture IDNA : rejet WHATWG connu',whatwgRejected);
  check('URL IDNA SQL acceptée : texte stocké relisible',(await update(id,{linkedin_url:exotic})).status==='success'&&(await read(id)).linkedin_url===exotic);
  check('URL IDNA corrigée par commande suivante',(await update(id,{linkedin_url:'https://example.invalid/corrected'})).status==='success');

  const base=await read(id);
  const independent=await Promise.all([
    rpc(command('update',{notes:'Note concurrente\nSeconde ligne'},{contact_id:id,base_versions:{notes:base.details_versions.notes}})),
    rpc(command('update',{job_title:'Titre concurrent indépendant'},{contact_id:id,base_versions:{job_title:base.details_versions.job_title}})),
  ]);
  const compatible=await read(id);
  check('Note et titre concurrents indépendants conservés',independent.every(result=>result.status==='success')&&compatible.notes==='Note concurrente\nSeconde ligne'&&compatible.job_title==='Titre concurrent indépendant');
  const concurrent=await Promise.all(['A','B'].map(suffix=>rpc(command('update',{notes:`Note concurrente ${suffix}`},{contact_id:id,base_versions:{notes:compatible.details_versions.notes}}))));
  const conflict=concurrent.find(result=>result.status==='conflict');
  check('Même note concurrente : un succès et un conflit ciblé',concurrent.filter(result=>result.status==='success').length===1&&conflict?.fields.join()==='notes');
  const replacement=command('update',{notes:'Remplacement confirmé'},{contact_id:id,base_versions:{notes:conflict.contact.field_versions.notes}});
  const replaced=await rpc(replacement);check('Remplacement explicite versionné accepté',replaced.status==='success');
  check('Réponse perdue v2 : même reçu sans nouvelle écriture',JSON.stringify(await rpc(replacement))===JSON.stringify(replaced)&&(await read(id)).revision===replaced.contact.revision);
  check('Même UUID v2 avec texte différent refusé',(await rpc({...replacement,fields:{notes:'Autre texte'}})).status==='validation');

  const duplicateEmail=`duplicates-${randomUUID()}@example.invalid`;
  const duplicateIds=[];
  for(let i=0;i<27;i++){const created=await rpc(command('create',{...empty,first_name:`Fictif ${alphabetic(i)}`,last_name:marker,email:i%2?duplicateEmail.toUpperCase():duplicateEmail}));check('Doublon autorise création indépendante',created.status==='success');duplicateIds.push(created.contact.id);}
  const duplicatePages=[];let duplicateTotal=0;
  for(let page=1;page===1||(page-1)*25<duplicateTotal;page++){const found=await duplicates(`  ${duplicateEmail.toUpperCase()}  `,null,page);check('Doublons : page globale accessible',found.status==='success');duplicateTotal=found.total;duplicatePages.push(...found.contacts);}
  check('Doublons globaux hors page : 27 fiches exactes sans fusion',duplicateTotal===27&&duplicatePages.length===27&&new Set(duplicatePages.map(row=>row.id)).size===27&&duplicateIds.every(id=>duplicatePages.some(row=>row.id===id)));
  const excluded=await duplicates(duplicateEmail,duplicateIds[0],1);
  check('Doublon : fiche courante exclue du total',excluded.status==='success'&&excluded.total===26&&!excluded.contacts.some(row=>row.id===duplicateIds[0]));
  const visitor=client();
  check('Visiteur : doublons privés',!!(await visitor.rpc('contact_email_duplicates',{p_email:duplicateEmail,p_exclude_id:null,p_page:1})).error);
  const outsiderPassword=`Qa-${randomUUID()}!`;
  const user=await admin.auth.admin.createUser({email:`qa-details-${randomUUID()}@example.invalid`,password:outsiderPassword,email_confirm:true});if(user.error)throw new Error('Fixture Auth refusée');outsiderId=user.data.user.id;
  outsider=client();check('Fixture non propriétaire connectée',!(await outsider.auth.signInWithPassword({email:user.data.user.email,password:outsiderPassword})).error);
  const otherDuplicates=await duplicates(duplicateEmail,null,1,outsider);
  check('Autre compte : aucun doublon révélé',otherDuplicates.status==='forbidden'&&!otherDuplicates.contacts);
  check('Autre compte : mutation v2 refusée',(await rpc(command('update',{notes:'Interdit'},{contact_id:id,base_versions:{notes:replaced.contact.field_versions.notes}}),outsider)).status==='forbidden');

  for(const field of details){const cleared=await update(id,{[field]:''});check(`${field} facultatif : effacement persisté`,cleared.status==='success'&&(await read(id))[field]==='');}
  check('Effacement des détails préserve les noms',(await read(id)).first_name===marker&&(await read(id)).last_name==='Ancien client corrigé');
  check('Notes indépendantes : aucune propriété interaction ajoutée',!Object.keys(await read(id)).some(key=>/interaction|exchange/.test(key)));
  succeeded=true;
}catch {console.error(`FAIL ${stage} ; aucun secret affiché.`);process.exitCode=1;}
finally {
  try {
    if(baseline&&managementToken)check('Toutes données et reçus préexistants inchangés',JSON.stringify(await snapshot())===JSON.stringify(baseline));
  }catch{process.exitCode=1;succeeded=false;console.error('FAIL conservation des données préexistantes.');}
  try {
    if(secret&&(fixtureIds.size||commandIds.size)){await manifest();await cleanupContactsQa({contact_ids:[...fixtureIds],command_ids:[...commandIds]});check('Fixtures et reçus exacts supprimés, absence relue',true);await rm(manifestPath);}
  }catch{process.exitCode=1;succeeded=false;console.error('FAIL nettoyage exact à reprendre depuis manifeste local.');}
  for(const session of [owner,outsider])if(session)try{await signOutQaSession(session);}catch{process.exitCode=1;succeeded=false;console.error('FAIL fermeture session QA.');}
  if(outsiderId&&admin)try{await deleteQaAuthUser(admin,outsiderId,secret.owner_id);check('Fixture Auth supprimée et absence vérifiée',true);}catch{process.exitCode=1;succeeded=false;console.error('FAIL nettoyage fixture Auth.');}
  managementToken=null;secret=null;
  await mkdir(proof,{recursive:true}).then(()=>writeFile(resolve(proof,'db-results.json'),JSON.stringify({success:succeeded&&process.exitCode!==1,at:new Date().toISOString(),node:process.version,results},null,2))).catch(()=>{process.exitCode=1;});
}
