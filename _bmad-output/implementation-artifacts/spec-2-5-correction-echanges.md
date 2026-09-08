---
title: 'Corriger un échange sans déformer son historique'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 33bc0cb094d109958433b8727b9e9bf98e0a20fe
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-2-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
---

<frozen-after-approval reason="human-owned intent — décisions déléguées et mandat du 8 septembre">

## Intent

Corriger date, canal, notes, contact et société historique d’un échange existant. Retrouver des historiques et dernières interactions recalculés après correction, sans créer un nouvel échange ou altérer d’autres relations.

## Boundaries & Constraints

Toujours : mêmes validations date/Paris/DST, canal et texte qu’en 2.4 ; un contact obligatoire dans cet epic, société historique facultative. Correction explicite ; modifier le contact ne réécrit pas implicitement la société historique déjà enregistrée. Patch des seuls champs modifiés et leurs versions initiales ; contrôles atomiques sur les états nécessaires. Conflit ciblé sans mutation partielle, choix local/distant explicite ; champs indépendants compatibles.

Enregistrer/Annuler, brouillon propriétaire, commande idempotente et générations ; fermeture protégée. Recalculer anciennes et nouvelles projections après commit, y compris vers un échange précédent ou aucun échange. Garder création et UUID de l’échange : tri par instant, création, UUID décroissants.

Jamais : suppression, archivage, restauration, audit de toutes les versions, mutation de société actuelle du contact ou déplacement des autres échanges. Ne pas casser commandes et reçus de création 2.4. Aucune opportunité créée par anticipation, aucun déploiement ou refactorisation finale.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Correction | Date/canal/notes valides ou notes effacées | Même échange relu, seuls champs ciblés changés | Erreur ciblée, saisie gardée |
| Relations | Contact A → B ; société X → Y → aucune | Historique retiré/ajouté explicitement, autres fiches intactes | Contact vide/interdit refusé |
| Dernier | Date reculée ou lien changé | Maximum global recalculé, ancien ou vide | Indépendant de la page |
| Concurrence | Même champ changé ailleurs | Conflit sans écriture partielle | Nouvelle version requise au remplacement |
| Indépendance | Notes et date modifiées séparément | Deux corrections compatibles | Pas de conflit global artificiel |
| Reprise | Réponse perdue, expiration ou saisie ultérieure | Résultat rejoué sans deuxième mutation | Brouillon et génération conservés |

</frozen-after-approval>

## Code Map

