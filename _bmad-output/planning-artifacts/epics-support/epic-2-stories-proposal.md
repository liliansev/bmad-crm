---
status: approved
workflowStage: stories-approved
epic: 2
updated: 2026-09-06
sources:
  - ../epics.md
  - ../architecture/architecture-bmad-crm-2026-09-06/ARCHITECTURE-SPINE.md
  - ../architecture/architecture-bmad-crm-2026-09-06/arbitrages-restants.md
  - ../ux-designs/ux-bmad-crm-2026-09-06/EXPERIENCE.md
  - ../ux-designs/ux-bmad-crm-2026-09-06/DESIGN.md
---

# Stories approuvées pour l’epic 2

Lilian approuve les cinq stories par « oui je valide tout ça » et délègue la poursuite accélérée. Les références aux anciens arbitrages sont désormais précisées par [decisions-deleguees.md](decisions-deleguees.md). Q7 reste un prérequis externe avant exécution ; aucune implémentation n’est annoncée.

## Epic 2: Retrouver ses contacts, sociétés et échanges

Gérer un carnet de relations utilisable sans dépendre du pipeline : contacts, sociétés, informations retenues, notes et échanges avec dernière interaction et contexte historique.

**Couverture :** FR-001/002/003/004 ; parties contact/société de FR-005/009/010/015 ; FR-018 pour récupération des saisies métier. FR-005/009/010/015 seront complétées par les opportunités en epic 3. FR-016 reste proposé sous Q5 ; FR-017 et NFR-005 restent retirés.

**Exigences communes à chaque story :** NFR-002/003/004, NFR-006 pour les échanges, AR-02/03/04/06/08/09/10/12/14/15. Les contrôles d’accès, migrations, validations, transactions, brouillons et conflits font partie de chaque nouvelle saisie. Il n’existe pas de story ultérieure chargée de rendre fiables les formulaires déjà livrés.

**Socle de recette R2 à appliquer dans chaque story :** exécuter le parcours utilisateur réellement avec agent-browser, contrôler TypeScript et vérifier persistance après rechargement/reconnexion. Pour chaque nouveau domaine, vérifier lecture directe/RLS, refus d’écriture directe, contrôle propriétaire et validation dans les commandes autorisées. Les mutations métier utilisent les Server Actions validées par Zod puis RPC transactionnelles de l’architecture ; aucune clé privilégiée dans le navigateur ou les requêtes ordinaires. Les erreurs préservent la saisie, les listes et fiches ont des états vide/chargement/échec, un accès clavier et des composants shadcn conformes aux tokens du projet. Préserver la fluidité du shell et des éditeurs dès leur création. Les données de recette sont fictives ; toute livraison hébergée conserve la vérification de cible, Ready et parcours sur l’URL réelle. Aucune conformité ni mesure ne découle des maquettes seules.

### Story 2.1: Créer et retrouver un contact sans perdre ma saisie

As a propriétaire du CRM,
I want créer un contact avec son prénom ou son nom et retrouver sa fiche,
So that je conserve rapidement une nouvelle relation même avec peu d’informations.

**Acceptance Criteria:**

**Given** l’accès privé de l’epic 1 et aucun contact,
**When** Contacts est ouvert puis un contact est créé avec au moins un prénom ou un nom,
**Then** une fiche est enregistrée, retrouvable dans la liste et consultable après rechargement,
**And** un formulaire dont prénom et nom sont tous deux vides est refusé sans effacer la saisie ; aucun autre champ n’est obligatoire.

**Given** un contact existant,
**When** son prénom ou son nom est modifié selon le mode de sauvegarde retenu sous Q4,
**Then** la fiche et la liste retrouvent la même valeur persistée après confirmation effective de l’écriture,
**And** le rendu optimiste porte l’état en cours et n’est marqué enregistré qu’après commit ; en cas d’échec, les projections reviennent à l’état confirmé tout en conservant le brouillon éditable. Une fiche absente/inaccessible et une liste vide/chargée/en erreur présentent des états distincts, sans simuler une relation vers une société ou opportunité non livrée.

