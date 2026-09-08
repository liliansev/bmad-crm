---
title: 'Enregistrer un échange et retrouver la dernière interaction'
type: 'feature'
created: '2026-09-08'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-2-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
---

<frozen-after-approval reason="human-owned intent — décisions déléguées et mandat du 8 septembre">

## Intent

Enregistrer un échange réel depuis un contact et consulter les historiques du contact et de sa société historique. Afficher la dernière interaction calculée globalement, sans confondre échanges datés et notes libres.

## Boundaries & Constraints

Toujours : contact requis à cette livraison ; date/heure requise, initialisée à maintenant Europe/Paris ; canal explicitement choisi parmi Téléphone/E-mail/Visio/Autre ; notes facultatives. Société historique facultative, initialisée depuis le contact, modifiable ou retirable ; elle est stockée indépendamment du lien actuel. Horodatages UTC, rendu Paris. Tri unique : instant, création, UUID décroissants ; pagination 25 et totaux globaux.

Session propriétaire authentique, validation Zod et RPC, RLS, commande idempotente, brouillon et générations préservés. Ajouter/Annuler, fermeture Enregistrer/Abandonner/Continuer. Aucun succès avant confirmation. Aucune perte de saisie sur revalidation ou reconnexion.

Jamais : futur accepté, canal implicite, suppression, connecteur, opportunité requise ou schéma Opportunité. Aucune migration rétroactive des échanges lors d’un changement d’employeur. Déploiement et refactorisation finale restent pour BMAD 06.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Création | Contact, date/canal, notes | Un échange relu avec ses valeurs | Saisie conservée |
| Paris | Heure locale inexistante ou ambiguë | Inexistante refusée ; ambiguë exige occurrence/décalage UTC | Aucune normalisation silencieuse |
| Date | Instant futur, date invalide | Refus serveur même par RPC directe | Erreur date ciblée |
| Histoire | Société A enregistrée, contact déplacé vers B | Échange reste dans A et contact | Aucun déplacement automatique |
| Reprise | Réponse perdue, génération plus récente | Même commande, un échange, nouvelle saisie conservée | Reconnexion du même propriétaire |
| Projection | Égalités, plusieurs pages, zéro échange | Maximum global stable ou vrai vide | Pas de date issue des notes |

</frozen-after-approval>

## Code Map

- Frontière middleware : `lib/supabase/middleware.ts` classe les API privées par préfixes contacts/companies. Ajouter exchanges explicitement afin que session expirée retourne JSON 401/403 au lieu de rediriger HTML.
- Existants : `lib/contacts.ts` (`contactsClient`, lectures), `lib/contacts-drafts.ts`, `lib/contacts-cache.ts`, `lib/contacts-transport.ts` ; préserver leurs contrats v1/v2 et reçus.
- Existants : `components/contacts/contact-editor.tsx`, `contacts-shell.tsx` ; intégrer Échanges et Dernière interaction à la position UX approuvée.
- Sociétés 2.3 : `lib/companies.ts` fournit readCompanies/readCompany/readCompanyContacts/readContactCompany ; `lib/companies-transport.ts` les lectures navigateur typées et bornées. `components/companies/companies-shell.tsx` contient CompanyContacts. `lib/companies-drafts.ts` montre pending immuable et génération, `lib/companies-cache.ts` le cache isolé. Réutiliser les lectures ; un brouillon Échange propre est nécessaire, sans refactoriser les éditeurs historiques.
- Nouveaux proposés : `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/`, `components/exchanges/`, migration additive et recette `scripts/verify-exchanges*.mjs`.

## Tasks & Acceptance

- [ ] `supabase/migrations/*_exchanges.sql`, `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/` : introduire Échange, versions/révision, reçu transactionnel, relations privées et lectures/projections globales sécurisées.
- [ ] `lib/exchange-date.ts` et `lib/validations/exchanges.ts` : partager résolution Paris/DST et validation de date ; confronter l’instant au temps serveur. Borner textes et transport avec les conventions existantes.
- [ ] `components/exchanges/`, `lib/exchanges-{drafts,transport}.ts`, `components/contacts/contacts-shell.tsx`, `components/contacts/contact-editor.tsx` et `components/companies/companies-shell.tsx` : livrer formulaire, historiques paginés et projections ; invalider contact et société historique seulement après commit, au focus/reconnexion également.
- [ ] `scripts/verify-exchanges-{db,transport,ui}.mjs` et nettoyage dédié : tester la matrice, droits directs, reprise, intégrité historique et clavier ; revue indépendante avant clôture.

**AC :** Given un contact existant, When Ajouter confirme l’échange, Then contact/date/canal/notes et société historique sont relus identiquement. Given un changement d’employeur, When les historiques sont rechargés, Then l’échange reste dans sa société enregistrée. Given plus de 25 échanges et des dates égales, When toute page est ouverte, Then la dernière interaction conserve le même maximum global. Given une session expirée ou réponse perdue, When la commande reprend, Then aucun doublon ni perte de génération récente. Given un visiteur ou une relation interdite, When HTTP/RPC est appelé directement, Then aucune lecture ou mutation autorisée n’a lieu.

## Implementation Notes

Le parent confirme 2.3 terminée avant dispatch. Implémentation déléguée complète de cette seule story, sans commit ni domaine futur. Migration additive autorisée sur bmad-crm / Persos / free, référence otadrkhrjxafutocstzo : revérifier via `.local/verify-story-target.py` avant mutation, puis créneau DB exclusif accordé à cet agent. Secrets `.local` jamais en sortie. Recettes fixtures via les helpers `scripts/companies-qa-cleanup.mjs`, `scripts/crm-qa-browser.mjs` et patrons de sécurité existants ; créer un nettoyage exact adapté aux échanges. Vérifier la provenance de chaque ID avant effacement. Garder dev actif localhost:3000, Node24 via PATH local configuré. Context7 avant usage bibliothèques, aucun skill non-BMAD. Ne pas ajouter de dépendance pour résoudre Paris si Intl suffit. Pour occurrence DST, comparer les instants candidats aux composants locaux exacts ; pas de parsing Date qui normalise silencieusement. Canal stocké enum stable, libellé français. Notes max 20000 points de code comme contacts, refus NUL/UTF16 invalide. Les lectures de dernière interaction doivent être calculées en base globalement et ne jamais écraser un reçu contact existant.

## Spec Change Log

## Review Triage Log

## Verification

Au dispatch, relire le code 2.3 terminé avant de fixer les interfaces ; vérifier sa clôture. TypeScript Node 24, tests dates réelles Paris (29 mars 2026 02:30 inexistant ; 25 octobre 2026 02:30 ambigu), bornes et RPC ; agent-browser réel et captures inspectées. Fixtures nominatives, empreintes avant/après, nettoyage exact, un seul agent en mutation distante. Mesures de fluidité documentées ; aucun build de développement ni déploiement.
