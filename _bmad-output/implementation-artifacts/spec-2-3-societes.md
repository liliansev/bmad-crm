---
title: 'Relier mes contacts à leurs sociétés'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
baseline_commit: 'd2be27630adb93555bed41e7214f8fa76d6bb5ff'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-2-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
---

<frozen-after-approval reason="human-owned intent — mandat autonome du 8 septembre 2026">

## Intent

Créer et renommer une société depuis Sociétés ; choisir, remplacer ou retirer la société actuelle d’un contact existant. Retrouver les relations cohérentes depuis les deux fiches et Contacts, avec les garanties de reprise et concurrence déjà livrées.

## Boundaries & Constraints

Toujours : nom de société obligatoire après trim, seul champ métier ; zéro ou une société actuelle par contact, plusieurs contacts par société. Liste des sociétés limitée au nom et accès fiche, pagination de 25 et total global, ordre français nom/UUID. Panneau droit compact, Ajouter/Enregistrer/Annuler, fermeture protégée et clavier. Session propriétaire authentique, RLS, versions par champ, reçus immuables et brouillons conservés. Les chiffres restent autorisés dans les noms de sociétés ; la restriction contact reste inchangée.

Jamais : suppression, fusion, recherche, coordonnées supplémentaires, échanges, opportunités ou gains simulés. Préserver contacts, anciens clients v1/v2, commandes pending et reçus existants. Migrations additives autorisées sur la cible dédiée vérifiée, exclusivement coordonnées par le parent ; aucun push, déploiement ou refactorisation finale.

## I/O & Edge-Case Matrix

| Cas | Entrée / état | Attendu | Échec |
|---|---|---|---|
| Société | Création ou renommage, nom vide | Nom canonique retrouvé ou erreur ciblée | Texte conservé, aucune écriture partielle |
| Relation | Société A → B → aucune | Contact déplacé entre listes liées, fiches conservées | Sélection récupérable |
| Accès | UUID inexistant, relation étrangère, compte non propriétaire | Refus sans fuite ni mutation | État explicite |
| Concurrence | Deux noms ou liens modifiés ; note indépendante | Conflit ciblé ; modification indépendante compatible | Aucun écrasement implicite |
| Reprise | Réponse perdue, offline, expiration, saisie plus récente | Même commande rejouée une fois, génération récente préservée | Brouillon intact |
| Lecture | Société vide, plusieurs pages, renommage ailleurs | Absence explicite, toutes relations accessibles, libellés revalidés | Pas de succès fictif |

</frozen-after-approval>

## Code Map

- `lib/contacts.ts` : `contactsClient()` vérifie identité serveur ; `readContact/readContacts` projettent six versions. Étendre la lecture des relations sans changer les reçus v2.
- `lib/validations/contacts.ts`, `contacts-v1.ts`, `lib/contacts-drafts.ts`, `contacts-transport.ts` : contrats stricts et reprise ancienne ; ne pas ajouter un champ obligatoire aux commandes historiques.
- `supabase/migrations/20260907160000_contacts.sql` et migrations suivantes : modèle RLS/RPC, verrou/reçu idempotent et projections versionnées ; ne pas éditer les migrations appliquées.
- `components/contacts/contacts-shell.tsx`, `contact-editor.tsx` : shell URL/cache, génération, fermeture et conflits à reprendre. `components/ui/` contient Button, Input, Label, Table, Sheet, Dialog, Skeleton ; sélecteur supplémentaire via shadcn/documentation.
- `app/(dashboard)/layout.tsx`, `components/dashboard-skeleton.tsx` : navigation privée et squelettes. Ajouter la route `/societes` et son chargement.
- `scripts/verify-contact-details-{db,transport}.mjs`, `verify-contact-details.mjs` : gabarits de fixtures, empreintes avant/après et preuve UI ; le helper `.local/supabase-query.py` existe localement mais n’est pas distribué par Git.

## Tasks & Acceptance

**Execution :**
- [x] `supabase/migrations/*_companies.sql` : table sociétés, nom/révision/version, RLS et RPC ; relation nullable/versionnée du contact, intégrité propriétaire, projection liée paginée.
- [x] `lib/validations/companies.ts`, `lib/companies.ts`, `app/actions/companies.ts`, `app/api/companies/` : contrats et transport borné authentifié ; validations Zod et SQL concordantes.
- [x] `lib/companies-{drafts,cache,transport}.ts`, `components/companies/`, `app/(dashboard)/societes/` : création, fiche, renommage, récupération et contacts liés paginés.
- [x] `components/contacts/`, lectures Contacts : affichage/lien société et éditeur de rattachement versionné ; invalider les anciennes/nouvelles projections après commit.
- [x] `scripts/verify-companies*.mjs` : couvrir la matrice DB/transport/UI avec fixtures isolées ; revue indépendante avant clôture.

