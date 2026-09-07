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
function check(name, condition) { assert.ok(condition, name); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
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
  responses = [{ status: 'conflict', contact: historical, fields: ['first_name'], message: 'Conflit fictif' }, { status: 'success', contact: actual }];
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
  for (const url of ['https://example.invalid/a b', 'https://example.invalid/a\\b', 'https://example.invalid/a\tb']) {
    check('URL refusée par SQL également refusée à la saisie', !schema.linkedinSchema.safeParse(url).success);
  }
  check('Notes Unicode usuelles conservées', schema.contactNamesSchema.safeParse({ ...fields, notes: '  Note 🙂\nDeuxième ligne  ' }).success);
  check('URL encodée HTTP(S) autorisée', schema.linkedinSchema.safeParse('https://example.invalid/a%20b').success);
  success = true;
} finally {
  const proof = resolve('_bmad-output/implementation-artifacts/verification/2-2');
  await mkdir(proof, { recursive: true });
  await writeFile(resolve(proof, 'transport-review-results.json'), JSON.stringify({ success, at: new Date().toISOString(), node: process.version, results }, null, 2));
}