**Given** une création ou modification soumise dont la réponse réseau est perdue après commit,
**When** la même commande est réessayée,
**Then** elle retourne son résultat déjà enregistré sans créer un deuxième contact ni réappliquer la modification,
**And** la clé d’idempotence, le propriétaire, l’empreinte et le résultat sont enregistrés atomiquement ; la même clé avec un contenu différent est refusée et les reçus restent conservés pendant le POC.

**Given** une erreur réseau ou une expiration de session pendant la création ou modification,
**When** le propriétaire réessaie ou se reconnecte au même compte,
**Then** il retrouve la saisie non confirmée sans ressaisie et peut la soumettre explicitement,
**And** le brouillon conserve propriétaire, cible de création ou entité, champs, versions de base, commande en cours et génération ; aucun succès n’est annoncé avant confirmation. Une identité technique de brouillon suffit avant attribution de l’UUID final ; ce n’est pas un nouveau champ métier.

**Given** une saisie plus récente que la commande en cours,
**When** une confirmation tardive ou une revalidation arrive,
**Then** seule la génération effectivement enregistrée est nettoyée ; la nouvelle saisie est conservée,
**And** un même champ n’a pas deux écritures client concurrentes ; après expiration, les données privées visibles sont purgées mais le brouillon reste récupérable uniquement par le propriétaire, conformément à AD-7.

**Given** deux onglets modifiant le même contact,
**When** le même champ a changé depuis sa lecture,
**Then** la seconde sauvegarde signale un conflit sans écrasement, conserve le brouillon et exige un choix explicite de remplacement soumis à un nouveau contrôle de version,
**And** les modifications de champs indépendants ne se bloquent ni ne s’écrasent ; une revalidation au focus, à la reconnexion ou à la reprise réseau ne remplace pas la saisie locale.

**Given** la story implémentée et un jeu de contacts dépassant la première page,
**When** le socle R2 et les scénarios précédents sont exécutés,
**Then** tous les contacts restent accessibles par la pagination prévue et les garanties de sécurité, brouillon, conflit, absence de doublon et accessibilité sont vérifiées,
**And** seules l’entité Contact et les structures de support réellement nécessaires sont introduites ; sociétés, opportunités et échanges ne sont pas créés à l’avance.

**Références :** FR-001 minimal, FR-018 ; NFR-002/003/004 ; AR-02/03/04/08/09/10/12/14/15 ; UX-DR1/5/14/16/25/27/30/33/34/36/37/39–44/48/57/59–61. La liste finale sera complétée par les prochaines stories, sans prétendre déjà reproduire toutes les colonnes métier.

**Dépendances :** epic 1 ; Q4 pour l’ouverture et le mode de sauvegarde du formulaire. Les minimums prénom ou nom sont déjà acquis ; aucun champ Q2 supplémentaire ici. Q6 avant protocole chiffré complémentaire. Cette story inclut le premier mécanisme de saisie fiable, borné à un seul domaine et deux champs métier.

### Story 2.2: Compléter les informations et notes de mon contact

As a propriétaire du CRM,
I want renseigner les coordonnées retenues, le titre professionnel, LinkedIn et une note libre,
So that je retrouve le contexte utile de ma relation dans sa fiche.

**Acceptance Criteria:**

**Given** un contact existant,
**When** son e-mail, son titre professionnel, son lien LinkedIn ou sa note est ajouté, modifié ou vidé,
**Then** les informations sauvegardées sont retrouvées après rechargement et les champs facultatifs peuvent rester vides,
**And** aucune photo, téléphone, adresse e-mail supplémentaire ou prochaine interaction n’est ajouté par défaut.

**Given** les règles de format e-mail/URL et l’avertissement de doublon arrêtés sous Q2,
**When** une valeur les enfreint ou un autre contact possède la même adresse,
**Then** le résultat respecte la décision Q2 avec un retour associé au champ et conservation de la saisie,
**And** le test distingue refus de format et avertissement éventuel ; aucune unicité d’e-mail bloquante n’est inventée à partir du PRD proposé.

**Given** un lien LinkedIn valide renseigné,
**When** il est activé,
**Then** le profil est ouvert à l’extérieur dans un nouvel onglet avec les protections de lien du projet,
**And** sans lien, aucune commande de profil n’est affichée ; la validation effective de l’URL suit Q2.