**Critères d’acceptation :**
- Depuis Sociétés, une création puis un renommage sont confirmés par relecture réelle ; nom vide refusé, état vide lisible.
- Choisir/remplacer/retirer une société actualise liste Contacts, fiche contact et contacts des deux sociétés ; les liens ouvrent les fiches correspondantes.
- Une commande périmée ne remplace aucun champ sans choix explicite ; une note concurrente ne bloque pas le rattachement indépendant.
- RLS/RPC, retry sans doublon, brouillons/reconnexion, pagination au-delà de 25 et clavier sont exécutés. Aucun schéma futur requis.

## Implementation Notes

Créneau DB accordé pour cette story par le parent : cible vérifiée le 8 septembre, recettes et migration additive autorisées dans le mandat. Aucun autre agent ne mute la base en parallèle. Lire les helpers de cible/SQL/nettoyage existants sans afficher leurs secrets. Implémenter la story puis ses tests et sa recette navigateur ; ne pas démarrer les stories suivantes ni committer (commit coordonné par le parent). Pour une bibliothèque, Context7 est callable par découverte ALL_TOOLS ; seuls les skills BMAD sont autorisés. Les nouveaux primitives réutilisables sont permis si nécessaires à cette story ; aucun schéma métier futur.

## Spec Change Log

## Review Triage Log

## Design Notes

De petites primitives neuves de transport, brouillon et cache peuvent servir aux domaines suivants, avec schémas injectés par entité ; aucune abstraction speculative ni refactorisation des contacts historiques. La story n’introduit que le schéma Société.

Contrat conseillé : `Company {id,name,field_versions:{name},revision,created_at,updated_at}` ; `company_command` create/update avec UUID de commande et versions ciblées. Relation dédiée `contact_company_command {command_id,contact_id,company_id:null|UUID,base_version}` ; version de relation indépendante des six champs existants. Lecture relation séparée ou projection additive, sans réécrire les reçus v1/v2. Les brouillons de relation restent isolés et leur fermeture participe à la protection du panneau contact.

Nom : limite cohérente de 200 points de code, refus NUL/UTF-16 invalide ; homonymes autorisés. Sélection paginée exhaustive sans recherche ni chargement tronqué. Un renommage invalide les libellés liés même si la révision du contact reste identique.

## Verification

`pnpm exec tsc --noEmit`, recettes ciblées Node 24 puis agent-browser réel sur localhost:3000. Exercices aux formats desktop/tablette/mobile, capture inspectée, absence d’erreurs console ; mesurer les cibles de fluidité et conserver leurs limites observées. Consigner empreintes et nettoyage exact des fixtures/reçus. Parent seul autorise le créneau de mutation distante. Pas de build pendant développement ni de déploiement.

### Revue du lot 2.3 — triage du 8 septembre

Trois couches indépendantes exécutées : blind, edge-case, verification-gap. Le nombre de reviewers simultanés a été limité par les slots ; chaque couche a rendu son rapport. Les remarques concernent cette story, pas les trois actions antérieures laissées ouvertes à BMAD 05.

