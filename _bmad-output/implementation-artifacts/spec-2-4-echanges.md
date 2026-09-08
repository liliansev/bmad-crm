---
title: 'Enregistrer un échange et retrouver la dernière interaction'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
baseline_commit: '8a39e58ad9d210d4cdf3e97bfdeefe541cd5313f'
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

- [x] `supabase/migrations/*_exchanges.sql`, `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/` : introduire Échange, versions/révision, reçu transactionnel, relations privées et lectures/projections globales sécurisées.
- [x] `lib/exchange-date.ts` et `lib/validations/exchanges.ts` : partager résolution Paris/DST et validation de date ; confronter l’instant au temps serveur. Borner textes et transport avec les conventions existantes.
- [x] `components/exchanges/`, `lib/exchanges-{drafts,transport}.ts`, `components/contacts/contacts-shell.tsx`, `components/contacts/contact-editor.tsx` et `components/companies/companies-shell.tsx` : livrer formulaire, historiques paginés et projections ; invalider contact et société historique seulement après commit, au focus/reconnexion également.
- [x] `scripts/verify-exchanges-{db,transport,ui}.mjs` et nettoyage dédié : tester la matrice, droits directs, reprise, intégrité historique et clavier ; revue indépendante avant clôture.

**AC :** Given un contact existant, When Ajouter confirme l’échange, Then contact/date/canal/notes et société historique sont relus identiquement. Given un changement d’employeur, When les historiques sont rechargés, Then l’échange reste dans sa société enregistrée. Given plus de 25 échanges et des dates égales, When toute page est ouverte, Then la dernière interaction conserve le même maximum global. Given une session expirée ou réponse perdue, When la commande reprend, Then aucun doublon ni perte de génération récente. Given un visiteur ou une relation interdite, When HTTP/RPC est appelé directement, Then aucune lecture ou mutation autorisée n’a lieu.

## Implementation Notes

Le parent confirme 2.3 terminée avant dispatch. Implémentation déléguée complète de cette seule story, sans commit ni domaine futur. Migration additive autorisée sur bmad-crm / Persos / free, référence otadrkhrjxafutocstzo : revérifier via `.local/verify-story-target.py` avant mutation, puis créneau DB exclusif accordé à cet agent. Secrets `.local` jamais en sortie. Recettes fixtures via les helpers `scripts/companies-qa-cleanup.mjs`, `scripts/crm-qa-browser.mjs` et patrons de sécurité existants ; créer un nettoyage exact adapté aux échanges. Vérifier la provenance de chaque ID avant effacement. Garder dev actif localhost:3000, Node24 via PATH local configuré. Context7 avant usage bibliothèques, aucun skill non-BMAD. Ne pas ajouter de dépendance pour résoudre Paris si Intl suffit. Pour occurrence DST, comparer les instants candidats aux composants locaux exacts ; pas de parsing Date qui normalise silencieusement. Canal stocké enum stable, libellé français. Notes max 20000 points de code comme contacts, refus NUL/UTF16 invalide. Les lectures de dernière interaction doivent être calculées en base globalement et ne jamais écraser un reçu contact existant.

## Spec Change Log

## Review Triage Log

## Verification

Au dispatch, relire le code 2.3 terminé avant de fixer les interfaces ; vérifier sa clôture. TypeScript Node 24, tests dates réelles Paris (29 mars 2026 02:30 inexistant ; 25 octobre 2026 02:30 ambigu), bornes et RPC ; agent-browser réel et captures inspectées. Fixtures nominatives, empreintes avant/après, nettoyage exact, un seul agent en mutation distante. Mesures de fluidité documentées ; aucun build de développement ni déploiement.

### Implémentation et contrôles préparatoires

Contrats finaux : `lib/validations/exchanges.ts`, dates Paris dans `lib/exchange-date.ts`, RPC exchange_command/exchanges_read/contacts_last_interactions ; formulaire et historique sous `components/exchanges/`. Migration principale `20260908210000` et durcissement dates `20260908211000`, après Sociétés. Premier essai de migration a rollback faute de contrainte unique owner/id Contact ; contrainte additive ajoutée avant application réussie. Aucun SQL futur ni déploiement. Renommage des fichiers avant commit pour ordre de reconstruction correct, aucun corps appliqué réécrit après coup.

Contrôles parent avant revue : date PostgreSQL 24:00 et secondes 60 normalisées malgré syntaxe ISO → refus strict par patch additif et tests réels ; résolution Paris historique → offsets Intl avec secondes exactes ; validation Contact avant création Échange lors de fermeture, message de confirmation partielle, revalidation du nom historique sélectionné et gardes de fermeture. Recette DB : finaliseurs indépendants, preuve success explicite et nettoyage répété idempotent (absence vérifiée, jamais suppression sans provenance).

À cet instant, dernière recette DB : 30 contrôles réussis, empreintes préexistantes inchangées et 28 échanges fictifs supprimés. Dates/Unicode/DST passés,12 contrôles de transport passés. Dernière UI : 43 assertions réussies, y compris colonne Contact vide puis dernière date confirmée avant/après rechargement. Captures finales ordinateur, téléphone et tablette inspectées. Aucune série de 20 essais de performance sur ce domaine encore, regroupés au bilan V1.

Matrice auditée avant revue : création → DB canonique + UI ; Paris → tests réels gap/overlap et UI ; date → DB futur/civil invalide + UI refus ; histoire → DB et UI société A après employeur B ; reprise → transport et UI perte/réessai/génération/reconnexion ; projection → DB ordre/pages/max global + UI page2 et colonne Contacts. Toutes les recettes citées ont été exécutées avec succès.

