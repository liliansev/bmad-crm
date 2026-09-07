"use server";
import { recoverPassword, requestRecovery } from "@/lib/supabase/recovery";
import type { RecoveryResult } from "@/lib/validations/recovery";

export async function requestPasswordReset(input: unknown): Promise<RecoveryResult> {
  return requestRecovery(input);
}

export async function changePassword(input: unknown): Promise<RecoveryResult> {
  return recoverPassword(input);
}
