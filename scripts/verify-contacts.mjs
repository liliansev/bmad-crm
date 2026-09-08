import { alphabetic, fixtureMarker } from './contacts-qa-marker.mjs';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cleanupContactsQa, signOutQaSession } from './contacts-qa-cleanup.mjs';
const exec = promisify(execFile);
const base = z.enum(['http://localhost:3000','https://bmad-crm.vercel.app']).parse(process.env.CRM_QA_ORIGIN ?? 'http://localhost:3000');
const session = `bmad-contacts-${Date.now()}`;
const supplemental = process.argv.includes('--supplemental-only');
const reviewOnly = process.argv.includes('--review-only');
const privacyOnly = process.argv.includes('--privacy-only');
const proof = resolve('_bmad-output/implementation-artifacts/verification/2-1', privacyOnly ? 'privacy' : reviewOnly ? 'review' : supplemental ? 'supplemental' : '.');
const secret = z.object({ project_ref: z.literal('otadrkhrjxafutocstzo'), service_role_key: z.string(), anon_key: z.string(), owner_id: z.uuid(), owner_email: z.email(), owner_password: z.string() }).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json', 'utf8')));
const url = `https://${secret.project_ref}.supabase.co`;
const admin = createClient(url, secret.service_role_key, { auth: { persistSession: false, autoRefreshToken: false } });
const owner = createClient(url, secret.anon_key, { auth: { persistSession: false, autoRefreshToken: false } });
const results = [], timings = [], fixtures = new Set(), commands = new Set();
let completed = false;
let baseline = [];
const performanceResults = { cold: [], warm: [], usableView: [], confirmations: [] };
const manifestPath = resolve('.local','contacts-ui-qa-cleanup.json');
try { const previous = JSON.parse(await readFile(manifestPath,'utf8')); await cleanupContactsQa(previous); await rm(manifestPath); } catch(error) { if(error?.code!=='ENOENT')throw error; }
const marker = fixtureMarker('Fictif-QA');
const check = (name, passed) => { results.push({ name, passed: Boolean(passed) }); if (!passed) throw new Error(`Échec : ${name}`); console.log(`PASS ${name}`); };
const browser = async (...args) => {
  try { const { stdout } = await exec('agent-browser', ['--session', session, '--json', ...args], { maxBuffer: 5_000_000, timeout: 45_000 }); const result = JSON.parse(stdout); if (!result.success) throw new Error(); return result.data; }
  catch { throw new Error(`Commande navigateur refusée : ${args[0]}`); }
};
const evaluate = async (code) => (await browser('eval', code)).result;
const secretEvaluate = (code) => new Promise((resolve,reject) => {
  const child=spawn('agent-browser',['--session',session,'--json','eval','--stdin'],{stdio:['pipe','pipe','pipe']}); let stdout=''; child.stdout.on('data',data=>{stdout+=data}); child.stderr.resume();
  const timer=setTimeout(()=>{child.kill();reject(new Error('Saisie sécurisée interrompue'));},30000);
  child.on('close',status=>{clearTimeout(timer);try {const data=JSON.parse(stdout);if(status||!data.success)throw new Error();resolve(data.data.result);}catch{reject(new Error('Saisie sécurisée refusée'));}});child.stdin.end(code);
});
const until = async (code, attempts=80) => { for(let i=0;i<attempts;i++){try { if(await evaluate(code))return true; } catch { /* Navigation can destroy the current JS context between polls. */ } await new Promise(r=>setTimeout(r,150));}return false; };
const clickText = async (text) => { await browser('snapshot','-i'); await browser('find','role','button','click','--name',text,'--exact'); };
const login = async () => {
  await browser('open',`${base}/connexion`);check('Formulaire de connexion prêt',await until(`Boolean(document.getElementById('email'))`));await browser('snapshot','-i');await browser('focus','#email');check('Origine de saisie authentifiée vérifiée',await evaluate(`location.origin===${JSON.stringify(base)} && location.pathname==='/connexion'`));
  await secretEvaluate(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [id,value] of ${JSON.stringify([['email',secret.owner_email],['password',secret.owner_password]])}){const el=document.getElementById(id);set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}return true})()`);
  await browser('click','button[type=submit]');check('Connexion réelle du propriétaire',await until(`location.pathname==='/' && !document.documentElement.dataset.privateState`));
  await browser('open',`${base}/contacts`);check('Contacts authentifiés chargés',await until(`document.querySelector('h1')?.textContent==='Contacts' && !document.documentElement.dataset.privateState`));
};
const save = async () => { await browser('click','[data-slot=sheet-content] button[type=submit]'); };
const saved = async () => until(`document.querySelector('[data-contact-message]')?.textContent.includes('Contact enregistré.')`);
const close = async () => {await clickText('Fermer la fiche');return until(`!document.querySelector('[data-slot=sheet-content]')`);};
const readContact=async id=>{const {data,error}=await owner.from('contacts').select('*').eq('id',id).single();if(error)throw new Error('Lecture DB QA');return data;};
const rpc=async command=>{if(command.operation==='update'&&!fixtures.has(command.contact_id))throw new Error('Mutation QA hors fixture interdite');commands.add(command.command_id);const {data,error}=await owner.rpc('contact_command',{p_command:command});if(error)throw new Error('RPC QA');if(data.status==='success')fixtures.add(data.contact.id);return data;};
const snapshotAll = async () => {
  const rows=[];
  for(let offset=0;;offset+=1000){const {data,error}=await owner.from('contacts').select('*').order('id').range(offset,offset+999);if(error)throw new Error('Inventaire de contacts indisponible');rows.push(...data);if(data.length<1000)return rows;}
};
const openFixture = async (id) => {
  if(!fixtures.has(id))throw new Error('Cible QA non suivie');
  await evaluate(`(()=>{const url=new URL(location.href);url.searchParams.set('panel',${JSON.stringify(id)});history.pushState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'));return true})()`);
  check('Fiche fixture accessible',await until(`new URL(location.href).searchParams.get('panel')===${JSON.stringify(id)} && Boolean(document.getElementById('contact-first_name'))`));
};
const verifyPagination = async () => {
  const total=baseline.length+fixtures.size, pages=Math.ceil(total/25), second=Math.min(25,total-25);
  await clickText('Actualiser');check('Page 1 stabilisée : 25 lignes',await until(`document.querySelectorAll('[data-contact-id]').length===25 && !document.body.innerText.includes('Actualisation…')`));
  await clickText('Suivant');check('Page 2 : reliquat selon total initial',await until(`document.body.innerText.includes('Page 2 sur ${pages}') && document.querySelectorAll('[data-contact-id]').length===${second} && !document.body.innerText.includes('Actualisation…')`));
  await clickText('Précédent');check('Retour page 1 stabilisé',await until(`document.body.innerText.includes('Page 1 sur ${pages}') && document.querySelectorAll('[data-contact-id]').length===25 && !document.body.innerText.includes('Actualisation…')`));
};
const privateHidden = (dialog=false) => `(()=>{const sheet=document.querySelector('[data-slot=sheet-content]'),input=document.getElementById('contact-first_name'),dialog=document.querySelector('[data-slot=dialog-content]');return document.documentElement.dataset.privateState==='checking' && Boolean(sheet&&input${dialog?'&&dialog':''}) && [sheet,input${dialog?',dialog':''}].every(el=>getComputedStyle(el).visibility==='hidden') && Boolean(document.querySelector('[data-contacts-skeleton]'));})()`;
const verifyPrivacy = async (dialog=false) => {
  await evaluate(`(()=>{window.__qaPrivacyFetch=window.fetch;window.fetch=(...a)=>String(a[0]).includes('/api/session')?new Promise(r=>window.__qaPrivacyResume=()=>r(Response.json({authenticated:true}))):window.__qaPrivacyFetch(...a);window.dispatchEvent(new Event('focus'));return true})()`);
  check(dialog?'Dialog et Sheet masqués, squelette Contacts':'Sheet et input masqués, squelette Contacts',await until(privateHidden(dialog)));
  await evaluate(`window.__qaPrivacyResume();window.fetch=window.__qaPrivacyFetch;true`);
  check('Surfaces privées réaffichées après vérification',await until(`!document.documentElement.dataset.privateState && getComputedStyle(document.getElementById('contact-first_name')).visibility==='visible' ${dialog?"&&getComputedStyle(document.querySelector('[data-slot=dialog-content]')).visibility==='visible'":''}`));
};
const measurePanel = async (id) => evaluate(`new Promise(resolve=>{const start=performance.now(),url=new URL(location.href);url.searchParams.set('panel',${JSON.stringify(id)});history.pushState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'));const poll=()=>{const input=document.getElementById('contact-first_name');if(input&&!input.disabled&&getComputedStyle(input).visibility==='visible')requestAnimationFrame(()=>resolve(performance.now()-start));else requestAnimationFrame(poll);};poll();})`);
const measurePerformance = async () => {
  await browser('open',`${base}/contacts`);check('Vue utilisable pour mesure',await until(`Boolean(document.querySelector('h1')) && !document.documentElement.dataset.privateState && !document.body.innerText.includes('Actualisation…')`));
  performanceResults.usableView.push(await evaluate('performance.now()'));
  const created=await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:'Mesure fictive',last_name:`${marker}-cold`}}),id=created.contact.id;
  check('Fiche froide absente de la liste initiale',await evaluate(`!document.querySelector('[data-contact-id="${id}"]')`));
  performanceResults.cold.push(await measurePanel(id));await close();
  for(let i=0;i<20;i++){performanceResults.warm.push(await measurePanel(id));await close();}
  await openFixture(id);
  for(let i=0;i<20;i++){
    await browser('fill','#contact-first_name',`Mesure fictive ${i}`);
    const duration=await evaluate(`new Promise(resolve=>{const start=performance.now();document.querySelector('[data-slot=sheet-content] button[type=submit]').click();let observedPending=false;const poll=()=>{const button=document.querySelector('[data-slot=sheet-content] button[type=submit]');if(button.disabled)observedPending=true;if(observedPending&&!button.disabled&&document.querySelector('[data-contact-message]')?.textContent==='Contact enregistré.')requestAnimationFrame(()=>resolve(performance.now()-start));else requestAnimationFrame(poll);};requestAnimationFrame(poll);})`);
    performanceResults.confirmations.push(duration);
  }
  check('Mesures distinctes froid/chaud/vue et 20 confirmations',performanceResults.cold.length===1&&performanceResults.warm.length===20&&performanceResults.usableView.length===1&&performanceResults.confirmations.length===20&&Object.values(performanceResults).flat().every(Number.isFinite));
  await close();
};
const runReview = async () => {
  await login();
  const witness=(await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:'Témoin intact',last_name:marker}})).contact;
  const initial=(await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:'Initiale',last_name:marker}})).contact;
  const id=initial.id;
  await openFixture(id);
  await browser('fill','#contact-first_name','Locale prénom');await browser('fill','#contact-last_name','Locale nom');
  await rpc({operation:'update',command_id:randomUUID(),contact_id:id,fields:{last_name:'Distant nom'},base_versions:{last_name:initial.field_versions.last_name}});
  await save();check('Conflit nom affiché avec deux champs locaux',await until(`document.body.innerText.includes('Cette fiche a changé ailleurs')`));await clickText('Utiliser la version enregistrée');check('Adoption distante limitée au champ conflictuel',await evaluate(`document.getElementById('contact-first_name').value==='Locale prénom'&&document.getElementById('contact-last_name').value==='Distant nom'`));await save();check('Autre changement local conservé et enregistré',await saved());
  let current=await readContact(id);await browser('fill','#contact-first_name','Locale suivante');await browser('fill','#contact-last_name','Nom temporaire');
  await rpc({operation:'update',command_id:randomUUID(),contact_id:id,fields:{last_name:'Distant suivant'},base_versions:{last_name:current.field_versions.last_name}});await save();check('Second conflit deux champs',await until(`document.body.innerText.includes('Cette fiche a changé ailleurs')`));await browser('fill','#contact-last_name','Distant nom');await clickText('Conserver ma saisie et préparer le remplacement');check('Choix local égal ancienne base préservé',await evaluate(`document.getElementById('contact-last_name').value==='Distant nom'&&document.getElementById('contact-first_name').value==='Locale suivante'`));await save();check('Remplacement deux champs contrôlé',await saved());
  current=await readContact(id);await browser('fill','#contact-first_name','Prénom compatible');await rpc({operation:'update',command_id:randomUUID(),contact_id:id,fields:{last_name:'Nom compatible distant'},base_versions:{last_name:current.field_versions.last_name}});await save();check('Prénom local et nom distant compatibles',await saved()&&(await readContact(id)).last_name==='Nom compatible distant');
  await browser('fill','#contact-first_name','Brouillon privé');await verifyPrivacy();await clickText('Fermer la fiche');await verifyPrivacy(true);await clickText('Continuer la saisie');await save();check('Brouillon après confidentialité enregistré',await saved());await close();
  const unicode=(await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:'𠮷'.repeat(101),last_name:marker}})).contact;
  await openFixture(unicode.id);check('101 points Unicode RPC puis lecture application',await evaluate(`Array.from(document.getElementById('contact-first_name').value).length===101`));await browser('fill','#contact-first_name','𠮷'.repeat(200));await save();check('200 points Unicode enregistrement UI',await saved()&&Array.from((await readContact(unicode.id)).first_name).length===200);await close();
  for(let i=0;i<26;i++)await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:`Page fictive ${alphabetic(i)}`,last_name:marker}});
  await verifyPagination();
  await openFixture(id);await browser('fill','#contact-first_name','Historique conservé');
  const historyTo=async(panel,page)=>evaluate(`(()=>{const current=location.href,destination=new URL(location.href);if(${JSON.stringify(panel)})destination.searchParams.set('panel',${JSON.stringify(panel)});else destination.searchParams.delete('panel');destination.searchParams.set('page',${page});history.pushState(null,'',destination);history.pushState(null,'',current);history.back();return true})()`);
  await historyTo(unicode.id,2);check('Historique sale demande fermeture',await until(`document.body.innerText.includes('Conserver votre saisie ?')`));await clickText('Continuer la saisie');check('Continuer conserve page cible actuelle et texte',await evaluate(`new URL(location.href).searchParams.get('panel')===${JSON.stringify(id)} && new URL(location.href).searchParams.get('page')!== '2' && document.getElementById('contact-first_name').value==='Historique conservé'`));
  await historyTo(unicode.id,2);await until(`document.body.innerText.includes('Conserver votre saisie ?')`);await clickText('Abandonner');check('Abandon applique destination et page historique',await until(`new URL(location.href).searchParams.get('panel')===${JSON.stringify(unicode.id)} && new URL(location.href).searchParams.get('page')==='2' && Array.from(document.getElementById('contact-first_name')?.value??'').length===200`));
  await browser('fill','#contact-first_name','Historique enregistré');await historyTo(id,1);await until(`document.body.innerText.includes('Conserver votre saisie ?')`);await clickText('Enregistrer');check('Enregistrer applique destination après commit',await until(`new URL(location.href).searchParams.get('panel')===${JSON.stringify(id)} && new URL(location.href).searchParams.get('page')===null && document.getElementById('contact-first_name')?.value==='Brouillon privé'`));check('Saisie précédente persistée avant navigation',(await readContact(unicode.id)).first_name==='Historique enregistré');await close();
  await historyTo(null,2);check('Historique sans panneau applique pagination',await until(`document.body.innerText.includes('Page 2 sur')&&!document.body.innerText.includes('Actualisation…')`));
  await evaluate(`(()=>{window.__qaDelayedFetch=window.fetch;window.__qaDenied=0;window.addEventListener('crm-session-denied',()=>window.__qaDenied++);window.fetch=async(...a)=>{const response=await window.__qaDelayedFetch(...a);if(String(a[0]).includes('/api/contacts?id='))await new Promise(r=>setTimeout(r,1800));return response;};return true})()`);await browser('hover','[data-contact-id] button');await browser('find','role','link','click','--name','Accueil','--exact');check('Départ Accueil pendant prélecture',await until(`location.pathname==='/'`));await new Promise(r=>setTimeout(r,2300));check('Prélecture après démontage sans déconnexion',await evaluate(`location.pathname==='/'&&window.__qaDenied===0`));
  await measurePerformance();
  check('Témoin préexistant aux parcours intact',JSON.stringify(await readContact(witness.id))===JSON.stringify({...witness,owner_id:secret.owner_id}) || (await readContact(witness.id)).revision===witness.revision&&(await readContact(witness.id)).first_name===witness.first_name&&(await readContact(witness.id)).last_name===witness.last_name);
};
await mkdir(proof,{recursive:true});
try {
  check('Node 24',process.versions.node.startsWith('24.'));
  const identity=await admin.auth.admin.getUserById(secret.owner_id);check('Identité et projet dédiés',!identity.error&&identity.data.user.email===secret.owner_email);
  check('Session RPC propriétaire',!(await owner.auth.signInWithPassword({email:secret.owner_email,password:secret.owner_password})).error);
  baseline=await snapshotAll();
  if (privacyOnly) {
    await login();const item=(await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:'Privé fictif',last_name:marker}})).contact;await openFixture(item.id);await browser('fill','#contact-first_name','Brouillon');await verifyPrivacy();await clickText('Fermer la fiche');await verifyPrivacy(true);await clickText('Continuer la saisie');
  } else if (reviewOnly) {
    await runReview();
  } else if (supplemental) {
    await login();
    const anonymous = await fetch(`${base}/api/contacts?page=1`, { redirect: 'manual' });
    check('Lecture API sans session : 401 JSON sans redirection',anonymous.status===401&&(await anonymous.json()).status==='unauthenticated');
    const cookie=await secretEvaluate('document.cookie');
    const csrf=await fetch(`${base}/api/contacts/command`,{method:'POST',headers:{Cookie:cookie,Origin:'https://hostile.example.invalid','Content-Type':'application/json'},body:JSON.stringify({operation:'create',command_id:randomUUID(),fields:{first_name:'Refus CSRF',last_name:marker}})});
    check('Mutation origine étrangère refusée',csrf.status===403&&(await csrf.json()).status==='forbidden');
    await clickText('Ajouter un contact');await browser('fill','#contact-first_name','  Espace fictif  ');await browser('fill','#contact-last_name',marker);
    await evaluate(`(()=>{window.__qaBeforeLost=window.fetch;window.fetch=async(...a)=>{const response=await window.__qaBeforeLost(...a);if(String(a[0]).includes('/api/contacts/command')){await response.text();throw new TypeError('QA lost');}return response;};return true})()`);await save();check('Création avec espaces committée sans confirmation',await until(`document.body.innerText.includes('confirmation n’a pas été reçue')`));
    await browser('reload');check('Commande originale récupérable après reload',await until(`document.body.innerText.includes('Une saisie est à reprendre')`));await clickText('Reprendre la saisie');check('Snapshot brut avec espaces restauré',await evaluate(`document.getElementById('contact-first_name').value==='  Espace fictif  '`));await save();check('Reprise confirme sans fausse nouvelle génération',await saved());const id=await evaluate(`new URL(location.href).searchParams.get('panel')`);fixtures.add(id);check('Brouillon confirmé seul nettoyé',await evaluate(`!Object.keys(sessionStorage).some(key=>key.startsWith('crm:contacts:draft:'))`));await close();
    for(let i=0;i<26;i++)await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:`Démo ${alphabetic(String(i).padStart(2,'0'))}`,last_name:marker}});
    await verifyPagination();
    await evaluate(`(()=>{window.__qaReadFetch=window.fetch;window.__qaReadSuspend=true;window.fetch=(...a)=>String(a[0]).includes('/api/contacts?id=')&&window.__qaReadSuspend?new Promise((_,reject)=>a[1].signal.addEventListener('abort',()=>reject(new DOMException('QA read timeout','AbortError')),{once:true})):window.__qaReadFetch(...a);return true})()`);
    await openFixture(id);await browser('fill','#contact-first_name','Lecture suspendue');await save();check('Mutation aboutit pendant lecture suspendue',await saved());check('Lecture suspendue bornée conserve éditeur',await until(`document.body.innerText.includes('Impossible de charger la fiche') && document.getElementById('contact-first_name')?.value==='Lecture suspendue'`,160));await evaluate(`window.__qaReadSuspend=false;window.dispatchEvent(new Event('online'));true`);check('Lecture rétablie sans file bloquée',await until(`!document.body.innerText.includes('Impossible de charger la fiche') && document.getElementById('contact-first_name')?.value==='Lecture suspendue'`));
    await browser('screenshot',resolve(proof,'read-recovered.png'));
  } else {
  await login();const initialCount=(await owner.from('contacts').select('id',{count:'exact',head:true})).count; if(initialCount===0)check('État vide distinct',await until(`document.body.innerText.includes('Aucun contact pour le moment')`));await clickText('Ajouter un contact');await save();check('Création vide refusée près du champ',await until(`document.getElementById('error-first_name')?.textContent.includes('prénom ou un nom')`));
  await browser('fill','#contact-first_name','  Camille  ');await browser('fill','#contact-last_name',marker);await save();check('Création confirmée',await saved());
  const id=await evaluate(`new URL(location.href).searchParams.get('panel')`);fixtures.add(id);
  check('Trim et persistance DB', (await readContact(id)).first_name==='Camille');
  await browser('reload');check('Fiche retrouvée au rechargement',await until(`document.getElementById('contact-first_name')?.value==='Camille'`));
  await browser('fill','#contact-first_name','Camille corrigée');await save();check('Correction confirmée',await saved());check('Correction persistée', (await readContact(id)).first_name==='Camille corrigée');
  await browser('fill','#contact-first_name','Saisie conservée');await clickText('Fermer la fiche');check('Fermeture sale propose trois choix',await until(`document.body.innerText.includes('Conserver votre saisie ?')`));await clickText('Continuer la saisie');check('Continuer conserve le texte',await evaluate(`document.getElementById('contact-first_name').value==='Saisie conservée'`));
  await clickText('Fermer la fiche');await clickText('Enregistrer');check('Enregistrer ferme après confirmation',await until(`!document.querySelector('[data-slot=sheet-content]')`));check('Fermeture a persisté la saisie', (await readContact(id)).first_name==='Saisie conservée');
  await browser('click',`[data-contact-id="${id}"] button`);await browser('fill','#contact-first_name','Texte abandonné');await clickText('Fermer la fiche');await clickText('Abandonner');check('Abandon explicite ferme sans écrire',(await readContact(id)).first_name==='Saisie conservée');
  await browser('click',`[data-contact-id="${id}"] button`);
  // Intercept only actual Server Action transport. Requests still execute against the real DB
  // in lost/delayed modes; no substitute business result is injected.
  await evaluate(`(()=>{window.__qaFetch=window.fetch;window.__qaMode='normal';window.fetch=async(...args)=>{const headers=new Headers(args[1]?.headers);if(String(args[0]).includes('/api/contacts/command')){if(window.__qaMode==='suspend')return new Promise((_,reject)=>args[1].signal.addEventListener('abort',()=>reject(new DOMException('QA timeout','AbortError')),{once:true}));if(window.__qaMode==='offline')throw new TypeError('QA offline');const response=await window.__qaFetch(...args);if(window.__qaMode==='lost'){await response.text();throw new TypeError('QA lost response');}if(window.__qaMode==='delay')await new Promise(r=>setTimeout(r,2200));return response;}return window.__qaFetch(...args);};return true})()`);
  await browser('fill','#contact-first_name','Hors connexion');await evaluate(`window.__qaMode='offline'`);await save();check('Offline garde saisie et commande',await until(`document.body.innerText.includes('confirmation n’a pas été reçue') && document.getElementById('contact-first_name').value==='Hors connexion'`));
  check('Offline n’écrit pas', (await readContact(id)).first_name==='Saisie conservée');await evaluate(`window.__qaMode='normal'`);await save();check('Réessai explicite réussit',await saved());
  await browser('fill','#contact-first_name','Réponse perdue');await evaluate(`window.__qaMode='lost'`);await save();check('Réponse perdue garde le brouillon',await until(`document.body.innerText.includes('confirmation n’a pas été reçue')`));check('Commit réel malgré réponse perdue',(await readContact(id)).first_name==='Réponse perdue');const revision=(await readContact(id)).revision;
  await evaluate(`window.__qaMode='normal'`);await save();check('Réessai identique confirmé',await saved());check('Réessai n’incrémente pas la révision',(await readContact(id)).revision===revision);
  await browser('fill','#contact-first_name','Commande lente');await evaluate(`window.__qaMode='delay'`);await save();await browser('fill','#contact-first_name','Nouvelle saisie');check('Confirmation tardive ne nettoie pas nouvelle génération',await until(`document.body.innerText.includes('Votre nouvelle saisie reste à enregistrer') && document.getElementById('contact-first_name').value==='Nouvelle saisie'`));
  await evaluate(`window.__qaMode='normal'`);await save();check('Génération suivante correctement réancrée',await saved());check('Génération suivante persistée',(await readContact(id)).first_name==='Nouvelle saisie');
  await browser('fill','#contact-first_name','Transport suspendu');await evaluate(`window.__qaMode='suspend'`);await save();check('Transport suspendu borné et commande conservée',await until(`document.body.innerText.includes('confirmation prend trop de temps') && !document.querySelector('[data-slot=sheet-content] button[type=submit]').disabled`,160));await evaluate(`window.__qaMode='normal'`);await save();check('Réessai après suspension confirme',await saved());
  const old=await readContact(id);await browser('fill','#contact-first_name','Version locale');await rpc({operation:'update',command_id:randomUUID(),contact_id:id,fields:{first_name:'Version autre onglet'},base_versions:{first_name:old.field_versions.first_name}});await save();check('Conflit réel visible et saisie intacte',await until(`document.body.innerText.includes('Cette fiche a changé ailleurs') && document.getElementById('contact-first_name').value==='Version locale'`));
  await clickText('Conserver ma saisie et préparer le remplacement');await save();check('Remplacement explicite contrôlé',await saved());check('Remplacement persisté',(await readContact(id)).first_name==='Version locale');
  await browser('fill','#contact-first_name','Brouillon après focus');await evaluate(`window.dispatchEvent(new Event('focus'));true`);check('Focus vérifié conserve brouillon',await until(`!document.documentElement.dataset.privateState && document.getElementById('contact-first_name')?.value==='Brouillon après focus'`));
  await evaluate(`(()=>{window.__qaSessionFetch=window.fetch;window.fetch=(...a)=>String(a[0]).includes('/api/session')?new Promise(r=>window.__qaResume=()=>r(Response.json({authenticated:true}))):window.__qaSessionFetch(...a);window.dispatchEvent(new Event('focus'));return true})()`);
  check('Portail masqué pendant vérification',await until(privateHidden()));
  await evaluate(`window.__qaResume();window.fetch=window.__qaSessionFetch;true`);check('Portail revient sans perte',await until(`!document.documentElement.dataset.privateState && document.getElementById('contact-first_name')?.value==='Brouillon après focus'`));
  await clickText('Fermer la fiche');await verifyPrivacy(true);await clickText('Continuer la saisie');
  await evaluate(`(()=>{for(const cookie of document.cookie.split(';'))document.cookie=cookie.split('=')[0].trim()+'=; Max-Age=0; path=/';return true})()`);await save();
  check('Expiration réelle à sauvegarde sans focus masque et redirige',await until(`location.pathname==='/connexion' && !document.querySelector('[data-slot=sheet-content]')`));
  await login();check('Reprise proposée après reconnexion',await until(`Boolean([...document.querySelectorAll('button')].find(el=>el.textContent==='Retrouver ma saisie'))`));await clickText('Retrouver ma saisie');await clickText('Reprendre la saisie');check('Même propriétaire retrouve texte et versions',await evaluate(`document.getElementById('contact-first_name').value==='Brouillon après focus'`));await save();check('Brouillon repris enregistré',await saved());await close();
  await clickText('Ajouter un contact');await browser('fill','#contact-first_name','Double clic fictif');await browser('fill','#contact-last_name',marker);
  await evaluate(`(()=>{const button=document.querySelector('[data-slot=sheet-content] button[type=submit]');button.click();button.click();return true})()`);check('Double clic création confirmé une fois',await saved());fixtures.add(await evaluate(`new URL(location.href).searchParams.get('panel')`));check('Double clic sans doublon', (await owner.from('contacts').select('id',{count:'exact'}).eq('first_name','Double clic fictif').eq('last_name',marker)).count===1);await close();
  await clickText('Ajouter un contact');await browser('fill','#contact-first_name','Création réponse perdue');await browser('fill','#contact-last_name',marker);
  await evaluate(`(()=>{window.__qaLostCreate=window.fetch;window.__qaLose=true;window.fetch=async(...a)=>{const r=await window.__qaLostCreate(...a);if(String(a[0]).includes('/api/contacts/command')&&window.__qaLose){await r.text();throw new TypeError('QA lost create');}return r;};return true})()`);await save();check('Création commit réponse perdue conserve brouillon',await until(`document.body.innerText.includes('confirmation n’a pas été reçue')`));check('Création réellement committée',(await owner.from('contacts').select('id',{count:'exact'}).eq('first_name','Création réponse perdue').eq('last_name',marker)).count===1);await evaluate(`window.__qaLose=false;true`);await save();check('Réessai création confirme même contact',await saved());fixtures.add(await evaluate(`new URL(location.href).searchParams.get('panel')`));check('Création perdue sans doublon',(await owner.from('contacts').select('id',{count:'exact'}).eq('first_name','Création réponse perdue').eq('last_name',marker)).count===1);await close();
  await evaluate(`(()=>{window.__qaListFetch=window.fetch;window.__qaListDown=true;window.fetch=(...a)=>String(a[0]).includes('/api/contacts?page=')&&window.__qaListDown?Promise.reject(new TypeError('QA list outage')):window.__qaListFetch(...a);return true})()`);await clickText('Actualiser');check('Panne liste distincte de liste vide',await until(`document.body.innerText.includes('Impossible de charger les contacts') && !document.body.innerText.includes('Aucun contact pour le moment')`));await evaluate(`window.__qaListDown=false;true`);await clickText('Réessayer');check('Réessai lecture retrouve liste',await until(`document.querySelectorAll('[data-contact-id]').length>=3`));
  for(let i=0;i<26;i++){await rpc({operation:'create',command_id:randomUUID(),fields:{first_name:`Démo ${alphabetic(String(i).padStart(2,'0'))}`,last_name:marker}});}
  await verifyPagination();
  for(const [label,width,height] of [['desktop',1440,900],['desktop-wide',2560,1440],['ipad-portrait',820,1180],['ipad-landscape',1180,820],['iphone',402,874]]){
    await browser('set','viewport',String(width),String(height));await browser('screenshot',resolve(proof,`contacts-${label}.png`));check(`${label} : aucune largeur débordante`,await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
    await browser('click','[data-contact-id] button');await until(`Boolean(document.getElementById('contact-first_name'))`);await browser('screenshot',resolve(proof,`panel-${label}.png`));check(`${label} : panneau contenu et champs accessibles`,await evaluate(`document.documentElement.scrollWidth<=innerWidth && document.querySelector('[data-slot=sheet-content]').getBoundingClientRect().width<=innerWidth && document.getElementById('contact-first_name').getBoundingClientRect().height>=44`));await browser('press','Escape');check(`${label} : Escape ferme`,await until(`!document.querySelector('[data-slot=sheet-content]')`));
  }
  await browser('set','viewport','1440','900');
  await measurePerformance();
  await browser('focus','[data-contact-id] button');await browser('press','Enter');check('Ouverture clavier Enter',await until(`Boolean(document.getElementById('contact-first_name'))`));await browser('press','Tab');check('Focus clavier contenu dans le panneau',await evaluate(`document.querySelector('[data-slot=sheet-content]').contains(document.activeElement)`));await browser('press','Escape');check('Focus retourne à la ligne',await until(`document.activeElement?.closest('[data-contact-id]')!==null`));
  await browser('open',`${base}/contacts?panel=${randomUUID()}`);check('Fiche absente distincte',await until(`document.body.innerText.includes('n’existe pas ou n’est pas accessible')`));
  }
  completed = true;
  console.log(`Panel first-paint ms (dev, local, 20 repeats): ${JSON.stringify(timings)}`);
} finally {
  try {
    await browser('screenshot',resolve(proof,'last-state.png')).catch(()=>undefined);
    const {data:marked,error:scanError}=await admin.from('contacts').select('id').eq('last_name',marker);
    if(scanError)throw new Error('Inventaire fixtures QA impossible');
    for(const row of marked??[])fixtures.add(row.id);
    const manifest={contact_ids:[...fixtures],command_ids:[...commands]};
    await writeFile(manifestPath,JSON.stringify(manifest,null,2));
    const originals=await snapshotAll();
    check('Contacts préexistants inchangés',baseline.every(row=>JSON.stringify(originals.find(current=>current.id===row.id))===JSON.stringify(row)));
    await cleanupContactsQa(manifest);
    check('Contacts et reçus QA supprimés et absence vérifiée',true);
    await rm(manifestPath);
    await signOutQaSession(owner);
    check('Session RPC QA déconnectée',true);
  } catch(error) { completed=false; throw error; } finally {
    try { await browser('close'); } catch(error) { completed=false; throw error; } finally {
      await writeFile(resolve(proof,'ui-results.json'),JSON.stringify({success:completed,base,at:new Date().toISOString(),results,timings,performance:{measurements:performanceResults,method:'Browser performance.now; one rAF after enabled visible editor or committed confirmation. Cold: direct opening of fixture absent from list/cache; warm: same fixture reopened. Usable view: navigation-start to polling detection, includes detection latency. No claim of exact pixel paint or 16ms from two rAF.',targets:{cold50ms:performanceResults.cold.length?performanceResults.cold.every(v=>v<=50):null,warm16ms:performanceResults.warm.length?performanceResults.warm.every(v=>v<=16):null,usableView2s:performanceResults.usableView.length?performanceResults.usableView.every(v=>v<2000):null,confirmations19of20under1s:performanceResults.confirmations.length===20?performanceResults.confirmations.filter(v=>v<1000).length>=19:null}},conditions:'Node 24; Next dev local unless CRM_QA_ORIGIN provided; real Supabase; fault injection only transport; browser headless.'},null,2));
    }
  }
}
