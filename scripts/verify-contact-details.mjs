import { alphabetic, fixtureMarker } from './contacts-qa-marker.mjs';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify, isDeepStrictEqual } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cleanupContactsQa, signOutQaSession } from './contacts-qa-cleanup.mjs';

// Local story 2.2 only. Wait for the parent's migration/QA go-ahead before running.
const base='http://localhost:3000', project='otadrkhrjxafutocstzo';
const session=`bmad-details-${Date.now()}`;
const logicalRunId=z.uuid().parse(process.env.CRM_QA_RUN_ID??randomUUID());
let productFingerprint=null;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const proof=resolve(process.env.NAMES_PROOF_DIR || '_bmad-output/implementation-artifacts/verification/2-2');
const manifestPath=resolve('.local/contact-details-ui-cleanup.json');
const marker=fixtureMarker('Fictif-Details');
const idnaOnly=process.argv.includes('--idna-only');
const httpOnly=process.argv.includes('--http-only');
const reliabilityOnly=process.argv.includes('--reliability-only');
const resumeDetails=process.argv.includes('--resume-details')||reliabilityOnly;
const empty={first_name:'',last_name:'',email:'',job_title:'',linkedin_url:'',notes:''};
const fixtures=new Set(), commands=new Set(), results=[];
const exec=promisify(execFile);
let secret, owner, admin, baseline, receiptBaseline, success=false, stage='préparation', browserStarted=false;
function check(name,passed){stage=name;results.push({name,passed:!!passed});if(!passed)throw new Error(name);console.log(`PASS ${name}`);}
async function browser(...args){stage=`navigateur ${args[0]}`;try{const {stdout}=await exec('agent-browser',['--session',session,'--json',...args],{timeout:45000,maxBuffer:5_000_000});const result=JSON.parse(stdout);if(!result.success)throw new Error();return result.data;}catch{throw new Error('Commande navigateur refusée');}}
// All evaluation, including credentials and cookies, travels through stdin. Never log its result.
function evaluate(code){return new Promise((resolve,reject)=>{
  const child=spawn('agent-browser',['--session',session,'--json','eval','--stdin'],{stdio:['pipe','pipe','pipe']});let stdout='';
  child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.resume();
  const timer=setTimeout(()=>{child.kill();reject(new Error('Évaluation navigateur expirée'));},30000);
  child.on('error',()=>{clearTimeout(timer);reject(new Error('Évaluation navigateur indisponible'));});
  child.on('close',status=>{clearTimeout(timer);try{const parsed=JSON.parse(stdout);if(status||!parsed.success)throw new Error();resolve(parsed.data.result);}catch{reject(new Error('Évaluation navigateur refusée'));}});child.stdin.end(code);
});}
async function until(code,attempts=120){for(let i=0;i<attempts;i++){try{if(await evaluate(code))return true;}catch{/* Navigation destroys the old evaluation context. */}await new Promise(r=>setTimeout(r,150));}return false;}
async function click(name){
  const locate=`[...document.querySelectorAll('button')].find(el=>(el.getAttribute('aria-label')??el.textContent.trim())===${JSON.stringify(name)}&&!el.disabled&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility==='visible')`;
  check(`Commande disponible : ${name}`,await until(`!!(${locate})`));await browser('snapshot','-i');
  await evaluate(`(()=>{document.querySelector('[data-details-qa-target]')?.removeAttribute('data-details-qa-target');const button=${locate};if(!button)throw new Error('Button not ready');button.setAttribute('data-details-qa-target','');return true})()`);
  await browser('focus','[data-details-qa-target]');await browser('press','Enter');
}
async function manifest(){await writeFile(manifestPath,JSON.stringify({contact_ids:[...fixtures],command_ids:[...commands]},null,2),{mode:0o600});}
async function collect(){const ids=await evaluate('window.__detailsCommands??[]');for(const id of ids)commands.add(z.uuid().parse(id));await manifest();}
async function installTransport(){await evaluate(`(()=>{
  if(window.__detailsFetch)return true;
  window.__detailsFetch=window.fetch;window.__detailsMode='normal';window.__detailsBlockRead=false;window.__detailsCommands=[];window.__detailsMeta=[];window.__detailsStatuses=[];window.__detailsSubmitCount=0;document.addEventListener('submit',()=>window.__detailsSubmitCount++,true);window.__detailsNetwork=[];
  window.fetch=async(...args)=>{
    const url=String(args[0]);const init=args[1];window.__detailsNetwork.push({url,method:init?.method??'GET'});
    if(url.includes('/api/contacts/command')){
      try{const value=JSON.parse(init.body);if(typeof value.command_id==='string'){window.__detailsCommands.push(value.command_id);window.__detailsMeta.push({version:value.version,operation:value.operation,fields:Object.keys(value.fields??{})});}}catch{}
      if(window.__detailsMode==='offline')throw new TypeError('QA offline');
      const response=await window.__detailsFetch(...args);const inspected=await response.clone().json().catch(()=>null);window.__detailsStatuses.push({http:response.status,status:inspected?.status,field:inspected?.field});
      if(window.__detailsMode==='lost'){await response.text();throw new TypeError('QA confirmation lost');}
      if(window.__detailsMode==='delay')await new Promise(resolve=>setTimeout(resolve,2400));
      return response;
    }
    if(window.__detailsBlockRead&&url.includes('/api/contacts?version=2&id='))throw new TypeError('QA detail unavailable');
    return window.__detailsFetch(...args);
  };return true;
})()`);}
async function login(){browserStarted=true;await browser('open',base+'/connexion');check('Connexion : formulaire prêt',await until(`!!document.getElementById('email')`));
  check('Origine de saisie authentifiée exacte',await evaluate(`location.origin===${JSON.stringify(base)}&&location.pathname==='/connexion'`));
  await evaluate(`(()=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [id,value]of ${JSON.stringify([['email',secret.owner_email],['password',secret.owner_password]])}){const field=document.getElementById(id);setter.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}return true})()`);
  await browser('click','button[type=submit]');check('Connexion propriétaire réelle',await until(`location.pathname==='/'&&!document.documentElement.dataset.privateState`));
  await browser('open',base+'/contacts');check('Liste Contacts prête',await until(`document.querySelector('h1')?.textContent==='Contacts'&&!document.documentElement.dataset.privateState`));await installTransport();}
