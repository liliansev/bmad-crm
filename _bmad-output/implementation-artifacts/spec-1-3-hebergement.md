---
title: 'Utiliser le CRM depuis son URL hébergée'
type: 'feature'
created: '2026-09-07'
status: 'done'
route: 'dispatch'
baseline_commit: '7219864f281fa1aa3cb33360ff3bb1da75184bea'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-1-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/setup-1-3.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Ouvrir le POC privé depuis une URL HTTPS vérifiée, avant de livrer la création de contact. Lilian délègue toutes les décisions de réalisation jusqu’à cette première fonctionnalité. Déployer l’accès et la récupération existants sans nouveau service ni abonnement.

## Boundaries & Constraints

Toujours : cible Vercel/Supabase dédiée vérifiée, Node 24, garde propriétaire, secrets ignorés, variables d’origine distinctes local/hébergé, preuve de version et de parcours réel. Ne jamais déclarer une réception d’e-mail à partir d’un HTTP 200. Garder le serveur local utilisable.

Jamais : abonnement payant, domaine acheté, service SMTP supplémentaire, données métier réelles, nouvelle entité dans cette story, contournement de la protection Auth. Les contacts appartiennent à 2.1, préparée en parallèle dans des fichiers distincts.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat | Erreur |
|---|---|---|---|
| Livraison | Révision locale contrôlée, variables correctes | Ready, HTTPS, révision attendue | Corriger build avant annoncer livraison |
| Accès | Connexion propriétaire puis rechargement | Accueil privé persisté | Erreur honnête, aucun secret |
| Refus | Sans session, cookie falsifié, autre compte | HTML/RSC/API privés refusés | Aucun contenu métier exposé |
| Récupération | Demande puis vrai e-mail reçu | Lien vers URL hébergée, changement et reconnexion | Lien consommé/invalide refusé ; quota ne vaut pas réception |
| Présentation | Clavier, desktop/mobile/tablette | Saisie et états utilisables sans débordement | Signaler une limite mesurée |

</frozen-after-approval>

## Code Map

- `scripts/verify-auth.mjs` : référence de recette propriétaire/non-propriétaire avec fixtures nettoyées ; éviter duplication de toute la recette locale.
- `scripts/verify-recovery-real.mjs` : vrai lien, changement/restauration, rejet des tokens ; actuellement localhost et chemins de preuve fixes.
- `lib/env.ts`, `next.config.ts` : validation d’origine déjà stricte, headers privés ; aucune modification produit attendue.
- `.gitignore`, `package.json` : secrets et Node 24 déjà configurés.

## Tasks & Acceptance

- [x] `.vercelignore` : exclure secrets locaux, outils BMAD et sorties QA de l’upload, conserver source/lockfile/config utiles.
- [x] `scripts/verify-hosted.mjs` : recette paramétrée par origine HTTPS vérifiée, propriétaire/visiteur/falsifié/autre compte, réinitialisation invalide, cinq formats et clavier. Fixtures fictives, nettoyage dans finally, aucun secret en argv/logs. Prévoir exécution sur cible réelle par parent.
- [x] `scripts/verify-recovery-real.mjs` : permettre origine via variable de recette validée et preuve distincte hébergée, sans modifier le chemin local ni la garde de cible Supabase. Lire le lien exact reçu, ne pas fabriquer une preuve d’e-mail.
- [x] `README.md` : procédure courte de déploiement et variables, liens vers preuves, aucun secret.
- [x] `setup-1-3.md` : parent configure Vercel et allowlist Supabase, déploie, observe Ready/révision puis vérifie les parcours réels et réception ; consigne preuves et limites.

Acceptation : Given URL finale, When recette complète, Then aucun succès annoncé sans résultat observé ; les parcours locaux restent disponibles et les identifiants initiaux sont restaurés après récupération de recette.

## Implementation Notes

Mandat de poursuite et choix techniques déjà donné ; pas de question ouverte. Effets externes autorisés : nouveau projet gratuit dédié, variables, Git/déploiement et e-mail de recette ; aucun achat. Agent d’implémentation limité aux quatre fichiers scripts/config/README listés ; parent seul sur setup, distant et clôture. Aucun commit/push par sous-agent.

## Spec Change Log

## Review Triage Log

Revue indépendante réalisée avant livraison de l’hébergement : la recette attend désormais la vérification de session hydratée, au lieu de considérer le seul HTML SSR comme preuve d’accès. Aucun correctif hébergement en attente. Revue transversale finale du candidat Contacts consignée dans la spec 2.1.

## Verification

`npx tsc --noEmit` ; syntaxe scripts et checks ciblés ; build seulement pour livraison ; `node scripts/verify-hosted.mjs` sur HTTPS puis récupération reçue réellement avec script adapté. Pas de Playwright ni skill hors BMAD.

Preuves finales : `verification/1-3/hosted-results.json` (36 contrôles réussis), `verification/1-3/recovery/real-mail-results.json` (18 contrôles réussis, vrai e-mail Gmail). Déploiement `ca4a3aaa4faa3af0dfab02a25f3a324cb8476629` Ready, domaine HTTPS vérifié. Identifiants initiaux restaurés et connexion navigateur vérifiée après la récupération. Voir setup-1-3 pour la cible et les preuves détaillées.
