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
let responses = [], requested = [], storageRemoveFails = false;
function load(file) {
  const path = resolve(root, file);
  if (loaded.has(path)) return loaded.get(path).exports;
  const module = { exports: {} }; loaded.set(path, module);
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    module, exports: module.exports, URL, URLSearchParams, Intl, Date, AbortSignal, setTimeout, clearTimeout, crypto: webcrypto,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => { if(storageRemoveFails)throw new Error("Storage unavailable");storage.delete(key); } },
    require: name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : name.startsWith('.') ? load(resolve(dirname(path), name + '.ts')) : require(name),
    fetch: async (url, init) => { requested.push({ url, body: init?.body }); assert.ok(responses.length, 'Unexpected request'); return { json: async () => responses.shift() }; },
  }, { filename: path });
  return module.exports;
}
function check(name, condition) { results.push({ name, passed: !!condition }); assert.ok(condition, name); console.log(`PASS ${name}`); }

const transport=load('lib/exchanges-transport.ts'),drafts=load('lib/exchanges-drafts.ts');
const id=webcrypto.randomUUID(),owner=webcrypto.randomUUID(),other=webcrypto.randomUUID();
const exchange={id,contact_id:other,company_id:null,occurred_at:'2025-10-26T01:30:45.123Z',channel:'phone',notes:'Initial',created_at:'2025-10-01T12:00:00Z',updated_at:'2025-10-01T12:00:00Z',revision:1,field_versions:{contact_id:1,company_id:1,occurred_at:1,channel:1,notes:1}};
let draft=drafts.freshExchangeUpdate(exchange);
check('Date secondes initiale non modifiée',!drafts.exchangeUpdateDirty(draft));
draft.values.notes='Correction';draft.generations.notes=1;
const command=drafts.exchangeUpdateCommand(draft,exchange.occurred_at);
check('Patch notes sans date ni relations',Object.keys(command.fields).join(',')==='notes'&&Object.keys(command.base_versions).join(',')==='notes');
draft.pending={command,generations:{...draft.generations}};
check('Brouillon update stocké',drafts.writeExchangeUpdate(owner,draft));
check('Isolation propriétaire',drafts.readExchangeUpdate(other,id)===null);
check('Isolation cible',drafts.readExchangeUpdate(owner,other)===null);
check('Create v1 séparé',drafts.readExchangeDraft(owner,id)===null);
check('Commande immuable restaurée',JSON.stringify(drafts.readExchangeUpdate(owner,id).pending.command)===JSON.stringify(command));
responses=[{status:'unavailable',message:'Offline'}];check('Perte réponse garde statut honnête',(await transport.sendExchangeCommand(command)).status==='unavailable');
const confirmed={...exchange,notes:'Correction',revision:2,field_versions:{...exchange.field_versions,notes:2}};
responses=[{status:'success',exchange:confirmed,affected:{contact_ids:[exchange.contact_id],company_ids:[]}}];check('Succès update transmis',(await transport.sendExchangeCommand(command)).status==='success');
check('Retry exact même clé et contenu',requested[0].body===requested[1].body);
draft.values.notes='Saisie ultérieure';draft.generations.notes=2;draft.values.channel='video';draft.generations.channel=1;
const acknowledged=drafts.acknowledgeExchangeUpdate(draft,confirmed);
check('Saisie ultérieure même champ préservée',acknowledged.values.notes==='Saisie ultérieure'&&acknowledged.base.field_versions.notes===2);
check('Saisie ultérieure autre champ préservée',acknowledged.values.channel==='video'&&drafts.exchangeUpdateDirty(acknowledged));
check('Pending confirmé nettoyé',acknowledged.pending===null);
const fullyConfirmed=drafts.acknowledgeExchangeUpdate({...draft,values:{...draft.values,notes:'Correction',channel:'phone'},generations:draft.pending.generations},confirmed);
check('Générations confirmées propres',!drafts.exchangeUpdateDirty(fullyConfirmed));
responses=[{status:'success',exchange:{...confirmed,notes:'Version plus récente',revision:3,field_versions:{...confirmed.field_versions,notes:3}}}];
const fresh=await transport.readExchange(id);check('Lecture unitaire actuelle après reçu',fresh.status==='success'&&fresh.exchange.revision===3&&requested.at(-1).url.includes('id='+id));
responses=[{status:'conflict',exchange:confirmed,conflicting_fields:['notes'],message:'Conflit'}];check('Conflit ciblé transmis',(await transport.sendExchangeCommand(command)).conflicting_fields.join(',')==='notes');
for(const status of ['unauthenticated','forbidden']){responses=[{status,message:'Refus'}];check('Lecture directe '+status,(await transport.readExchange(id)).status===status);}
const refreshDraft=drafts.freshExchangeUpdate(exchange);refreshDraft.values.notes='Local';refreshDraft.generations.notes=1;
const remote={...exchange,channel:'email',notes:'Distant',revision:4,field_versions:{...exchange.field_versions,channel:2,notes:3}};
const revalidated=drafts.revalidateExchangeUpdate(refreshDraft,remote);
check('Revalidation champs propres récents',revalidated.values.channel==='email'&&revalidated.base.field_versions.channel===2);
check('Revalidation garde saisie et version dirty',revalidated.values.notes==='Local'&&revalidated.base.notes==='Initial'&&revalidated.base.field_versions.notes===1);
check('Revalidation rejette ancienne révision',drafts.revalidateExchangeUpdate(revalidated,exchange)===revalidated);
refreshDraft.pending={command:drafts.exchangeUpdateCommand(refreshDraft,exchange.occurred_at),generations:{...refreshDraft.generations}};
const refreshPending=drafts.revalidateExchangeUpdate(refreshDraft,remote);
check('Revalidation conserve commande pending exacte',JSON.stringify(refreshPending.pending)===JSON.stringify(refreshDraft.pending));
const receiptWithIndependentRemote={...confirmed,channel:'email',field_versions:{...confirmed.field_versions,channel:2}};
const afterCommit={...confirmed,channel:'other',notes:'Modification distante après commit',revision:3,field_versions:{...confirmed.field_versions,notes:3,channel:3}};
const beforeRead=JSON.stringify(afterCommit);
const raced=drafts.acknowledgeExchangeUpdate(draft,receiptWithIndependentRemote,afterCommit);
check('Relecture ne mute pas état distant',JSON.stringify(afterCommit)===beforeRead);
check('Génération notes récente garde version reçu',raced.base.notes==='Correction'&&raced.base.field_versions.notes===2&&raced.values.notes==='Saisie ultérieure');
check('Génération indépendante garde version initiale',raced.base.channel==='phone'&&raced.base.field_versions.channel===1&&raced.values.channel==='video');
const raceCommand=drafts.exchangeUpdateCommand(raced,exchange.occurred_at);
check('Sauvegarde suivante exige conflit notes et canal',raceCommand.base_versions.notes!==afterCommit.field_versions.notes&&raceCommand.base_versions.channel!==afterCommit.field_versions.channel);
check('Champ propre adopte lecture actuelle',raced.base.revision===3&&raced.values.contact_id===afterCommit.contact_id);
drafts.writeExchangeUpdate(owner,draft);storageRemoveFails=true;
check('Échec suppression explicite',drafts.removeExchangeUpdate(owner,id)===false);
check('Échec suppression conserve génération pending',drafts.readExchangeUpdate(owner,id).pending.command.command_id===command.command_id);
storageRemoveFails=false;
check('Suppression réessayable',drafts.removeExchangeUpdate(owner,id)===true&&drafts.readExchangeUpdate(owner,id)===null);
await mkdir('_bmad-output/implementation-artifacts/verification/2-5',{recursive:true});
await writeFile('_bmad-output/implementation-artifacts/verification/2-5/exchanges-update-transport.json',JSON.stringify({success:true,results},null,2));
