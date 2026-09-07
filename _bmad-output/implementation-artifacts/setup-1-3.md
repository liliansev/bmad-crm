# Hébergement du POC — paramètres et preuves

## Paramètres vérifiés

- Vercel CLI connecté comme `liliansev`. Équipe `liliansevs-projects`, ID `team_Q3nb0GNhD0y8bddmceOond2h`, plan Hobby actif. Prototype de démonstration avec données fictives, aucun abonnement changé.
- Nouveau projet dédié `bmad-crm`, ID `prj_p48iJ3ESO2tMkXxRHUamJmtweuDc`, Next.js, Node 24.x. Domaine attribué et vérifié par Vercel : `https://bmad-crm.vercel.app`. `.vercel/project.json` ignoré lie le bon projet.
- Dépôt existant `liliansev/bmad-crm`, public, vide côté distant au début. Push de cette livraison et vérification du SHA nécessaires ; aucune clé ou fichier local ignoré n’est inclus.
- Supabase `otadrkhrjxafutocstzo`, org Persos ; compte propriétaire déjà vérifié. Secrets nécessaires lus en mémoire depuis `.local/bootstrap-secrets.json` et `.env.local`, jamais affichés. Clé service_role uniquement recette/administration, jamais environnement applicatif Vercel.
- Variables applicatives : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_OWNER_ID, NEXT_PUBLIC_APP_URL. Dernière variable HTTPS canonique sur Vercel ; localhost conservé en local.
- Allowlist Supabase doit conserver les origines locales et ajouter exactement `/reinitialiser` sous l’origine hébergée. Site URL canonique HTTPS ; resetPasswordForEmail fournit toujours son redirectTo explicitement. Template natif obligatoire sur free/defaultSMTP, pas de modification payante.
- Deux mails de récupération ont été envoyés lors de 1.2 à 16:22 et 16:41 UTC le 7 septembre ; limite fournisseur 2/heure. Continuer les contacts pendant l’attente éventuelle du prochain envoi, ne pas annoncer réception prématurément. Le parent réalise demande/Gmail, vous ne déclenchez aucun e-mail.

## Réalisation

Agent hébergement : `.vercelignore`, `README.md`, `scripts/verify-hosted.mjs`, adaptation `scripts/verify-recovery-real.mjs` uniquement. Autre agent prépare Contacts dans ses propres fichiers. Ne pas installer de dépendance ni changer le code Auth sans besoin démontré ; prévenir parent si nécessaire. Pas de build serveur concurrent ni push/déploiement par sous-agent.

Node 24 local : `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin/node`. Dev existant localhost:3000. Agent-browser CLI disponible ; commandes `--session` isolées, credentials injectées par stdin comme scripts existants. Ne pas lire les valeurs du fichier secrets dans le contexte : les scripts les chargent en mémoire. Restauration du mot de passe initial dans finally et confirmation par Auth + navigateur.

## Preuves

- 7 septembre 2026 : les quatre variables de production sont configurées et relues comme Encrypted ; aucune clé administrative applicative.
- Site URL Supabase passée à https://bmad-crm.vercel.app, redirection exacte /reinitialiser ajoutée, local conservé, inscriptions désactivées et SMTP/template inchangés relus.
- Build de livraison Node 24 réussi sur copie isolée du HEAD 7219864 (même code applicatif que cette livraison hébergement), afin de garder le développement Contacts actif et son .next intact.
- Revue indépendante intermédiaire : attente explicite de la première réponse /api/session ajoutée à la recette afin de ne pas confondre le HTML SSR avec une session déjà revérifiée après hydratation.
- Scan des fichiers versionnés et historique : aucune valeur privée de bootstrap ni signature de clé privée détectée.
- Commit poussé et SHA origin/main relu : ca4a3aaa4faa3af0dfab02a25f3a324cb8476629. Vercel dpl_5AoWUNkr41BAoZzbsR2ifcSnVDus observé READY avec ce githubCommitSha ; alias canonique bmad-crm.vercel.app relu.
- `CRM_QA_ORIGIN=https://bmad-crm.vercel.app node scripts/verify-hosted.mjs` sous Node 24 : 36 contrôles PASS, exit 0 ; origine réelle, propriétaire/rechargement, refus HTML/RSC/API, clé falsifiée, autre compte, suppression fixture 404 relue, clavier et cinq formats. Captures desktop/iPhone relues visuellement par parent. Résultats ignorés : verification/1-3/hosted-results.json.
- Récupération HTTPS réellement reçue Gmail le 7 septembre à 17:23:27 UTC ; lien natif exact utilisé, destination HTTPS validée. Recette réelle exit0 : 18 contrôles PASS, changement/reconnexion, lien consommé et rejeu refusés, refresh révoqué. Mot de passe initial restauré et reconnexion navigateur finale confirmés. Preuves : verification/1-3/recovery/real-mail-results.json. Fichier temporaire de lien supprimé.
