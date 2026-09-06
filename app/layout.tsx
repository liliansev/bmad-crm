import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "CRM · Espace privé", template: "%s · CRM" }, description: "Votre espace de suivi commercial privé.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
