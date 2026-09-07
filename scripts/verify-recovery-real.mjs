import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const generatedLink = process.argv.includes('--generated-link');
// An arbitrary HTTPS host must never receive the owner's credentials or recovery link.
// This hosted origin is the dedicated target verified in setup-1-3.md.
const origin = z.enum(['http://localhost:3000','https://bmad-crm.vercel.app']).safeParse(process.env.CRM_QA_ORIGIN ?? 'http://localhost:3000');
if (!origin.success) { console.error('CRM_QA_ORIGIN refusée : utiliser une origine de recette vérifiée.'); process.exit(1); }
const base=origin.data;
const hosted=base.startsWith('https:');
const mailPath = hosted
  ? (generatedLink ? '.local/recovery-hosted-generated-link.json' : '.local/recovery-hosted-mail.json')
  : (generatedLink ? '.local/recovery-generated-link.json' : '.local/recovery-mail.json');
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
let secret, mail, admin, password, capturedProof;
let operation = 'préparation';
const anon=()=>createClient(`https://${secret.project_ref}.supabase.co`,secret.anon_key,options);
const exec=promisify(execFile);
const session=hosted?'bmad-recovery-hosted':'bmad-recovery-real';
const proof=resolve('_bmad-output/implementation-artifacts/verification',hosted?'1-3/recovery':'1-2');
const results=[];
let restoreNeeded=false;

