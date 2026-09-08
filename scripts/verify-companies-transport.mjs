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
    module, exports: module.exports, URL, AbortSignal, setTimeout, clearTimeout, crypto: webcrypto,
    sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    require: name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : name.startsWith('.') ? load(resolve(dirname(path), name + '.ts')) : require(name),
    fetch: async (url, init) => { requested.push({ url, body: init?.body }); assert.ok(responses.length, 'Unexpected request'); return { json: async () => responses.shift() }; },
  }, { filename: path });
  return module.exports;
}
function check(name, condition) { results.push({ name, passed: !!condition }); assert.ok(condition, name); console.log(`PASS ${name}`); }

const schema=load('lib/validations/companies.ts'),transport=load('lib/companies-transport.ts'),drafts=load('lib/companies-drafts.ts');
const id=webcrypto.randomUUID(),owner=webcrypto.randomUUID(),other=webcrypto.randomUUID();
const company={id,name:'Société 42',field_versions:{name:1},revision:1,created_at:'2026-09-08T00:00:00Z',updated_at:'2026-09-08T00:00:00Z'};
let success=false;
try {
 check('Chiffres société autorisés',schema.companyNameSchema.safeParse('Société 42').success);
 check('Nom trim canonique',schema.companyNameSchema.parse('  Société 42  ')==='Société 42');
 for(const bad of ['', ' ', '\u0000', '\ud800', '\udc00','😀'.repeat(201)])check('Nom non stockable refusé',!schema.companyNameSchema.safeParse(bad).success);
 check('200 points Unicode autorisés',schema.companyNameSchema.safeParse('😀'.repeat(200)).success);
 let draft=drafts.freshDraft(id,company);draft.values.name='Nouvelle société';draft.generation=1;
 const command=drafts.makeCommand(draft);draft.pending={command,generation:1,values:{...draft.values}};
 check('Écriture brouillon',drafts.writeDraft(owner,draft));
 const resumed=drafts.readDraft(owner,id);check('Retry commande et version identiques',JSON.stringify(drafts.makeCommand(resumed))===JSON.stringify(command));
 check('Isolation propriétaire',drafts.readDraft(other,id)===null);
 responses=[{status:'unavailable',message:'Offline'}];check('Offline laisse échec explicite',(await transport.sendCompanyCommand(command)).status==='unavailable');
 responses=[{status:'success',company:{...company,name:'Nouvelle société',revision:2,field_versions:{name:2}}}];check('Retry reçu canonique',(await transport.sendCompanyCommand(command)).status==='success');check('Empreinte de retry identique',requested[0].body===requested[1].body);
 draft.values.name='Saisie plus récente';draft.generation=2;const confirmed=drafts.acknowledge(draft,{...company,name:'Nouvelle société',revision:2,field_versions:{name:2}});check('Nouvelle génération conservée',confirmed.values.name==='Saisie plus récente'&&drafts.isDirty(confirmed)&&confirmed.pending===null&&confirmed.base.field_versions.name===2);
 for(const status of ['unauthenticated','forbidden']){responses=[{status,message:'Session refusée'}];check('Session refusée propagée '+status,(await transport.fetchCompany(id)).status===status);}
 responses=[{status:'success',company:{id}}];check('Réponse partielle ne simule pas succès',(await transport.fetchCompany(id)).status==='unavailable');
 responses=[{status:'success',companies:[company],total:26,page:2}];check('Pagination DTO conserve compteur global',(await transport.fetchCompanies(2)).total===26);
 responses=[{status:'success',contacts:[{id,first_name:'Recette',last_name:'Fictive'}],total:26,page:2}];check('Contacts liés DTO seconde page',(await transport.fetchCompanyContacts(id,2)).page===2);
 check('Relation version indépendante',schema.contactCompanyCommandSchema.safeParse({command_id:webcrypto.randomUUID(),contact_id:id,company_id:null,base_version:1}).success);
 check('Version relation absente refusée',!schema.contactCompanyCommandSchema.safeParse({command_id:webcrypto.randomUUID(),contact_id:id,company_id:null}).success);
 success=true;
}finally{const proof=resolve('_bmad-output/implementation-artifacts/verification/2-3');await mkdir(proof,{recursive:true});await writeFile(resolve(proof,'companies-transport.json'),JSON.stringify({success,results},null,2));}
