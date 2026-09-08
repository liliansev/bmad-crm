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
const schema = load('lib/validations/contacts.ts');
const transport = load('lib/contacts-transport.ts');
const drafts = load('lib/contacts-drafts.ts');
const id = '11111111-1111-4111-8111-111111111111', owner = '22222222-2222-4222-8222-222222222222';
const fields = { first_name: 'Camille', last_name: 'Fictif', email: '', job_title: '', linkedin_url: '', notes: '' };
const versions = Object.fromEntries(Object.keys(fields).map(field => [field, 1]));
const actual = { ...fields, id, first_name: 'Prénom distant', last_name: 'Nom distant récent', field_versions: { ...versions, first_name: 2, last_name: 2 }, revision: 3, created_at: '2026-09-07T00:00:00Z', updated_at: '2026-09-07T00:00:00Z' };
const historical = { id, first_name: 'Prénom distant', last_name: 'Fictif', field_versions: { first_name: 2, last_name: 1 }, revision: 2, created_at: actual.created_at, updated_at: actual.updated_at };
const command = { operation: 'update', command_id: '33333333-3333-4333-8333-333333333333', contact_id: id, fields: { first_name: 'Mon prénom', last_name: 'Mon nom' }, base_versions: { first_name: 1, last_name: 1 } };
let success = false;
try {
  check('Node 24', process.versions.node.startsWith('24.'));
  const matcher=load('lib/validations/contact-name-digits.ts').CONTACT_NAME_DIGITS;
  const parityPoints=new Set([65,233,0x674e,0x639,0x10400,0xb2,0x2167]);
  for(let cp=1;cp<0x10ffff;cp++) if(/\p{Nd}/u.test(String.fromCodePoint(cp))) {parityPoints.add(cp-1);parityPoints.add(cp);parityPoints.add(cp+1);}
  check('Matcher de production : parité Nd, voisins et lettres', [...parityPoints].every(cp=>matcher.test(String.fromCodePoint(cp))===/\p{Nd}/u.test(String.fromCodePoint(cp))));
  check('Matcher de production : ² et Ⅷ acceptés',!matcher.test('²')&&!matcher.test('Ⅷ'));
  for (const field of ['first_name', 'last_name']) for (const value of ['Jean2', '123', 'ع٢', '全２', '𝟚']) {
    const parsed = schema.contactNamesSchema.safeParse({ ...fields, [field]: value });
    check(`Chiffre décimal refusé dans ${field}: ${value}`, !parsed.success && parsed.error.issues.some(issue => issue.path.includes(field)));
  }
  for(const file of ['lib/validations/contacts.ts','lib/validations/contacts-v1.ts']) {
    const strict=load(file);
    for(const field of ['first_name','last_name']) {
      const cmd={...(file.endsWith('contacts.ts')?{version:2}:{}),operation:'update',command_id:webcrypto.randomUUID(),contact_id:id,fields:{[field]:'Jean2'},base_versions:{[field]:1}};
      const result=strict.contactCommandSchema.safeParse(cmd);
      check('Commande stricte : erreur associée au nom transmis',!result.success&&result.error.issues.some(issue=>issue.path.includes(field)));
    }
  }
  for (const value of ['Élodie', 'Jean-Pierre', 'O’Connor', '李', 'علي', '𐐀'.repeat(200)]) check('Nom international valide', schema.contactNamesSchema.safeParse({ ...fields, first_name: value }).success);
  check('201 points de code refusés', !schema.contactNamesSchema.safeParse({ ...fields, first_name: '𐐀'.repeat(201) }).success);
  check('Deux blancs refusés', !schema.contactNamesSchema.safeParse({ ...fields, first_name: '  ', last_name: '\t' }).success);
  responses = [{ status: 'conflict' , contact: historical, fields: ['first_name'], message: 'Conflit fictif' }, { status: 'success', contact: actual }];
  const conflict = await transport.sendContactCommand(command);
  check('Reçu v1 : le nom changé après le conflit exige aussi un choix', conflict.status === 'conflict' && [...conflict.fields].sort().join() === 'first_name,last_name');
  check('Reçu v1 : la fiche complémentaire est réellement lue', requested.length === 2 && requested[1].url.includes('version=2') && conflict.contact.last_name === actual.last_name);
  check('Reçu v1 : commande et UUID conservés exactement', requested[0].body === JSON.stringify(command));
  for (const status of ['unauthenticated', 'forbidden']) {
    responses = [{ status: 'success', contact: historical }, { status, message: 'Session refusée' }];
    check(`Lecture après reçu v1 : ${status} propagé`, (await transport.sendContactCommand(command)).status === status);
  }
  for (const notes of ['Texte\u0000fictif', 'Texte\ud800fictif', 'Texte\udc00fictif']) {
    const result = schema.contactNamesSchema.safeParse({ ...fields, notes });
    check('Texte non stockable : validation ciblée Notes', !result.success && result.error.issues.some(issue => issue.path.includes('notes')));
    const draft = drafts.freshDraft(id, actual);
    draft.values.notes = notes;
    draft.pending = { command: { version: 2, operation: 'update', command_id: webcrypto.randomUUID(), contact_id: id, fields: { notes }, base_versions: { notes: 1 } }, generation: 0, values: { ...draft.values } };
    check('Ancien brouillon non stockable écrit sans perdre son texte', drafts.writeDraft(owner, draft));
    const restored = drafts.readDraft(owner, id);
    check('Ancienne commande non stockable reste récupérable et corrigeable', restored?.values.notes === notes && restored?.pending?.command.command_id === draft.pending.command.command_id);
  }
  const numericContact={...actual,first_name:'Historique2',last_name:'Nom٢'};
  check('Fiche historique chiffrée lisible',schema.contactSchema.safeParse(numericContact).success);
  const historicFields={...fields,first_name:'Historique2',last_name:'Nom٢'};
  check('Formulaire historique : autres champs modifiables',schema.contactEditorSchema(numericContact).safeParse({...historicFields,notes:'Note corrigée'}).success);
  check('Formulaire historique : correction indépendante du prénom',schema.contactEditorSchema(numericContact).safeParse({...historicFields,first_name:'Élodie'}).success);
  check('Formulaire historique : nouveau nom chiffré refusé',!schema.contactEditorSchema(numericContact).safeParse({...historicFields,last_name:'Autre3'}).success);
  for(const version of [1,2]) {
    const pending={...(version===2?{version:2}:{}),operation:'create',command_id:webcrypto.randomUUID(),fields:version===2?historicFields:{first_name:'Historique2',last_name:'Nom٢'}};
    const target='new';
    const draft=version===2?{...drafts.freshDraft(target,null),values:historicFields,pending:{command:pending,generation:0,values:historicFields}}:{target,generation:0,values:pending.fields,base:null,pending:{command:pending,generation:0,values:pending.fields}};
    storage.clear();storage.set(`crm:contacts:draft:v${version}:${owner}:${target}`,JSON.stringify(draft));
    const restored=drafts.readDraft(owner,target);
    check(`Brouillon v${version} ancien : texte et commande préservés`,restored?.values.first_name==='Historique2'&&JSON.stringify(restored?.pending?.command)===JSON.stringify(pending));
    check(`Transport v${version} laisse rejouer une ancienne commande`,(version===2?schema.contactTransportCommandSchema:schema.legacyCommandSchema).safeParse(pending).success);
  }
  for (const url of ['https://example.invalid/a b', 'https://example.invalid/a\\b', 'https://example.invalid/a\tb']) {
    check('URL refusée par SQL également refusée à la saisie', !schema.linkedinSchema.safeParse(url).success);
  }
  check('Notes Unicode usuelles conservées', schema.contactNamesSchema.safeParse({ ...fields, notes: '  Note 🙂\nDeuxième ligne  ' }).success);
  check('URL encodée HTTP(S) autorisée', schema.linkedinSchema.safeParse('https://example.invalid/a%20b').success);
  success = true;
} finally {
  const proof = resolve(process.env.NAMES_PROOF_DIR || '_bmad-output/implementation-artifacts/verification/2-2');
  await mkdir(proof, { recursive: true });
  await writeFile(resolve(proof, 'transport-review-results.json'), JSON.stringify({ success, at: new Date().toISOString(), node: process.version, results }, null, 2));
}