| Avis | Verdict | Preuve et traitement |
|---|---|---|
| B1 relation avant validation contact | medium | Le save parent exécutait relation avant schema contact : validation avancée avant toute nouvelle mutation, retour de confirmation partielle explicite. Patch. |
| B2 réponse relation périmée | medium | Refresh pouvait réécrire une base clean sans comparer version : invalider génération de lecture à sauvegarde et garder version la plus récente. Patch. |
| B3 lien contact quitte renommage dirty | medium | Link naviguait sans handle de fermeture : routage après confirmation via parent. Patch. |
| B4 sélection hors page invisible | medium | La base affichée ne décrivait pas la nouvelle sélection : résumé indépendant de pagination. Patch. |
| B5 liste sociétés erreur sans retry | medium | L'erreur ne proposait pas de commande de relecture : retry ciblé. Patch. |
| B6 lecture relation échouée encore skeleton | medium | Échec et chargement confondus : états séparés, retry. Patch. |
| B7 nom long non sécable déborde | low | Les boutons ne forçaient pas le retour d'un mot de 200 caractères : règle de wrapping directe. Patch. |
| B8 auth dupliquée contacts société | low | Deux authentifications sérialisées dans readCompanyContacts : réemploi du client déjà vérifié. Patch. |
| B9 double refresh société sauvegardée | low | Appel direct et événement provoquaient deux requêtes : conserver événement seul. Patch. |
| B10 chemins UI relation non exercés | medium | Nouvel éditeur distinct, recette initiale limitée au succès : ajouter reprise, sélection plus récente et abandon/navigation. Même vérification que G1. |
| E1 nouvelle sélection pendant confirmation contact | medium | CloseAfter ne vérifiait que dirty contact : fermeture conditionnée aussi par relation. Patch. |
| E2 limite après deux milliards de versions | low, rejeté | Borne entière SQL et DTO diffèrent au dernier incrément possible. Extrême non rencontré au quotidien ; nouveau guard SQL disproportionné pour le POC, aucune fausse garantie de capacité infinie. |
| E3 ancien manifeste UI écrasé | medium | Initialisation réécrivait sans nettoyer précédent run interrompu : reprise du manifeste d'abord. Patch. |
| E4 échec baseline saute cleanup UI | medium | Une exception de comparaison empêchait cleanup dans le même try : séparer contrôles et nettoyage. Patch. |
| G1 reprise relation confirmation perdue absente | medium | UI initial ne testait pas le pending de relation distinct : perte après commit, reload, reprise même clé et génération récente, vérification version en DB. Patch test. |
| G2 pagination liée ne traverse pas application | medium | Test DB paginait sa propre requête, UI avait un seul contact : scénario 26 liés puis page2 et identité exacte via UI. Patch test. |

Les corrections de comportement respectent les invariants figés, aucun nouveau contrat public ni schéma futur. Les recettes finales couvrent ces chemins avant clôture ; ne pas prendre cette table comme preuve de réussite d'un test non exécuté.

### Relecture des corrections

Revue indépendante finale : B1–B6 et E1 confirmés corrigés, aucun nouveau défaut majeur. Deux défauts mineurs de libellé sélectionné traités : effacer l’alerte après relecture réussie ; numéroter les requêtes pour ignorer une ancienne réponse. Les protections de données/relation sont inchangées. Les assertions UI ciblent les parcours métier, sans prétendre simuler chaque branche de rafraîchissement.

Reconnexion réelle : la recette a révélé un défaut medium de middleware, qui ne classait pas les nouvelles routes Sociétés et relation Contact comme API privées. Une session absente recevait une redirection HTML au lieu du refus JSON, retardant la purge visible. Extension des préfixes de domaine API contacts/companies ; test d’expiration relancé sur ces deux écritures.

Revue ciblée finale du middleware : préfixe exact ou descendant avec `/`, sans autoriser de faux préfixes ; pages publiques, session et cookies inchangés. Deux refus POST 401 JSON et cache private/no-store constatés sans cookies.

Couverture de la matrice : Société → DB création/renommage/bornes et UI création-relecture ; Relation → DB A/B/retrait et UI persistée ; Accès → DB anonyme/second compte/RLS/RPC et HTTP 401 ; Concurrence → DB versions nom/relation et note indépendante ; Reprise → transport offline/génération, UI réponse perdue/reload/reconnexion ; Lecture → DB 29 sociétés/27 contacts, UI contacts liés26 et état vide.

### Résultat final vérifié

TypeScript Node24 passe après le dernier patch middleware. Recettes exécutées : 28 contrôles DB tous verts, 23 transport tous verts, 60 assertions UI toutes vertes (`ui-results.json` success=true à 2026-09-08T14:57:50.769Z). Deux POST sans cookies refusés 401 JSON avec cache privé sans stockage. Captures ordinateur/téléphone/tablette inspectées ; aucun crash navigateur. Fixtures et reçus créés supprimés, données/reçus préexistants inchangés.

Mesures dev local sur20 essais : ouverture chaude 31,4–33ms (médiane32,3 ; mesure incluant deux frames), confirmations131,5–207,2ms, 20/20<1s. Cela ne prouve pas la cible chaude≤16ms ni la charge NFR globale ; mesure froide/volumétrie restant au bilan V1. Preuves ignorées dans `verification/2-3/` : companies-db.json, companies-transport.json, ui-results.json, performance.json, expiration-http.json et captures.

Migration additive appliquée via helper SQL au projet Supabase dédié, sans push frontend ; l’enregistrement dans la table de migrations CLI doit être inventorié avant livraison BMAD06 pour éviter toute réapplication aveugle. Aucun déploiement effectué.
