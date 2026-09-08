---
title: 'Relier mes échanges à mes opportunités'
type: 'feature'
created: '2026-09-08'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-3-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/planning-artifacts/epics.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/planning-artifacts/epics-support/decisions-deleguees.md
---

<frozen-after-approval reason="human-owned intent — décisions déléguées et mandat du 8 septembre">

## Intent

Étendre le journal fiable de l’epic 2 pour enregistrer et corriger un échange lié à une opportunité avec ou sans contact, sans déplacer les historiques ni créer un second journal.

## Boundaries & Constraints

Échange : contact seul, opportunité seule ou les deux, jamais aucun des deux. Depuis opportunité, préremplir le lien opportunité, visible et modifiable ; le contact d’échange peut différer du principal sans le changer. Relation société historique indépendante : initialiser depuis société de l’opportunité si présente, sinon du contact, sinon vide ; modifiable/retirable explicitement. Une fois enregistrée, elle ne suit pas les changements de fiches ni une correction de contact/opportunité sans choix explicite de cette société.

Conserver Q3 : instant requis prérempli maintenant Paris, canal requis sans choix implicite Téléphone/E-mail/Visio/Autre, Notes facultatives, Ajouter/Enregistrer explicites. Stockage UTC, rendu Europe/Paris, futur refusé serveur, heure inexistante refusée, ambiguë exige occurrence/décalage. Corrections date/canal/notes/liens avec mêmes versions par champ et validation atomique de l’état final. Retirer le dernier contact/opportunité interdit même si deux commandes concurrentes tentent chacune de retirer un lien.

Historiques contact/opportunité/société historique, pages de 25 et compteurs globaux. Dernière interaction = instant d’échange, création puis UUID décroissants, calcul global indépendant des pages. Recalculer anciennes et nouvelles relations après ajout/correction de date/liens, y compris passage au vide ; Notes d’opportunité ne créent jamais d’échange ni de dernière interaction.

Migration additive compatible : anciens échanges contact seul restent valides et inchangés, reçus confirmés conservés/rejouables sans écriture ; préserver les versions d’API/RPC et brouillons existants ou prévoir adaptation explicitement contrôlée. Propriétaire authentique sur échange et chaque relation, RLS/RPC, reçus idempotents, cache privé et générations ; réponse perdue, conflit, expiration/reconnexion conservent saisie et versions d’origine. Revalidation après commit/focus/réseau sans nettoyage d’une génération récente.

Jamais : nouveau moteur d’échanges, suppression, déplacement historique implicite, changement du contact principal, API publique/intégration ou déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Liens | Contact seul, opportunité seule, les deux, aucun | Trois premiers valides, dernier refusé atomiquement | Aucune suppression implicite d’échange |
| Contexte | Opportunité avec principal A, échange contact B | Opportunité préliée ; B enregistré sans changer A | Chaque relation interdite/inexistante refusée |
| Société initiale | Opportunité société A/contact B, opportunité sans société, aucun contexte | A prioritaire ; sinon société contact ; sinon vide | Aucun lien inventé ou forcé |
| Histoire | Modifier ensuite employeur/société/principal ou lien échange | Société historique reste celle enregistrée sauf correction explicite | Aucun déplacement rétroactif |
| Retrait concurrent | Deux patches retirant chacun un des deux liens | Au moins un lien final garanti par verrou/contrainte | Second retrait refusé, aucune écriture partielle |
| Date/canal | Futur, heure Paris DST inexistante/ambiguë, canal vide | Règles 2.4/2.5 inchangées, choix ambigu explicite | Refus serveur/RPC avec saisie intacte |
| Projections | Corriger échange le plus récent, déplacer liens, >25 éléments égaux | Anciennes/nouvelles dernières interactions et pages exactes, même si vide | Ancien cache n’écrase pas le nouveau |
| Compatibilité | Ancien échange/reçu/brouillon contact seul | Toujours lisible ; retry confirmé sans mutation ni doublon | Commande non confirmée incompatible refusée/corrigeable, pas perdue |
| Notes | Modifier Notes d’opportunité | Aucun nouvel échange ou changement de dernière interaction | Sources de données distinctes |
| Fiabilité | Réponse perdue, génération récente, expiration, accès direct | Idempotence/propriétaire/conflits inchangés | Aucune fuite ni perte de brouillon |

</frozen-after-approval>

## Code Map

- Réels à la lecture : `lib/contacts.ts`, `lib/companies.ts`, `components/contacts/contact-editor.tsx`, `components/companies/company-editor.tsx`, caches/transports/brouillons Contacts/Sociétés et `lib/auth.ts`.
- Le journal 2.4/2.5 n’est pas encore présent dans l’instantané ; `spec-2-4-echanges.md` propose `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/`, `components/exchanges/`. Relire leurs implémentations finales et contrats de correction, reçus, brouillons, dates Paris et dernière interaction avant toute extension.
- À relire aussi : module Opportunité et panneau 3.1/3.2 proposés sous `lib/opportunities*` et `components/opportunities/`. Étendre le journal existant et insérer son historique/formulaire partagé dans le panneau, pas le réimplémenter.
- Migration proposée : lien facultatif Opportunité, adaptation de nullabilité contact et contrainte contact-ou-opportunité, contrôle privé des relations, projections et RPC compatibles. Revoir toutes les contraintes existantes après 2.5 ; aucun nom SQL fixé ici.
- UI réelle : `components/ui/{button,dialog,input,label,sheet,skeleton,textarea}.tsx`. Inventorier avant usage ; Context7/shadcn pour tout ajout nécessaire.

## Tasks & Acceptance

- [ ] Étendre schéma/contrats existants de manière additive et compatible, garantir au moins un lien dans tout état final et préserver reçus historiques.
- [ ] Partager formulaire/correction/historique et priorité de société initiale ; conserver lien historique après enregistrement sauf patch explicite.
- [ ] Invalider toutes anciennes/nouvelles projections et maxima globaux ; garder date Paris, pagination, versions, droits, brouillons/générations.
- [ ] Vérifier données/reçus antérieurs, trois combinaisons de liens, courses et incidents R2 ; revue indépendante avant clôture.

**AC1 :** Given opportunité et journal existant, When échange est créé, Then opportunité préremplie, contact seul/opportunité seule/les deux valides, aucun refusé, contact principal inchangé et Q3 respecté.

**AC2 :** Given contexte, When société historique est initialisée, Then opportunité prime puis contact puis vide ; correction explicite possible et modifications ultérieures des fiches ne déplacent rien.

**AC3 :** Given ajout/correction, When liens/date changent, Then projections anciennes/nouvelles se recalculent globalement ; retrait du dernier lien refusé atomiquement et relations privées protégées.

**AC4 :** Given échanges de l’epic 2, When migration compatible et R2 s’exécutent, Then données/brouillons/reçus/conflits/pages tiennent, Notes d’opportunité restent indépendantes sans nouvelle suppression/intégration.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni recette accomplie. Au dispatch vérifier 2.4/2.5 et 3.1/3.2 clôturées ; lire versions réelles avant de choisir compatibilité. TypeScript, tests ciblés contraintes/courses/permissions et reprise d’anciens reçus ; agent-browser sur trois combinaisons de liens, priorité de société et historiques après changement d’employeur. Vérifier DST Paris (29 mars 2026 02:30 inexistant, 25 octobre 2026 02:30 ambigu), futur serveur, maxima sur plusieurs pages et projections redevenant vides. Fixtures nominatives, empreintes avant/après et nettoyage exact, aucune donnée préexistante effacée ; un seul agent en mutation distante. Aucun build de développement ni déploiement frontend.
