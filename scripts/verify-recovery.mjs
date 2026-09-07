import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const exec = promisify(execFile);
const proof = resolve('_bmad-output/implementation-artifacts/verification/1-2');
const base = 'http://localhost:3000';
const fakeFragment='#access_token=fictitious.token.signature&refresh_token=fictitious-refresh&type=recovery';
const session = 'bmad-recovery-boundaries';
const results = [];
const boundariesOnly = process.argv.includes('--boundaries-only');
const fixtureOrigin = 'https://recovery-redirect.example.invalid';
const check = (name, passed) => { results.push({ name, passed: !!passed }); if (!passed) throw new Error(name); console.log(`PASS ${name}`); };
const browser = async (...args) => {
  const { stdout } = await exec('agent-browser', ['--session', session, '--json', ...args], { timeout: 40_000, maxBuffer: 5_000_000 });
  const response = JSON.parse(stdout);
  if (!response.success) throw new Error('Commande navigateur refusée');
  return response.data;
};
const evaluate = async (code) => (await browser('eval',code)).result;
const until = async (code, attempts=60) => {
  for(let i=0; i<attempts; i++) { if(await evaluate(code)) return true; await new Promise(r=>setTimeout(r,200)); }
  return false;
};
await mkdir(proof,{recursive:true});
let temporary;
try {
  check('Node 24 utilisé',process.versions.node.startsWith('24.'));
  // Compile the actual boundary modules to a temporary, dependency-linked directory.
  // Only server-only is omitted: no product logic is copied into the tests.
  temporary = await mkdtemp(resolve('.local','recovery-tests-'));
  const sources = ['lib/env.ts','lib/validations/auth.ts','lib/validations/recovery.ts','lib/supabase/fetch.ts','lib/supabase/recovery.ts'];
  for(const source of sources) {
    let code = await readFile(source,'utf8');
    code = code.replace('import "server-only";','').replace(/from "(@\/[^\"]+|\.\/[^\"]+)"/g, (_,name) => {
      const target = name.startsWith('@/') ? name.slice(2) : resolve(dirname(source),name).slice(process.cwd().length+1);
      return `from ${JSON.stringify(pathToFileURL(resolve(temporary,target+'.mjs')).href)}`;
    });
    const target=resolve(temporary,source.replace(/\.ts$/,'.mjs'));
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  }
  const { appOriginSchema } = await import(pathToFileURL(resolve(temporary,'lib/env.mjs')));
  check('Origine fixe : localhost et HTTPS autorisés',appOriginSchema.safeParse(base).success && appOriginSchema.safeParse('https://crm.example.com').success);
  check('Origine hostile : credentials, path, query, fragment et HTTP distant refusés', ['https://user:pass@crm.example.com','https://crm.example.com/path','https://crm.example.com?next=x','https://crm.example.com#x','http://crm.example.com','https://crm.example.com/'].every(value=>!appOriginSchema.safeParse(value).success));
  const { requestRecovery, recoverPassword } = await import(pathToFileURL(resolve(temporary,'lib/supabase/recovery.mjs')));
  const fetchOriginal=globalThis.fetch;
  const envOriginal={...process.env};
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://recovery-fixture.example.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_fictitious_recovery_test_key';
  process.env.NEXT_PUBLIC_APP_URL=fixtureOrigin;
  process.env.SUPABASE_OWNER_ID='11111111-1111-4111-8111-111111111111';
  let calls=[];
  let mode='ok';
  const owner={id:process.env.SUPABASE_OWNER_ID,aud:'authenticated',role:'authenticated',email:'owner@example.invalid',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
  const tokenFor=(extra={})=>[{alg:'HS256',typ:'JWT'},{sub:owner.id,session_id:'33333333-3333-4333-8333-333333333333',exp:Math.floor(Date.now()/1000)+3600,amr:[{method:'otp',timestamp:Math.floor(Date.now()/1000)}],...extra}].map(value=>Buffer.from(JSON.stringify(value)).toString('base64url')).join('.')+'.fake';
  const fakeToken=tokenFor();
  globalThis.fetch=async(input,init)=>{
    const path=new URL(String(input)).pathname;
    calls.push({url:String(input),path,method:init?.method,bearer:new Headers(init?.headers).get("authorization"),body:init?.body ? JSON.parse(init.body) : undefined});
    if(mode==='outage') throw new Error('Simulated offline');
    if(mode==='quota') return Response.json({message:'rate limited'}, {status:429});
    if(path.endsWith('/recover')) return Response.json({});
    if(path.endsWith('/token')) {
      if(mode==='invalid') return Response.json({msg:'Token has expired or is invalid',code:'otp_expired'},{status:403});
      return Response.json({access_token:mode==='mixed-session'?tokenFor({session_id:'44444444-4444-4444-8444-444444444444'}):fakeToken,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,user:owner});
    }
    if(path.endsWith('/logout')) return (mode==='cleanup-failure' || (mode==='cleanup-retry' && calls.filter(call=>call.path.endsWith('/logout')).length===1)) ? Response.json({message:'unavailable'},{status:503}) : new Response(null,{status:204});
    if(path.endsWith('/user')) {
      if(mode==='invalid') return Response.json({message:'invalid token'},{status:401});
      if(mode==='same-password' && init?.method==='PUT') return Response.json({message:'same password',code:'same_password'},{status:422,headers:{'x-supabase-api-version':'2024-01-01'}});
      if(mode==='update-failure' && init?.method==='PUT') return Response.json({message:'unavailable'},{status:503});
      return Response.json(mode==='non-owner' ? {...owner,id:'22222222-2222-4222-8222-222222222222'} : owner);
    }
    throw new Error('Unexpected Auth call');
  };
  try {
    check('E-mail invalide refusé avant Auth',!(await requestRecovery({email:'invalid'})).ok && calls.length===0);
    for(const input of [{password:'short',confirmation:'short',accessToken:fakeToken,refreshToken:'fixture-refresh'},{password:'long-enough',confirmation:'different',accessToken:fakeToken,refreshToken:'fixture-refresh'},{password:'long-enough',confirmation:'long-enough'}]) {
      check('Mot de passe ou preuve invalide refusés avant Auth',!(await recoverPassword(input)).ok && calls.length===0);
    }
    const first=await requestRecovery({email:'owner@example.invalid'});
    const second=await requestRecovery({email:'unknown@example.invalid'});
    check('Demande : réponse identique sans divulgation du compte',first.ok && second.ok && JSON.stringify(first)===JSON.stringify(second));
    check('Demande : origine fixe configurée dans redirect_to',calls.length===2 && calls.every(call=>new URL(call.url).searchParams.get('redirect_to')===fixtureOrigin+'/reinitialiser'));
    const payload={password:'Fictitious-password-123!',confirmation:'Fictitious-password-123!',accessToken:fakeToken,refreshToken:'fixture-refresh'};
    for(const selected of ['invalid','non-owner','outage','update-failure','mixed-session']) {
      mode=selected;calls=[];
      const result=await recoverPassword(payload);
      check(`${selected} : refus honnête et nouveau lien requis`,!result.ok && result.needsNewLink);
      if(selected!=='update-failure') check(`${selected} : aucune mutation mot de passe`,!calls.some(call=>call.method==='PUT'));
    }
    for(const [name,accessToken] of [['Session password falsifiée en recovery',tokenFor({amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]})],['Authentification e-mail trop ancienne',tokenFor({amr:[{method:'otp',timestamp:Math.floor(Date.now()/1000)-3601}]})],['JWT expiré',tokenFor({exp:Math.floor(Date.now()/1000)-1})]]) {
      mode='ok'; calls=[];
      check(name+' : refus avant rafraîchissement et mutation', !(await recoverPassword({...payload,accessToken})).ok && calls.length===1 && calls[0].method!=='PUT');
    }
    mode='quota';
    check('Quota : erreur explicite et aucun faux envoi',!(await requestRecovery({email:'owner@example.invalid'})).ok);
    mode='ok';calls=[];
    check('Mutation : confirmation serveur avant succès',(await recoverPassword(payload)).ok);
    check('Mutation : preuve e-mail, rafraîchissement, identité, modification puis révocation',calls.map(call=>call.path.split('/').at(-1)).join(',')==='user,token,user,user,logout');
    check('Révocation : scope local exact',calls.filter(call=>call.path.endsWith('/logout')).every(call=>new URL(call.url).searchParams.get('scope')==='local'));
    mode='cleanup-retry';calls=[];
    const retry=await recoverPassword(payload);
    check('Nettoyage repris : une reprise réussie sans alerte',retry.ok && !retry.message.includes('fermeture') && calls.filter(call=>call.path.endsWith('/logout')).length===2);
    check('Reprise : bearer utilisateur retenu et scope local exact',calls.filter(call=>call.path.endsWith('/logout')).every(call=>call.bearer==='Bearer '+fakeToken && new URL(call.url).searchParams.get('scope')==='local'));
    mode='cleanup-failure';calls=[];
    const unclosed=await recoverPassword(payload);
    check('Double échec nettoyage : succès conservé et fermeture non confirmée',unclosed.ok && unclosed.message.includes('fermeture du lien n’a pas pu être confirmée') && calls.filter(call=>call.path.endsWith('/logout')).length===2);
    mode='same-password';
    const same=await recoverPassword(payload);
    check('Mot de passe identique : refus certain et retour connexion',!same.ok && same.message.includes('déjà celui du compte') && same.message.includes('connexion') && !same.message.includes('n’a pas pu'));
    mode='update-failure';
    const uncertain=await recoverPassword(payload);
    check('Mutation incertaine : essai connexion ou nouveau lien',!uncertain.ok && uncertain.message.includes('connecter avec le nouveau mot de passe') && uncertain.message.includes('nouveau lien'));
  } finally { globalThis.fetch=fetchOriginal; for(const name of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_APP_URL','SUPABASE_OWNER_ID']) { if(envOriginal[name]===undefined) delete process.env[name]; else process.env[name]=envOriginal[name]; } }

  if (!boundariesOnly) {
  for(const path of ['/mot-de-passe-oublie','/reinitialiser']) {
    const response=await fetch(base+path,{redirect:'manual'});
    check(`Route ${path} publique et sans référent`,response.ok && response.headers.get('referrer-policy')==='no-referrer');
  }
  for(const path of ['/','/reinitialiser/extra','/mot-de-passe-oublie/extra']) check(`Route ${path} protégée sans session`,(await fetch(base+path,{redirect:'manual'})).status===307);
  await browser('open',base+'/connexion');
  await browser('click','a[href="/mot-de-passe-oublie"]');
  check('Lien depuis connexion utilisable',await until(`location.pathname === '/mot-de-passe-oublie' && !!document.querySelector('#email')`));
  await evaluate(`window.__posts=0; window.__fetch=window.fetch; window.fetch=function(input,init){if(init?.method==='POST')window.__posts++;return window.__fetch.apply(this,arguments)};true`);
  await browser('fill','#email','invalid');
  await browser('click','button[type=submit]');
  check('Validation e-mail accessible sans POST',await until(`document.querySelector('#email-error') && document.querySelector('#email').getAttribute('aria-describedby')==='email-error' && window.__posts===0`));
  await browser('fill','#email','qa@example.invalid');
  await browser('set','offline','on');
  await browser('click','button[type=submit]');
  check('Demande hors réseau : réessai et e-mail conservé',await until(`document.querySelector('[role=alert]')?.textContent.includes('interrompu') && document.querySelector('#email').value==='qa@example.invalid' && !document.querySelector('button[type=submit]').disabled`));
  await browser('set','offline','off');
  for(const [label,width,height] of [['desktop',1440,900],['large',2560,1440],['iphone',402,874],['ipad-portrait',820,1180],['ipad-paysage',1180,820]]) {
    await browser('set','viewport',String(width),String(height));
    for(const [page,url] of [['demande',base+'/mot-de-passe-oublie'],['nouveau',base+'/reinitialiser'+fakeFragment]]) {
      await browser('open',url);
      check(`${page} ${label} : champs prêts`,await until(`!!document.querySelector('input')`));
      check(`${page} ${label} : aucune largeur perdue et cibles 44px`,await evaluate(`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('input,button,a')].every(e=>e.getBoundingClientRect().height>=44)`));
      await browser('screenshot',resolve(proof,`${page}-${label}.png`));
      if(label==='desktop') {
        const a11y=await browser('a11y'); check(`${page} : zéro violation accessibilité`,a11y.counts.violations===0);
        await writeFile(resolve(proof,`${page}-a11y.json`),JSON.stringify(a11y,null,2));
      }
    }
  }
  check('Fragment retiré sans stockage navigateur',await evaluate(`!location.hash && !location.search && !Object.values(localStorage).some(v=>v.includes('fictitious.token.signature')) && !Object.values(sessionStorage).some(v=>v.includes('fictitious.token.signature'))`));
  await browser('focus','#password'); await browser('press','Tab');
  check('Clavier : confirmation accessible',await evaluate(`document.activeElement.id==='confirmation'`));
  await browser('press','Tab');
  check('Clavier : soumission accessible',await evaluate(`document.activeElement.type==='submit'`));
  await evaluate(`window.__posts=0; window.__fetch=window.fetch; window.fetch=function(input,init){if(init?.method==='POST')window.__posts++;return window.__fetch.apply(this,arguments)};true`);
  await browser('fill','#password','short');await browser('fill','#confirmation','short');await browser('click','button[type=submit]');
  check('Mot de passe court : erreur de champ, effacement, zéro POST',await until(`document.querySelector('#password-error') && document.querySelector('#password').value==='' && document.querySelector('#confirmation').value==='' && window.__posts===0`));
  await browser('fill','#password','Long-enough!');await browser('fill','#confirmation','different');await browser('click','button[type=submit]');
  check('Confirmation différente : erreur de champ et zéro POST',await until(`document.querySelector('#confirmation-error') && window.__posts===0`));
  await browser('fill','#password','Long-enough!');await browser('fill','#confirmation','Long-enough!');await browser('click','button[type=submit]');
  check('Token invalide : refus réel Supabase, nouveau lien, aucun secret affiché',await until(`document.querySelector('[role=alert]')?.textContent.includes('déjà utilisé') && !document.querySelector('input') && !document.body.textContent.includes('fictitious.token.signature')`));
  await browser('open','about:blank');
  await browser('open',base+'/reinitialiser'+fakeFragment);
  await until(`!!document.querySelector('#password')`);
  await browser('reload');
  check('Rechargement après nettoyage : nouveau lien requis',await until(`document.querySelector('[role=alert]')?.textContent.includes('absent') && !document.querySelector('input')`));
  const a11y=await browser('a11y');check('Accessibilité lien absent : zéro violation',a11y.counts.violations===0);
  await writeFile(resolve(proof,'a11y.json'),JSON.stringify(a11y,null,2));
  }
  console.log(`Vérification terminée : ${results.length} contrôles. Réception et vraie mutation : script verify-recovery-real.mjs.`);
} catch {
  console.error('Vérification récupération en échec ; consulter le dernier contrôle et results.json sans secrets.');process.exitCode=1;
} finally {
  if (!boundariesOnly) {
    await browser('set','offline','off').catch(()=>{});
    await browser('close').catch(()=>{});
  }
  if(temporary) await rm(temporary,{recursive:true,force:true});
  await writeFile(resolve(proof,boundariesOnly ? 'boundary-results.json' : 'results.json'),JSON.stringify({date:new Date().toISOString(),node:process.version,results},null,2));
}
