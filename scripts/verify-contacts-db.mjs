import { alphabetic, fixtureMarker } from './contacts-qa-marker.mjs';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { deleteQaAuthUser, signOutQaSession } from './contacts-qa-cleanup.mjs';

// Run only after the dedicated migration and private owner registry are applied.
// QA administration is confined to this script; no privileged key enters the app.
const exec = promisify(execFile);
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const project = 'otadrkhrjxafutocstzo';
const endpoint = `https://${project}.supabase.co`;
const secretSchema = z.object({
  project_ref: z.literal(project), anon_key: z.string().min(1), service_role_key: z.string().min(1),
  owner_id: z.uuid(), owner_email: z.email(), owner_password: z.string().min(1),
});
const resultSchema = z.object({ status: z.enum(['success', 'validation', 'conflict', 'not_found', 'unauthenticated', 'forbidden', 'unavailable']) }).passthrough();
let secret, admin, owner, other, outsiderId, managementToken;
let stage = 'préparation';
let passed = 0;
const commands = new Set();
const contacts = new Set();
const marker = fixtureMarker('QA DB fictif');

function check(name, condition) {
  stage = name;
  if (!condition) throw new Error(name);
  passed += 1;
  console.log(`PASS ${name}`);
}
function client() { return createClient(endpoint, secret.anon_key, options); }
function command(operation, fields, rest = {}) {
  const value = { operation, command_id: randomUUID(), fields, ...rest };
  commands.add(value.command_id);
  return value;
}
async function rpc(c, value) {
  const response = await c.rpc('contact_command', { p_command: value });
  if (response.error) throw new Error('Échec transport RPC');
  const result = resultSchema.parse(response.data);
  if (result.status === 'success' && value.operation === 'create') contacts.add(result.contact.id);
  return result;
}
async function query(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${managementToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }), signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error('Administration DB indisponible');
  const result = await response.json();
  if (!Array.isArray(result)) throw new Error('Réponse administration DB invalide');
  return result;
}
async function loadManagementToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  const { stdout } = await exec('security', ['find-generic-password', '-s', 'Supabase CLI', '-a', 'access-token', '-w']);
  const value = stdout.trim();
  if (value.startsWith('go-keyring-encoded:')) return Buffer.from(value.split(':')[1], 'hex').toString();
  if (value.startsWith('go-keyring-base64:')) return Buffer.from(value.split(':')[1], 'base64').toString();
  return value;
}

