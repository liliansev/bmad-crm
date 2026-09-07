---
title: 'Récupérer mon accès par e-mail'
type: 'feature'
created: '2026-09-07'
status: 'done'
baseline_commit: 'a4c66662cba6846908cd977f45f577c38d4c95da'
route: 'dispatch'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-1-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/setup-1-2.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Permettre au propriétaire de demander un e-mail depuis « Mot de passe oublié », choisir un nouveau mot de passe avec son lien et se reconnecter. La connexion fonctionne déjà ; cette story complète la récupération locale validée dans l’epic 1.

## Boundaries & Constraints

**Toujours :** français compact, identité Supabase authentique et UUID propriétaire côté serveur, réponse de demande neutre, erreurs honnêtes, attente bornée, email conservé et mots de passe effacés après tentative. Une session ordinaire ne remplace jamais le lien de récupération.

**Jamais :** inscription, déconnexion visible, table métier, service payant, déploiement, secret dans les journaux ou stockage navigateur. Aucun changement de politique Supabase (minimum actuel : 6 caractères).

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Erreur |
|---|---|---|---|
| Parcours réel | E-mail propriétaire, lien reçu, mot de passe conforme | Changement effectif puis reconnexion ; ancien mot de passe refusé | Aucun succès avant confirmation serveur |
| Confidentialité | Adresse inconnue valide | Même réponse neutre que propriétaire | Aucune existence de compte révélée |
| Validation | Email invalide, mot de passe court ou confirmation différente | Erreur associée au champ, aucun appel Auth | Correction possible |
| Lien interdit | Absent, invalide, expiré, consommé ou autre utilisateur ; même navigateur propriétaire connecté | Aucun changement ni nouvelle session CRM | Demander un nouveau lien |
| Service défaillant | Réseau coupé, Auth indisponible ou quota d’envoi | Échec explicite, attente bornée, réessai | Ne pas annoncer réception ni changement |
| Non-régression | Visiteur ou session non propriétaire | CRM toujours inaccessible | Garde existante conservée |

</frozen-after-approval>

## Code Map

- `lib/supabase/{server,fetch,middleware}.ts` : réutiliser fetch borné ; conserver garde SSR, allowlist exacte des nouvelles pages.
- `lib/validations/auth.ts`, `lib/env.ts` : Zod et origine de retour fixe validée.
- `components/auth/login-form.tsx`, `app/(auth)/connexion/page.tsx` : formulaire et composition existants ; shadcn déjà installé.
- `scripts/verify-auth.mjs` : recette réelle, fixtures temporaires nettoyées, Node 24 et agent-browser ; ne jamais employer Playwright.

## Tasks & Acceptance

**Execution :**
- [x] `lib/validations/recovery.ts`, `lib/supabase/recovery.ts`, `app/actions/recovery.ts` : demande et mutation isolées, validation et contrôle propriétaire, sans donner une session CRM avant reconnexion.
- [x] `lib/env.ts`, `.env.example`, `lib/supabase/middleware.ts` : valider origine applicative et autoriser seulement les routes nécessaires.
- [x] `app/(auth)/mot-de-passe-oublie/`, `app/(auth)/reinitialiser/`, `components/auth/` : formulaires accessibles, lien depuis connexion, états complets et nettoyage du secret d’URL.
- [x] `scripts/verify-recovery.mjs` : tests ciblés des frontières et recette réelle couvrant chaque ligne de matrice ; conserver les contrôles 1.1 pertinents.
- [x] `setup-1-2.md` : consigner configuration et preuves de réception/changement/reconnexion sans secrets ; configuration distante et e-mail réel coordonnés par l’agent principal.

**Acceptance :** navigation clavier et absence de débordement aux cinq formats de l’epic ; TypeScript propre ; preuve de réception réelle requise avant clôture. Aucun ajout de dépendance sans nécessité.

## Implementation Notes

Autorisation : validations de l’epic et délégation antérieures, puis « ok letsgo » pour cette story ; aucune question d’intention restante. Effets externes : origine de retour réversible, e-mail réel, changement de mot de passe de recette à restaurer ensuite. Empreinte : formulaires, actions, configuration et recette Auth uniquement.

- Implémentation : client Auth isolé, formulaires natifs français, origine validée, allowlist exacte, aucune dépendance nouvelle.
- Vérification parent : TypeScript propre, 63 contrôles ciblés exécutés, 13 assertions du parcours reçu par Gmail ; contrôles réels visiteur/non-propriétaire HTML/RSC/API et reconnexion 1.1 passés. Captures desktop/mobile relues. Expiration JWT/AMR testée par horloge de fixture ; lien consommé testé réellement.

