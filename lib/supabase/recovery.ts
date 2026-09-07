import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { recoveryClaimsSchema, recoveryMutationSchema, recoveryRequestSchema, type RecoveryResult } from "@/lib/validations/recovery";
import { authFetch } from "./fetch";

const newLink = "Ce lien est absent, expiré ou déjà utilisé. Demandez un nouveau lien.";
const interrupted = "Le changement n’a pas pu être confirmé. Essayez de vous connecter avec le nouveau mot de passe, ou demandez un nouveau lien.";

// Never reads or writes the ordinary SSR/browser session.
function recoveryClient() {
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: "implicit" },
    global: { fetch: authFetch },
  });
}

export async function requestRecovery(input: unknown): Promise<RecoveryResult> {
  const parsed = recoveryRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Vérifiez votre adresse e-mail.", fields: { email: parsed.error.issues[0].message } };
  try {
    const { error } = await recoveryClient().auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getServerEnv().NEXT_PUBLIC_APP_URL}/reinitialiser`,
    });
    if (error) return { ok: false, message: error.status === 429 ? "La limite d’envoi est atteinte. Réessayez plus tard." : "L’envoi n’a pas pu être confirmé. Réessayez dans un instant." };
    return { ok: true, message: "Si cette adresse correspond au compte, un e-mail de récupération lui sera envoyé. Consultez aussi les indésirables." };
  } catch {
    return { ok: false, message: "L’envoi n’a pas pu être confirmé. Vérifiez votre réseau puis réessayez." };
  }
}

export async function recoverPassword(input: unknown): Promise<RecoveryResult> {
  const parsed = recoveryMutationSchema.safeParse(input);
  if (!parsed.success) {
    if (parsed.error.issues.some((issue) => issue.path[0] === "accessToken" || issue.path[0] === "refreshToken")) return { ok: false, message: newLink, needsNewLink: true };
    const fields: Partial<Record<"password" | "confirmation", string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "password" || field === "confirmation") && !fields[field]) fields[field] = issue.message;
    }
    return { ok: false, message: "Vérifiez les champs indiqués.", fields };
  }
  const supabase = recoveryClient();
  let renewedBearer: string | null = null;
  let confirmedResult: RecoveryResult | undefined;
  try {
    const identity = await supabase.auth.getUser(parsed.data.accessToken);
    if (identity.error || identity.data.user?.id !== getServerEnv().SUPABASE_OWNER_ID) return { ok: false, needsNewLink: true, message: identity.error && (!identity.error.status || identity.error.status >= 500) ? interrupted : newLink };
    // Decode only after the provider authenticated this exact bearer token.
    const claims = authenticatedRecoveryClaims(parsed.data.accessToken);
    if (!claims || claims.sub !== identity.data.user.id) return { ok: false, needsNewLink: true, message: newLink };
    const renewed = await supabase.auth.refreshSession({ refresh_token: parsed.data.refreshToken });
    if (renewed.error || !renewed.data.session) return { ok: false, needsNewLink: true, message: renewed.error && (!renewed.error.status || renewed.error.status >= 500) ? interrupted : newLink };
    renewedBearer = renewed.data.session.access_token;
    const renewedIdentity = await supabase.auth.getUser();
    if (renewedIdentity.error || renewedIdentity.data.user?.id !== identity.data.user.id) return { ok: false, needsNewLink: true, message: renewedIdentity.error ? interrupted : newLink };
    const renewedClaims = authenticatedRecoveryClaims(renewed.data.session.access_token);
    if (!renewedClaims || renewedClaims.sub !== claims.sub || renewedClaims.session_id !== claims.session_id) return { ok: false, needsNewLink: true, message: newLink };
    const changed = await supabase.auth.updateUser({ password: parsed.data.password });
    if (changed.error?.code === "same_password") return { ok: false, needsNewLink: true, message: "Ce mot de passe est déjà celui du compte. Retournez à la connexion pour l’utiliser, ou demandez un nouveau lien pour en choisir un autre." };
    if (changed.error || changed.data.user?.id !== getServerEnv().SUPABASE_OWNER_ID) return { ok: false, needsNewLink: true, message: interrupted };
    confirmedResult = { ok: true, message: "Votre mot de passe a été modifié. Reconnectez-vous avec le nouveau." };
    return confirmedResult;
  } catch {
    return { ok: false, needsNewLink: true, message: interrupted };
  } finally {
    parsed.data.password = "";
    parsed.data.confirmation = "";
    parsed.data.accessToken = "";
    parsed.data.refreshToken = "";
    if (renewedBearer) {
      let closed = false;
      try { closed = !(await supabase.auth.signOut({ scope: "local" })).error; } catch { /* Retry below with the retained user bearer. */ }
      if (!closed) {
        // signOut may clear memory even when its request fails. This method uses
        // the retained user bearer, with the same public client and bounded fetch.
        try { closed = !(await supabase.auth.admin.signOut(renewedBearer, "local")).error; } catch { /* Report the unconfirmed cleanup below. */ }
      }
      renewedBearer = null;
      if (!closed && confirmedResult?.ok) confirmedResult.message += " La fermeture du lien n’a pas pu être confirmée.";
    }
  }
}

function authenticatedRecoveryClaims(token: string) {
  try {
    const claims = recoveryClaimsSchema.parse(JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))));
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp <= now || !claims.amr.some(({ method, timestamp }) =>
      (method === "otp" || method === "recovery") && timestamp >= now - 3600 && timestamp <= now + 60)) return null;
    return claims;
  } catch { return null; }
}