try {
  secret = secretSchema.parse(JSON.parse(await readFile('.local/bootstrap-secrets.json', 'utf8')));
  managementToken = await loadManagementToken();
  admin = createClient(endpoint, secret.service_role_key, options);
  const identity = await admin.auth.admin.getUserById(secret.owner_id);
  check('Projet dédié et identité propriétaire vérifiés', !identity.error && identity.data.user.email === secret.owner_email);
  const registry = await query(`select owner_id = '${secret.owner_id}'::uuid as correct from private.crm_owner where singleton;`);
  check('Registre privé initialisé avec le propriétaire attendu', registry.length === 1 && registry[0].correct);
  const privileges = await query(`select
    not has_table_privilege('anon', 'public.contacts', 'SELECT') as anon_select_denied,
    has_table_privilege('authenticated', 'public.contacts', 'SELECT') as owner_select_granted,
    not has_table_privilege('authenticated', 'public.contacts', 'INSERT,UPDATE,DELETE') as direct_write_denied,
    not has_function_privilege('anon', 'public.contact_command(jsonb)', 'EXECUTE') as anon_rpc_denied,
    not has_table_privilege('authenticated', 'private.crm_owner', 'SELECT,INSERT,UPDATE,DELETE') as registry_private,
    not has_table_privilege('authenticated', 'private.contact_command_receipts', 'SELECT,INSERT,UPDATE,DELETE') as receipts_private,
    (select relrowsecurity from pg_class where oid = 'public.contacts'::regclass) as rls_enabled,
    (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = 'public.contact_command(jsonb)'::regprocedure) as definer_hardened;`);
  check('RLS, droits directs et RPC durcie vérifiés en catalogue', Object.values(privileges[0]).every(Boolean));

  owner = client();
  const login = await owner.auth.signInWithPassword({ email: secret.owner_email, password: secret.owner_password });
  check('Authentification réelle du propriétaire', !login.error && login.data.user.id === secret.owner_id);
  const visitor = client();
  check('Visiteur : lecture directe refusée', !!(await visitor.from('contacts').select('id')).error);
  check('Visiteur : RPC directe refusée', !!(await visitor.rpc('contact_command', { p_command: command('create', { first_name: marker, last_name: 'Visiteur' }) })).error);
  const withoutIdentity = await query(`begin;
    set local role authenticated;
    select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
    select public.contact_command('{"operation":"create"}'::jsonb)->>'status' as status,
      (select count(*) from public.contacts) as visible;
    rollback;`);
  check('Rôle authentifié sans identité : commande refusée et aucune ligne', withoutIdentity.some(r => r.status === 'unauthenticated' && Number(r.visible) === 0));
  const badToken = createClient(endpoint, secret.anon_key, { ...options, global: { headers: { Authorization: `Bearer ${login.data.session.access_token.slice(0, -8)}invalidx` } } });
  check('Jeton invalide : données refusées', !!(await badToken.from('contacts').select('id')).error);

  stage = 'création du compte fictif non propriétaire';
  const outsiderPassword = `Qa-${randomUUID()}!`;
  const createdUser = await admin.auth.admin.createUser({ email: `qa-contacts-${randomUUID()}@example.invalid`, password: outsiderPassword, email_confirm: true });
  if (createdUser.error) throw new Error('Création compte de recette refusée');
  outsiderId = createdUser.data.user.id;
  other = client();
  const otherLogin = await other.auth.signInWithPassword({ email: createdUser.data.user.email, password: outsiderPassword });
  check('Authentification réelle du compte non propriétaire', !otherLogin.error && otherLogin.data.user.id === outsiderId);
  const otherRead = await other.from('contacts').select('id');
  check('Autre compte : RLS masque toutes les lignes', !otherRead.error && otherRead.data.length === 0);
  check('Autre compte : RPC refusée même avec UUID propriétaire injecté', (await rpc(other, command('create', { first_name: marker, last_name: 'Intrusion' }, { owner_id: secret.owner_id }))).status === 'forbidden');
  check('Propriétaire : insertion directe refusée', !!(await owner.from('contacts').insert({ owner_id: secret.owner_id, first_name: marker, last_name: 'Direct' })).error);
  check('Autre compte : insertion de ses propres lignes refusée', !!(await other.from('contacts').insert({ owner_id: outsiderId, first_name: marker, last_name: 'Direct' })).error);
  check('Propriétaire non falsifiable par paramètres RPC', (await rpc(owner, command('create', { first_name: marker, last_name: 'Injection' }, { owner_id: outsiderId }))).status === 'validation');

  for (const [name, fields] of [
    ['Noms blancs Unicode refusés', { first_name: ' \t\n\u00a0\ufeff ', last_name: '\u2003' }],
    ['Nom trop long refusé', { first_name: 'a'.repeat(201), last_name: '' }],
    ['Champ métier futur refusé', { first_name: marker, last_name: '', email: 'fictif@example.invalid' }],
    ['Valeur non textuelle refusée', { first_name: null, last_name: marker }],
  ]) check(name, (await rpc(owner, command('create', fields))).status === 'validation');
  for (const malformed of [null, [], {}, { operation: 'create', command_id: 'bad', fields: {} }]) {
    check('Commande malformée refusée sans erreur SQL', (await rpc(owner, malformed)).status === 'validation');
  }

  const original = command('create', { first_name: ` \t${marker}\u00a0`, last_name: '  Éclair \n' });
  const simultaneous = await Promise.all(Array.from({ length: 8 }, () => rpc(owner, original)));
  const first = simultaneous[0].contact;
  check('Huit créations simultanées de même commande : résultat strictement identique', simultaneous.every(r => JSON.stringify(r) === JSON.stringify(simultaneous[0])) && simultaneous[0].status === 'success');
  check('Trim et versions initiales persistés', first.first_name === marker && first.last_name === 'Éclair' && first.revision === 1 && first.field_versions.first_name === 1 && first.field_versions.last_name === 1);
  check('Résultat canonique sans propriétaire exposé', !('owner_id' in first));
  const count = await owner.from('contacts').select('id', { count: 'exact' }).eq('id', first.id);
  check('Création simultanée : exactement une ligne', !count.error && count.count === 1);
  const reordered = { fields: { last_name: original.fields.last_name, first_name: original.fields.first_name }, command_id: original.command_id, operation: 'create' };
  check('Ordre des clés JSON sans effet sur idempotence', JSON.stringify(await rpc(owner, reordered)) === JSON.stringify(simultaneous[0]));
  check('Même clé et contenu différent refusés', (await rpc(owner, { ...original, fields: { ...original.fields, last_name: 'Autre' } })).status === 'validation');
  check('Propriétaire : correction directe refusée', !!(await owner.from('contacts').update({ last_name: 'Interdit' }).eq('id', first.id)).error);
  check('Propriétaire : suppression directe refusée', !!(await owner.from('contacts').delete().eq('id', first.id)).error);

  const independent = await Promise.all([
    rpc(owner, command('update', { first_name: `${marker} modifié` }, { contact_id: first.id, base_versions: { first_name: 1 } })),
    rpc(owner, command('update', { last_name: 'Corrigé' }, { contact_id: first.id, base_versions: { last_name: 1 } })),
  ]);
  check('Deux champs indépendants simultanés acceptés', independent.every(r => r.status === 'success'));
  const confirmed = (await owner.from('contacts').select('*').eq('id', first.id).single()).data;
  check('Les deux corrections conservées sans écrasement global', confirmed.first_name === `${marker} modifié` && confirmed.last_name === 'Corrigé' && confirmed.revision === 3 && confirmed.field_versions.first_name === 2 && confirmed.field_versions.last_name === 2);
  const sameField = await Promise.all(['A', 'B'].map(suffix => rpc(owner, command('update', { last_name: `Concurrence ${suffix}` }, { contact_id: first.id, base_versions: { last_name: 2 } }))));
  check('Même champ simultané : un succès et un conflit', sameField.filter(r => r.status === 'success').length === 1 && sameField.filter(r => r.status === 'conflict').length === 1);
  const conflict = sameField.find(r => r.status === 'conflict');
  check('Conflit renvoie le champ et la version confirmée', conflict.fields.join() === 'last_name' && conflict.contact.field_versions.last_name === 3);
  const replacement = command('update', { last_name: 'Remplacement explicite' }, { contact_id: first.id, base_versions: { last_name: conflict.contact.field_versions.last_name } });
  const replaced = await rpc(owner, replacement);
  check('Remplacement explicite avec nouvelle version accepté', replaced.status === 'success' && replaced.contact.field_versions.last_name === 4);
  check('Réponse perdue après correction : même reçu sans nouvelle révision', JSON.stringify(await rpc(owner, replacement)) === JSON.stringify(replaced));
  check('Réessai ancien create : résultat original immuable après corrections', JSON.stringify(await rpc(owner, original)) === JSON.stringify(simultaneous[0]));
  check('Correction vidant les deux noms refusée', (await rpc(owner, command('update', { first_name: '', last_name: '' }, { contact_id: first.id, base_versions: replaced.contact.field_versions }))).status === 'validation');
  check('Versions manquantes refusées', (await rpc(owner, command('update', { first_name: 'Essai' }, { contact_id: first.id, base_versions: {} }))).status === 'validation');
  check('Version fractionnaire refusée', (await rpc(owner, command('update', { first_name: 'Essai' }, { contact_id: first.id, base_versions: { first_name: 1.1 } }))).status === 'validation');
  check('Version supplémentaire refusée', (await rpc(owner, command('update', { first_name: 'Essai' }, { contact_id: first.id, base_versions: { first_name: 2, last_name: 4 } }))).status === 'validation');
  check('Contact absent distingué', (await rpc(owner, command('update', { first_name: 'Essai' }, { contact_id: randomUUID(), base_versions: { first_name: 1 } }))).status === 'not_found');

  // More than one page, including accents/case and UUID ties, all fictional fixtures.
  const names = ['zèbre', 'Éclair', 'eclair', 'ALPHA', 'alpha', ...Array.from({ length: 26 }, (_, i) => `Pagination ${alphabetic(String(i).padStart(2, '0'))}`)];
  const sortedFixtures = [];
  for (const last_name of names) {
    const created = await rpc(owner, command('create', { first_name: marker, last_name }));
    if (created.status !== 'success') throw new Error('Création fixture pagination refusée');
    sortedFixtures.push(created.contact);
  }
  const pages = [];
  let total = 0;
  for (let page = 0; page === 0 || page * 25 < total; page += 1) {
    const result = await owner.from('contacts').select('id,first_name,last_name', { count: 'exact' }).order('last_name').order('first_name').order('id').range(page * 25, page * 25 + 24);
    if (result.error) throw new Error('Pagination refusée');
    total = result.count;
    pages.push(...result.data);
  }
  check('Pagination 25 : total global et toutes pages sans doublons', total > 25 && pages.length === total && new Set(pages.map(c => c.id)).size === total && [...contacts].every(id => pages.some(c => c.id === id)));
  const collator = new Intl.Collator('fr', { sensitivity: 'accent' });
  const expectedOrder = sortedFixtures.toSorted((a, b) => collator.compare(a.last_name, b.last_name) || collator.compare(a.first_name, b.first_name) || a.id.localeCompare(b.id)).map(c => c.id);
  const fixtureIds = new Set(expectedOrder);
  check('Tri français insensible à la casse et UUID stable', JSON.stringify(pages.filter(c => fixtureIds.has(c.id)).map(c => c.id)) === JSON.stringify(expectedOrder));
  const finalOtherRead = await other.from('contacts').select('id');
  check('Autre compte ne voit toujours aucune fixture créée', !finalOtherRead.error && finalOtherRead.data.length === 0);
  await signOutQaSession(owner);
  owner = client();
  await owner.auth.signInWithPassword({ email: secret.owner_email, password: secret.owner_password });
  const afterReconnect = await owner.from('contacts').select('first_name,last_name,revision').eq('id', first.id).single();
  check('Reconnexion réelle : dernière version persistée retrouvée', !afterReconnect.error && afterReconnect.data.last_name === replaced.contact.last_name && afterReconnect.data.revision === replaced.contact.revision);
} catch {
  console.error(`FAIL ${stage} ; aucun secret affiché.`);
  process.exitCode = 1;
} finally {
  // Only UUIDs generated/returned by this run. Never delete another user's fixture.
  if (managementToken && secret && commands.size) {
    try {
      const commandList = [...commands].map(id => `'${z.uuid().parse(id)}'::uuid`).join(',');
      const contactList = [...contacts].map(id => `'${z.uuid().parse(id)}'::uuid`).join(',') || 'null::uuid';
      await query(`begin;
        delete from public.contacts where owner_id = '${secret.owner_id}'::uuid and (
          id in (${contactList}) or id in (
            select (result->'contact'->>'id')::uuid from private.contact_command_receipts
            where owner_id = '${secret.owner_id}'::uuid and command_id in (${commandList})
              and operation = 'create' and result->>'status' = 'success'
          )
        );
        delete from private.contact_command_receipts where owner_id = '${secret.owner_id}'::uuid and command_id in (${commandList});
        commit;`);
      const remains = await query(`select
        (select count(*) from private.contact_command_receipts where owner_id = '${secret.owner_id}'::uuid and command_id in (${commandList})) as receipts,
        (select count(*) from public.contacts where owner_id = '${secret.owner_id}'::uuid and id in (${contactList})) as contacts;`);
      check('Fixtures et reçus de cette recette nettoyés', Number(remains[0].receipts) === 0 && Number(remains[0].contacts) === 0);
    } catch { console.error('FAIL nettoyage des fixtures DB à reprendre.'); process.exitCode = 1; }
  }
  for (const [label, session] of [['propriétaire', owner], ['autre compte', other]]) {
    if (!session) continue;
    try {
      await signOutQaSession(session);
      check(`Session QA ${label} déconnectée`, true);
    } catch { console.error(`FAIL déconnexion QA ${label} à reprendre.`); process.exitCode = 1; }
  }
  if (outsiderId && admin) {
    try {
      await deleteQaAuthUser(admin, outsiderId, secret.owner_id);
      check('Compte fictif de recette supprimé et absence confirmée par Auth', true);
    } catch { console.error('FAIL suppression du compte de recette à reprendre.'); process.exitCode = 1; }
  }
  managementToken = null; secret = null;
  console.log(`${process.exitCode === 1 ? 'ÉCHEC' : 'SUCCÈS'} : ${passed} contrôles DB validés, Node ${process.version}.`);
}