- Après revue : correctifs appliqués et relus ; 68 contrôles ciblés et recette supplémentaire avec rejeu des tokens passent ; mot de passe initial restauré puis reconnexion navigateur vérifiée. Le contrôle initial Gmail complet reste distinct de la recette complémentaire administrateur sans e-mail. Une limite préexistante Supabase reportée.

## Spec Change Log

- 7 septembre : template personnalisé refusé par Supabase gratuit. Transport remplacé par le fragment implicit natif ; intention et matrice inchangées. Conserver UI, validation et garde propriétaire.

## Review Triage Log

| Source | Verdict | Preuve et suite |
|---|---|---|
| Blind 1 | medium | Le SDK retourne error et retire sa session mémoire même sur 503 ; résultat ignoré confirmé. Patch : révocation avec bearer retenu, reprise bornée et état honnête si nettoyage non confirmé. |
| Blind 2 | low | same_password est un refus certain, actuellement message incertain. Patch de libellé précis ; réessai via connexion ou nouveau lien, sans réexposer de tokens. |
| Blind 3 | medium | Messages réseau ne proposent que nouvel e-mail malgré mutation potentiellement effective ; retour connexion existe mais message incomplet. Patch de texte. |
| Blind 4 | medium | Recover Supabase retourne 200 pour compte absent avant sendPasswordRecovery ; erreurs d’envoi peuvent distinguer une adresse. Préexistant dans l’API publique Supabase déjà exposée par la clé anonyme en 1.1 ; report documenté, pas d’infrastructure ni de succès d’envoi inventé. |
| Blind 5 | low | Fragment conservé jusqu’au montage si hydratation retardée ; aucun référent ne contient le fragment, aucun script tiers. Rejet : panne de chargement exceptionnelle, bootstrap parallèle plus complexe qu’une correction directe. |
| Blind 6 | medium | Le test ne capture que pathname ; une mauvaise destination passerait. Patch assertion de query exacte. |
| Blind 7 | medium | URL native consommée testée, mais pas rejeu des tokens après action. Patch recette avec capture mémoire et refus réel. |
| Blind 8 | medium | writeFile peut court-circuiter suppression et fermeture, préparation avant try également. Patch finally imbriqué et préparation protégée. |
| Edge 1 | medium | Même défaut vérifié que Blind 1 ; patch commun révocation. |
| Edge 2 | low | Un second fragment pendant submit est perdu ; succès et retour connexion ou échec avec nouveau lien restent disponibles. Rejet de mise en file : cas exceptionnel, complexité supplémentaire non justifiée. |
| Edge 3 | medium | Même défaut vérifié que Blind 6 ; patch commun assertion redirect_to. |
| Edge 4 | medium | Même défaut vérifié que Blind 8 ; patch commun nettoyage indépendant. |
| Verification 1 | medium | Gap pré-vérifié : destination HTTP non observée. Patch commun Blind 6. |
| Verification 2 | medium | Gap pré-vérifié : scope=others ne serait pas détecté. Patch scope exact et refus réel des tokens. |

Groupes : révocation et preuve (Blind 1/7, Edge 1, Verification 2) ; messages (Blind 2/3) ; assertion destination (Blind 6, Edge 3, Verification 1) ; nettoyage recette (Blind 8, Edge 4). Tous patch, aucun nouveau contrat public. Limite fournisseur préexistante reportée ; deux améliorations exceptionnelles rejetées.

## Design Notes

Contrainte distante constatée : le plan gratuit refuse les templates personnalisés. Conserver ConfirmationURL natif et flow implicit. Supabase vérifie le lien puis redirige sur `/reinitialiser` avec access_token, refresh_token et type=recovery dans le fragment. Retirer immédiatement le fragment, garder les secrets seulement en mémoire. La mutation isolée valide getUser(access_token), UUID et les claims AMR otp/recovery frais (≤ une heure) du JWT ainsi authentifié ; elle force refreshSession, revérifie identité et même session_id avant updateUser. Une session password, même marquée type=recovery côté client, est refusée. Révoquer la session temporaire après traitement. Le fournisseur consomme le lien ; réutilisation, session révoquée et rechargement sans fragment demandent un nouveau lien. Voir setup pour observations live et traitement des erreurs ambiguës.

## Verification

- `npx tsc --noEmit` sous Node 24.
- `node scripts/verify-recovery.mjs` et contrôles Auth pertinents ; API réellement exercée et navigation agent-browser, sans build ni push pendant développement.
