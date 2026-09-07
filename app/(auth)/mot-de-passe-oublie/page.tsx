import type { Metadata } from "next";
import { RecoveryFrame } from "@/components/auth/recovery-frame";
import { RecoveryRequestForm } from "@/components/auth/recovery-request-form";
export const metadata: Metadata = { title: "Mot de passe oublié", referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default function ForgotPasswordPage() {
  return <RecoveryFrame title="Récupérer mon accès" description="Saisissez votre adresse pour demander un lien de récupération."><RecoveryRequestForm /></RecoveryFrame>;
}
