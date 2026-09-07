import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const exec = promisify(execFile);
const project = 'otadrkhrjxafutocstzo';
const fixtureSchema = z.object({ contact_ids: z.array(z.uuid()).max(10000), command_ids: z.array(z.uuid()).max(10000) }).strict();
const secretsSchema = z.object({ project_ref: z.literal(project), owner_id: z.uuid(), owner_email: z.email(), service_role_key: z.string().min(1) });
const sqlIds = (ids) => [...new Set(ids)].map(id => `'${z.uuid().parse(id)}'::uuid`).join(',') || 'null::uuid';

export async function signOutQaSession(client) {
  const result = await client.auth.signOut({ scope: 'local' });
  if (result.error) throw new Error('Déconnexion de la session QA refusée.');
}

export async function deleteQaAuthUser(admin, userId, protectedOwnerId) {
  z.uuid().parse(userId); z.uuid().parse(protectedOwnerId);
  if (userId === protectedOwnerId) throw new Error('Suppression du propriétaire interdite.');
  const removed = await admin.auth.admin.deleteUser(userId);
  if (removed.error) throw new Error('Suppression du compte QA refusée.');
  const remaining = await admin.auth.admin.getUserById(userId);
  if (!remaining.error || remaining.error.status !== 404 || remaining.error.code !== 'user_not_found') {
    throw new Error('Absence du compte QA non confirmée.');
  }
}

// Import has no side effects. Caller supplies only the exact UUIDs tracked by its run.
// Read/validate the cleanup manifest in the UI script, then pass its two arrays here.
export async function cleanupContactsQa(input) {
  const fixtures = fixtureSchema.parse(input);
  if (!fixtures.contact_ids.length && !fixtures.command_ids.length) return { contacts: 0, receipts: 0 };
  const secret = secretsSchema.parse(JSON.parse(await readFile('.local/bootstrap-secrets.json', 'utf8')));
  const admin = createClient(`https://${project}.supabase.co`, secret.service_role_key, { auth: { persistSession: false, autoRefreshToken: false } });
  const identity = await admin.auth.admin.getUserById(secret.owner_id);
  if (identity.error || identity.data.user.email !== secret.owner_email) throw new Error('Identité QA non confirmée.');
  let token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    const { stdout } = await exec('security', ['find-generic-password', '-s', 'Supabase CLI', '-a', 'access-token', '-w']);
    token = stdout.trim();
    if (token.startsWith('go-keyring-encoded:')) token = Buffer.from(token.split(':')[1], 'hex').toString();
    else if (token.startsWith('go-keyring-base64:')) token = Buffer.from(token.split(':')[1], 'base64').toString();
  }
  async function query(sql) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql }), signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('Nettoyage QA : administration indisponible.');
    const result = await response.json();
    if (!Array.isArray(result)) throw new Error('Nettoyage QA : réponse invalide.');
    return result;
  }
  try {
    const registry = await query(`select owner_id = '${secret.owner_id}'::uuid as correct from private.crm_owner where singleton;`);
    if (registry.length !== 1 || !registry[0].correct) throw new Error('Propriétaire du registre QA non confirmé.');
    const commandList = sqlIds(fixtures.command_ids);
    // A lost create response may leave no contact UUID in the browser manifest.
    const recovered = await query(`select result->'contact'->>'id' as id from private.contact_command_receipts
      where owner_id = '${secret.owner_id}'::uuid and command_id in (${commandList})
        and operation = 'create' and result->>'status' = 'success';`);
    const targetIds = [...new Set([...fixtures.contact_ids, ...recovered.map(row => z.uuid().parse(row.id))].map(id => id.toLowerCase()))];
    const contactList = sqlIds(targetIds);
    const contactTextList = targetIds.map(id => `'${z.uuid().parse(id)}'::text`).join(',') || 'null::text';
    // Browser-created commands are not necessarily individually captured. Their
    // receipts still belong to the exact contact UUIDs tracked by this QA run.
    const receiptPredicate = `(command_id in (${commandList})
      or result->'contact'->>'id' in (${contactTextList})
      or command->>'contact_id' in (${contactTextList}))`;
    const deleted = await query(`begin;
      with deleted_contacts as (
        delete from public.contacts where owner_id = '${secret.owner_id}'::uuid and id in (${contactList}) returning id
      ), deleted_receipts as (
        delete from private.contact_command_receipts where owner_id = '${secret.owner_id}'::uuid and ${receiptPredicate} returning command_id
      ) select (select count(*) from deleted_contacts) as contacts, (select count(*) from deleted_receipts) as receipts;
      commit;`);
    const remaining = await query(`select
      (select count(*) from public.contacts where owner_id = '${secret.owner_id}'::uuid and id in (${contactList})) as contacts,
      (select count(*) from private.contact_command_receipts where owner_id = '${secret.owner_id}'::uuid and ${receiptPredicate}) as receipts;`);
    if (remaining.length !== 1 || Number(remaining[0].contacts) !== 0 || Number(remaining[0].receipts) !== 0) {
      throw new Error('Nettoyage QA : données encore présentes après commit.');
    }
    if (deleted.length !== 1 || !Number.isSafeInteger(Number(deleted[0].contacts)) || !Number.isSafeInteger(Number(deleted[0].receipts))) {
      throw new Error('Nettoyage QA : compte des suppressions non confirmé.');
    }
    return { contacts: Number(deleted[0].contacts), receipts: Number(deleted[0].receipts) };
  } finally { token = null; }
}
