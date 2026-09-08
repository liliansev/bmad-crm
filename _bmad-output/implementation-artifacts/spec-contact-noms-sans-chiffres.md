---
title: 'Refuser les chiffres dans les noms de contacts'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
baseline_commit: '2a06b01d308617c9723cc9195699d3230d9b9ae2'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
---

<frozen-after-approval reason="human-owned intent — plan approuvé par oui vasy letsgo">

## Intent

Interdire les chiffres dans le prénom et le nom à la création et à la correction d’un contact. Appliquer le plan de tests minimal approuvé : validation, HTTP, RPC v1/v2 et navigateur, sans nouveau framework. Montrer un vrai test en échec avant correction, puis sa réussite et les régressions pertinentes.

## Boundaries & Constraints

Toujours : chiffres décimaux Unicode (Nd) refusés, erreur près du champ ; accents, espaces, apostrophes, tirets, lettres internationales acceptés. Au moins un prénom ou nom après trim, maximum 200 points de code par champ ; autres champs inchangés. Garder le texte saisi corrigeable, ne pas filtrer les frappes. Les anciens contacts, reçus et brouillons doivent rester lisibles. Le rejeu d’une commande déjà confirmée garde son reçu immuable ; une ancienne commande non enregistrée est refusée et devient corrigeable. Chaque nouveau nom transmis doit respecter la règle ; les champs historiques non modifiés ne sont pas migrés ni nettoyés automatiquement.

Jamais : effacement de données réelles, nouvelle dépendance, Playwright, déploiement frontend, implémentation d’autres stories. Recettes sur fixtures exactes, contrôle propriétaire/cible Supabase et nettoyage vérifié. La migration additive sur le projet existant et les recettes DB prévues au plan sont autorisées par l’approbation du plan ; préserver l’ancienne version hébergée et ses reçus.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Erreur |
| --- | --- | --- | --- |
| Noms | Jean2, 123, chiffres arabes/pleine chasse/mathématiques, prénom et nom | Refus création et modification | Champ indiqué, données inchangées |
| Noms valides | Élodie, Jean-Pierre, O’Connor, lettres internationales, un nom seul | Acceptés et persistés | Aucun rejet ASCII abusif |
| Bornes | Blancs, 200/201 points de code | Deux blancs refusés, 200 accepté, 201 refusé | Saisie conservée |
| Contournement | Appels HTTP puis RPC v1/v2 directs | Même règle sans dépendre du formulaire | Aucune ligne/révision modifiée |
| Héritage | Noms chiffrés stockés, reçus et brouillons v1/v2 | Lisibles, rejouables si déjà confirmés, corrigeables sinon | Pas de perte de commande ou de texte |
| Navigateur | Saisir/coller chiffres, sauvegarder, corriger, recharger | Erreur visible, correction puis persistance | Aucune suppression silencieuse |

</frozen-after-approval>

## Code Map

- `lib/validations/contacts.ts` et `contacts-v1.ts` : séparer validation des nouveaux noms des lectures stockées. `contactSchema`, résumés et réponses doivent accepter l’héritage. `rawContactFieldsSchema` conserve toute saisie.
- `app/actions/contacts.ts` : validation structurelle et auth avant RPC, sans interdire le rejeu d’un reçu chiffré déjà confirmé. Distinguer les schémas commande stricte et transport historique. Les RPC restent autorité pour les nouvelles écritures.
- `lib/contacts-drafts.ts` : v2 garde déjà les commandes structurelles ; la restauration v1 utilise legacyCommandSchema et doit rester permissive. `contact-editor.tsx` possède erreurs de champs et état pending ; réutiliser sans nouvel UI.
- `supabase/migrations/20260907200000_contact_details.sql` : ne pas modifier une migration appliquée. Dans les deux RPC, nouveau contrôle des noms fournis après advisory lock/recherche de reçu et avant mutation. Pas de CHECK rétroactif sur toute la table. Aligner exactement Unicode JS/PostgreSQL.
- `scripts/verify-contact-details-transport.mjs`, `verify-contact-details-db.mjs`, `verify-contact-details.mjs`, `verify-contact-details-review.mjs`, `verify-contacts-db.mjs` : recettes existantes, plusieurs fixtures utilisent des chiffres/UUID dans les noms. Les adapter sans modifier les attentes métier ; préférer helper de marqueur alphabétique unique commun. Ajouter scénarios ciblés, garder les anciennes recettes utilisables.
- `.local/verify-story-target.py`, `.local/supabase-query.py` : helpers de cible/SQL, accès privés internes jamais affichés. La recette peut réutiliser Node24 disponible dans `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin` et agent-browser CLI. Rapports ignorés dans `verification/names/`, conserver rouge et vert séparés.

## Tasks & Acceptance

