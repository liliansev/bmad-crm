import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

// Execute the actual TypeScript transport and draft code with controlled HTTP
// responses. No database, authentication secret, browser or external write.
const require = createRequire(import.meta.url);
const root = resolve('.');
const loaded = new Map(), storage = new Map(), results = [];
let responses = [], requested = [];
function load(file) {
  const path = resolve(root, file);
  if (loaded.has(path)) return loaded.get(path).exports;
  const module = { exports: {} }; loaded.set(path, module);
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    module, exports: module.exports, URL, URLSearchParams, Intl, Date, AbortSignal, setTimeout, clearTimeout, crypto: webcrypto,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    require: name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : name.startsWith('.') ? load(resolve(dirname(path), name + '.ts')) : require(name),
    fetch: async (url, init) => { requested.push({ url, body: init?.body }); assert.ok(responses.length, 'Unexpected request'); return { json: async () => responses.shift() }; },
  }, { filename: path });
  return module.exports;
}
function check(name, condition) { results.push({ name, passed: !!condition }); assert.ok(condition, name); console.log(`PASS ${name}`); }

const transport=load('lib/exchanges-transport.ts'),drafts=load('lib/exchanges-drafts.ts');
const id=webcrypto.randomUUID(),owner=webcrypto.randomUUID(),other=webcrypto.randomUUID();
let draft=drafts.freshExchangeDraft(id,null);draft.values.channel='phone';draft.values.notes='Initial';draft.generation=1;
const command={operation:'create',command_id:webcrypto.randomUUID(),fields:{contact_id:id,company_id:null,occurred_at:'2026-09-01T12:00:00.000Z',channel:'phone',notes:'Initial'}};
draft.pending={command,generation:1};
check('Brouillon pending stocké',drafts.writeExchangeDraft(owner,draft));
check('Isolation propriétaire',drafts.readExchangeDraft(other,id)===null);
check('Commande restaurée identique',JSON.stringify(drafts.readExchangeDraft(owner,id).pending.command)===JSON.stringify(command));
responses=[{status:'unavailable',message:'Offline'}];check('Réponse perdue honnête',(await transport.sendExchangeCommand(command)).status==='unavailable');
const exchange={...command.fields,id:webcrypto.randomUUID(),created_at:'2026-09-01T12:00:00Z',updated_at:'2026-09-01T12:00:00Z',revision:1,field_versions:{contact_id:1,company_id:1,occurred_at:1,channel:1,notes:1}};
responses=[{status:'success',exchange}];check('Reçu canonique relu',(await transport.sendExchangeCommand(command)).status==='success');check('Retry identique',requested[0].body===requested[1].body);
draft.generation=2;draft.values.notes='Nouvelle saisie';const latest=drafts.acknowledgeExchange(draft);check('Génération récente préservée',latest.values.notes==='Nouvelle saisie'&&drafts.exchangeDirty(latest)&&latest.pending===null);
check('Génération confirmée nettoyée',!drafts.exchangeDirty(drafts.acknowledgeExchange({...draft,generation:1})));
for(const status of ['unauthenticated','forbidden']){responses=[{status,message:'Refus'}];check('Refus explicite '+status,(await transport.fetchExchanges({contact_id:id},1)).status===status);}
responses=[{status:'success',exchanges:[],total:26,page:2,last_interaction:exchange}];const page=await transport.fetchExchanges({company_id:id},2);check('Maximum global indépendant de page',page.status==='success'&&page.last_interaction.id===exchange.id&&page.total===26&&page.page===2);
responses=[{status:'success',exchange:{id}}];check('Faux succès incomplet refusé',(await transport.sendExchangeCommand(command)).status==='unavailable');
console.log(JSON.stringify({success:true,results}));
