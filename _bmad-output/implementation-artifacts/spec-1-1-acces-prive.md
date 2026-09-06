---
title: '1.1 — Initialiser le CRM et son accès privé'
type: feature
created: 2026-09-06
status: done
route: dispatch
baseline_commit: 593bd46fe176280edd29bd564d3b9afbbed38898
review_loop_iteration: 0
story_key: 1-1-initialiser-le-projet-depuis-le-starter-et-ouvrir-mon-espace
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/setup-1-1.md'
---

<frozen-after-approval reason="Périmètre de story approuvé ; poursuite déléguée par Lilian">

## Intent

**Problem:** Le CRM ne contient que sa préparation. Lilian doit pouvoir ouvrir un espace privé avec son compte, sans inscription publique.

**Approach:** Adapter le starter officiel with-supabase à Next 15/Tailwind 4 ; connexion française et Accueil privé réellement protégés, dans le langage compact validé. Réaliser la story 1.1 uniquement.

## Boundaries & Constraints

**Always:** Skills BMAD uniquement. Outils Context7, CLI et agent-browser autorisés. TypeScript strict, Zod/RHF, shadcn via CLI, tokens UX existants. Auth Supabase réelle et propriétaire vérifié côté serveur par UUID privé sur chaque accès. Cookies rafraîchis correctement. Refus si configuration absente ; aucun secret privilégié dans l’application. Données fictives et projet dédié ; rester en local sur localhost:3000.

**Never:** Tables CRM futures, signup, invitation, déconnexion explicite, récupération e-mail (1.2), déploiement/push (1.3), autres services/skills. Pas de fausses tâches, navigation inactive ou éléments métier simulés. Pas de logs contenant identifiants de connexion, mots de passe ou tokens.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Connexion | Propriétaire, identifiants valides | Accueil privé ; session retrouvée après rechargement | Confirmation après identité réelle |
| Saisie | Adresse invalide ou champ vide | Erreurs près des champs, aucune tentative inutile | E-mail conservé |
| Identifiants | Mauvais mot de passe ou compte non propriétaire | Erreur neutre, aucun accès privé | Réessai possible, session non propriétaire refusée |
| Accès direct | Sans cookie, cookie falsifié ou expiré irréparable | Redirection connexion, aucune donnée privée dans HTML/RSC | Purge des caches/données visibles |
| Réseau | Connexion interrompue ou service indisponible | Erreur explicite et fin de l’attente | E-mail conservé, pas de faux succès |
| Session active | Expiration/perte de session au focus ou depuis un autre onglet | Masquer le contenu privé puis revenir à la connexion | Pas de brouillon métier à effacer, jamais de boucle |
| Clavier/tactile | Formulaire et Accueil | Labels, erreurs associées, focus et zéro débordement | Chargement stable |

</frozen-after-approval>

## Code Map