- Références existantes : `lib/contacts-drafts.ts` et `components/contacts/contact-editor.tsx` pour générations/choix de conflit ; ne pas refactoriser leur implémentation.
- Fichiers 2.4 présents, à relire après clôture : `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `lib/exchange-date.ts`, `lib/exchanges-drafts.ts`, `lib/exchanges-transport.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/`, `components/exchanges/exchange-editor.tsx`, `exchange-history.tsx`, migrations Échange et `scripts/verify-exchanges*.mjs`. Étendre ces contrats plutôt que créer un moteur parallèle. Les reçus create restent relisibles exactement après ajout update.
- Réutiliser les primitives de domaine introduites par 2.3 et retenues par 2.4 ; lectures/projections communes contact/société. Ne jamais modifier une migration déjà appliquée ni enrichir rétrospectivement un reçu.

## Tasks & Acceptance

- [x] `supabase/migrations/*_exchange_update.sql`, `lib/validations/exchanges.ts`, `app/actions/exchanges.ts` : ajouter la commande update transactionnelle avec clé idempotente, verrou, versions ciblées et validation des relations propriétaire ; migration additive si nécessaire.
- [x] `components/exchanges/`, `lib/exchanges-drafts.ts`, `lib/exchanges-transport.ts` : étendre formulaire et brouillons existants au patch et conflit par champ ; conserver identité/création et commande pending initiale.
- [x] `lib/exchanges.ts`, `components/contacts/contact-editor.tsx`, `components/companies/companies-shell.tsx` et historiques : invalider les projections des anciens et nouveaux contacts/sociétés, y compris lors d’une réponse tardive ; ne pas écraser les brouillons ouverts.
- [x] `scripts/verify-exchanges-*.mjs` ou recettes correction dédiées : couvrir la matrice, choix mixtes de conflits et changements concurrents indépendants ; revue indépendante avant clôture.

**AC :** Given un échange existant, When une correction confirme, Then le même UUID est relu et le retry n’augmente plus sa révision. Given une société historique corrigée, When les fiches sont relues, Then seules les projections de cet échange changent, pas l’employeur du contact ni les autres échanges. Given le dernier échange d’un contact, When sa date ou son contact change, Then l’ancien contact retrouve son précédent maximum ou l’état vide et le nouveau obtient le bon maximum. Given deux onglets, When un patch périmé est envoyé, Then aucun champ du patch n’est partiellement enregistré et la saisie reste disponible. Given une tentative directe non propriétaire, When lecture ou correction est demandée, Then aucune donnée privée n’est retournée ni modifiée.

## Implementation Notes

Préparation avant clôture2.4 : son editor est actuellement un inline sans formulaire imbriqué sous ficheContact. Le parent compose dirty/save/discard avec contact/société ; toute édition depuis un historique Contact ou Société doit participer à la protection du panneau, pas seulement à son bouton Annuler. Étendre le même moteur aux commandes update, en isolant les brouillons par cible Échange et leurs bases originales. La version2.4 de création reste compatible. Réutiliser résolution Paris, sémantique des notes20000points et nettoyage par reçus. Une couche de composition dédiée à ces nouveaux éditeurs est permise si nécessaire à la fonctionnalité, sans refactorisation générale de l’application.

### Contrat retenu après lecture de 2.4

Commande update : `{operation:"update", command_id, exchange_id, fields, base_versions}`. Le patch est non vide ; les clés des versions sont exactement celles des champs modifiés. `contact_id` reste obligatoire ; `company_id` peut être null. Les métadonnées de lecture et l’identité ne sont pas modifiables. Les commandes create et leurs reçus historiques restent strictement compatibles.

Résultat conflict : état courant et `conflicting_fields` avec message. Résultat success update : état confirmé et `affected: {contact_ids, company_ids}` depuis les relations réelles sous verrou avant/après ; champ optionnel dans le schéma commun pour ne pas réécrire les reçus create. Même verrou de commande et même table de reçus entre opérations, empreinte de commande exacte. Verrouiller ensuite l’échange ; comparer toutes les versions avant écriture ; incrémenter seulement les champs du patch et une seule révision globale. Aucune version de société exigée pour un changement indépendant de contact. Pas de transformation rétroactive des reçus.

Ajouter une lecture unitaire propriétaire `readExchange(id)` et GET `/api/exchanges?id=UUID` pour retrouver une correction déplacée hors de la page courante. Reprendre les projections optionnelles `contact_name` et `company_name`. Après reçu rejoué, revalider l’état actuel et toutes projections concernées ; ne jamais remplacer une révision récente par l’état historique du reçu. Les maxima restent calculés globalement par les RPC.

Brouillons update séparés des create v1, isolés par propriétaire et UUID, valeurs/versions initiales, commande pending immuable et générations par champ (ou équivalent démontré). Un succès avance les bases sans effacer de saisie ultérieure. Conflits : choix local/distant par champ, nouvelle clé et versions fraîchement lues ; conserver les champs indépendants du patch, accepter qu’un second conflit survienne.

La correction apparaît depuis chaque ligne d’historique Contact/Société. Réutiliser les champs et règles du formulaire Échange, avec identifiants DOM propres à la cible pour éviter les doublons. Agréger dirty/busy/save/discard/focus au parent ; ne jamais fermer/abandonner un panneau pendant sa commande. Une erreur annule également toute navigation différée. Préserver les fixes de 2.4 : stockage indisponible ne recharge pas une génération plus ancienne, Entrée dans les champs d’échange ne soumet pas Contact, première erreur focalisée, heures ambiguës affichées avec leur offset.

Migrations additives seulement après `20260908212000_exchanges_read_names.sql`. Le mandat autorise la cible Supabase dédiée après vérification de son identité/plan ; coordonner l’exclusivité DB et navigateur avec le parent. Node 24 disponible à `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin`. Context7 avant utilisation des bibliothèques ; seuls les skills BMAD sont autorisés. Aucun push/build/déploiement ni refactorisation finale.

### Organisation de l’implémentation

L’agent d’implémentation prend en charge la seule story 2.5, sans commit ni changement de statut de la spec. Il peut déléguer l’UI et sa recette à un sous-agent avec périmètre explicitement disjoint ; publier d’abord le contrat partagé. Il reste propriétaire des schémas, RPC, migrations, tests DB et autorise ensuite le créneau exclusif UI pour ses fixtures. Le parent assure revue et clôture. Interdire les mutations DB simultanées. Inspecter chaque capture finale, enregistrer preuves JSON et nettoyage dans verification/2-5 ignoré ; ne pas annoncer un contrôle non exécuté.

## Spec Change Log

## Review Triage Log

### Triage individuel des trois revues

Les trois couches ont été exécutées avant triage. Limite réelle de slots : les deuxième et troisième reviewers ont démarré dès libération du précédent ; aucune couche omise. Chaque constat est évalué avant regroupement.

| Avis | Verdict | Preuve et route |
|---|---|---|
| B1 rebase de génération récente sur relecture | high | acknowledgeExchangeUpdate prend toutes bases dans actual.exchange, même pour une saisie commencée pendant pending ; une écriture distante entre commit et relecture perd son contrôle de version au prochain save. Patch : base du reçu pour champ envoyé, base initiale pour champ indépendant modifié pendant attente, relecture actuelle pour champs propres. |
| B2 sélecteurs paginés interactifs pendant chargement | medium | L’effet conserve contacts/companies et boutons actifs malgré page incrémentée ; clics rapides affichent ancienne page sous nouveau numéro. Patch loading séparé, contenu honnête et commandes de page bornées pendant attente. |
| B3 suppression storage ignorée | medium | removeExchangeUpdate avale l’erreur puis succès/abandon ferme ; ancien brouillon reste récupérable au reload. Patch signaler échec et préserver un état récupérable honnête, empêcher départ prétendant abandon terminé tant que cette suppression n’est pas confirmée. |
| B4 busy parent partagé | medium | Deux éditeurs indépendants écrivent le même booléen ; un finally false réactive l’affichage du parent pendant autre commande. Les refs empêchent déjà la mutation/départ, mais boutons incohérents. Patch états séparés puis OR. |
| B5 erreurs des groupes non associées | low | Erreurs Date/Notes associées, groupes Canal/Contact/Société sans aria-describedby vers message prévu. Correction directe des attributs d’accessibilité, sans nouveau comportement métier. |
| B6 finaliseurs UI groupés | medium | Un échec cleanup saute signOut dans le même try. Patch finaliseurs indépendants et preuve de leur résultat ; manifeste métier retiré seulement après cleanup métier confirmé. |
| B7 mesures sans verdict de seuil | medium | Le JSON compte les timings mais success ne distingue pas seuils ; tous grands seuils observés passent, un input16,4ms dépasse la cible stricte16. Patch verdicts de performance explicites séparés du succès fonctionnel, seuils bloquants Q6 assertés, compte ≤16ms visible ; ne pas relâcher un seuil pour rendre vert. |
| B8 registre migration absent | medium | État préexistant de toutes migrations appliquées via helper, déjà consigné ; la nouvelle migration est explicitement marquée appliquée. Reconciliation avant outillage de déploiement reste requise, mais fait partie de la préparation livraison conservée BMAD06. Defer sans replay ni mutation registre maintenant. |
| B9 sprint in-progress vs spec in-review | false | step05 BMAD prévoit justement spec done puis sprint review à la clôture. La story n’est pas encore clôturée pendant cette revue ; ces deux états sont attendus dans ce workflow. |
| B10 code condensé | false | Préférence de mise en forme sans consommateur ni défaut démontré distinct ; la refactorisation finale est conservée pour BMAD06. Ne pas ajouter une réécriture générale dans cette story. |
| E1 fermeture société sans éditeur monté | medium | editor.current est toujours une façade ; branche else appelle seulement companyEditor facultatif. Chargement/erreur sans éditeur ne ferment plus. Patch fallback close quand aucun enfant. |
| E2 choix local revenu à valeur initiale | high | resolve itère seulement changedExchangeFields ; la valeur locale revenue à base disparaît de cet ensemble malgré choix explicite mine. Patch union avec champs conflictuels choisis mine. |
| G1 Enregistrer dans parents non exercé | medium | Évidence de gap acceptée : recette choisit Continuer, sauvegarde ensuite via bouton enfant. Patch parcours Enregistrer parent Contact et Société, DB/fermeture/navigation, refus validation gardant saisie. |

Pas de doublon de racine entre constats conservés. Corrections sur états/commandes déjà démontrés, sans changer intention ni API métier ; contrôles internes et recettes concernés seulement. Actions d’outillage BMAD05 préservées.


## Verification

Préalable confirmé : 2.4 terminée et commit 33bc0cb, interfaces et preuves relues ; rattacher les fichiers exacts avant exécution. TypeScript Node 24 ; tests RPC/transport ciblés, puis parcours agent-browser édition, retry, expiration, conflits mixtes, pagination et retour de focus. Rejouer dates Paris et refus serveur de futur ; vérifier révisions et projections en DB. Fixtures isolées avec empreintes et nettoyage exact, exclusivité distante coordonnée par le parent. Consigner mesures et limites sans annoncer une preuve non exécutée.

### Implémentation et preuves avant revue

Migration additive `20260908220000_exchange_update.sql` appliquée sur bmad-crm/Persos/free après revalidation. L’ancien chemin create est renommé en fonction interne non exécutable par authenticated ; wrapper unique partage clés/reçus et conserve ses résultats historiques. Update verrouille l’échange, vérifie toutes versions et relations, préserve UUID/création et émet affected depuis les relations réelles. Lecture unitaire propriétaire ajoutée pour l’échange déplacé et la réconciliation après reçu historique. Note d’application ignorée `verification/2-5/migration-application.json` ; aucun registre CLI distinct écrit, ne pas rejouer aveuglément cette migration à la livraison.

Extension des brouillons create/update dans `lib/exchanges-drafts.ts` avec schémas pending distincts, bases et générations par champ. `ExchangeUpdateEditor` et `ExchangeHistory` composent sauvegarde/abandon/busy/focus avec les panneaux Contact et Société ; Annuler interne Société passe également par la protection. Les champs propres se revalident au focus/online, les bases des champs dirty restent d’origine, les réponses anciennes sont rejetées. Le feedback succès reste visible après fermeture de l’éditeur.

Avant la campagne finale : 42 contrôles DB passés avec nettoyage exact répété et empreintes intactes ; 15 validations de contrats et 22 tests transport/brouillons update passés ; dates Paris et 12 contrôles transport create v1 rejoués avec succès. Recette UI enrichie à 102 assertions passées, datée 2026-09-08T15:36:05.240Z ; un dernier passage ajoute futur dynamique, mesures et cibles tactiles. TypeScript parent et diff --check sans erreur sur l’état relu.

Matrice : correction/date/effacement → RPC et UI ; relations A→B/X→Y→aucune et employeur intact → RPC et UI ; dernier global précédent/vide/page2 → RPC et UI ; conflit multichamp atomique/choix mixtes et patch indépendant → RPC/transport/UI ; reprise → reçus create/update immuables, révision stable au retry, UI réponse retenue/perdue, génération récente et reconnexion réelle. Les recettes ont nettoyé leurs fixtures entre chaque exécution ; aucun build/push/déploiement.


Dernière recette complète réussie à 2026-09-08T15:41:21.210Z : 184 assertions UI, futur dynamique inclus, quatre captures inspectées (parent iPhone également), nettoyage exact et données préexistantes intactes. Série20 : ouverture éditeur 7–15,4ms (20/20 sous16ms), vue complète359–582ms, confirmation443–837ms (20/20 sous1s), saisie3,5–16,4ms (19/20 ≤16ms, tous<100ms). Ces observations concernent l’éditeur dans un panneau déjà ouvert, données fictives limitées et serveur de développement ; elles ne prouvent pas le cold path global ni le jeu Q6 complet. Écart ponctuel de0,4ms au seuil16ms consigné, pas masqué par le seuil100ms. Aucun refactorisation/push/déploiement.


### Clôture des constats après patch

B1–B7, E1/E2 et G1 corrigés, B8 conservé pour la préparation livraison, B9/B10 rejetés selon triage. Relecture indépendante ciblée du code corrigé : aucun défaut avéré persistant, notamment bases de générations, suppression stockage, mine égal base, fallback Société et busy séparés.

Vérification finale parent : TypeScript et diff --check sans erreur ; preuves JSON/capture finale relues. 30 tests ciblés transport/brouillons passent et 86 assertions navigateur sur les seuls constats passent à 2026-09-08T15:57:19.158Z. Courses réelles, deux dialogues parent Enregistrer/validation/navigation, stockage refusé puis reload/réessai, page retardée, ARIA et deux commandes simultanées sont couverts. Finaliseurs collection/baseline/cleanup/signOut/browser tous true ; données préexistantes intactes, fixtures et reçus retirés.

La série complète antérieure reste conservée ; aucune nouvelle série de performance annoncée après ces corrections. Verdict Q6 explicite dans la recette, recalcul des 20 timings réels : toutes réactions <100ms, vues <2s, 20/20 confirmations <1s ; le seuil strict de saisie ≤16ms reste 19/20 sur ce run. Tests de performance et succès fonctionnel distincts. Cette mesure n’est pas une preuve de la volumétrie Q6 finale. Aucun build, push, déploiement ou refactorisation finale.