function check(name,passed){results.push({name,passed:!!passed});console.log(`${passed?'PASS':'FAIL'} ${name}`);if(!passed)throw new Error(name);}
async function browser(...args){
  operation='navigateur '+args[0];
  try {const {stdout}=await exec('agent-browser',['--session',session,'--json',...args],{timeout:40000,maxBuffer:5_000_000});const parsed=JSON.parse(stdout);if(!parsed.success)throw new Error();return parsed.data;}
  catch {throw new Error(`Commande navigateur refusée : ${args[0]}`);}
}
function evaluate(code){operation='évaluation navigateur';return new Promise((resolve,reject)=>{
  const child=spawn('agent-browser',['--session',session,'--json','eval','--stdin'],{stdio:['pipe','pipe','pipe']});let out='';
  child.stdout.on('data',b=>out+=b);child.stderr.resume();
  const timer=setTimeout(()=>{child.kill();reject(new Error('Délai navigateur dépassé'));},30000);
  child.on('error',()=>{clearTimeout(timer);reject(new Error('Navigateur indisponible'));});
  child.on('close',status=>{clearTimeout(timer);try{const r=JSON.parse(out);if(status!==0||!r.success)throw new Error();resolve(r.data.result);}catch{reject(new Error('Évaluation refusée'));}});
  child.stdin.end(code);
});}
async function until(code){for(let i=0;i<100;i++){try{if(await evaluate(code))return true;}catch{/* A full navigation can briefly destroy the execution context. */}await new Promise(r=>setTimeout(r,200));}return false;}
async function fill(entries){await evaluate(`(() => {if(location.origin!==${JSON.stringify(base)}) throw new Error('Origine inattendue');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [id,value] of ${JSON.stringify(entries)}){const e=document.getElementById(id);setter.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}return true;})()`);}
async function openLink(expectForm=true){
  await browser('open',`${base}/connexion`);
  await evaluate(`location.assign(${JSON.stringify(mail.url)}); true`);
  check(generatedLink?'Lien de contrôle ouvert et secret retiré de l’URL':'Lien natif reçu ouvert et secret retiré de l’URL',await until(`location.origin===${JSON.stringify(base)} && location.pathname==='/reinitialiser' && location.hash==='' && ${expectForm ? "!!document.querySelector('#confirmation')" : "!/chargement|vérification du lien/i.test(document.body.textContent)"}`));
  await browser('snapshot','-i');
}
async function signIn(pwd){const client=anon();const r=await client.auth.signInWithPassword({email:secret.owner_email,password:pwd});if(r.data.session)await client.auth.signOut({scope:'local'});return r;}
try{
  secret = z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),service_role_key:z.string(),anon_key:z.string(),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
  mail = z.object({url:z.url().refine(value=>{const u=new URL(value);return u.origin==='https://otadrkhrjxafutocstzo.supabase.co'&&!u.username&&!u.password&&u.pathname==='/auth/v1/verify'&&u.searchParams.get('type')==='recovery'&&u.searchParams.get('redirect_to')===`${base}/reinitialiser`;}),message_id:z.string(),received_at:z.string()}).parse(JSON.parse(await readFile(mailPath,'utf8')));
  admin=createClient(`https://${secret.project_ref}.supabase.co`,secret.service_role_key,options);
  password=`Qa-${randomUUID()}!`;
  await mkdir(proof,{recursive:true});
  const identity=await admin.auth.admin.getUserById(secret.owner_id);
  check('Cible dédiée et propriétaire vérifiés',!identity.error&&identity.data.user.email===secret.owner_email);
  check('Mot de passe initial confirmé avant recette',!(await signIn(secret.owner_password)).error);
  if (!generatedLink) check('Réception Gmail réelle enregistrée',!!mail.message_id&&!!mail.received_at);
  else console.log('Recette additionnelle avec lien administrateur, aucun e-mail émis.');
  await openLink();
  // Capture only the submitted proof, never the password or action response.
  await evaluate(`(() => {
    const original=window.fetch;
    window.__qaRecoveryOriginalFetch=original;
    window.fetch=function(input,init){
      if(init?.method?.toUpperCase()==='POST' && typeof init.body==='string') {
        try { const args=JSON.parse(init.body); const value=Array.isArray(args)?args[0]:null;
          if(typeof value?.accessToken==='string' && typeof value?.refreshToken==='string') window.__qaRecoveryProof={accessToken:value.accessToken,refreshToken:value.refreshToken};
        } catch { /* Ignore unrelated transport bodies. */ }
      }
      return original.apply(this,arguments);
    };
    return true;
  })()`);
  await fill([['password',password],['confirmation',password]]);
  restoreNeeded=true;
  await browser('click','button[type=submit]');
  check('Preuve soumise capturée en mémoire seulement',await until(`!!window.__qaRecoveryProof`));
  capturedProof=z.object({accessToken:z.string().min(1),refreshToken:z.string().min(1)}).parse(await evaluate(`(() => {
    const proof=window.__qaRecoveryProof;
    window.fetch=window.__qaRecoveryOriginalFetch;
    delete window.__qaRecoveryProof; delete window.__qaRecoveryOriginalFetch;
    return proof;
  })()`));
  check('Changement confirmé dans le formulaire réel',await until(`document.body.textContent.includes('Votre mot de passe a été modifié. Reconnectez-vous avec le nouveau.')`));
  const refreshProbe=anon();
  const revoked=await refreshProbe.auth.refreshSession({refresh_token:capturedProof.refreshToken});
  if(revoked.data.session) await refreshProbe.auth.signOut({scope:'local'});
  check('Preuve consommée : refresh token refusé par révocation Auth',!!revoked.error && ['refresh_token_not_found','refresh_token_already_used','session_not_found'].includes(revoked.error.code));
  check('Mot de passe précédent refusé réellement',!!(await signIn(secret.owner_password)).error);
  check('Nouveau mot de passe accepté réellement',!(await signIn(password)).error);
  await browser('open',`${base}/connexion`);
  await browser('snapshot','-i');
  await fill([['email',secret.owner_email],['password',password]]);
  await browser('click','button[type=submit]');
  check('Reconnexion navigateur avec nouveau mot de passe',await until(`location.pathname==='/' && document.body.textContent.includes('Votre espace privé est ouvert')`));
  await openLink(false);
  check('Lien consommé refusé même avec session propriétaire',await until(`!document.querySelector('#confirmation') && /lien/i.test(document.body.textContent) && /invalide|expiré|utilisé|nouveau lien/i.test(document.body.textContent) && !document.body.textContent.includes('Votre mot de passe a été modifié.')`));
  check('Refus du lien consommé : mot de passe inchangé',!(await signIn(password)).error);
  await browser('screenshot',resolve(proof,'lien-consomme.png'));
  await browser('open',`${base}/connexion`);
  await evaluate(`location.assign(${JSON.stringify(base+'/reinitialiser#'+new URLSearchParams({access_token:capturedProof.accessToken,refresh_token:capturedProof.refreshToken,type:'recovery'}).toString())}); true`);
  check('Rejeu de la preuve consommée : formulaire prêt sans secret URL',await until(`location.pathname==='/reinitialiser' && location.hash==='' && !!document.querySelector('#confirmation')`));
  await fill([['password',password],['confirmation',password]]);
  await browser('click','button[type=submit]');
  check('Même paire de tokens consommée : mutation refusée réellement',await until(`!document.querySelector('#confirmation') && /nouveau lien/i.test(document.body.textContent) && !document.body.textContent.includes('Votre mot de passe a été modifié.')`));
  capturedProof=null;
  check('Rejeu refusé : mot de passe confirmé inchangé',!(await signIn(password)).error);
}catch{console.error('Recette en échec pendant '+operation+' ; aucun secret affiché.');process.exitCode=1;}
finally{
  if(restoreNeeded){
    try{
      const restored=await admin.auth.admin.updateUserById(secret.owner_id,{password:secret.owner_password});
      check('Mot de passe initial restauré et revérifié',!restored.error&&!(await signIn(secret.owner_password)).error);
      await browser('open',`${base}/connexion`);await browser('snapshot','-i');
      await fill([['email',secret.owner_email],['password',secret.owner_password]]);await browser('click','button[type=submit]');
      check('Reconnexion finale avec les identifiants initiaux',await until(`location.pathname==='/' && document.body.textContent.includes('Votre espace privé est ouvert')`));
    }catch{console.error('Fin de restauration à reprendre pendant '+operation+' ; identifiants non affichés.');process.exitCode=1;}
  }
  // Each cleanup runs even when preparation, restoration, or report writing fails.
  try {
    await evaluate(`(() => { if(window.__qaRecoveryOriginalFetch) window.fetch=window.__qaRecoveryOriginalFetch; delete window.__qaRecoveryProof; delete window.__qaRecoveryOriginalFetch; return true; })()`).catch(()=>{});
    capturedProof=null;
  } finally {
    try {
      await unlink(mailPath).catch(error=>{if(error.code!=='ENOENT'){console.error('Suppression du fichier de lien à reprendre.');process.exitCode=1;}});
    } finally {
      await browser('close').catch(()=>{console.error('Fermeture du navigateur à reprendre.');process.exitCode=1;});
      try {
        await mkdir(proof,{recursive:true});
        await writeFile(resolve(proof,generatedLink?'generated-link-results.json':'real-mail-results.json'),JSON.stringify({date:new Date().toISOString(),node:process.version,origin:base,success:process.exitCode!==1,mail:mail?{source:generatedLink?'admin-generated':'gmail',message_id:generatedLink?null:mail.message_id,received_at:generatedLink?null:mail.received_at}:null,results},null,2));
      } catch { console.error('Écriture des preuves en échec ; nettoyage terminé.'); process.exitCode=1; }
      capturedProof=null; password=null; mail=null; secret=null;
    }
  }
}