- `AGENTS.md` et contexte epic 1 : périmètre et garanties canoniques.
- `.local/starter/` : copie inspectée des fichiers du starter officiel figé ; adapter server/client/proxy et formulaire, ne pas reprendre le contenu public.
- `.env.local` : URL/clé publiable/UUID propriétaire réels configurés ; ne jamais imprimer son contenu. `.local/bootstrap-secrets.json` : secrets de vérification seulement, jamais importés dans l’app ni versionnés.
- Pas de package.json ou components/ui au départ. Node 24 et versions vérifiées dans setup-1-1.md.
- UX DESIGN.md dans planning-artifacts : palette et composants de référence, sans nouveau workflow design.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, lockfile, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.nvmrc`, `components.json` — initialiser depuis la référence inspectée, épingler le socle, installer les composants shadcn réellement utilisés. Pas de dependency métier future.
- [x] `lib/env.ts`, `lib/validations/auth.ts`, `lib/supabase/{server,client,middleware}.ts`, `lib/auth.ts`, `middleware.ts` — Zod aux frontières, clients par requête, getUser authentique + UUID propriétaire, refresh cookies propagés même sur redirection, données privées non cachées.
- [x] `app/(auth)/connexion/page.tsx`, `components/auth/login-form.tsx`, `app/actions/auth.ts` — RHF et Zod, erreurs typées, bouton en attente, authentification réelle, retour privé uniquement pour propriétaire ; aucune valeur sensible renvoyée dans l’état d’action.
- [x] `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx`, `app/(dashboard)/{layout,page,loading}.tsx`, `components/auth/session-guard.tsx`, `app/api/session/route.ts` — Accueil sobre avec seule navigation livrée, contrôle session côté serveur et purge visuelle sur perte ; API interne sans donnée sensible, aucune API publique métier.
- [x] `.env.example`, `README.md`, `scripts/verify-auth.mjs` — configuration sans secret, provenance starter et commandes Node 24 ; vérification réelle de chaque ligne de matrice. Créer puis retirer le compte non propriétaire temporaire uniquement sur le projet dédié, sans envoyer d’e-mail.
- [x] `verification/` sous implementation-artifacts — contrôle TypeScript, sorties de vérification sans secrets, screenshots desktop/tactile et examen des captures réelles ; garder pnpm dev actif.

**Acceptance Criteria:**
- Given le socle installé, when pnpm dev démarre avec Node 24, then localhost:3000 sert une application française et seul le propriétaire atteint Accueil.
- Given le formulaire et les routes protégées, when chaque scénario de matrice est exercé réellement, then les résultats sont enregistrés avec preuves et sans secret ; aucune case non testée n’est déclarée passée.
- Given une configuration manquante/invalide, when l’application démarre, then elle refuse explicitement au lieu de rendre l’accueil public.
- Given le code livré, when le contrôle TypeScript et la revue indépendante BMAD sont exécutés, then les erreurs et failles sont corrigées avant clôture.

## Implementation Notes

- Périmètre approuvé par les validations de la story et « ok continue ». La délégation remplace le menu documentaire supplémentaire ; Q7 pour la connexion locale est vérifié dans setup-1-1.md. Seul le déploiement Vercel reste hors story. Aucun secret dans cette spécification.

## Spec Change Log

## Review Triage Log

| ID | Verdict | Preuve et route |
|---|---|---|
| B1 | medium | Le timer appelle check qui masque tout le shell, même avec une session valide : interruption répétée et focus perdu. Patch : contrôle périodique discret. |
| B2 | medium | hide au changement de visibilité ne périme pas la génération ; une réponse positive en vol peut retirer hidden. Patch commun avec E1. |
| B3 | medium | Layout et page appellent requireOwner et créent chacun un client ; trois appels Auth par rendu avec middleware. Patch : déduplication React limitée à la requête pour le rendu. |
| B4 | medium | Le délai client de 10 s est inférieur aux deux appels Auth successifs potentiellement valides dans middleware puis API. Patch : ajuster le délai global au parcours réel. |
| B5 | medium | Le finally assimile toute erreur de getUserById à une absence. Patch : exiger le code user_not_found confirmé. |
| B6 | medium | Le test adaptateur 503 ne traverse ni le message de login ni le statut de session ; la limite est honnêtement déclarée mais cette branche reste sans couverture. Patch commun avec V2. |
| B7 | medium | La fixture non propriétaire traverse HTML et formulaire, sans assertion API ou RSC. Patch de tests : exercer ces deux frontières existantes. |
| B8 | low | Le JWT reste signé valide ; expires_at déclenche réellement le refresh, sans prouver une expiration signée. Patch direct du libellé de preuve pour nommer précisément le scénario ; aucune promesse de jeton signé expiré. |
| B9 | medium | Le test mauvais identifiants utilise une adresse absente. Patch : ajouter le propriétaire avec mot de passe erroné et vérifier son effacement. |
| B10 | medium | Le squelette du garde retire la colonne de 208 px et celui de route diffère de la carte finale ; le chargement n’est pas stable. Patch : reprendre les dimensions de la composition livrée. |
| E1 | medium | La réponse en vol ne vérifie ni leaving ni la visibilité ; après SIGNED_OUT, elle peut rendre de nouveau visible le shell avant navigation. Patch avec B2 : invalider/annuler et garder ces conditions avant affichage. |
| E2 | medium | login(input) ne comporte aucune borne côté formulaire ; un transport bloqué maintient le bouton désactivé et le mot de passe en mémoire. Patch : délai borné, erreur et effacement, sans succès tardif. |
| E3 | medium | Même fausse preuve de suppression que B5, confirmée à la lecture du finally. Patch commun. |
| V1 | medium | Lacune pré-vérifiée : l’essai inter-onglets n’observe que la navigation finale, jamais le masquage pendant attente. Patch : retarder la réponse de contrôle et observer immédiatement hidden. |
| V2 | medium | Lacune pré-vérifiée : seule la fonction authFetch est testée pour l’indisponibilité fournisseur. Patch : environnement de test isolé, sans secrets réels, traversant action et API de session. |

Tous les constats sont traités par corrections locales des chemins existants ou de leur vérification, sans ajout de parcours public ni changement de l’intention approuvée. Aucun report, aucune nouvelle décision produit.

## Verification

**Commands:**
- `pnpm dev` sous Node 24 — serveur maintenu actif, pas de pnpm build pendant dev.
- `pnpm exec tsc --noEmit` — zéro erreur.
- `node scripts/verify-auth.mjs` — matrice exercée sur l’application et Supabase réels via fetch/agent-browser, aucune réinstallation Playwright.
- `agent-browser --help` — documentation CLI de vérification, aucun skill non BMAD.

**Contrôle avant revue :** 32 résultats positifs dans la matrice réelle du 6 septembre 2026, TypeScript sans erreur (exécution indépendante également), captures Connexion/Accueil examinées. Les sept lignes de matrice ont une couverture exécutée. La panne navigateur est exercée de bout en bout ; la panne du fournisseur est exercée sur l’adaptateur réseau, sans interrompre Supabase. Revue indépendante en cours.


**Clôture après revue :** les 15 constats sont résolus (corrections locales et preuves précisées), aucun report. La matrice complète a été réexécutée par l’agent principal après correction : **52 résultats réussis**, sortie 0, TypeScript sans erreur. Le fournisseur indisponible traverse désormais l’action login et l’API de session dans une copie locale isolée utilisant exclusivement une configuration fictive. La fixture Auth est supprimée puis son absence confirmée par user_not_found/404. Le serveur principal reste actif.

| Ligne de matrice | Preuves exécutées après correction |
|---|---|
| Connexion | Formulaire propriétaire, accueil autorisé, rechargement, refresh réel déclenché par expiration locale |
| Saisie | Champs vides, e-mail invalide, focus, aucun POST, e-mail conservé |
| Identifiants | Mauvais mot de passe propriétaire effacé, compte non propriétaire refusé par formulaire/HTML/RSC/API |
| Accès direct | Sans cookie, cookie falsifié, refresh irréparable, redirection et purge |
| Réseau | Navigateur hors ligne, transport bloqué 45 s et réponse tardive, fournisseur HTTPS indisponible via action et API |
| Session active | Masquage immédiat, dimensions conservées, réponse périmée après visibilité/SIGNED_OUT, contrôle périodique sans disparition |
| Clavier/tactile | Navigation clavier, 5 dimensions, cibles 44 px et saisies 16 px, axe connexion sans violation, captures examinées |

Résultats détaillés : [results.json](verification/1-1/results.json). Captures locales ignorées par Git ; essais Chromium à dimensions mobiles/tablettes, pas de validation physique Safari. Le JWT de la preuve de refresh reste signé valide : seule son expiration locale est forcée. Aucune mise en ligne effectuée.
