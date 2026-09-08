import { alphabetic, fixtureMarker } from './contacts-qa-marker.mjs';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cleanupContactsQa, signOutQaSession } from './contacts-qa-cleanup.mjs';

// Local story 2.2 only. Wait for the parent's migration/QA go-ahead before running.
const base='http://localhost:3000', project='otadrkhrjxafutocstzo';
const session=`bmad-details-review-${Date.now()}`;
const logicalRunId=z.uuid().parse(process.env.CRM_QA_RUN_ID??randomUUID());
let productFingerprint=null;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const proof=resolve('_bmad-output/implementation-artifacts/verification/2-2/review');
const manifestPath=resolve('.local/contact-details-review-cleanup.json');
const marker=fixtureMarker('Fictif-Review');
const empty={first_name:'',last_name:'',email:'',job_title:'',linkedin_url:'',notes:''};
const fixtures=new Set(), commands=new Set(), results=[];
const exec=promisify(execFile);
let secret, owner, admin, baseline, success=false, stage='préparation', browserStarted=false;
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
    check(`Effacement ${field} : événement input et brouillon persisté`,await until(`window.__detailsInputCount>0&&document.getElementById('contact-${field}').value===''&&Object.keys(sessionStorage).filter(key=>key.startsWith('crm:contacts:draft:v2:')).every(key=>JSON.parse(sessionStorage.getItem(key)).values.${field}==='')`));
  }else await browser('fill',`#contact-${field}`,value);
}
async function read(id){const {data,error}=await owner.from('contacts').select('*').eq('id',z.uuid().parse(id)).single();if(error)throw new Error('Lecture fixture refusée');return data;}
async function snapshot(){const rows=[];for(let offset=0;;offset+=1000){const {data,error}=await owner.from('contacts').select('*').order('id').range(offset,offset+999);if(error)throw new Error('Inventaire privé indisponible');for(const row of data)if(!fixtures.has(row.id))rows.push({id:row.id,hash:createHash('sha256').update(JSON.stringify(row)).digest('hex')});if(data.length<1000)return rows;}}
async function rpc(command){if(command.operation==='update'&&!fixtures.has(command.contact_id))throw new Error('Mutation hors fixture interdite');commands.add(z.uuid().parse(command.command_id));await manifest();const result=await owner.rpc(command.version===2?'contact_command_v2':'contact_command',{p_command:command});if(result.error)throw new Error('RPC fixture refusée');if(result.data.status==='success'&&command.operation==='create')fixtures.add(z.uuid().parse(result.data.contact.id));await manifest();return result.data;}
async function create(fields={},version=2){return rpc({...(version===2?{version:2}:{}),operation:'create',command_id:randomUUID(),fields:version===2?{...empty,first_name:'Contact fictif',last_name:marker,...fields}:{first_name:'Ancien client fictif',last_name:marker,...fields}});}
async function update(id,fields){const row=await read(id);return rpc({version:2,operation:'update',command_id:randomUUID(),contact_id:id,fields,base_versions:Object.fromEntries(Object.keys(fields).map(field=>[field,row.field_versions[field]??row.details_versions[field]]))});}
async function openFixture(id){if(!fixtures.has(id))throw new Error('Fiche hors fixture interdite');await evaluate(`(()=>{const url=new URL(location.href);url.searchParams.set('panel',${JSON.stringify(id)});history.pushState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'));return true})()`);check('Fiche fixture chargée',await until(`new URL(location.href).searchParams.get('panel')===${JSON.stringify(id)}&&!!document.getElementById('contact-notes')&&!document.getElementById('contact-notes').disabled`));}
async function api(path,init){return evaluate(`fetch(${JSON.stringify(path)},${JSON.stringify(init??{})}).then(async r=>({status:r.status,body:await r.json()}))`);}
async function fingerprintProduct(){
  const paths=[];
  async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=directory+'/'+entry.name;if(entry.isDirectory())await walk(path);else if(entry.isFile())paths.push(path);}}
  for(const directory of ['app','components','lib','supabase/migrations'])await walk(directory);
  paths.push('middleware.ts','package.json','pnpm-lock.yaml','next.config.ts');
  const hash=createHash('sha256');for(const path of paths.sort()){const content=await readFile(path);hash.update(path+'\0'+content.length+'\0');hash.update(content);}return hash.digest('hex');
}
// A separate post-review proof: it never promotes historical segments to this code version.
async function setRaw(field,value){
  await evaluate(`(()=>{const el=document.getElementById('contact-${field}');const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  check(`Valeur brute ${field} persistée au brouillon`,await until(`JSON.parse(sessionStorage.getItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+activeId)}))?.values.${field}===${JSON.stringify(value)}`));
}
let activeId;
async function verifyRejectedField(field,value,replacement,label){
  const before=await read(activeId),count=await evaluate('window.__detailsCommands.length');
  await browser('snapshot','-i');await setRaw(field,value);await browser('focus','[data-slot=sheet-content] button[type=submit]');await browser('press','Enter');await collect();
  check(`${label} : erreur attachée au champ`,await until(`!!document.getElementById('error-${field}')&&document.getElementById('contact-${field}').getAttribute('aria-describedby')?.includes('error-${field}')`));
  check(`${label} : aucune commande ni pending`,await evaluate(`window.__detailsCommands.length===${count}&&JSON.parse(sessionStorage.getItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+activeId)})).pending===null`));
  check(`${label} : fiche distante inchangée`,JSON.stringify(await read(activeId))===JSON.stringify(before));
  await fill(field,replacement);
}
async function installDuplicateRace(emailA){await evaluate(`(()=>{
  const original=window.fetch;window.__reviewDuplicateCalls=[];window.__reviewHoldEmail=${JSON.stringify(emailA)};window.__reviewHoldPage=false;
  window.fetch=async(...args)=>{
    if(!String(args[0]).includes('/api/contacts/duplicates'))return original(...args);
    const input=JSON.parse(args[1].body);window.__reviewDuplicateCalls.push({page:input.page,isA:input.email===window.__reviewHoldEmail});
    const response=await original(...args);
    if(input.email===window.__reviewHoldEmail){window.__reviewAReceived=true;await new Promise(resolve=>window.__reviewReleaseA=resolve);window.__reviewAReturned=true;}
    if(window.__reviewHoldPage&&input.page===2){window.__reviewPageReceived=true;await new Promise(resolve=>window.__reviewReleasePage=resolve);}
    return response;
  };return true;
})()`);}
try{
  check('Node 24',process.versions.node.startsWith('24.'));await mkdir(proof,{recursive:true});await mkdir(resolve('.local'),{recursive:true});productFingerprint=await fingerprintProduct();
  secret=z.object({project_ref:z.literal(project),anon_key:z.string().min(1),service_role_key:z.string().min(1),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string().min(1)}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
  try{const previous=JSON.parse(await readFile(manifestPath,'utf8'));await cleanupContactsQa(previous);await rm(manifestPath);}catch(error){if(error?.code!=='ENOENT')throw error;}
  admin=createClient(`https://${project}.supabase.co`,secret.service_role_key,options);owner=createClient(`https://${project}.supabase.co`,secret.anon_key,options);
  const identity=await admin.auth.admin.getUserById(secret.owner_id);check('Projet dédié et propriétaire exacts',!identity.error&&identity.data.user.email===secret.owner_email);
  check('Session RPC propriétaire',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);
  baseline=await snapshot();await login();await browser('set','viewport','1440','900');
  const created=await create({first_name:'Revue ciblée fictive',notes:'Notes initiales',job_title:'Titre initial'});check('Fixture principale créée',created.status==='success');activeId=created.contact.id;await openFixture(activeId);
  if(!process.argv.includes('--after-validation')){
  if(!process.argv.includes('--after-nul')){
  await fill('notes','Notes locales retenues');await fill('job_title','Titre local non retenu');await update(activeId,{notes:'Notes distantes non retenues',job_title:'Titre distant retenu'});await save();
  check('Deux conflits réels notes et titre présentés',await until(`!!document.querySelector('[data-conflict-field=notes]')&&!!document.querySelector('[data-conflict-field=job_title]')`));
  const prepare=`[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Préparer ces choix')`;
  check('Préparer désactivé sans choix',await evaluate(`(${prepare})?.disabled===true`));await click('Garder ma saisie pour Notes');
  check('Préparer désactivé tant que titre sans choix',await evaluate(`(${prepare})?.disabled===true`));await click('Utiliser la version enregistrée pour Titre professionnel');
  check('Préparer activé après les deux choix',await evaluate(`(${prepare})?.disabled===false`));await click('Préparer ces choix');
  check('Résolution mixte conserve notes locales et titre distant',await evaluate(`document.getElementById('contact-notes').value==='Notes locales retenues'&&document.getElementById('contact-job_title').value==='Titre distant retenu'`));await save();check('Résolution de deux conflits confirmée',await saved());const merged=await read(activeId);check('DB confirme les deux choix explicites',merged.notes==='Notes locales retenues'&&merged.job_title==='Titre distant retenu');
  await verifyRejectedField('notes','Texte\u0000interdit','Notes locales retenues','NUL');
  }
  await verifyRejectedField('job_title','Titre\ud800interdit','Titre distant retenu','Surrogate isolé');
  await verifyRejectedField('linkedin_url','https://example.invalid/path with space','https://example.invalid/valide','Espace interne URL');
  await save();check('Corrections des champs enregistrables',await saved());
  await fill('email','invalide');await click('Fermer la fiche');check('Confirmation fermeture affichée',await until(`!!document.querySelector('[data-slot=dialog-content]')`));
  await browser('snapshot','-i');await evaluate(`(()=>{const dialog=document.querySelector('[data-slot=dialog-content]');const button=[...dialog.querySelectorAll('button')].find(el=>el.textContent.trim()==='Enregistrer');button.setAttribute('data-review-dialog-save','');return true})()`);await browser('focus','[data-review-dialog-save]');await browser('press','Enter');
  check('Email invalide depuis fermeture : dialogue fermé et focus champ visible',await until(`(()=>{const el=document.getElementById('contact-email'),r=el?.getBoundingClientRect();return !document.querySelector('[data-slot=dialog-content]')&&!!document.getElementById('error-email')&&document.activeElement===el&&r.top>=0&&r.bottom<=innerHeight})()`));
  check('Email invalide fermeture : pending absent',await evaluate(`JSON.parse(sessionStorage.getItem(${JSON.stringify('crm:contacts:draft:v2:'+secret.owner_id+':'+activeId)})).pending===null`));await browser('screenshot',resolve(proof,'invalid-close-focus.png'));await fill('email','');
  }
  const longNote='Note fictive longue.\n'.repeat(1000).slice(0,20000);check('Fixture notes exactement 20k caractères',longNote.length===20000);await fill('notes',longNote);
  check('Notes 20k : hauteur bornée et défilement interne',await evaluate(`(()=>{const el=document.getElementById('contact-notes'),r=el.getBoundingClientRect();return el.value.length===20000&&r.height<=289&&parseFloat(getComputedStyle(el).maxHeight)===288&&el.scrollHeight>el.clientHeight&&getComputedStyle(el).overflowY==='auto'})()`));await browser('focus','#contact-notes');await browser('screenshot',resolve(proof,'notes-20k-bounded.png'));await save();check('Notes 20k réellement enregistrées',await saved()&&(await read(activeId)).notes===longNote);
  const emailA=`a-${randomUUID()}@example.invalid`,emailB=`b-${randomUUID()}@example.invalid`;
  check('Fixture doublon A créée',(await create({first_name:'Résultat A fictif',email:emailA})).status==='success');check('Fixture doublon B créée',(await create({first_name:'Résultat B fictif',email:emailB})).status==='success');await installDuplicateRace(emailA);
  await fill('email',emailA);check('Réponse réelle A retenue après réseau',await until('window.__reviewAReceived===true'));await fill('email',emailB);
  check('Réponse B affichée avant libération A',await until(`document.querySelector('[data-contacts-duplicates]')?.textContent.includes('Résultat B fictif')`));
  await evaluate(`window.__reviewReleaseA();true`);check('Réponse réelle A libérée',await until('window.__reviewAReturned===true'));await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
  check('Réponse tardive A ne remplace jamais avertissement B',await evaluate(`document.querySelector('[data-contacts-duplicates]').textContent.includes('Résultat B fictif')&&!document.querySelector('[data-contacts-duplicates]').textContent.includes('Résultat A fictif')`));
  check('Revérifier disponible après recherche réussie',await evaluate(`!![...document.querySelectorAll('[data-contacts-duplicates] button')].find(el=>el.textContent.trim()==='Revérifier les doublons')`));
  const duplicateEmail=`groupe-${randomUUID()}@example.invalid`,duplicateIds=[];
  for(let i=0;i<27;i++){const result=await create({first_name:`Pagination fictive ${alphabetic(String(i).padStart(2,'0'))}`,email:duplicateEmail});if(result.status!=='success')throw new Error('Fixture pagination refusée');duplicateIds.push(result.contact.id);}check('27 fixtures de pagination créées',duplicateIds.length===27);
  await fill('email',duplicateEmail);check('Doublons : total 27 page initiale',await until(`document.querySelector('[data-contacts-duplicates]')?.textContent.includes('27 contacts')&&document.querySelector('[data-contacts-duplicates]')?.textContent.includes('1 / 2')`));
  await evaluate(`window.__reviewHoldPage=true;true`);await click('Doublons suivants');check('Pagination : réponse réelle page deux retenue',await until('window.__reviewPageReceived===true'));
  check('Pagination chargement : focus reste sur conteneur stable',await evaluate(`document.activeElement===document.querySelector('[data-contacts-duplicates]')&&document.activeElement.textContent.includes('Vérification des doublons…')`));
  await evaluate(`window.__reviewHoldPage=false;window.__reviewReleasePage();true`);check('Pagination : page deux et focus stable après réponse',await until(`document.querySelector('[data-contacts-duplicates]')?.textContent.includes('2 / 2')&&document.activeElement===document.querySelector('[data-contacts-duplicates]')`));
  await update(duplicateIds[0],{email:''});await update(duplicateIds[1],{email:''});await click('Revérifier les doublons');
  check('Total 27 vers 25 : page clampée et 25 résultats visibles',await until(`document.querySelector('[data-contacts-duplicates]')?.textContent.includes('25 contacts')&&document.querySelectorAll('[data-contacts-duplicates] li').length===25&&!document.querySelector('button[aria-label="Doublons suivants"]')`));
  check('Clamping : requêtes réelles page deux puis page un et focus préservé',await evaluate(`window.__reviewDuplicateCalls.slice(-2).map(item=>item.page).join(',')==='2,1'&&document.activeElement===document.querySelector('[data-contacts-duplicates]')`));await browser('screenshot',resolve(proof,'duplicates-clamped-focus.png'));
  await save();check('Adresse doublonnée enregistrable après clamping',await saved()&&(await read(activeId)).email===duplicateEmail);check('Revérifier disponible après sauvegarde réussie',await until(`!![...document.querySelectorAll('[data-contacts-duplicates] button')].find(el=>el.textContent.trim()==='Revérifier les doublons')`));
  for(const version of ['3','unknown']){const result=await api('/api/contacts?version='+version+'&id='+activeId);check(`Version GET ${version} inconnue refusée sans fallback`,result.status===400&&typeof result.body.message==='string'&&!('contact' in result.body)&&!('contacts' in result.body));}
  check('Coordonnées et notes absentes des URLs réseau',await evaluate(`window.__detailsNetwork.every(item=>![${JSON.stringify(emailA)},${JSON.stringify(emailB)},${JSON.stringify(duplicateEmail)},'Note fictive longue'].some(value=>decodeURIComponent(item.url).includes(value)))`));
  const a11y=await browser('a11y');check('Accessibilité après correctifs : zéro violation',a11y.counts.violations===0);await writeFile(resolve(proof,'a11y.json'),JSON.stringify(a11y,null,2));
  const errors=await browser('errors'),logs=await browser('console');const runtimeErrors=Array.isArray(errors)?errors:errors?.errors??[];const consoleItems=Array.isArray(logs)?logs:logs?.messages??[];const diagnostics={runtimeErrorCount:runtimeErrors.length,consoleErrorCount:consoleItems.filter(item=>item.type==='error'||item.level==='error').length};
  check('Navigateur : aucun crash JavaScript',diagnostics.runtimeErrorCount===0);await writeFile(resolve(proof,'browser-diagnostics.json'),JSON.stringify(diagnostics,null,2));
  check('Empreinte produit inchangée pendant recette',await fingerprintProduct()===productFingerprint);success=true;
}catch{console.error(`FAIL ${stage} ; aucun secret affiché.`);process.exitCode=1;if(browserStarted)try{console.log(JSON.stringify({diagnostic:await evaluate(`({errors:[...document.querySelectorAll('[id^=error-]')].map(el=>el.id),submitDisabled:document.querySelector('[data-slot=sheet-content] button[type=submit]')?.disabled,activeId:document.activeElement?.id,activeSlot:document.activeElement?.dataset.slot,duplicateLoading:document.querySelector('[data-contacts-duplicates]')?.textContent.includes('Vérification des doublons…'),commandCount:window.__detailsCommands?.length,statuses:window.__detailsStatuses})`)}));}catch{}}
finally{
  if(browserStarted)await collect().catch(()=>{});
  try{if(admin&&baseline){const scan=await admin.from('contacts').select('id').eq('last_name',marker);if(scan.error)throw new Error();for(const row of scan.data){if(baseline.some(original=>original.id===row.id))throw new Error();fixtures.add(row.id);}await manifest();check('Contacts préexistants intégralement inchangés',JSON.stringify(await snapshot())===JSON.stringify(baseline));}}catch{success=false;process.exitCode=1;console.error('FAIL conservation ou inventaire fixtures.');}
  try{if(secret&&(fixtures.size||commands.size)){await manifest();await cleanupContactsQa({contact_ids:[...fixtures],command_ids:[...commands]});check('Fixtures et reçus supprimés, absence vérifiée',true);await rm(manifestPath);}}catch{success=false;process.exitCode=1;console.error('FAIL nettoyage exact ; manifeste conservé.');}
  if(owner)try{await signOutQaSession(owner);}catch{success=false;process.exitCode=1;}
  if(browserStarted)try{await browser('close');}catch{success=false;process.exitCode=1;}
  secret=null;await mkdir(proof,{recursive:true});const report={success:success&&process.exitCode!==1,scope:process.argv.includes('--after-validation')?'post-review-after-validation':process.argv.includes('--after-nul')?'post-review-after-nul':'post-review-targeted',logicalRunId,productFingerprint,at:new Date().toISOString(),results};await writeFile(resolve(proof,'results.json'),JSON.stringify(report,null,2));await writeFile(resolve(proof,`part-${Date.now()}.json`),JSON.stringify(report,null,2));
}