async function save(){await browser('snapshot','-i');await browser('focus','[data-slot=sheet-content] button[type=submit]');await browser('press','Enter');await collect();}
async function saved(){return until(`document.querySelector('[data-contact-message]')?.textContent.includes('Contact enregistré.')&&!document.querySelector('[data-slot=sheet-content] button[type=submit]')?.disabled`);}
async function close(){await click('Fermer la fiche');check('Fiche fermée',await until(`!document.querySelector('[data-slot=sheet-content]')`));}
async function fill(field,value){
  check(`Champ prêt : ${field}`,await until(`!!document.getElementById('contact-${field}')&&!document.getElementById('contact-${field}').matches(':disabled')`));
  if(value===''){await browser('focus',`#contact-${field}`);await evaluate(`(()=>{window.__detailsInputCount=0;const field=document.getElementById('contact-${field}');field.addEventListener('input',()=>window.__detailsInputCount++,{once:true});field.select();return true})()`);await browser('press','Backspace');
    check(`Effacement ${field} : événement input et brouillon persisté`,await until(`window.__detailsInputCount>0&&Object.keys(sessionStorage).filter(key=>key.startsWith('crm:contacts:draft:v2:')).some(key=>JSON.parse(sessionStorage.getItem(key)).values.${field}==='')`));
  }else await browser('fill',`#contact-${field}`,value);
}
async function read(id){const {data,error}=await owner.from('contacts').select('*').eq('id',z.uuid().parse(id)).single();if(error)throw new Error('Lecture fixture refusée');return data;}
async function snapshot(){const rows=[];for(let offset=0;;offset+=1000){const {data,error}=await owner.from('contacts').select('*').order('id').range(offset,offset+999);if(error)throw new Error('Inventaire privé indisponible');for(const row of data)if(!fixtures.has(row.id))rows.push({id:row.id,hash:createHash('sha256').update(JSON.stringify(row)).digest('hex')});if(data.length<1000)return rows;}}
async function rpc(command){if(command.operation==='update'&&!fixtures.has(command.contact_id))throw new Error('Mutation hors fixture interdite');commands.add(z.uuid().parse(command.command_id));await manifest();const result=await owner.rpc(command.version===2?'contact_command_v2':'contact_command',{p_command:command});if(result.error)throw new Error('RPC fixture refusée');if(result.data.status==='success'&&command.operation==='create')fixtures.add(z.uuid().parse(result.data.contact.id));await manifest();return result.data;}
async function create(fields={},version=2){return rpc({...(version===2?{version:2}:{}),operation:'create',command_id:randomUUID(),fields:version===2?{...empty,first_name:'Contact fictif',last_name:marker,...fields}:{first_name:'Ancien client fictif',last_name:marker,...fields}});}
async function update(id,fields){const row=await read(id);return rpc({version:2,operation:'update',command_id:randomUUID(),contact_id:id,fields,base_versions:Object.fromEntries(Object.keys(fields).map(field=>[field,row.field_versions[field]??row.details_versions[field]]))});}
async function openFixture(id){if(!fixtures.has(id))throw new Error('Fiche hors fixture interdite');await evaluate(`(()=>{const url=new URL(location.href);url.searchParams.set('panel',${JSON.stringify(id)});history.pushState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'));return true})()`);check('Fiche fixture chargée',await until(`new URL(location.href).searchParams.get('panel')===${JSON.stringify(id)}&&!!document.getElementById('contact-notes')&&!document.getElementById('contact-notes').disabled`));}
async function api(path,init){return evaluate(`fetch(${JSON.stringify(path)},${JSON.stringify(init??{})}).then(async r=>({status:r.status,body:await r.json()}))`);}
async function resume(){check('Brouillon reprenable proposé',await until(`document.body.innerText.includes('Une saisie est à reprendre')`));await click('Reprendre la saisie');}
async function injectLegacy(draft){await collect();await evaluate(`sessionStorage.removeItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+draft.target)});sessionStorage.setItem(${JSON.stringify('crm:contacts:draft:v1:'+secret.owner_id+':'+draft.target)},${JSON.stringify(JSON.stringify(draft))});true`);await browser('open',`${base}/contacts?panel=${draft.target}`);check('Cible legacy ouverte',await until(`!!document.getElementById('contact-notes')`));await installTransport();await resume();}

