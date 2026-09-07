import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

// Deliberately no arbitrary host: target ownership was checked in setup-1-3.md.
const origin = z.literal('https://bmad-crm.vercel.app').safeParse(process.env.CRM_QA_ORIGIN);
if (!origin.success) {
  console.error('CRM_QA_ORIGIN doit être l’origine HTTPS dédiée vérifiée dans setup-1-3.md.');
  process.exit(1);
}
const base = origin.data;
const proof = resolve('_bmad-output/implementation-artifacts/verification/1-3');
const session = `bmad-hosted-${randomUUID()}`;
const exec = promisify(execFile);
const results = [];
const clients = [];
let secret, admin, fixtureId;
let operation = 'préparation';
let browserStarted = false;
const privateText = 'Votre espace privé est ouvert';
const check = (name, passed) => {
  results.push({ name, passed: !!passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  if (!passed) throw new Error('Contrôle refusé');
};
async function browser(...args) {
  operation = `navigateur ${args[0]}`;
  browserStarted = true;
  try {
    const { stdout } = await exec('agent-browser', ['--session', session, '--json', ...args], { timeout: 40_000, maxBuffer: 5_000_000 });
    const result = JSON.parse(stdout);
    if (!result.success) throw new Error();
    return result.data;
  } catch { throw new Error('Commande navigateur en échec'); }
}
// All JS, credentials and cookie values travel through stdin, never process argv.
function evaluate(code) {
  operation = 'évaluation navigateur';
  return new Promise((resolve, reject) => {
    const child = spawn('agent-browser', ['--session', session, '--json', 'eval', '--stdin'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.stderr.resume();
    const timer = setTimeout(() => { child.kill(); reject(new Error('Délai navigateur')); }, 30_000);
    child.on('error', () => { clearTimeout(timer); reject(new Error('Navigateur indisponible')); });
    child.on('close', code => {
      clearTimeout(timer);
      try { const result = JSON.parse(out); if (code !== 0 || !result.success) throw new Error(); resolve(result.data.result); }
      catch { reject(new Error('Évaluation refusée')); }
    });
    child.stdin.end(code);
  });
}
async function until(code) {
  for (let i = 0; i < 100; i++) {
    try { if (await evaluate(code)) return true; } catch { /* Navigation destroys the old context. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return false;
}
async function pageLogin(email, password) {
  await browser('open', `${base}/connexion`);
  await browser('snapshot', '-i');
  await evaluate(`(() => {
    if (location.origin !== ${JSON.stringify(base)} || location.pathname !== '/connexion') throw new Error('Cible inattendue');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id, value] of ${JSON.stringify([['email', email], ['password', password]])}) {
      const field = document.getElementById(id);
      setter.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  })()`);
  await browser('click', 'button[type=submit]');
}
async function signInCookies(email, password) {
  const jar = new Map();
  const client = createServerClient(`https://${secret.project_ref}.supabase.co`, secret.anon_key, {
    auth: { autoRefreshToken: false },
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: cookies => cookies.forEach(({ name, value }) => jar.set(name, value)) },
  });
  clients.push(client);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error('Connexion Auth refusée');
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}
const request = (path, cookie, headers = {}) => fetch(`${base}${path}`, {
  redirect: 'manual', signal: AbortSignal.timeout(20_000), headers: { ...(cookie ? { Cookie: cookie } : {}), ...headers },
});
async function checkRefused(name, cookie) {
  for (const [surface, headers] of [['HTML', {}], ['RSC', { RSC: '1' }]]) {
    const response = await request('/', cookie, headers);
    const location = response.headers.get('location');
    check(`${name} : ${surface} refusé sans contenu privé`, response.status === 307 && !!location && new URL(location, base).href === `${base}/connexion` && !(await response.text()).includes(privateText));
  }
  const api = await request('/api/session', cookie);
  check(`${name} : API 401 sans identité ni cache`, api.status === 401 && JSON.stringify(await api.json()) === '{"authenticated":false}' && api.headers.get('cache-control')?.includes('no-store'));
}

try {
  await mkdir(proof, { recursive: true });
  secret = z.object({ project_ref: z.literal('otadrkhrjxafutocstzo'), service_role_key: z.string().min(1), anon_key: z.string().min(1), owner_id: z.uuid(), owner_email: z.email(), owner_password: z.string().min(1) }).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json', 'utf8')));
  admin = createClient(`https://${secret.project_ref}.supabase.co`, secret.service_role_key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const identity = await admin.auth.admin.getUserById(secret.owner_id);
  check('Projet Supabase dédié et propriétaire vérifiés', !identity.error && identity.data.user?.email === secret.owner_email);
  const login = await request('/connexion');
  check('Origine HTTPS accessible sans redirection', login.status === 200 && login.url === `${base}/connexion`);
  await checkRefused('Sans session');
  await checkRefused('Cookie falsifié', `sb-${secret.project_ref}-auth-token=base64-invalide`);

  const ownerCookie = await signInCookies(secret.owner_email, secret.owner_password);
  const home = await request('/', ownerCookie);
  check('Propriétaire : accueil HTTP privé et non caché', home.status === 200 && (await home.text()).includes(privateText) && home.headers.get('cache-control')?.includes('no-store'));
  const ownerRsc = await request('/', ownerCookie, { RSC: '1' });
  check('Propriétaire : accès RSC autorisé', ownerRsc.status === 200 && (await ownerRsc.text()).includes(privateText));
  const ownerApi = await request('/api/session', ownerCookie);
  check('Propriétaire : API authentifiée et non cachée', ownerApi.status === 200 && JSON.stringify(await ownerApi.json()) === '{"authenticated":true}' && ownerApi.headers.get('cache-control')?.includes('no-store'));

  const fixtureEmail = `qa-${randomUUID()}@example.invalid`;
  const fixturePassword = `Qa-${randomUUID()}!`;
  const created = await admin.auth.admin.createUser({ email: fixtureEmail, password: fixturePassword, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('Création fixture refusée');
  fixtureId = created.data.user.id;
  await checkRefused('Autre compte réel', await signInCookies(fixtureEmail, fixturePassword));
  await pageLogin(fixtureEmail, fixturePassword);
  check('Autre compte : refus neutre dans le formulaire', await until(`document.querySelector('[role=alert]')?.textContent.includes('Connexion impossible') && document.querySelector('#password').value === ''`));
  check('Autre compte : cookie navigateur retiré', await evaluate(`!document.cookie.includes('sb-${secret.project_ref}-auth-token')`));
  await browser('cookies', 'clear');
  await browser('open', `${base}/reinitialiser`);
  check('Réinitialisation sans preuve : refus sans formulaire de changement', await until(`!document.querySelector('#confirmation') && /nouveau lien/i.test(document.body.textContent)`));
  await browser('open', `${base}/reinitialiser#access_token=fictitious-invalid-token&refresh_token=fictitious-invalid-refresh&type=recovery`);
  check('Réinitialisation invalide : secret fictif retiré de l’URL', await until(`location.hash === '' && !/vérification du lien|chargement/i.test(document.body.textContent)`));
  // If the parser accepts the token's shape, the real action must reject the proof.
  if (await evaluate(`!!document.querySelector('#confirmation')`)) {
    await evaluate(`(() => { const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; for(const id of ['password','confirmation']) {const field=document.getElementById(id); setter.call(field,'Fictitious-qa-password-123!');field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));} return true; })()`);
    await browser('click', 'button[type=submit]');
  }
  check('Réinitialisation invalide : aucun changement annoncé', await until(`!document.querySelector('#confirmation') && /nouveau lien/i.test(document.body.textContent) && !document.body.textContent.includes('Votre mot de passe a été modifié.')`));
  await browser('screenshot', resolve(proof, 'reinitialisation-invalide.png'));

  const viewports = [['desktop', 1440, 900], ['large', 2560, 1440], ['iphone', 402, 874], ['ipad-portrait', 820, 1180], ['ipad-paysage', 1180, 820]];
  await browser('open', `${base}/connexion`);
  await browser('snapshot', '-i');
  await browser('focus', '#email');
  await browser('press', 'Tab');
  check('Clavier : e-mail vers mot de passe', await evaluate(`document.activeElement.id === 'password'`));
  await browser('press', 'Tab');
  check('Clavier : mot de passe vers bouton de connexion', await evaluate(`document.activeElement.tagName === 'BUTTON' && document.activeElement.type === 'submit'`));
  await browser('press', 'Enter');
  check('Validation au clavier : erreurs associées et focus e-mail', await until(`!!document.querySelector('#email-error') && !!document.querySelector('#password-error') && document.activeElement.id === 'email'`));
  for (const [label, width, height] of viewports) {
    await browser('set', 'viewport', String(width), String(height));
    check(`Connexion ${label} : aucun débordement, saisies et cibles accessibles`, await evaluate(`document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('input')].every(e => parseFloat(getComputedStyle(e).fontSize) >= 16 && e.getBoundingClientRect().height >= 44) && document.querySelector('button[type=submit]').getBoundingClientRect().height >= 44`));
    await browser('screenshot', resolve(proof, `connexion-${label}.png`));
  }
  await pageLogin(secret.owner_email, secret.owner_password);
  const visibleHome = `location.origin === ${JSON.stringify(base)} && location.pathname === '/' && document.body.textContent.includes(${JSON.stringify(privateText)}) && !!document.querySelector('[data-session-content]') && getComputedStyle(document.querySelector('[data-session-content]')).visibility === 'visible' && performance.getEntriesByType('resource').some(entry => entry.name === ${JSON.stringify(`${base}/api/session`)} && entry.responseEnd > 0)`;
  check('Connexion propriétaire par formulaire réel', await until(visibleHome));
  await browser('reload');
  check('Session propriétaire persistée après rechargement', await until(visibleHome));
  for (const [label, width, height] of viewports) {
    await browser('set', 'viewport', String(width), String(height));
    check(`Accueil ${label} : aucun débordement et navigation tactile`, await evaluate(`document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('nav a')].every(e => e.getBoundingClientRect().height >= 44)`));
    await browser('screenshot', resolve(proof, `accueil-${label}.png`));
  }
  await browser('cookies', 'clear');
  await evaluate(`window.dispatchEvent(new Event('focus')); true`);
  check('Perte de session : retour connexion et contenu privé purgé', await until(`location.pathname === '/connexion' && !document.body.textContent.includes(${JSON.stringify(privateText)})`));
} catch {
  console.error(`Recette hébergée en échec pendant ${operation} ; aucun secret affiché.`);
  process.exitCode = 1;
} finally {
  // Every cleanup is independent; a provider failure must not skip fixture deletion.
  for (const client of clients) {
    try { const result = await client.auth.signOut({ scope: 'local' }); if (result.error) throw new Error(); }
    catch { results.push({ name: 'Fermeture session Auth de recette', passed: false }); process.exitCode = 1; }
  }
  if (fixtureId) {
    try {
      const deletion = await admin.auth.admin.deleteUser(fixtureId);
      const reread = await admin.auth.admin.getUserById(fixtureId);
      check('Fixture supprimée et absence 404 user_not_found relue', !deletion.error && reread.error?.code === 'user_not_found' && reread.error?.status === 404);
    } catch { console.error('Suppression fixture à reprendre ; aucune absence présumée.'); process.exitCode = 1; }
  }
  if (browserStarted) {
    try { await browser('close'); }
    catch { console.error('Fermeture navigateur à reprendre.'); process.exitCode = 1; }
  }
  try {
    await mkdir(proof, { recursive: true });
    await writeFile(resolve(proof, 'hosted-results.json'), JSON.stringify({ date: new Date().toISOString(), node: process.version, origin: base, success: process.exitCode !== 1, emailReceptionTested: false, results }, null, 2));
  } catch { console.error('Écriture des preuves impossible.'); process.exitCode = 1; }
  secret = null;
}
if (process.exitCode !== 1) console.log(`Recette HTTPS terminée : ${results.length} contrôles. Réception e-mail à vérifier séparément.`);
