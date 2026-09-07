import type { Metadata } from "next";
import { RecoveryFrame } from "@/components/auth/recovery-frame";
import { RecoveryPasswordForm } from "@/components/auth/recovery-password-form";
export const metadata: Metadata = { title: "Nouveau mot de passe", referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default function ResetPasswordPage() {
  return <RecoveryFrame title="Choisir un nouveau mot de passe" description="Enregistrez votre nouveau mot de passe, puis reconnectez-vous."><RecoveryPasswordForm /></RecoveryFrame>;
}
