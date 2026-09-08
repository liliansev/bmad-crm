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
- Journal 2.4/2.5 livré aux commits `33bc0cb` et `a49853d` : `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `lib/exchange-date.ts`, `lib/exchanges-drafts.ts`, `lib/exchanges-transport.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/`, `components/exchanges/{exchange-editor,exchange-update-editor,exchange-history}.tsx`. Relire contrats create/update, reçus, brouillons, dates Paris et dernière interaction avant extension. Migrations appliquées `20260908210000_exchanges.sql`, `20260908211000_exchanges_strict_time.sql`, `20260908212000_exchanges_read_names.sql`, `20260908220000_exchange_update.sql` : ne pas les réécrire/rejouer. Les recettes `scripts/verify-exchanges-{dates,db,read-names,transport,ui}.mjs` et `verify-exchanges-update-{contract,db,transport,ui,review-ui}.mjs` fournissent les acquis à préserver ; fixtures/nettoyage par `scripts/exchanges-qa-cleanup.mjs`.
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

Points de compatibilité identifiés pendant 2.5, à confronter à sa version finale : `exchange_create_command_v1` est désormais une fonction interne dont les droits directs authenticated sont retirés ; `exchange_command` est le passage public commun create/update avec une table de reçus. Étendre ce passage sans permettre d’ancien contournement et sans modifier les reçus confirmés. Les métadonnées/propriétés nouvelles dans les DTO historiques doivent rester optionnelles pour relire un ancien reçu sans le réécrire ou injecter artificiellement un champ dans sa réponse. Toute version nécessaire à une nouvelle correction vient de la relecture actuelle, jamais d’un reçu ancien enrichi a posteriori.

Relire notamment les jointures de `exchange_read`, `exchanges_read` et `contacts_last_interactions` : une jointure Contact devenue facultative ne doit pas faire disparaître un échange opportunité seule des lectures/projections. L’état final complet contact/opportunité doit être validé sous le verrou échange, même pour deux patches de champs indépendants retirant chacun un lien. Le refus du deuxième ne modifie aucun autre champ.

Conserver les correctifs de génération2.5 : une modification faite pendant commande ne doit pas reprendre implicitement la version d’une modification distante intervenue entre commit et relecture. En conflit, le choix mine reste honoré même si la valeur locale a été remise à sa base initiale. Préserver l’abandon/busy, les échecs de stockage et les associations de focus sur les trois panneaux.


### Compatibilité vérifiée sur les contrats2.5/3.1

- Distinguer DTO courant complet et reçu historique : les anciennes réponses/pending peuvent omettre `opportunity_id` et sa version. Les accepter à la lecture compatible, conserver commande/clé/empreinte exactes, puis exiger une lecture actuelle avant une nouvelle correction. Initialiser la version du lien ajouté à1 pour les lignes existantes sans augmenter leur révision métier ni modifier les reçus. Adapter les nouveaux brouillons depuis cette lecture ; préserver versions et générations des anciens champs dirty/pending, sans rebase global silencieux.
- Le verrou actuel de `exchange_command` est commande puis échange FOR UPDATE. Calculer sous ce dernier les deux relations finales depuis les clés réellement présentes et l'état verrouillé ; refuser contact+opportunité tous deux nuls avant écriture du patch entier. Ajouter CHECK SQL et FK composite propriétaire/opportunité. Un deuxième retrait concurrent peut être un refus métier malgré une version individuelle valide : conserver le brouillon, aucun patch partiel. Traiter check_violation dans le résultat métier approprié, sans masquer une panne comme succès.
- RPC existante : `exchanges_read(uuid,uuid,integer)` avec paramètres par défaut. Ne pas créer une surcharge ambiguë à quatre paramètres par défaut. Une projection explicitement versionnée avec wrapper ancien est possible ; choisir un contrat sans ambiguïté acceptant exactement un contexte parmi contact/société/opportunité. Mettre à jour service, transport et API ensemble, conserver les clients historiques valides.
- Transformer les INNER JOIN Contact des lectures simples/pages en jointures facultatives. Filtrer les valeurs nulles des `affected.contact_ids`, produire `[]` et ajouter anciennes/nouvelles opportunity_ids ; DTO toujours UUID uniquement. L'historique ne fabrique jamais de lien `/contacts?panel=null`. Filtrage Société sur exchange.company_id historique, jamais sur l'employeur actuel ou la société actuelle de l'affaire. Tri des échanges occurred_at/created_at/id DESC inchangé.
- Création actuelle exige contactId et clé de brouillon par contact. Introduire une identité stable distincte pour un nouveau contexte Opportunité, lire les anciennes clés, et ne pas changer la clé lorsqu'un lien saisi change. Préremplir société uniquement sur brouillon neuf intact ; jamais écraser un choix explicite ou une reprise. Composer les handles de création/correction d'échange avec la garde Opportunité avant fermeture/navigation : le blur d'une opportunité n'enregistre jamais implicitement un nouvel échange.

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni recette accomplie. Au dispatch vérifier 2.4/2.5 et 3.1/3.2 clôturées ; lire versions réelles avant de choisir compatibilité. TypeScript, tests ciblés contraintes/courses/permissions et reprise d’anciens reçus ; agent-browser sur trois combinaisons de liens, priorité de société et historiques après changement d’employeur. Vérifier DST Paris (29 mars 2026 02:30 inexistant, 25 octobre 2026 02:30 ambigu), futur serveur, maxima sur plusieurs pages et projections redevenant vides. Fixtures nominatives, empreintes avant/après et nettoyage exact, aucune donnée préexistante effacée ; un seul agent en mutation distante. Aucun build de développement ni déploiement frontend.