**Given** une note libre de contact,
**When** elle est modifiée ou effacée,
**Then** seule cette note change,
**And** aucun échange ni date d’interaction artificielle n’est créé ; les coordonnées et notes ne sont pas copiées dans les journaux techniques.

**Given** la liste et la fiche enrichies,
**When** les nouvelles saisies sont exercées selon R2 avec erreur réseau, reconnexion et édition concurrente,
**Then** elles réutilisent les garanties vérifiées en 2.1 et leurs champs sont inclus dans les versions, brouillons et invalidations,
**And** la liste respecte l’ordre relatif Prénom, Nom, E-mail, Titre professionnel, LinkedIn pour les colonnes déjà disponibles ; Dernière interaction, Société et Opportunité rejoignent leurs positions approuvées lorsque leurs domaines existent.

**Références :** FR-001 complément, FR-002/003/018 ; NFR-002/003/004 ; UX-DR5/14/27/30/33/34/36/37/39–44/48/56/57/59/61 et langage visuel UX-DR49–55. La note demeure un contenu de fiche, pas une colonne supplémentaire décidée pour Contacts.

**Dépendances :** 2.1 ; Q2 pour les formats et doublons, Q4 pour la sauvegarde hors carte. Aucune dépendance à la société ou au journal.

### Story 2.3: Relier mes contacts à leurs sociétés

As a propriétaire du CRM,
I want créer une société et lui rattacher mes contacts,
So that je consulte mes relations dans leur contexte d’entreprise.

**Acceptance Criteria:**

**Given** les contacts disponibles,
**When** Sociétés est ouvert directement puis une société est créée avec son nom,
**Then** elle est retrouvée dans sa liste et sa fiche et son nom est modifiable,
**And** un nom vide est refusé sans effacer les autres saisies ; les éventuels autres champs/colonnes sont limités aux décisions Q2/Q4 et ne deviennent pas obligatoires par déduction.

**Given** un contact et des sociétés existants,
**When** une société est choisie, remplacée ou retirée pour ce contact,
**Then** il possède zéro ou une société actuelle et la relation est cohérente dans la liste Contacts, la fiche contact et les contacts de chaque société affectée,
**And** plusieurs contacts peuvent appartenir à la même société ; modifier le lien ne supprime aucune fiche.

**Given** une société sans contact ou une relation absente,
**When** sa fiche ou le contact est consulté,
**Then** l’absence est lisible et l’utilisateur peut accéder aux fiches liées lorsqu’elles existent,
**And** aucune opportunité ni somme de gains n’est simulée ; ces extensions appartiennent à l’epic 3.

**Given** un autre onglet modifiant la société d’un contact ou le nom d’une société,
**When** une commande basée sur une ancienne version est soumise,
**Then** les champs concernés suivent le contrôle de conflit de 2.1 et les commandes vérifient le propriétaire de chaque relation,
**And** après succès les anciennes et nouvelles listes liées sont actualisées ; après échec la relation enregistrée reste cohérente et la saisie est conservée.

**Given** la nouvelle entité Société et sa relation Contact,
**When** R2 est exécuté sur création, modification, rattachement et retrait,
**Then** les contrôles RLS/RPC, absence de doublon sur retry, brouillons, reconnexion, pagination et accès clavier sont vérifiés sur ce domaine,
**And** aucun schéma Échange ou Opportunité n’est requis pour terminer la story ; l’invariance historique sera vérifiée dès l’introduction des échanges en 2.4.

**Références :** FR-005 partie annuaire, FR-009 partie relation, FR-018 ; NFR-002/003/004 ; AR-03/04/06/08/09/12 ; UX-DR1/5/6/14/15 partiel/16/18/27/30/33/34/36/37/39–44/48/57/59–61.

**Dépendances :** 2.1 et 2.2 ; Q2/Q4 pour les détails de société et les formes de fiches/formulaires. Le nom obligatoire et la cardinalité du lien sont déjà acquis. Aucun choix page/panneau de fiche secondaire n’est implicitement tranché.

### Story 2.4: Enregistrer un échange et retrouver la dernière interaction

As a propriétaire du CRM,
I want enregistrer un échange avec un contact et consulter son historique,
So that je sache quand et dans quel contexte nous avons réellement échangé.

**Acceptance Criteria:**