### Revue indépendante — triage individuel

Trois couches exécutées, troisième lancée dès libération du slot disponible ; aucun résultat traité avant réception des trois couches. Aucun défaut de règles métier ou d’autorisation DB détecté ; corrections de coordination UI et vérification ci-dessous.

| Avis | Verdict | Preuve / route |
|---|---|---|
| B1 abandon pendant sauvegarde échange | medium | Le parent ne connaît que son saving ; discard enfant refuse puis parent ferme. Exposer busy et bloquer le départ pendant cette requête. Patch. |
| B2 confirmation après démontage ignorée | medium | Le départ prématuré B1 provoque ce résultat ; regroupé avec B1 pour empêcher ce démontage dans le parcours applicatif. Reload explicite reste couvert par reçu/reprise. |
| B3 retry remplace mémoire par ancien storage | medium | L’effet dépend de retry et relit le brouillon ; stockage défaillant peut laisser une génération ancienne. Séparer récupération initiale et lecture réseau. Patch. |
| B4 destination historique persistante après échec | medium | onCancelClose nettoie le parent mais pas pendingExchangeHref local. Centraliser nettoyage des intentions de fermeture. Patch. |
| B5 requêtes sélecteur fermé | false | Préchargement d’un éditeur monté volontaire pour ouverture rapide, conformément aux patterns du projet. Le constat seul ne démontre ni données fausses ni budget/performance dépassé. Mesures globales prévues, pas de changement spéculatif. |
| B6 absence cache historique | false | Le panneau Contact possède son cache propriétaire ; l’historique est une lecture paginée distincte avec état de chargement et revalidation. La cible d’ouverture du panneau n’exige pas que tous les historiques soient déjà chargés. Aucun dépassement mesuré établi par ce constat seul. |
| B7 deux occurrences affichées identiquement | medium | formatExchangeDate omet décalage alors que le choix d’occurrence est métier. Ajouter décalage pour heures locales ambiguës et tester. Patch. |
| B8 relations anonymes dans historique | medium | Depuis Société, plusieurs entrées affichent toutes Contact sans identité. Projection de noms privés liée à la lecture, sans modifier reçus ni liens. Patch. |
| B9 focus erreur canal/notes absent | medium | Seule la date reçoit focus ; erreurs hors écran depuis dialogue possibles. Focus ciblé après fermeture du dialogue. Patch. |
| B10 Enter soumet formulaire Contact | medium | Les inputs imbriqués appartiennent au form Contact sans interception. Empêcher cette soumission étrangère et vérifier clavier. Patch. |
| E1 abandon pendant attente | medium | Même défaut prouvé que B1 ; regroupé, garde occupé et test. |
| E2 ancienne destination après échec | medium | Même défaut prouvé que B4 ; regroupé. |
| E3 storage ancien au retry | medium | Même défaut prouvé que B3 ; regroupé. |
| E4 reprise nettoyage UI bloquée | medium | Helper exige les reçus même pour des IDs déjà absents ; correction locale DB ne protège pas le caller UI. Helper doit accepter seulement les absences constatées et refuser les survivants non prouvés. Patch. |
| G1 origine HTTP non vérifiée | medium | Recettes DB contournent frontière et transport simule fetch. Ajouter requête propriétaire Origin interdit / manquant / cross-site,403 et zéro écriture/reçu. Patch test. |
| G2 historique ouvert focus/online absent | medium | Recette recharge routes après mutations. Ajouter échanges externes sur fiche Société maintenue ouverte puis focus/online et assertion count/max/entrée. Patch test. |
| G3 date future figée en octobre2026 | medium | Le test cesse d’être correct après cet instant ; conserver DST fixe puis future distincte calculée au moment du test. Patch test. |

Les corrections portent sur des chemins observés de la création/historique et ne changent pas l’intention. Aucun nouveau domaine ou déploiement. Les trois actions d’outillage BMAD05 explicitement conservées restent hors de ce lot.

### Clôture après corrections

Toutes les corrections acceptées ci-dessus ont été appliquées. Seconde relecture indépendante ciblée : aucun défaut avéré persistant ou nouveau, confirmation statique des gardes busy, mémoire, navigation, focus/Entrée, offsets, projections privées et nettoyage. Les deux constats B5/B6 restent écartés pour les raisons documentées ; les trois actions BMAD05 restent ouvertes.

Vérifications finales : TypeScript parent sans erreur et diff sans erreurs d’espacement ; 30 contrôles DB initiaux, tests dates/transport (12) réussis ; 11 contrôles DB ciblés supplémentaires sur projection des noms, reçus immuables et nettoyage/provenance. La recette UI complète après correctifs passe 66 assertions à 2026-09-08T15:26:53.309Z (`verification/2-4/ui-results.json`, success:true). Elle couvre les trois rejets HTTP authentifiés sans écriture, actualisations focus/online sans navigation, busy/fermeture, stockage défaillant et génération récente, focus/Entrée, reprise réelle, identité des relations, historique/page2/max global et colonne Contact après reload. Quatre captures inspectées ; parent a également relu preuve JSON et capture desktop finale. Aucun crash ni débordement de page constaté.

Fixtures et reçus de recette retirés exactement ; empreintes préexistantes intactes. Les performances en série restent à mesurer au bilan V1 ; aucun build, push, déploiement ou refactorisation finale exécuté.