// Reuse the private management helper; SQL and credentials never enter CLI arguments.
async function query(sql){const path=resolve('.local',`names-ui-query-${logicalRunId}.sql`);await writeFile(path,sql,{mode:0o600});try{const {stdout}=await exec('python3',['.local/supabase-query.py',path],{timeout:45000,maxBuffer:2_000_000});return JSON.parse(stdout);}finally{await rm(path,{force:true});}}
const sqlUuid=value=>`'${z.uuid().parse(value)}'::uuid`;
async function receiptSnapshot(){const excluded=[...commands].map(sqlUuid).join(',');return query(`select command_id::text as id,md5(to_jsonb(r)::text) as hash from private.contact_command_receipts r ${excluded?`where command_id not in (${excluded})`:''} order by command_id;`);}
async function verifyHistoricalNames(){
  const registry=await query(`select owner_id=${sqlUuid(secret.owner_id)} as correct from private.crm_owner where singleton;`);
  check('Fixtures historiques : registre propriétaire confirmé',registry.length===1&&registry[0].correct);
  for(const version of [1,2]){
    const original={...(version===2?{version:2}:{}),operation:'create',command_id:randomUUID(),fields:version===2?{...empty,first_name:'Historique',last_name:marker}:{first_name:'Historique',last_name:marker}};
    const result=await rpc(original);check(`Historique v${version} : fixture exacte créée`,result.status==='success');const id=result.contact.id;
    if(!fixtures.has(id)||!commands.has(original.command_id))throw new Error('Fixture historique hors manifeste');
    // Canonical v1 values are trimmed before fingerprinting, as in the hosted client.
    const canonical={...original,fields:{...original.fields,first_name:'Historique2',last_name:'Ancien٣'}};
    const expected={...result,contact:{...result.contact,first_name:'Historique2',last_name:'Ancien٣'}};
    await query(`begin;
      update public.contacts set first_name='Historique2',last_name='Ancien٣' where id=${sqlUuid(id)} and owner_id=${sqlUuid(secret.owner_id)};
      update private.contact_command_receipts set command=jsonb_set(jsonb_set(command,'{fields,first_name}','"Historique2"'),'{fields,last_name}','"Ancien٣"'),result=jsonb_set(jsonb_set(result,'{contact,first_name}','"Historique2"'),'{contact,last_name}','"Ancien٣"') where command_id=${sqlUuid(original.command_id)} and owner_id=${sqlUuid(secret.owner_id)} and result->'contact'->>'id'='${z.uuid().parse(id)}';
      commit;`);
    const before=await read(id),countBefore=await owner.from('contacts').select('id',{head:true,count:'exact'});
    const replay=await api('/api/contacts/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(canonical)});
    check(`HTTP v${version} : reçu chiffré confirmé rejoué`,replay.body.status==='success'&&isDeepStrictEqual(replay.body,expected));
    const countAfter=await owner.from('contacts').select('id',{head:true,count:'exact'});
    check(`HTTP v${version} : rejeu sans révision ni doublon`,!countBefore.error&&!countAfter.error&&countBefore.count===countAfter.count&&JSON.stringify(await read(id))===JSON.stringify(before));
    await browser('open',`${base}/contacts?panel=${id}`);check(`Historique v${version} : deux noms lisibles`,await until(`document.getElementById('contact-first_name')?.value==='Historique2'&&document.getElementById('contact-last_name')?.value==='Ancien٣'`));await installTransport();
    await fill('notes','Note historique corrigée');await save();check(`Historique v${version} : note corrigée malgré les deux noms`,await saved()&&(await read(id)).notes==='Note historique corrigée');
    await fill('first_name','Élodie');await save();check(`Historique v${version} : prénom seul corrigé`,await saved());await close();
    await browser('open',`${base}/contacts?panel=${id}`);check(`Historique v${version} : autre nom et note conservés après rechargement`,await until(`document.getElementById('contact-first_name')?.value==='Élodie'&&document.getElementById('contact-last_name')?.value==='Ancien٣'&&document.getElementById('contact-notes')?.value==='Note historique corrigée'`));await installTransport();await close();
    const current=(await api(`/api/contacts?version=${version}&id=${id}`)).body.contact;
    const pendingCommand={...(version===2?{version:2}:{}),operation:'update',command_id:randomUUID(),contact_id:id,fields:{first_name:'Pending𝟚'},base_versions:{first_name:current.field_versions.first_name}};
    commands.add(pendingCommand.command_id);await manifest();
    const values=version===2?{...empty,first_name:current.first_name,last_name:current.last_name,email:current.email,job_title:current.job_title,linkedin_url:current.linkedin_url,notes:current.notes}:{first_name:current.first_name,last_name:current.last_name};values.first_name='Pending𝟚';
    const draft={...(version===2?{version:2}:{}),target:id,generation:1,values,base:current,pending:{command:pendingCommand,generation:1,values:{...values}}};
    if(version===1)await injectLegacy(draft);else{
      await collect();await evaluate(`sessionStorage.setItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+id)},${JSON.stringify(JSON.stringify(draft))});true`);
      await browser('open',`${base}/contacts?panel=${id}`);check('Cible pending v2 ouverte',await until(`!!document.getElementById('contact-notes')`));await installTransport();await resume();
    }
    await save();
    check(`Pending v${version} : refus ciblé, commande libérée et texte intact`,await until(`document.getElementById('error-first_name')?.textContent.includes('chiffres')&&document.getElementById('contact-first_name').value==='Pending𝟚'&&JSON.parse(sessionStorage.getItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+id)})).pending===null`));
    await fill('first_name','Camille');await save();check(`Pending v${version} : correction réellement persistée`,await saved()&&(await read(id)).first_name==='Camille'&&(await read(id)).last_name==='Ancien٣');await close();
  }
}

async function verifyHttpBoundaries(){
  const created=await create({first_name:'Bornes HTTP fictives'});check('Fixture HTTP créée',created.status==='success');const id=created.contact.id;
  const row=await read(id);
  const make=(fields)=>({version:2,operation:'update',command_id:randomUUID(),contact_id:id,fields,base_versions:Object.fromEntries(Object.keys(fields).map(field=>[field,row.field_versions[field]??row.details_versions[field]]))});
  for(const version of [1,2]) for(const field of ['first_name','last_name']) for(const value of ['Jean2','ع٢','全２','𝟚']) {
    for(const operation of ['create','update']) {
      const cmd=operation==='update'?make({[field]:value}):{version:2,operation:'create',command_id:randomUUID(),fields:{...empty,first_name:'Camille',last_name:marker,[field]:value}};
      if(version===1){delete cmd.version;if(operation==='create')cmd.fields={first_name:cmd.fields.first_name,last_name:cmd.fields.last_name};}
      commands.add(cmd.command_id);await manifest();
      const response=await api('/api/contacts/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cmd)});
      check(`HTTP v${version} ${operation} ${field} refuse ${value}`,response.body.status==='validation'&&response.body.field===field);
    }
  }
  const huge=make({notes:'x'.repeat(128*1024+1)});commands.add(huge.command_id);await manifest();
  const oversize=await api('/api/contacts/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(huge)});
  check('Commande >128 Kio refusée avant mutation',oversize.status===400&&oversize.body.status==='validation'&&oversize.body.message==='Commande trop longue.');
  const duplicateOversize=await api('/api/contacts/duplicates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'x'.repeat(4200)+'@example.invalid',exclude_id:id,page:1})});
  check('Doublons >4 Kio refusés',duplicateOversize.status===400&&duplicateOversize.body.status==='validation');
  const cookie=await evaluate('document.cookie');const foreign=make({notes:'Écriture étrangère interdite'});commands.add(foreign.command_id);await manifest();
  const csrf=await fetch(base+'/api/contacts/command',{method:'POST',headers:{Cookie:cookie,Origin:'https://hostile.example.invalid','Content-Type':'application/json'},body:JSON.stringify(foreign),signal:AbortSignal.timeout(15000)});
  check('Commande depuis origine étrangère refusée',csrf.status===403&&(await csrf.json()).status==='forbidden');
  const foreignDuplicate=await fetch(base+'/api/contacts/duplicates',{method:'POST',headers:{Cookie:cookie,Origin:'https://hostile.example.invalid','Content-Type':'application/json'},body:JSON.stringify({email:'fictif@example.invalid',exclude_id:id,page:1}),signal:AbortSignal.timeout(15000)});
  check('Doublons depuis origine étrangère refusés',foreignDuplicate.status===403&&(await foreignDuplicate.json()).status==='forbidden');
  const invalid=make({email:'adresse-invalide'});commands.add(invalid.command_id);await manifest();
  const validation=await api('/api/contacts/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(invalid)});
  check('Payload v2 invalide : erreur serveur associée au champ e-mail',validation.body.status==='validation'&&validation.body.field==='email');
  check('Tous refus HTTP : fixture intégralement inchangée',JSON.stringify(await read(id))===JSON.stringify(row));
}

async function fingerprintProduct(){
  const paths=[];
  async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=directory+'/'+entry.name;if(entry.isDirectory())await walk(path);else if(entry.isFile())paths.push(path);}}
  for(const directory of ['app','components','lib','supabase/migrations'])await walk(directory);
  paths.push('middleware.ts','package.json','pnpm-lock.yaml','next.config.ts');
  const hash=createHash('sha256');for(const path of paths.sort()){const content=await readFile(path);hash.update(path+'\0'+content.length+'\0');hash.update(content);}return hash.digest('hex');
}
function aggregateUiReports(parts,current,required){
  const identified=typeof current.logicalRunId==='string'&&typeof current.productFingerprint==='string';
  const matching=identified?parts.filter(part=>part.logicalRunId===current.logicalRunId&&part.productFingerprint===current.productFingerprint).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)):[];
  const checks=new Map();for(const part of matching)for(const check of part.results??[])checks.set(check.name,check);
  const missing=required.filter(name=>!checks.get(name)?.passed),results=[...checks.values()],latest=matching.at(-1);
  return {success:identified&&current.success===true&&latest?.success===true&&latest.at===current.at&&missing.length===0&&results.every(check=>check.passed),logicalRunId:current.logicalRunId,productFingerprint:current.productFingerprint,current:{scope:current.scope,at:current.at,success:current.success},parts:matching.map(part=>({file:part.file,scope:part.scope??'initial',at:part.at,success:part.success})),missing,results};
}

try{
  check('Node 24',process.versions.node.startsWith('24.'));await mkdir(proof,{recursive:true});await mkdir(resolve('.local'),{recursive:true});
  productFingerprint=await fingerprintProduct();
  console.log(`QA logical run: ${logicalRunId}`);
  secret=z.object({project_ref:z.literal(project),anon_key:z.string().min(1),service_role_key:z.string().min(1),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string().min(1)}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
  try{const previous=JSON.parse(await readFile(manifestPath,'utf8'));await cleanupContactsQa(previous);await rm(manifestPath);}catch(error){if(error?.code!=='ENOENT')throw error;}
  admin=createClient(`https://${project}.supabase.co`,secret.service_role_key,options);owner=createClient(`https://${project}.supabase.co`,secret.anon_key,options);
  const identity=await admin.auth.admin.getUserById(secret.owner_id);check('Projet dédié et propriétaire exacts',!identity.error&&identity.data.user.email===secret.owner_email);
  check('Session RPC propriétaire',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);
  baseline=await snapshot();receiptBaseline=await receiptSnapshot();await login();
  const anonymous=await fetch(base+'/api/contacts?version=2&page=1',{redirect:'manual'});check('API v2 sans session : données refusées',anonymous.status===401&&(await anonymous.json()).status==='unauthenticated');
  const anonymousDuplicates=await fetch(base+'/api/contacts/duplicates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'qa@example.invalid',exclude_id:null,page:1}),redirect:'manual'});check('Doublons sans session : données refusées',anonymousDuplicates.status===401);
  await click('Ajouter un contact');check('Noms : formulaire prêt',await until(`!!document.getElementById('contact-first_name')`));
  await fill('first_name','Jean2');await fill('last_name','Nom٢');await save();
  check('Noms : erreurs près des deux champs et saisie conservée',await until(`document.getElementById('error-first_name')?.textContent.includes('chiffres')&&document.getElementById('error-last_name')?.textContent.includes('chiffres')&&document.getElementById('contact-first_name').value==='Jean2'&&document.getElementById('contact-last_name').value==='Nom٢'`));
  check('Noms : focus direct sur le premier champ invalide',await until(`document.activeElement?.id==='contact-first_name'`));
  await click('Fermer la fiche');check('Noms : confirmation de fermeture ouverte',await until(`!!document.querySelector('[data-slot=dialog-content]')`));
  await browser('snapshot','-i');await evaluate(`(()=>{const button=[...document.querySelectorAll('[data-slot=dialog-content] button')].find(el=>el.textContent.trim()==='Enregistrer');if(!button)throw new Error('Save confirmation missing');button.setAttribute('data-names-save-close','');return true})()`);await browser('focus','[data-names-save-close]');await browser('press','Enter');
  check('Noms : focus après fermeture sur erreur et saisie conservée',await until(`!document.querySelector('[data-slot=dialog-content]')&&document.activeElement?.id==='contact-first_name'&&document.getElementById('contact-first_name').value==='Jean2'&&document.getElementById('contact-last_name').value==='Nom٢'`));
  await browser('screenshot',resolve(proof,'names-errors.png'));
  await fill('first_name','Élodie');await fill('last_name',marker);await save();check('Noms : correction et création confirmées',await saved());
  const namesId=z.uuid().parse(await evaluate(`new URL(location.href).searchParams.get('panel')`));fixtures.add(namesId);await manifest();
  await fill('last_name','O’Connor𝟚');await save();check('Noms : modification refusée sans effacer le texte',await until(`document.getElementById('error-last_name')?.textContent.includes('chiffres')&&document.getElementById('contact-last_name').value==='O’Connor𝟚'`));
  check('Noms : refus sans mutation',(await read(namesId)).last_name===marker);
  await fill('last_name','O’Connor');await save();check('Noms : correction enregistrée',await saved());await close();
  await browser('open',`${base}/contacts?panel=${namesId}`);check('Noms : correction persistée après rechargement',await until(`document.getElementById('contact-first_name')?.value==='Élodie'&&document.getElementById('contact-last_name')?.value==='O’Connor'`));await installTransport();await browser('screenshot',resolve(proof,'names-persisted.png'));await close();
  await verifyHistoricalNames();
  if(!httpOnly){
  if(!resumeDetails){
  await click('Ajouter un contact');check('Création : six champs prêts',await until(`!!document.getElementById('contact-notes')`));
  await fill('first_name','Création détaillée fictive');await fill('last_name',marker);await fill('email','creation-'+marker+'@example.invalid');await fill('job_title','Titre créé');await fill('linkedin_url','https://example.invalid/creation');await fill('notes','Note créée\nSeconde ligne');await save();check('Création UI avec quatre informations confirmée',await saved());
  const createdId=z.uuid().parse(await evaluate(`new URL(location.href).searchParams.get('panel')`));fixtures.add(createdId);await manifest();const createdRow=await read(createdId);check('Création UI : quatre champs réellement persistés',createdRow.email==='creation-'+marker+'@example.invalid'&&createdRow.job_title==='Titre créé'&&createdRow.linkedin_url==='https://example.invalid/creation'&&createdRow.notes==='Note créée\nSeconde ligne');await close();
  const exotic=(await create({first_name:'URL exotique fictive',linkedin_url:'https://\u200d.example.invalid/'})).contact;
  check('Fixture IDNA stockée par RPC',exotic.linkedin_url==='https://\u200d.example.invalid/');
  const exoticRead=await api('/api/contacts?version=2&id='+exotic.id);check('URL IDNA : lecture API détail reste fonctionnelle',exoticRead.body.status==='success'&&exoticRead.body.contact.linkedin_url==='https://\u200d.example.invalid/');
  await click('Actualiser');await until(`!document.body.innerText.includes('Actualisation…')`);
  const initialPage=await api('/api/contacts?version=2&page=1');check('URL IDNA : lecture liste reste fonctionnelle',initialPage.body.status==='success');
  for(let page=1;page<=Math.ceil(initialPage.body.total/25);page++){if(await evaluate(`!!document.querySelector('[data-contact-id="${exotic.id}"]')`))break;await click('Suivant');await until(`document.body.innerText.includes('Page ${page+1} sur')&&!document.body.innerText.includes('Actualisation…')`);}
  check('URL IDNA : ligne visible sans lien activable',await evaluate(`!!document.querySelector('[data-contact-id="${exotic.id}"]')&&!document.querySelector('[data-contact-id="${exotic.id}"] a[target="_blank"]')`));
  await openFixture(exotic.id);check('URL IDNA : fiche utilisable sans lien activable',await evaluate(`document.getElementById('contact-linkedin_url').value==='https://\u200d.example.invalid/'&&![...document.querySelectorAll('[data-slot=sheet-content] a')].some(a=>a.target==='_blank')`));
  await fill('notes','Note préservée malgré URL exotique');await save();check('URL IDNA : sauvegarde bloquée près du champ',await until(`!!document.getElementById('error-linkedin_url')&&document.getElementById('contact-notes').value==='Note préservée malgré URL exotique'`));
  await fill('linkedin_url','https://example.invalid/corrected');await save();check('URL IDNA corrigée : sauvegarde redevient possible',await saved());await close();
  await collect();await browser('open',base+'/contacts');check('Retour liste initiale après fixture URL',await until(`document.querySelector('h1')?.textContent==='Contacts'&&!document.documentElement.dataset.privateState`));await installTransport();
  }
  if(!idnaOnly){
  const legacy=(await create({},1)).contact,id=legacy.id;
  await openFixture(id);
  check('Ancien contact : quatre champs facultatifs vides',await evaluate(`['email','job_title','linkedin_url','notes'].every(field=>document.getElementById('contact-'+field).value==='')`));
  const note='  Note fictive multiligne\nDeuxième ligne <b>texte brut</b>\n\nFin avec espaces  ';
  const email=`fictif-${randomUUID()}@example.invalid`;
  let row;
  if(!resumeDetails){
  const commandsBeforeValidation=commands.size;
  await fill('email','incorrect');await fill('job_title','Titre conservé');await fill('notes',note);await save();
  check('E-mail incorrect : erreur associée et saisie intacte',await until(`!!document.getElementById('error-email')&&document.getElementById('contact-email').getAttribute('aria-describedby')?.includes('error-email')&&document.getElementById('contact-notes').value===${JSON.stringify(note)}`));
  check('Format e-mail invalide : aucune commande de mutation',commands.size===commandsBeforeValidation);
  await fill('email',`  ${email}  `);await fill('linkedin_url','javascript:alert(1)');await save();check('LinkedIn interdit : erreur de champ et note préservée',await until(`!!document.getElementById('error-linkedin_url')&&document.getElementById('contact-notes').value===${JSON.stringify(note)}`));
  await fill('linkedin_url','https://www.linkedin.com/in/contact-fictif');await fill('job_title','  Consultante fictive  ');await save();check('Quatre informations enregistrées',await saved());
  row=await read(id);check('Trim e-mail et titre, notes multiligne brutes',row.email===email&&row.job_title==='Consultante fictive'&&row.notes===note);
  check('LinkedIn externe protégé',await evaluate(`!![...document.querySelectorAll('[data-slot=sheet-content] a')].find(a=>a.href==='https://www.linkedin.com/in/contact-fictif'&&a.target==='_blank'&&a.rel.includes('noopener')&&a.rel.includes('noreferrer'))`));
  check('Notes ne sont jamais interprétées comme HTML',await evaluate(`document.getElementById('contact-notes').value===${JSON.stringify(note)}&&![...document.querySelectorAll('[data-slot=sheet-content] b')].some(el=>el.textContent==='texte brut')`));
  const v2Page=await api('/api/contacts?version=2&page=1');check('Liste v2 : notes longues absentes de chaque ligne',v2Page.body.status==='success'&&v2Page.body.contacts.every(item=>!('notes'in item)));
  check('Liste : ordre des cinq colonnes approuvées',await evaluate(`JSON.stringify([...document.querySelectorAll('thead th')].map(el=>el.textContent))===JSON.stringify(['Prénom','Nom','E-mail','Titre professionnel','LinkedIn'])`));
  const oldRead=await api('/api/contacts?id='+id);check('API legacy : projection stricte deux champs métier',oldRead.body.status==='success'&&Object.keys(oldRead.body.contact).sort().join()===Object.keys(legacy).sort().join());
  const v2Read=await api('/api/contacts?version=2&id='+id);check('API détail v2 : note canonique réellement lue',v2Read.body.status==='success'&&v2Read.body.contact.notes===note);
  await collect();await browser('reload');check('Quatre champs retrouvés après reload',await until(`document.getElementById('contact-email')?.value===${JSON.stringify(email)}&&document.getElementById('contact-job_title')?.value==='Consultante fictive'&&document.getElementById('contact-notes')?.value===${JSON.stringify(note)}`));await installTransport();
  }else{await update(id,{email,job_title:'Consultante fictive',linkedin_url:'https://www.linkedin.com/in/contact-fictif',notes:note});await collect();await browser('open',`${base}/contacts?panel=${id}`);check('Fixture de reprise chargée avec valeurs confirmées',await until(`document.getElementById('contact-email')?.value===${JSON.stringify(email)}&&!document.getElementById('contact-email').matches(':disabled')`));await installTransport();}
  if(!reliabilityOnly){
  for(const field of ['email','job_title','linkedin_url','notes']){await fill(field,'');await save();check(`${field} effaçable et persisté`,await saved()&&(await read(id))[field]==='');}
  check('LinkedIn vide : aucune commande externe',await evaluate(`![...document.querySelectorAll('[data-slot=sheet-content] a')].some(a=>a.target==='_blank')`));
  await fill('linkedin_url','http://example.invalid/contact');await fill('notes',note);await save();check('HTTP et note restaurés',await saved());

  const duplicateEmail=`doublon-${randomUUID()}@example.invalid`,duplicateIds=[];
  for(let i=0;i<27;i++){const created=await create({first_name:`Doublon ${alphabetic(String(i).padStart(2,'0'))}`,email:i%2?duplicateEmail.toUpperCase():duplicateEmail});check('Fixture doublon créée',created.status==='success');duplicateIds.push(created.contact.id);}
  await close();await click('Actualiser');check('Liste paginée stabilisée',await until(`document.querySelectorAll('[data-contact-id]').length===25&&!document.body.innerText.includes('Actualisation…')`));
  const visible=await evaluate(`[...document.querySelectorAll('[data-contact-id]')].map(el=>el.dataset.contactId)`);check('Au moins un doublon hors page actuelle',duplicateIds.some(value=>!visible.includes(value)));
  await openFixture(id);await fill('email',duplicateEmail.toUpperCase());
  check('Avertissement doublons non bloquant affiché',await until(`!!document.querySelector('[data-contacts-duplicates]')&&document.querySelector('[data-contacts-duplicates]').textContent.includes('27')&&!document.querySelector('[data-slot=sheet-content] button[type=submit]').disabled`));
  let duplicatePage=await api('/api/contacts/duplicates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:duplicateEmail.toUpperCase(),exclude_id:id,page:1})});
  let found=[...duplicatePage.body.contacts];const second=await api('/api/contacts/duplicates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:duplicateEmail,exclude_id:id,page:2})});found.push(...second.body.contacts);
  check('API doublons globale : 27 contacts toutes pages',duplicatePage.body.total===27&&found.length===27&&duplicateIds.every(value=>found.some(item=>item.id===value)));
  await click('Doublons suivants');check('Avertissement : seconde page de doublons réellement navigable',await until(`document.querySelector('[data-contacts-duplicates]')?.textContent.includes('2 / 2')&&${JSON.stringify(second.body.contacts.map(item=>item.first_name))}.every(name=>document.querySelector('[data-contacts-duplicates]').textContent.includes(name))`));
  await save();check('Doublon en casse différente : sauvegarde permise sans fusion',await saved()&&(await read(id)).email===duplicateEmail.toUpperCase());
  const counts=await owner.from('contacts').select('id',{count:'exact',head:true}).in('id',duplicateIds);check('Toutes fiches doublons toujours distinctes',!counts.error&&counts.count===27);
  check('Aucun e-mail ou note dans URL réseau ; doublons en POST',await evaluate(`window.__detailsNetwork.every(item=>!decodeURIComponent(item.url).includes(${JSON.stringify(duplicateEmail)})&&!decodeURIComponent(item.url).includes(${JSON.stringify(duplicateEmail.toUpperCase())})&&!decodeURIComponent(item.url).includes(${JSON.stringify(note)})&&(!item.url.includes('/api/contacts/duplicates')||item.method==='POST'))`));

  }
  await fill('notes','Note hors connexion\nConservée');await evaluate(`window.__detailsMode='offline';true`);await save();
  check('Offline : note et commande conservées',await until(`document.body.innerText.includes('confirmation n’a pas été reçue')&&document.getElementById('contact-notes').value==='Note hors connexion\\nConservée'`));check('Offline : ancienne note encore en DB',(await read(id)).notes===note);
  await evaluate(`window.__detailsMode='normal';true`);await save();check('Réessai après offline confirmé',await saved());
  await fill('notes','Note commit sans réponse');await evaluate(`window.__detailsMode='lost';true`);await save();check('Perte de confirmation explicite',await until(`document.body.innerText.includes('confirmation n’a pas été reçue')`));row=await read(id);check('Perte réponse : vrai commit observé',row.notes==='Note commit sans réponse');
  await evaluate(`window.__detailsMode='normal';true`);await save();check('Même commande rejouée sans nouvelle révision',await saved()&&(await read(id)).revision===row.revision);
  await fill('notes','Note lente');await evaluate(`window.__detailsMode='delay';true`);await save();await fill('notes','Nouvelle génération\nÀ conserver');
  check('Confirmation tardive : génération récente conservée',await until(`document.body.innerText.includes('Votre nouvelle saisie reste à enregistrer')&&document.getElementById('contact-notes').value==='Nouvelle génération\\nÀ conserver'`));
  await evaluate(`window.__detailsMode='normal';true`);await save();check('Nouvelle génération correctement réancrée',await saved()&&(await read(id)).notes==='Nouvelle génération\nÀ conserver');
  await fill('notes','Note locale compatible');await update(id,{job_title:'Titre autre onglet'});await save();check('Note locale et titre distant indépendants conservés',await saved()&&(await read(id)).notes==='Note locale compatible'&&(await read(id)).job_title==='Titre autre onglet');
  await fill('notes','Note locale conflictuelle');await fill('job_title','Titre local indépendant');await update(id,{notes:'Note distante conflictuelle'});await save();check('Conflit réel de note visible',await until(`document.body.innerText.includes('Cette fiche a changé ailleurs')&&document.getElementById('contact-notes').value==='Note locale conflictuelle'`));
  await click('Utiliser la version enregistrée pour Notes');await click('Préparer ces choix');check('Choix distant limité à la note conflictuelle',await evaluate(`document.getElementById('contact-notes').value==='Note distante conflictuelle'&&document.getElementById('contact-job_title').value==='Titre local indépendant'`));await save();check('Titre indépendant conservé après résolution',await saved());
  await fill('notes','Note locale retenue');await update(id,{notes:'Autre note distante'});await save();check('Second conflit présenté',await until(`document.body.innerText.includes('Cette fiche a changé ailleurs')`));await click('Garder ma saisie pour Notes');await click('Préparer ces choix');await save();check('Remplacement explicite de note contrôlé',await saved()&&(await read(id)).notes==='Note locale retenue');
  await fill('notes','Brouillon privé après expiration\nSeconde ligne');await evaluate(`(()=>{for(const cookie of document.cookie.split(';'))document.cookie=cookie.split('=')[0].trim()+'=;Max-Age=0;path=/';return true})()`);await save();
  check('Expiration : panneau purgé et connexion requise',await until(`location.pathname==='/connexion'&&!document.querySelector('[data-slot=sheet-content]')&&!document.body.textContent.includes('Brouillon privé après expiration')`));
  await login();check('Reconnexion : retrouver saisie proposé',await until(`!![...document.querySelectorAll('button')].find(el=>el.textContent==='Retrouver ma saisie')`));await click('Retrouver ma saisie');await resume();check('Note entière restaurée après reconnexion',await evaluate(`document.getElementById('contact-notes').value==='Brouillon privé après expiration\\nSeconde ligne'`));await save();check('Note restaurée enregistrée',await saved());await close();

  const old=(await create({first_name:'Base legacy'},1)).contact,oldId=old.id;
  await update(oldId,{email:'legacy-fictif@example.invalid',job_title:'Titre réellement lu',notes:'Note enrichie réellement lue'});
  const legacyDraft={target:oldId,generation:7,values:{first_name:'  Ancien brouillon intact  ',last_name:marker},base:old,pending:null};
  await injectLegacy(legacyDraft);check('Brouillon v1 : noms bruts et détails réels raccordés',await evaluate(`document.getElementById('contact-first_name').value==='  Ancien brouillon intact  '&&document.getElementById('contact-job_title').value==='Titre réellement lu'&&document.getElementById('contact-notes').value==='Note enrichie réellement lue'`));await save();check('Brouillon v1 sauvegardé sans effacer nouveaux champs',await saved()&&(await read(oldId)).notes==='Note enrichie réellement lue');await close();
  const legacyBase=(await api('/api/contacts?id='+oldId)).body.contact;
  const pendingCommand={operation:'update',command_id:randomUUID(),contact_id:oldId,fields:{first_name:'  Commande legacy en attente  '},base_versions:{first_name:legacyBase.field_versions.first_name}};
  const canonicalPending={...pendingCommand,fields:{first_name:pendingCommand.fields.first_name.trim()}};
  const received=await rpc(canonicalPending);check('Fixture v1 : commande committée avant réception',received.status==='success');
  const pendingDraft={target:oldId,generation:10,values:{first_name:'  Saisie suivante intacte  ',last_name:marker},base:legacyBase,pending:{command:pendingCommand,generation:9,values:{first_name:'  Commande legacy en attente  ',last_name:marker}}};
  await injectLegacy(pendingDraft);await evaluate(`window.__detailsBlockRead=true;true`);await save();check('Reçu v1 sans lecture détail : confirmation retenue et pending conservé',await until(`document.body.innerText.includes('fiche doit encore être relue')&&JSON.parse(sessionStorage.getItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+oldId)})).pending.command.command_id===${JSON.stringify(pendingCommand.command_id)}`));await evaluate(`window.__detailsBlockRead=false;true`);await save();check('Reçu v1 : génération récente préservée après reprise',await until(`document.getElementById('contact-first_name').value==='  Saisie suivante intacte  '&&document.getElementById('contact-notes').value==='Note enrichie réellement lue'&&document.body.innerText.includes('Votre nouvelle saisie reste à enregistrer')`));
  const replayed=await rpc(canonicalPending);check('Reçu v1 toujours immuable après raccord v2',JSON.stringify(replayed)===JSON.stringify(received));
  await save();check('Génération suivante issue de v1 enregistrée sans perte',await saved()&&(await read(oldId)).first_name==='Saisie suivante intacte'&&(await read(oldId)).notes==='Note enrichie réellement lue');await close();

  await openFixture(id);await fill('notes','Fermeture conserve\nTexte brut');await click('Fermer la fiche');check('Fermeture sale : trois choix visibles',await until(`document.body.innerText.includes('Conserver votre saisie ?')`));await click('Continuer la saisie');check('Continuer : note conservée',await evaluate(`document.getElementById('contact-notes').value==='Fermeture conserve\\nTexte brut'`));await click('Fermer la fiche');await click('Abandonner');check('Abandon : note confirmée inchangée',(await read(id)).notes==='Brouillon privé après expiration\nSeconde ligne');
  for(const [label,width,height]of [['desktop',1440,900],['large',2560,1440],['ipad-portrait',820,1180],['ipad-paysage',1180,820],['iphone',402,874]]){
    await browser('set','viewport',String(width),String(height));await openFixture(id);
    check(`${label} : six champs accessibles et aucune largeur débordante`,await evaluate(`document.documentElement.scrollWidth<=innerWidth&&['first_name','last_name','email','job_title','linkedin_url','notes'].every(field=>document.getElementById('contact-'+field).getBoundingClientRect().height>=44)&&document.querySelector('[data-slot=sheet-content]').getBoundingClientRect().width<=innerWidth`));
    await browser('focus','#contact-email');await browser('press','Tab');check(`${label} : Tab reste dans le panneau`,await evaluate(`document.querySelector('[data-slot=sheet-content]').contains(document.activeElement)`));
    await browser('screenshot',resolve(proof,`details-${label}.png`));await browser('press','Escape');check(`${label} : Escape ferme`,await until(`!document.querySelector('[data-slot=sheet-content]')`));
  }
  await browser('set','viewport','1440','900');await openFixture(id);const a11y=await browser('a11y');check('Accessibilité fiche détails : zéro violation',a11y.counts.violations===0);await writeFile(resolve(proof,'details-a11y.json'),JSON.stringify(a11y,null,2));
  }
  }
  if(httpOnly||(!idnaOnly&&!resumeDetails))await verifyHttpBoundaries();
  if(browserStarted){const errors=await browser('errors');const logs=await browser('console');const runtimeErrors=Array.isArray(errors)?errors:Array.isArray(errors?.errors)?errors.errors:[];const consoleItems=Array.isArray(logs)?logs:Array.isArray(logs?.messages)?logs.messages:[];check('Console navigateur : aucun crash JavaScript',runtimeErrors.length===0);await writeFile(resolve(proof,httpOnly?'browser-diagnostics-http.json':'browser-diagnostics-ui.json'),JSON.stringify({at:new Date().toISOString(),runtimeErrorCount:runtimeErrors.length,consoleErrorCount:consoleItems.filter(item=>item.type==='error'||item.level==='error').length},null,2));}
  success=true;
}catch{console.error(`FAIL ${stage} ; aucun secret affiché.`);if(browserStarted)try{const diagnostic=await evaluate(`({message:document.querySelector('[data-contact-message]')?.textContent,meta:window.__detailsMeta,statuses:window.__detailsStatuses,urlCorrected:document.getElementById('contact-linkedin_url')?.value==='https://example.invalid/corrected',errors:[...document.querySelectorAll('[id^=error-]')].map(e=>({id:e.id,text:e.textContent})),submitCount:window.__detailsSubmitCount,formValid:document.querySelector('[data-slot=sheet-content] form')?.checkValidity(),draftMatchesDom:(()=>{const key=Object.keys(sessionStorage).find(key=>key.startsWith('crm:contacts:draft:v2:')&&key.endsWith(new URL(location.href).searchParams.get('panel')));return key?JSON.parse(sessionStorage.getItem(key)).values.linkedin_url===document.getElementById('contact-linkedin_url')?.value:null;})(),submitDisabled:document.querySelector('[data-slot=sheet-content] button[type=submit]')?.disabled})`);console.log(JSON.stringify({diagnostic}));}catch{}process.exitCode=1;}
finally{
  if(browserStarted)await collect().catch(()=>{});
  try{
    if(admin&&baseline){const scan=await admin.from('contacts').select('id').eq('last_name',marker);if(scan.error)throw new Error('Inventaire fixture indisponible');for(const row of scan.data){if(baseline.some(original=>original.id===row.id))throw new Error('Collision fixture préexistante');fixtures.add(row.id);}await manifest();check('Contacts préexistants intégralement inchangés',JSON.stringify(await snapshot())===JSON.stringify(baseline));if(receiptBaseline)check('Reçus préexistants intégralement inchangés',JSON.stringify(await receiptSnapshot())===JSON.stringify(receiptBaseline));}
  }catch{process.exitCode=1;success=false;console.error('FAIL conservation ou inventaire de fixtures.');}
  try{if(secret&&(fixtures.size||commands.size)){await manifest();await cleanupContactsQa({contact_ids:[...fixtures],command_ids:[...commands]});check('Contacts et reçus exacts supprimés, absence vérifiée',true);await rm(manifestPath);}}catch{process.exitCode=1;success=false;console.error('FAIL nettoyage exact à reprendre via manifeste local.');}
  if(owner)try{await signOutQaSession(owner);}catch{process.exitCode=1;success=false;console.error('FAIL fermeture session QA.');}
  if(browserStarted)try{await browser('close');}catch{process.exitCode=1;success=false;console.error('FAIL fermeture navigateur QA.');}
  secret=null;
  await mkdir(proof,{recursive:true}).then(async()=>{
    const at=new Date().toISOString(),scope=httpOnly?'http':idnaOnly?'idna':reliabilityOnly?'reliability-remainder':resumeDetails?'details-remainder':'full';
    const report={success:success&&process.exitCode!==1,logicalRunId,productFingerprint,scope,at,node:process.version,base,results};
    await writeFile(resolve(proof,'ui-current-results.json'),JSON.stringify(report,null,2));
    await writeFile(resolve(proof,`ui-part-${Date.parse(at)}-${scope}.json`),JSON.stringify(report,null,2));
    if(httpOnly||idnaOnly)await writeFile(resolve(proof,httpOnly?'http-results.json':'idna-results.json'),JSON.stringify(report,null,2));
    const partNames=(await readdir(proof)).filter(name=>name.startsWith('ui-part-'));const parts=[];
    for(const name of partNames)parts.push({file:name,...JSON.parse(await readFile(resolve(proof,name),'utf8'))});
    const required=['Création UI avec quatre informations confirmée','URL IDNA corrigée : sauvegarde redevient possible','Quatre champs retrouvés après reload',...['email','job_title','linkedin_url','notes'].map(field=>`${field} effaçable et persisté`),'Avertissement : seconde page de doublons réellement navigable','Doublon en casse différente : sauvegarde permise sans fusion','Réessai après offline confirmé','Même commande rejouée sans nouvelle révision','Nouvelle génération correctement réancrée','Remplacement explicite de note contrôlé','Note restaurée enregistrée','Brouillon v1 sauvegardé sans effacer nouveaux champs','Reçu v1 sans lecture détail : confirmation retenue et pending conservé','Génération suivante issue de v1 enregistrée sans perte',...['desktop','large','ipad-portrait','ipad-paysage','iphone'].map(label=>`${label} : Escape ferme`),'Accessibilité fiche détails : zéro violation','Commande >128 Kio refusée avant mutation','Doublons >4 Kio refusés','Commande depuis origine étrangère refusée','Payload v2 invalide : erreur serveur associée au champ e-mail'];
    await writeFile(resolve(proof,'ui-results.json'),JSON.stringify({scope:'aggregate',at,node:process.version,base,...aggregateUiReports(parts,report,required)},null,2));
  }).catch(()=>{process.exitCode=1;});
}