**Given** un contact existant et les choix de date, canal, présentation et sauvegarde arrêtés sous Q3/Q4,
**When** un échange est enregistré depuis le contexte de ce contact,
**Then** il est lié au contact et consultable avec les valeurs effectivement saisies selon Q3,
**And** le lien Contact suffit à cette livraison ; aucune entité Opportunité n’est requise et un échange sans aucun lien autorisé est refusé.

**Given** un contact avec ou sans société actuelle,
**When** l’échange est préparé,
**Then** sa société historique est préremplie depuis le contact si possible et reste modifiable explicitement,
**And** cette valeur est stockée sur l’échange indépendamment de la société actuelle du contact ; le cas sans valeur préremplissable suit la décision Q3 avant implémentation.

**Given** un échange enregistré pour le contact dans une société historique,
**When** le contact change ensuite de société ou n’en possède plus,
**Then** l’échange reste rattaché à la société historique enregistrée et reste visible dans l’historique du contact et de cette société,
**And** la nouvelle société ne récupère pas automatiquement cet échange et les notes libres du contact ne modifient toujours aucune interaction.

**Given** plusieurs échanges d’un contact ou d’une société historique,
**When** la liste Contacts ou les fiches sont consultées,
**Then** la dernière interaction reflète l’échange pertinent le plus récent, avec accès à ses informations et à ses notes selon Q3,
**And** le classement et les égalités de date suivent une politique unique arrêtée sous Q1, les horodatages sont stockés en UTC et affichés dans le contexte Europe/Paris ; sans échange le véritable état vide est affiché.

**Given** une création répétée après réponse perdue ou une erreur/session expirée pendant la saisie,
**When** la commande est réessayée ou le même propriétaire se reconnecte,
**Then** un seul échange est créé et la saisie non confirmée reste récupérable,
**And** les projections de dernière interaction et historiques contact/société sont actualisées après commit, sans afficher une réussite avant celui-ci.

**Given** des historiques dépassant la première page et les cas avec société différente de celle du contact,
**When** R2 et les scénarios de dernière interaction sont exécutés,
**Then** tous les échanges autorisés restent consultables, la dernière interaction ne dépend pas de la page chargée et les accès directs sont protégés,
**And** seules les structures Échange et projections nécessaires sont ajoutées ; aucun connecteur externe, champ d’opportunité requis ou suppression n’est introduit.

**Références :** FR-004/010/015 parties contact/société, invariance FR-009, FR-018 ; NFR-002/003/004/006 ; AR-03/04/06/08/09/12/14 ; UX-DR5/14/15 partiel/23/27/30/33/34/36/37/39–44/48/57/59–61. FR-010 côté opportunité attend l’epic 3.

**Dépendances :** 2.1–2.3 ; Q1 pour les égalités, Q3 pour date/canal/saisie/consultation, Q4 pour le formulaire. Les canaux Téléphone/E-mail/Visio/Autre, le refus d’une date future et le dernier créé à date identique ne sont pas adoptés par cette story sans leurs arbitrages.

### Story 2.5: Corriger un échange sans déformer son historique

As a propriétaire du CRM,
I want corriger les informations d’un échange déjà enregistré,
So that mes historiques et ma dernière interaction restent fidèles à ce qui s’est passé.

**Acceptance Criteria:**

**Given** un échange existant et les modalités de correction arrêtées sous Q3,
**When** une correction autorisée de ses informations est enregistrée,
**Then** le même échange est modifié et relu avec ses nouvelles valeurs,
**And** le retry de la commande ne crée pas un nouvel échange ; les champs corrigibles et règles de date/canal suivent Q3 sans permettre une suppression par défaut.

**Given** une société historique incorrecte sur un échange,
**When** elle est corrigée explicitement,
**Then** le contexte de cet échange est mis à jour dans les sociétés concernées,
**And** la société actuelle du contact et les autres échanges ne changent pas ; un changement d’employeur seul ne déclenche jamais cette correction.

**Given** l’échange qui fournissait la dernière interaction,
**When** une correction autorisée de sa date ou de son rattachement change le résultat du classement,
**Then** toutes les fiches et listes affectées affichent le nouveau résultat selon la politique Q1, y compris un échange précédent ou l’état vide lorsqu’applicable,
**And** le calcul reste cohérent pour les liens retirés et ajoutés et un échange conserve au moins son lien Contact dans cet epic.

