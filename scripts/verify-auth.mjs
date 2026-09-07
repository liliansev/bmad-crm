import { readFile, mkdir, writeFile, mkdtemp, cp, symlink, rm } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const exec = promisify(execFile);
const base = 'http://localhost:3000';
const proof = resolve('_bmad-output/implementation-artifacts/verification/1-1');
let session = 'bmad-story-1-1';
const guardOnly = process.argv.includes('--guard-only');
const reviewOnly = process.argv.includes('--review-only') || guardOnly;
const secret = z.object({ project_ref: z.literal('otadrkhrjxafutocstzo'), service_role_key: z.string(), anon_key: z.string(), owner_id: z.uuid(), owner_email: z.email(), owner_password: z.string() }).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json', 'utf8')));
const url = `https://${secret.project_ref}.supabase.co`;
const admin = createClient(url, secret.service_role_key, { auth: { persistSession: false, autoRefreshToken: false } });
const results = [];
let fixtureId;
const check = (name, passed) => { results.push({ name, passed: !!passed }); if (!passed) throw new Error(`Échec : ${name}`); console.log(`PASS ${name}`); };
const browser = async (...args) => {
  try {
    const { stdout } = await exec('agent-browser', ['--session', session, '--json', ...args], { maxBuffer: 5_000_000, timeout: 40_000 });
    const data = JSON.parse(stdout);
    if (!data.success) throw new Error('browser');
    return data.data;
  } catch { throw new Error(`Commande navigateur en échec : ${args[0]}`); }
};
const browserStdin = (code) => new Promise((resolve, reject) => {
  const child = spawn('agent-browser', ['--session', session, '--json', 'eval', '--stdin'], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  child.stdout.on('data', (data) => { stdout += data; });
  child.stderr.resume();
  const timer = setTimeout(() => { child.kill(); reject(new Error('Saisie navigateur interrompue')); }, 30_000);
  child.on('error', () => { clearTimeout(timer); reject(new Error('Saisie navigateur indisponible')); });
  child.on('close', (status) => {
    clearTimeout(timer);
    try { const result = JSON.parse(stdout); if (status !== 0 || !result.success) throw new Error(); resolve(result.data.result); }
    catch { reject(new Error('Saisie navigateur refusée')); }
  });
  child.stdin.end(code);
});
const evaluate = async (code) => (await browser('eval', code)).result;
const until = async (code, attempts = 50) => {
  for (let i = 0; i < attempts; i++) { if (await evaluate(code)) return true; await new Promise((r) => setTimeout(r, 200)); }
  return false;
};
const pageLogin = async (email, password, origin = base) => {
  await browser('open', `${origin}/connexion`);
  await browser('snapshot', '-i');
  await fillLogin(email,password);
  await browser('click', 'button[type=submit]');
};
const fillLogin = async(email,password) => {
  await browser('focus', '#email');
  await browserStdin(`(() => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id, value] of ${JSON.stringify([['email', email], ['password', password]])}) {
      const field = document.getElementById(id);
      setValue.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  })()`);
};
const signInCookies = async (email, password) => {
  const jar = new Map();
  const client = createServerClient(url, secret.anon_key, { cookies: { getAll: () => [...jar].map(([name,value])=>({name,value})), setAll: (cookies) => cookies.forEach(({name,value})=>jar.set(name,value)) } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error('Connexion de vérification refusée');
  return { cookie: [...jar].map(([name,value])=>`${name}=${value}`).join('; '), authSession: data.session, jar };
};
const isAbsentUser = (error) => error?.code === 'user_not_found' && error?.status === 404;

const request = (path, cookie, headers={}) => fetch(`${base}${path}`, { redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...headers } });

await mkdir(proof, { recursive: true });
try {
  if (!reviewOnly) {
  const identity = await admin.auth.admin.getUserById(secret.owner_id);
  check('Projet dédié et propriétaire réel vérifiés', !identity.error && identity.data.user.email === secret.owner_email);
  for (const [name,cookie] of [['Sans session',undefined],['Cookie falsifié',`sb-${secret.project_ref}-auth-token=base64-invalide`]]) {
    const response = await request('/',cookie);
    check(`${name} : redirection et aucun contenu privé`, response.status === 307 && response.headers.get('location')?.endsWith('/connexion') && !(await response.text()).includes('Votre espace privé est ouvert'));
    const rsc = await request('/',cookie,{RSC:'1'});
    check(`${name} : accès RSC refusé`, rsc.status === 307 && !(await rsc.text()).includes('Votre espace privé est ouvert'));
  }
  const api = await request('/api/session');
  check('API session sans identité ni cache', api.status === 401 && JSON.stringify(await api.json()) === '{"authenticated":false}' && api.headers.get('cache-control').includes('no-store'));
  const owner = await signInCookies(secret.owner_email, secret.owner_password);
  const home = await request('/', owner.cookie);
  check('Accueil propriétaire réel autorisé et non caché', home.status === 200 && (await home.text()).includes('Votre espace privé est ouvert') && home.headers.get('cache-control').includes('no-store'));

  // A real valid session with an expired local timestamp exercises the refresh path.
  const refreshed = { ...owner.authSession, expires_at: 1 };
  const cookieName = `sb-${secret.project_ref}-auth-token`;
  const encode = (data) => `${cookieName}=base64-${Buffer.from(JSON.stringify(data)).toString('base64url')}`;
  const renewal = await request('/api/session', encode(refreshed));
  check('Expiration locale : refresh réel et cookies propagés (JWT encore valide)', renewal.status === 200 && renewal.headers.getSetCookie().some((value) => value.startsWith(cookieName)));
  const expired = await request('/', encode({ ...refreshed, refresh_token: 'invalid-refresh-token' }));
  check('Expiration irréparable : redirection et cookie purgé', expired.status === 307 && expired.headers.getSetCookie().some((value) => value.includes('Max-Age=0')));

  const fixtureEmail = `qa-${randomUUID()}@example.invalid`;
  const fixturePassword = `Qa-${randomUUID()}!`;
  const created = await admin.auth.admin.createUser({ email: fixtureEmail, password: fixturePassword, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('Création fixture refusée');
  fixtureId = created.data.user.id;
  const outsider = await signInCookies(fixtureEmail, fixturePassword);
  const refusal = await request('/', outsider.cookie);
  check('Compte réel non propriétaire refusé en accès direct', refusal.status === 307 && !(await refusal.text()).includes('Votre espace privé est ouvert'));
  const outsiderRsc = await request('/', outsider.cookie, { RSC: '1' });
  check('Non-propriétaire : RSC refusé sans contenu privé', outsiderRsc.status === 307 && !(await outsiderRsc.text()).includes('Votre espace privé est ouvert'));
  const outsiderApi = await request('/api/session', outsider.cookie);
  check('Non-propriétaire : API session 401 sans identité', outsiderApi.status === 401 && JSON.stringify(await outsiderApi.json()) === '{"authenticated":false}');
  await pageLogin(fixtureEmail, fixturePassword);
  check('Compte non propriétaire : erreur neutre via formulaire', await until(`document.querySelector('[role=alert]')?.textContent.includes('Connexion impossible')`));
  check('Session non propriétaire retirée du navigateur', await evaluate(`!document.cookie.includes('${cookieName}')`));

  await browser('cookies', 'clear');
  await browser('open', `${base}/connexion`);
  await browser('snapshot', '-i');
  await evaluate(`window.__qaPostCount = 0; const originalFetch = window.fetch; window.fetch = function(input, init) { if (init?.method?.toUpperCase() === 'POST') window.__qaPostCount++; return originalFetch.apply(this, arguments); }; true`);
  await browser('click', 'button[type=submit]');
  check('Champs vides : erreurs associées et focus', await until(`document.querySelector('#email-error')?.textContent.includes('Saisissez') && document.querySelector('#password-error')?.textContent.includes('Saisissez') && document.activeElement.id === 'email'`));
  await browser('fill','#email','adresse-invalide');
  await browser('click','button[type=submit]');
  check('Adresse invalide refusée près du champ', await until(`document.querySelector('#email-error')?.textContent.includes('valide') && document.querySelector('#email').getAttribute('aria-describedby') === 'email-error'`));
  check('Validation locale : aucune tentative POST envoyée', await evaluate(`window.__qaPostCount === 0`));
  await browser('fill','#email','qa@example.invalid');
  await browser('fill','#password','Incorrect-password-123!');
  await browser('click','button[type=submit]');
  check('Mauvais identifiants : erreur neutre et e-mail conservé', await until(`document.querySelector('[role=alert]')?.textContent.includes('Connexion impossible') && document.querySelector('#email').value === 'qa@example.invalid' && !document.querySelector('button[type=submit]').disabled`));
  await browser('screenshot',resolve(proof,'connexion-erreur.png'));
  await browser('fill','#password','Incorrect-password-123!');
  await browser('set','offline','on');
  await browser('click','button[type=submit]');
  check('Réseau interrompu : attente terminée, erreur explicite et e-mail conservé', await until(`document.querySelector('[role=alert]')?.textContent.includes('interrompue') && document.querySelector('#email').value === 'qa@example.invalid' && !document.querySelector('button[type=submit]').disabled`));
  await browser('set','offline','off');

  await pageLogin(secret.owner_email,secret.owner_password);
  check('Connexion propriétaire par saisie réelle', await until(`location.pathname === '/' && document.querySelector('h2')?.textContent === 'Votre espace privé est ouvert' && getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible'`));
  await browser('reload');
  check('Session retrouvée après rechargement',await until(`location.pathname === '/' && document.querySelector('[data-session-content]') && getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible'`));
  for (const [label,width,height] of [['desktop',1440,900],['large',2560,1440],['iphone',402,874],['ipad-portrait',820,1180],['ipad-paysage',1180,820]]) {
    await browser('set','viewport',String(width),String(height));
    check(`${label} : aucun débordement et navigation tactile`, await evaluate(`document.documentElement.scrollWidth <= window.innerWidth && [...document.querySelectorAll('nav a')].every(e => e.getBoundingClientRect().height >= 44)`));
    await browser('screenshot',resolve(proof,`accueil-${label}.png`));
  }
  const firstTab = (await browser('tab','list')).tabs.find(tab => tab.active).tabId;
  await browser('tab','new', `${base}/connexion`);
  const secondTab = (await browser('tab','list')).tabs.find(tab => tab.active).tabId;
  await browser('cookies','clear');
  await browser('tab',firstTab);
  await evaluate(`window.dispatchEvent(new Event('focus')); true`);
  check('Perte de session depuis autre onglet : purge au focus et reconnexion',await until(`location.pathname === '/connexion' && !document.body.textContent.includes('Votre espace privé est ouvert')`));
  await browser('tab',secondTab);
  await browser('tab','close');
  await browser('set','viewport','1440','900');
  await browser('open',`${base}/connexion`);
  await browser('focus','#email');
  await browser('press','Tab');
  check('Navigation clavier vers mot de passe',await evaluate(`document.activeElement.id === 'password'`));
  await browser('press','Tab');
  check('Navigation clavier vers connexion',await evaluate(`document.activeElement.tagName === 'BUTTON' && document.activeElement.type === 'submit'`));
  await browser('screenshot',resolve(proof,'connexion-desktop.png'));
  await browser('set','viewport','402','874');
  check('Saisies mobile : taille 16px et cible 44px',await evaluate(`[...document.querySelectorAll('input')].every(e => parseFloat(getComputedStyle(e).fontSize) >= 16 && e.getBoundingClientRect().height >= 44) && document.documentElement.scrollWidth <= innerWidth`));
  await browser('screenshot',resolve(proof,'connexion-iphone.png'));
  const a11y = await browser('a11y');
  check('Audit accessibilité connexion : zéro violation', a11y.counts.violations === 0);
  await writeFile(resolve(proof,'a11y.json'),JSON.stringify(a11y,null,2));
  const { authFetch } = await import('../lib/supabase/fetch.ts');
  const unavailable = await authFetch('http://localhost:1');
  check('Service inaccessible : erreur 503 bornée, sans faux succès',unavailable.status === 503);
  let configRefused = false;
  try {
    await exec(process.execPath,['node_modules/next/dist/bin/next','dev','--port','3101','--hostname','localhost'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_OWNER_ID:''},timeout:15000});
  } catch (error) { configRefused = `${error.stdout}${error.stderr}`.includes('Configuration CRM manquante ou invalide'); }
  check('Démarrage sans configuration refusé explicitement',configRefused);
  }
  await reviewPaths();
  console.log(`Vérification terminée : ${results.length} contrôles réussis.`);
} catch(error) {
  console.error(error instanceof Error ? error.message.replaceAll(secret.owner_email,'[propriétaire]') : 'Vérification en échec');
  process.exitCode = 1;
} finally {
  await browser('set','offline','off').catch(()=>{});
  if (fixtureId) {
    const deleted = await admin.auth.admin.deleteUser(fixtureId);
    const reread = await admin.auth.admin.getUserById(fixtureId);
    const removed = !deleted.error && isAbsentUser(reread.error);
    results.push({name:'Compte fixture retiré et absence relue',passed:removed});
    if (!removed) process.exitCode=1;
    console.log(removed ? 'PASS Compte fixture retiré et absence relue' : 'FAIL Suppression fixture à reprendre');
  }
  await writeFile(resolve(proof,reviewOnly ? 'review-results.json' : 'results.json'),JSON.stringify({date:new Date().toISOString(),node:process.version,results},null,2));
  await browser('close').catch(()=>{});
}

async function reviewPaths() {
  if (!guardOnly) {
  check('Absence Auth : seuls user_not_found / 404 prouvent la suppression', isAbsentUser({code:'user_not_found',status:404}) && !isAbsentUser({status:503}) && !isAbsentUser({status:403}) && !isAbsentUser({code:'unexpected_failure',status:404}));
  await pageLogin(secret.owner_email, 'Wrong-owner-password-123!');
  check('Propriétaire : mauvais mot de passe refusé et effacé', await until(`document.querySelector('[role=alert]')?.textContent.includes('Connexion impossible') && document.querySelector('#password').value === '' && !document.querySelector('button[type=submit]').disabled`));
  check('Propriétaire : e-mail conservé après refus', await browserStdin(`document.querySelector('#email').value === ${JSON.stringify(secret.owner_email)}`));

  // Block the actual Server Action transport, then deliver its real response late.
  await browser('open',`${base}/connexion`);
  await evaluate(`window.__qaOriginalFetch = window.fetch; window.__qaLateFetch = null; window.fetch = function(input, init) { if (init?.method?.toUpperCase() === 'POST') return new Promise((resolve,reject) => { window.__qaLateFetch = () => window.__qaOriginalFetch(input,init).then(response => { window.__qaLateDelivered = true; resolve(response); },reject); }); return window.__qaOriginalFetch.apply(this,arguments); }; true`);
  await fillLogin(secret.owner_email,secret.owner_password);
  await browser('click','button[type=submit]');
  check('Transport bloqué : attente bornée et mot de passe effacé', await until(`document.querySelector('[role=alert]')?.textContent.includes('interrompue') && document.querySelector('#password').value === '' && !document.querySelector('button[type=submit]').disabled`, 220));
  await evaluate(`window.__qaLateFetch(); true`);
  check('Succès réel tardif : formulaire reste récupérable', await until(`window.__qaLateDelivered === true && location.pathname === '/connexion' && document.querySelector('[role=alert]')?.textContent.includes('interrompue') && !document.querySelector('button[type=submit]').disabled`));

  }
  await pageLogin(secret.owner_email, secret.owner_password);
  check('Session valide prête pour les courses', await until(`location.pathname === '/' && performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/api/session')) && document.querySelector('[data-session-content]') && getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible'`));
  await evaluate(`window.__qaOriginalFetch = window.fetch; window.__qaPending = []; window.fetch = function(input, init) { if (String(input) === '/api/session') return new Promise(resolve => window.__qaPending.push(() => resolve(Response.json({authenticated:true})))); return window.__qaOriginalFetch.apply(this,arguments); }; window.__qaBox = document.querySelector('[data-session-content]').getBoundingClientRect().toJSON(); window.dispatchEvent(new Event('focus')); true`);
  check('Focus : masquage immédiat avant réponse retardée',await evaluate(`getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'hidden' && document.querySelector('[data-session-content]').inert`));
  check('Vérification : dimensions du shell conservées',await evaluate(`document.querySelector('[data-session-content]').getBoundingClientRect().height === window.__qaBox.height && document.querySelector('[data-session-content]').getBoundingClientRect().width === window.__qaBox.width`));
  await browser('screenshot',resolve(proof,'session-verification-desktop.png'));
  await evaluate(`Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'}); document.dispatchEvent(new Event('visibilitychange')); window.__qaPending.shift()(); true`);
  await new Promise(r=>setTimeout(r,200));
  check('Page cachée : réponse obsolète ne réaffiche rien',await evaluate(`getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'hidden' && document.querySelector('[data-session-content]').inert`));
  await evaluate(`delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); window.__qaPending.shift()(); true`);
  check('Retour visible : seule la nouvelle réponse réaffiche',await until(`getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible'`));
  // Observe a real 30-second periodic tick with a deliberately pending response.
  await evaluate(`window.__qaUnexpectedHide = false; window.__qaObserver = new MutationObserver(() => { if (getComputedStyle(document.querySelector('[data-session-content]')).visibility !== 'visible') window.__qaUnexpectedHide = true; }); window.__qaObserver.observe(document.querySelector('[data-session-content]'),{attributes:true}); true`);
  check('Contrôle périodique réel : requête lancée en arrière-plan',await until(`window.__qaPending.length > 0`,160));
  check('Contrôle périodique : aucune disparition du shell',await evaluate(`!window.__qaUnexpectedHide && getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible'`));
  await evaluate(`window.__qaObserver.disconnect(); window.__qaPending.shift()(); true`);
  await new Promise(r=>setTimeout(r,100));

  // SIGNED_OUT is emitted through the same BroadcastChannel used by Supabase tabs.
  await evaluate(`window.dispatchEvent(new Event('focus')); sessionStorage.setItem('qa-revealed-after-signout','false'); window.__qaSignoutObserver = new MutationObserver(() => { if (getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible') sessionStorage.setItem('qa-revealed-after-signout','true'); }); window.__qaSignoutObserver.observe(document.querySelector('[data-session-content]'),{attributes:true}); window.__qaChannel = new BroadcastChannel('sb-${secret.project_ref}-auth-token'); window.__qaChannel.postMessage({event:'SIGNED_OUT',session:null}); setTimeout(() => { window.__qaPending.forEach(resolve => resolve()); }, 20); true`);
  check('SIGNED_OUT : retour connexion malgré réponse valide tardive',await until(`location.pathname === '/connexion'`));
  check('SIGNED_OUT : aucun réaffichage après purge',await evaluate(`sessionStorage.getItem('qa-revealed-after-signout') === 'false'`));
  await evaluate(`sessionStorage.removeItem('qa-revealed-after-signout'); true`);
  await isolatedProviderOutage();
}

async function isolatedProviderOutage() {
  const mainSession = session;
  const isolatedRoot = await mkdtemp(resolve('.local','qa-provider-outage-'));
  const isolatedPort = 3102;
  const isolatedOrigin = `http://localhost:${isolatedPort}`;
  let server;
  try {
    // Copy only source/config: no .env, bootstrap file or live credentials.
    for (const path of ['app','components','lib','middleware.ts','next.config.ts','postcss.config.mjs','package.json','tsconfig.json','next-env.d.ts']) await cp(resolve(path),resolve(isolatedRoot,path),{recursive:true});
    await symlink(resolve('node_modules'),resolve(isolatedRoot,'node_modules'),'dir');
    const fakeOwner = '11111111-1111-4111-8111-111111111111';
    server = spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'dev','--hostname','localhost','--port',String(isolatedPort)],{
      cwd:isolatedRoot,
      env:{PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_APP_URL:isolatedOrigin,NEXT_PUBLIC_SUPABASE_URL:'https://auth-outage.example.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_entirely_fictitious_qa_key',SUPABASE_OWNER_ID:fakeOwner},
      stdio:['ignore','pipe','pipe'], detached:true,
    });
    server.stdout.resume(); server.stderr.resume();
    let ready=false;
    for(let i=0;i<100;i++) { try {const response=await fetch(`${isolatedOrigin}/connexion`); if(response.ok){ready=true;break;}} catch {} await new Promise(r=>setTimeout(r,200)); }
    check('Run fournisseur isolé disponible avec configuration fictive',ready);
    session='bmad-story-1-1-outage';
    await pageLogin('qa@example.invalid','Fictitious-password-123!',isolatedOrigin);
    check('Fournisseur HTTPS indisponible : action login explique indisponibilité',await until(`document.querySelector('[role=alert]')?.textContent.includes('momentanément indisponible') && !document.querySelector('button[type=submit]').disabled && document.querySelector('#password').value === ''`,160));
    const payload={sub:fakeOwner,role:'authenticated',aud:'authenticated',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600};
    const token=[{alg:'HS256',typ:'JWT'},payload].map(part=>Buffer.from(JSON.stringify(part)).toString('base64url')).join('.')+'.ZmFrZQ';
    const fakeSession={access_token:token,refresh_token:'entirely-fictitious-refresh',token_type:'bearer',expires_at:payload.exp,expires_in:3600,user:{id:fakeOwner,email:'qa@example.invalid'}};
    const cookie=`sb-auth-outage-auth-token=base64-${Buffer.from(JSON.stringify(fakeSession)).toString('base64url')}`;
    const response=await fetch(`${isolatedOrigin}/api/session`,{headers:{Cookie:cookie}});
    check('Fournisseur HTTPS indisponible : API 503 authenticated:false',response.status===503 && JSON.stringify(await response.json()) === '{"authenticated":false}');
    check('Serveur principal 3000 reste disponible', (await fetch(`${base}/connexion`)).ok);
  } finally {
    if(session!==mainSession) await browser('close').catch(()=>{});
    session=mainSession;
    if(server?.pid) {
      const exited=new Promise(resolve=>server.once('close',resolve));
      try {process.kill(-server.pid,'SIGTERM');} catch {}
      await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,3000))]);
      if(server.exitCode===null) { try {process.kill(-server.pid,'SIGKILL');} catch {} }
    }
    await rm(isolatedRoot,{recursive:true,force:true});
  }
}