- [x] Tests paramétrés et échec constaté avant changement produit ; fixtures alphabétiques.
- [x] Validations formulaires/commandes et lectures/drafts compatibles.
- [x] Migration additive RPC et tests DB/HTTP directs ; propriétaire/cible vérifiés avant application, aucune donnée métier transformée.
- [x] Parcours réel agent-browser : erreurs prénom/nom, correction, persistance, capture ; nettoyage des seules fixtures.
- [x] Régressions transport, DB détails, HTTP et TypeScript ; revue indépendante.
- [x] Critère ajouté comme amendement approuvé dans les stories 2.1/2.2 et décisions déléguées, preuves et limitations consignées.

Given une requête sans session ou d’un autre compte, when elle vise un contact, then les protections actuelles continuent à refuser l’accès. Given une ancienne valeur chiffrée, when la fiche ou son brouillon sont ouverts, then le texte reste accessible et peut être corrigé sans perdre les autres champs. Given une commande confirmée avant la règle, when elle est rejouée, then elle ne crée ni doublon ni nouvelle révision.

## Implementation Notes

Plan approuvé avant cette spec dans la conversation ; aucune nouvelle question métier ni nouvelle validation à demander. Approche multi-couches nécessitant migration, donc dispatch. L’agent implémente et vérifie séquentiellement ; le parent prépare uniquement les contrôles de cible en lecture seule pendant ce travail. Les tests réels distants autorisés par le plan priment sur les limites génériques de skill. Aucun push.

## Spec Change Log

## Review Triage Log

| Avis | Verdict | Preuve et traitement |
| --- | --- | --- |
| B1 — parité sans matcher livré | medium | La DB compare SQL à Nd natif et non au matcher livré. Ajouter le corpus au test du module JS réel ; patch commun G2. |
| B2 — origine des plages peu documentée | low | Copie JS/SQL explicite, risque de divergence couvert par B1. Ajouter une note de provenance reproductible Node/Unicode ; pas de générateur supplémentaire. |
| B3 — reçu historique absent du test HTTP | medium | RPC et schéma séparés ne détectent pas une mauvaise sélection de schéma dans l’action. Ajouter rejeu v1/v2 via HTTP ; patch commun G1. |
| B4 — RPC v1 brut puis HTTP normalisé | low | Cas préexistant : saveContactAction transmet déjà parsed.data avant ce changement. Les commandes v1 de l’application sont historiquement canonisées ; changer ce comportement casserait leurs reprises. Consigner cette limite inter-canaux séparément, aucune modification du protocole v1 ici. |
| B5 — ancien pending refusé non testé dans UI | medium | Restauration structurelle testée mais pas le cycle UI refus/pending vidé/correction. Ajouter ce parcours ciblé. |
| B6 — édition historique sans test UI | medium | Le nouveau contactEditorSchema est testé isolément ; ajouter ouverture fixture historique, note puis un seul nom et rechargement. |
| B7 — refus HTTP sans contrôle des données | false | verifyHttpBoundaries compare intégralement la fixture à son état initial après tous les refus. snapshot final compare tous les contacts préexistants et détecte toute création imprévue non enregistrée comme fixture. Ces contrôles sont exécutés et verts. |
| B8 — nombres hors Nd non testés côté app | low | SQL teste déjà ² et Ⅷ, mais le module livré mérite ces positifs aussi : inclure au corpus B1. |
| B9 — focus après erreur de fermeture non vérifié | low | Chemin existant intact, mais assertion sur l’erreur nouvelle peu coûteuse : ajouter le focus direct et après Enregistrer dans la confirmation de fermeture. |
| G1 — rejeu HTTP consommateur | medium | Lacune vérifiée du même défaut de couverture que B3. Patch test ciblé commun. |
| G2 — matcher JS non exécuté dans parité | medium | Lacune vérifiée du même défaut de couverture que B1. Patch corpus commun. |

Revue edge-case : aucun constat. Les avis sont évalués individuellement avant regroupement. Groupes de patch : B1/B2/B8/G2 ; B3/G1 ; B5 ; B6 ; B9. B4 est une limite préexistante inter-canaux à investiguer séparément sans toucher aux commandes canoniques ; aucun défaut produit nouveau confirmé par cette revue.

## Verification

Node24 : pnpm typecheck ; pnpm verify:contacts:transport ; pnpm verify:contacts:db ; pnpm verify:contacts:http ; recette navigateur ciblée ajoutée à l’outillage existant. Ne pas lancer les recettes DB/UI en parallèle. Rapports rouge/vert datés avec commandes et état du code. N’annoncer que les contrôles réellement exécutés ; un test existant non relancé ne prouve pas la version actuelle.


Preuves et limites détaillées : `setup-contact-noms-sans-chiffres.md`. TypeScript, transport, DB et HTTP + parcours agent-browser ciblé exécutés avec succès. Revue indépendante terminée : trois couches, lacunes corrigées et relues. Contrôles finaux exécutés par le parent ; B4 seul consigné séparément comme limite préexistante.

Clôture : nouveaux scénarios matcher Unicode réel, rejeu HTTP v1/v2, brouillons pending refusés puis corrigés, édition historique et focus passés. Les fixtures de la recette UI historique ont également été converties en marqueurs alphabétiques ; syntaxe contrôlée, sans annoncer sa recette ancienne complète comme rejouée. Aucun push ni déploiement frontend.