**Given** deux onglets corrigeant le même échange,
**When** une version de champ ou d’état nécessaire à la commande n’est plus celle lue,
**Then** la commande est contrôlée atomiquement, sans écrasement silencieux ni mise à jour partielle de la relation,
**And** le brouillon et les versions de base sont préservés pour un choix explicite ; les modifications de champs réellement indépendants restent possibles conformément à AD-3.

**Given** les corrections retenues sous Q3 et la story implémentée,
**When** R2 est exécuté avec erreur réseau, reconnexion, conflits et correction de l’échange le plus récent,
**Then** valeurs, projections, pagination et droits restent cohérents après rechargement,
**And** aucune suppression définitive, archivage, historique de toutes les versions ou restauration nouvelle n’est ajouté par ce découpage.

**Références :** FR-009/010/015 parties correction et projections, FR-004/018 ; NFR-002/003/004/006 ; AR-03/04/06/08/12 ; UX-DR14/15 partiel/23/27/33/34/36/37/39–44/48/57/59/61. Toute suppression proposée dans A10 reste en réserve sous Q3/Q5 et ne fait pas partie des critères exécutables ci-dessus.

**Dépendances :** 2.4 ; Q3 pour la correction et les rattachements modifiables, Q1 pour les projections, Q4 pour la sauvegarde. Si Q3 réduit les corrections, ajuster explicitement cette story avant de la déclarer prête ; ne pas inventer les commandes manquantes.

## Couverture et revue de l’epic 2

| Exigence | Stories proposées et limite |
|---|---|
| FR-001 | 2.1 minimal + 2.2 informations ; formats/doublons Q2. |
| FR-002/003 | 2.2, LinkedIn et note de contact distincte du journal. |
| FR-004 | 2.4 et maintien après correction en 2.5. |
| FR-005 | 2.3 annuaire ; relations opportunités et gains attendent l’epic 3. |
| FR-009 | 2.3 relations, 2.4 invariance historique, 2.5 correction explicite ; extensions opportunités en epic 3. |
| FR-010/015 | 2.4 création/consultation et 2.5 correction ; Q1/Q3 conservés, suppression non adoptée, extension opportunités en epic 3. |
| FR-018 et NFR-002 | 2.1 premier parcours de brouillon, conflit et retry ; extension et recette effective dans 2.2–2.5. |
| NFR-003/004 | Socle R2 vérifié dans chacune des cinq stories. |
| NFR-006 | Règles de rattachement et projections partagées en 2.4/2.5, réutilisables par l’epic 3 ; aucun connecteur. |
| UX-DR5/6/14/16/18/23/30 | 2.1–2.5 selon surfaces, sauf liens opportunités en epic 3 ; champs/propositions visuels non promus en nouveaux choix métier. |
| UX-DR15/47 | Couverture contact/société et historique seulement ; montants gagnés et parcours société → opportunité restent epic 3. |
| UX-DR25/27/33/34/36/37/39–44/48–61 | Garanties de saisie, accès, états, accessibilité, transposition et limites appliquées au domaine de chaque story. Les références Accueil/Pipeline/Relances de UX-DR56/58 attendent l’epic 3. |
| FR-016 / UX-DR26 | Réserve Q5, aucune recherche à construire par défaut. |
| FR-017 / NFR-005 | Retirées, aucun travail correspondant. |

**Ordre : 2.1 → 2.2 → 2.3 → 2.4 → 2.5.** Chaque story a un résultat observable sans dépendre d’une story future. Les nouveaux champs et tables arrivent avec le premier usage qui les exige. Les sujets Q2/Q3/Q4 et la partie échanges de Q1 doivent être tranchés avant leurs stories dépendantes ; l’approbation de cette liste ne tranche pas ces sujets.

La story 2.1 porte l’effort initial de saisie fiable sur une seule entité minimale. Les quatre suivantes réutilisent ce mécanisme et ajoutent chacune un résultat métier borné. Aucune epic technique supplémentaire ni story globale de fiabilité différée.

Validation enregistrée : cinq stories approuvées, poursuite vers l’epic 3 déléguée. Aucune implémentation ou vérification runtime réalisée dans cette phase documentaire.
