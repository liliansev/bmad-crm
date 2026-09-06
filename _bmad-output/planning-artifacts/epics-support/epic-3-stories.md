---
status: adopted-by-delegation
workflowStage: story-design-complete
epic: 3
updated: 2026-09-06
decisions: decisions-deleguees.md
---

# Stories de l’epic 3 — choix délégués

Les décisions de réalisation sont prises dans le mandat de Lilian et détaillées dans [decisions-deleguees.md](decisions-deleguees.md). Elles complètent les critères ci-dessous. Les critères R2 de l’epic 2 s’appliquent à chaque nouveau domaine : accès propriétaire/RLS/RPC, validations, transactions, idempotence, conflits par champ, brouillons et générations, erreurs, revalidation des vues, clavier, états de chargement et recette réelle. Aucune fonction ne reporte sa fiabilité à la fin de l’epic.

## Epic 3: Faire avancer ses opportunités et agir au bon moment

Piloter le cycle commercial complet avec le kanban compact, les cartes éditables, une prochaine action, cinq priorités au maximum et une vue Relances exhaustive. Les rendez-vous restent dans l’agenda externe ; aucune génération de devis ou intégration n’est créée.

### Story 3.1: Créer une opportunité et la relier à mon contexte

As a propriétaire du CRM,
I want créer une opportunité et renseigner ses informations et relations,
So that je puisse suivre une affaire depuis mes contacts ou sociétés.

**Acceptance Criteria:**

**Given** les contacts et sociétés de l’epic 2,
**When** une opportunité est créée avec un titre,
**Then** elle est enregistrée par défaut À qualifier, avec montant et Notes facultatifs, société et contact principal facultatifs et indépendants,
**And** titre vide et montant négatif sont refusés sans perte de saisie ; montant HT en euros stocké exactement en centimes, vide distinct de zéro, aucune Description séparée ni date de clôture prévisionnelle, écartée explicitement du POC dans les décisions déléguées.

**Given** une création depuis une société, un contact ou Pipeline,
**When** le formulaire est ouvert puis validé,
**Then** la société ou le contact du contexte est prélié, visible et modifiable ; depuis Pipeline aucun lien n’est imposé,
**And** changer le contact principal n’impose pas sa société, et un contact peut être principal de plusieurs opportunités.

**Given** une opportunité existante, y compris gagnée ou perdue,
**When** ses informations, étape ou relations sont modifiées,
**Then** les champs restent modifiables, les relations des fiches affectées sont actualisées et le titre, les champs et liens suivent Q4 délégué,
**And** aucun changement de société/contact ne déplace les échanges historiques ni ne supprime une fiche. La liste Contacts et les fiches Contacts/Sociétés affichent et ouvrent leurs opportunités liées ; la liste Sociétés reste limitée au nom et à l’accès à sa fiche.

**Given** une nouvelle opportunité et une commande de création/modification échouée, répétée ou concurrente,
**When** les parcours R2 sont exécutés,
**Then** aucune seconde création ou perte de saisie n’apparaît, les conflits par champ sont contrôlés et les relations vérifient chaque propriétaire,
**And** seules l’entité Opportunité et ses relations nécessaires sont ajoutées ; aucun schéma Tâche n’est requis pour terminer cette story. Les cinq étapes sont fixes et les transitions sans tâche sont utilisables depuis la fiche.

**Références :** FR-005/006/008/009/011/012 partiel/018 ; NFR-002/003/004 ; AR-03/04/06/08/09/12 ; UX-DR5/6/12–18/27/30/33/34/36/37/39–44/47–61 applicables.

**Dépendances :** epic 2. Aucun besoin de story future ; clôture avec tâche introduite atomiquement quand Tâche devient disponible en 3.3.

### Story 3.2: Piloter le kanban et modifier mes cartes en place

As a propriétaire du CRM,
I want voir mes opportunités dans le kanban et modifier montant ou Notes sur leur carte,
So that je mette à jour une affaire rapidement sans quitter son contexte.

**Acceptance Criteria:**

**Given** les opportunités de 3.1,
**When** Pipeline est ouvert,
**Then** il présente À qualifier, Échange en cours, Proposition envoyée, Gagnée, Perdue, avec titre, société, montant et aperçu Notes par carte,
**And** la composition A compacte est transposée sans copier les chiffres raster comme compteurs ni ajouter de classement manuel des cartes ; l’accès à toutes les opportunités reste possible par pagination explicite.

**Given** une carte,
**When** son montant ou Notes est cliqué et modifié,
**Then** l’éditeur reste monté, le clic ne démarre ni déplacement ni ouverture du panneau, et quitter le champ déclenche une seule sauvegarde de la modification,
**And** la valeur est commune au panneau ; état en cours, confirmé, erreur et conflit sont distincts, un rendu optimiste n’est pas une confirmation et un échec conserve le brouillon.

**Given** une carte sélectionnable et un panneau fermé ou ouvert,
**When** la carte est ouverte puis une autre sélectionnée, ou le panneau fermé et l’historique navigateur parcouru,
**Then** le panneau apparaît à droite en conservant le kanban visible, le contexte URL et la sélection restent cohérents,
**And** shell client, cache isolé, préchargement, refus des réponses périmées, fermeture avec brouillon selon Q4 et absence de navigation serveur à chaque clic suivent AD-7 et les conventions.

**Given** une opportunité sans tâche,
**When** elle est déplacée entre colonnes ou son étape changée depuis la fiche au clavier,
**Then** tous les changements entre les cinq étapes sont possibles et utilisent la même commande,
**And** erreur ou conflit rétablit l’étape confirmée sans effacer une saisie indépendante ; le même chemin recevra le traitement transactionnel des tâches en 3.3 avant qu’une tâche puisse exister.

**Given** le kanban, le panneau et les cartes réels,
**When** R2 est exécuté avec zéro carte, colonne vide, texte long, petits écrans, chargement, perte réseau et édition entre onglets,
**Then** les commandes essentielles restent utilisables au clavier, les valeurs confirmées persistent et le scroll éventuel appartient au kanban plutôt qu’à la page,
**And** dimensions de chargement, focus, contraste, composition et fluidité sont vérifiés sur les composants ; modules lourds de déplacement chargés séparément, aucune conformité déduite du raster.

**Références :** FR-011/012/018 ; NFR-001/002/003/004 ; AR-04/08/09/14 ; UX-DR7–13/27/31/33/34/36/37/39–45/48–61.

**Dépendances :** 3.1. Les dates, tâches et agrégats non encore créés ne sont pas simulés.

### Story 3.3: Programmer une action et clôturer une opportunité sans incohérence

As a propriétaire du CRM,
I want programmer une prochaine action et choisir son devenir quand l’affaire se clôture,
So that je n’oublie pas un suivi et ne termine pas involontairement une tâche.

**Acceptance Criteria:**

**Given** une opportunité à n’importe quelle étape sans tâche active,
**When** Ajouter une prochaine action est validé avec intitulé et date,
**Then** une seule tâche à faire lui est liée ; intitulé requis, date requise préremplie aujourd’hui Paris et modifiable, dates passées autorisées,
**And** les opportunités gagnées/perdues acceptent cette tâche sans réouverture ; l’ajout ne transforme pas un rendez-vous en intégration agenda.

**Given** deux créations simultanées pour la même opportunité,
**When** leurs commandes arrivent,
**Then** un verrou parent et un index unique partiel garantissent au plus une tâche active, sans écriture partielle,
**And** le refus conserve la saisie et le retry idempotent ne crée pas une nouvelle tâche. La table Tâche et les RPC nécessaires arrivent dans cette story seulement.

**Given** une tâche active lors d’un passage à Gagnée ou Perdue depuis le kanban ou la fiche,
**When** le choix de clôture est présenté,
**Then** Conserver, Annuler la tâche et Abandonner sont possibles sans choix implicite,
**And** conserver/annuler met à jour étape et tâche dans une transaction ; abandon conserve les deux états, annuler ne compte jamais comme fait.

**Given** un changement concurrent d’étape ou de tâche après ouverture du choix,
**When** la clôture est confirmée,
**Then** la révision de workflow est revérifiée et un conflit refuse l’ensemble de la commande sans écraser l’autre état,
**And** un changement indépendant de Notes/montant ne bloque pas inutilement la clôture ; réouvrir ne réactive aucune tâche terminée/annulée.

**Given** les nouvelles commandes de tâche et toutes les entrées de changement d’étape,
**When** R2 exerce création, clôture, abandon, réponse perdue et concurrence,
**Then** aucune entrée ne contourne le choix ou l’unicité et les valeurs survivent au rechargement,
**And** le panneau affiche la tâche active et permet son édition intitulé/date via le dialogue explicite ; aucune gestion de tâche n’est livrée avant la protection de clôture.

**Références :** FR-011/012/013/018 ; NFR-002/003/004 ; AR-03/04/05/08/12 ; UX-DR12/17/22/28/31/33/34/36/37/39–45/48/57/59–61.

**Dépendances :** 3.1 et 3.2. Création/édition et clôture cohérentes fonctionnent avant le cycle d’achèvement de 3.4.

### Story 3.4: Terminer, reporter et corriger mes prochaines actions

As a propriétaire du CRM,
I want terminer, reporter, annuler ou rétablir une action terminée par erreur,
So that mon suivi reflète ce qu’il me reste réellement à faire.

**Acceptance Criteria:**

**Given** une tâche active,
**When** elle est marquée faite depuis le panneau,
**Then** elle devient terminée avec un horodatage d’achèvement serveur et libère la place de prochaine action,
**And** Ajouter la suivante est proposé sans formulaire automatique ni obligation ; aucune tâche n’est inventée.

**Given** une tâche active,
**When** son intitulé/date est corrigé ou son annulation confirmée,
**Then** les valeurs ou le statut sont enregistrés via les commandes partagées,
**And** l’annulation ne produit ni achèvement ni suppression ; le changement de date conserve un jour Paris sans conversion en instant.

**Given** une tâche terminée par erreur,
**When** Rétablir est demandé,
**Then** elle redevient active seulement si aucune autre tâche n’est active et sa date d’achèvement courante est retirée,
**And** sinon la commande refuse sans terminer/annuler l’autre tâche ; verrouillage parent, révision de workflow et idempotence couvrent les courses avec création/clôture.

**Given** une opportunité avec des tâches passées,
**When** la section Historique est dépliée,
**Then** elle affiche intitulé, échéance, statut et date d’achèvement des tâches terminées, triées et paginées selon Q4 délégué,
**And** les actions annulées restent distinctes des réalisées ; aucune restauration d’action annulée ou journal de toutes les versions n’est ajouté.

**Given** le parcours après appel avec tâche, montant, Notes et étape,
**When** les cinq essais du protocole Q6 et les cas d’erreur/reconnexion/conflit R2 sont exécutés,
**Then** valeurs et statuts sont retrouvés après rechargement, aucun doublon actif ne survient et les temps obtenus sont consignés,
**And** la story ne prétend satisfaire le seuil sous une minute qu’après mesure effective ; les mêmes commandes sont prêtes pour la vue Relances sans dépendre de son existence.

**Références :** FR-012/013/018 ; NFR-001/002/003/004 ; AR-04/05/08/14 ; UX-DR17/22/28/33/34/36/37/39–45/48/57/59–61.

**Dépendances :** 3.3. Pas de dépendance à Relances ou Accueil.

### Story 3.5: Retrouver et traiter toutes mes relances

As a propriétaire du CRM,
I want consulter toutes mes actions et les terminer ou reporter dans leur ligne,
So that aucune relance à faire ne soit masquée par l’accueil limité.

**Acceptance Criteria:**

**Given** des tâches actives passées, du jour et futures, y compris sur des opportunités gagnées/perdues,
**When** Relances est ouverte directement,
**Then** En retard, À faire aujourd’hui et À venir présentent toutes les tâches concernées avec Fait, intitulé, opportunité, étape et échéance,
**And** les terminées/annulées sont exclues ; compteurs globaux exacts et pages accessibles de 25 lignes, sans filtre supplémentaire.

**Given** des opportunités sans tâche active,
**When** la rubrique Opportunités sans prochaine action est consultée,
**Then** seules les opportunités ouvertes concernées sont listées avec accès au panneau et ajout de tâche,
**And** création, achèvement, annulation, rétablissement, réouverture et clôture reclassent toutes les rubriques concernées après commit.

**Given** une ligne de tâche,
**When** Fait est coché ou son échéance modifiée,
**Then** les commandes 3.4 sont exécutées sans ouvrir le panneau, une seule commande par changement de date validé,
**And** état en cours visible ; après échec les projections reviennent au confirmé avec saisie conservée, après succès la ligne rejoint sa rubrique ou disparaît des tâches à faire. Ajouter la suivante reste une proposition non obligatoire.

**Given** un onglet ouvert à minuit Paris, une reprise de focus/réseau, ou des échéances proches d’un changement d’heure,
**When** le jour métier ou les données changent,
**Then** les rubriques, leur tri date/création/UUID et les compteurs sont recalculés sans modifier les dates stockées,
**And** une tâche du jour n’est jamais en retard, un brouillon de date n’est pas écrasé par la revalidation et les réponses anciennes sont ignorées.

**Given** zéro résultat, plusieurs pages, absence d’action et échec réseau,
**When** R2 et la recette SM-002/SM-C02 sont exécutés,
**Then** les états restent compréhensibles et toutes les échues actives sont accessibles, sans tâche future/du jour/terminée/annulée dans En retard,
**And** la vue reprend la composition compacte validée, reste utilisable au clavier/tactile et offre les liens de contexte sans annoncer qu’un accueil peu rempli signifie que tout est fait.

**Références :** FR-013/014/018 ; NFR-001/002/003/004 ; AR-05/07/08/09/12/14/16 ; UX-DR1/19–22/27/29/32/34/36–44/46/48–61.

**Dépendances :** 3.3 et 3.4 ; politiques Q1/Q4 déléguées.

### Story 3.6: Voir jusqu’à cinq priorités à l’ouverture

As a propriétaire du CRM,
I want voir les actions les plus importantes dès l’accueil,
So that je commence par ce qui rapproche mes opportunités de la signature.

**Acceptance Criteria:**

**Given** des tâches actives d’opportunités ouvertes et closes,
**When** Accueil est ouvert après connexion,
**Then** seules les tâches d’opportunités ouvertes sont éligibles et zéro à cinq lignes sont affichées,
**And** les tâches closes restent dans Relances ; aucun rendez-vous agenda ni score chiffré n’est ajouté.

**Given** des tâches échues ou du jour,
**When** les places sont attribuées,
**Then** Proposition envoyée précède Échange en cours puis À qualifier, ensuite date, création et UUID croissants,
**And** si ce groupe contient plus de cinq tâches, seules les cinq premières apparaissent ; les autres restent accessibles dans Relances.

**Given** moins de cinq tâches dans le premier groupe,
**When** la sélection est complétée,
**Then** les futures sont ajoutées par date croissante, puis étape, création et UUID,
**And** aucune place vide n’est remplie artificiellement et les cas zéro, un, cinq et plus de cinq résultats sont couverts.

**Given** une sélection affichée,
**When** une tâche est terminée/reportée, une étape change, une nouvelle tâche est créée ou le jour Paris change,
**Then** la sélection est recalculée avec les mêmes règles après confirmation et au focus/reprise réseau,
**And** aucune réponse périmée ne remplace un résultat plus récent ; les libellés de retard et Aujourd’hui sont corrects.

**Given** l’accueil vide ou rempli,
**When** une opportunité ou Voir toutes les relances est activé,
**Then** le contexte s’ouvre dans le panneau ou la vue Relances complète est affichée,
**And** les lignes montrent tâche, opportunité, étape et échéance ; R2, la composition validée et le parcours reprise du matin sont exécutés, sans ajouter Fait/report à l’accueil.

**Références :** FR-014/018 ; NFR-001/002/003/004 ; AR-07/08/09/12/14/16 ; UX-DR1–4/27/29/33/36–44/46/48–61.

**Dépendances :** 3.5 pour l’accès à la vue complète ; Q1/Q4 délégués. Ce résultat ne dépend pas des agrégats ou échanges d’opportunité ajoutés ensuite.

### Story 3.7: Relier mes échanges à mes opportunités

As a propriétaire du CRM,
I want journaliser un échange lié à une opportunité, avec ou sans contact,
So that je retrouve le contexte de l’affaire sans altérer les historiques existants.

**Acceptance Criteria:**

**Given** une opportunité et le journal de l’epic 2,
**When** un échange est créé depuis son panneau,
**Then** l’opportunité est préremplie et contact seul, opportunité seule ou les deux sont autorisés ; un échange sans aucun lien contact/opportunité est refusé,
**And** le contact de l’échange peut différer du principal sans le modifier ; les mêmes règles Q3 de date, canal et sauvegarde s’appliquent.

**Given** le contexte de l’échange,
**When** la société historique est préremplie,
**Then** la société renseignée de l’opportunité prime, sinon celle du contact, sinon le lien reste vide,
**And** une correction explicite est possible ; changer ensuite les sociétés des fiches ne déplace pas l’échange historique.

**Given** un échange ajouté ou corrigé,
**When** ses liens ou sa date changent,
**Then** les dernières interactions et historiques des contacts, opportunités et sociétés historiques affectés sont recalculés selon la politique commune,
**And** retirer le dernier lien contact/opportunité est refusé atomiquement ; aucun accès direct ou cache ne révèle un lien non autorisé.

**Given** des échanges historiques de l’epic 2 et une migration compatible vers le lien Opportunité facultatif,
**When** R2 et les cas contact seul/opportunité seule/les deux sont exécutés,
**Then** les données existantes restent valides et les nouveaux scénarios conservent brouillons, idempotence, conflits et pagination,
**And** modifier les Notes d’opportunité n’ajoute jamais d’échange ni ne modifie sa dernière interaction ; aucune suppression, API publique ou intégration n’est créée.

**Références :** FR-004/009/010/015/018 ; NFR-002/003/004/006 ; AR-03/04/06/08/10/12 ; UX-DR13–15/18/23/27/33/34/36/37/39–45/47/48/57/59–61.

**Dépendances :** 2.4/2.5 et 3.1/3.2. Aucun nouveau moteur d’échanges, extension des commandes existantes seulement.

### Story 3.8: Lire le montant gagné et le contexte complet d’une société

As a propriétaire du CRM,
I want voir le montant des opportunités gagnées d’une société avec ses relations,
So that je lise son contexte commercial depuis une seule fiche.

**Acceptance Criteria:**

**Given** une société avec opportunités ouvertes, gagnées et perdues,
**When** sa fiche est ouverte,
**Then** Montant des opportunités gagnées additionne seulement les montants HT renseignés des opportunités actuellement gagnées liées, toutes dates confondues,
**And** les montants absents ont un compteur séparé, zéro renseigné reste renseigné ; aucune valeur n’est qualifiée de facturation ou d’encaissement.

**Given** aucune opportunité gagnée, ou seulement des gagnées sans montant,
**When** l’agrégat est consulté,
**Then** la somme affiche 0 € et le compteur de montants manquants est visible s’il est non nul,
**And** la somme et le compteur portent sur tout le périmètre autorisé, pas seulement la page chargée.

**Given** un changement de montant, d’étape ou de société d’une opportunité,
**When** la transaction est confirmée,
**Then** sommes et compteurs des sociétés affectées sont revalidés avec les listes/panneaux concernés,
**And** une erreur ne confirme aucun faux total ; les réponses anciennes ne remplacent pas les agrégats récents et aucun recalcul ne perd un brouillon local.

**Given** les trois epics intégrés avec leurs données fictives,
**When** le parcours société → contacts/opportunités/échanges → création d’opportunité préliée est exécuté,
**Then** les relations sont navigables, l’historique reste exact après changement d’employeur et tous les champs/colonnes de l’UX finale sont présents,
**And** le parcours fonctionne avec valeurs absentes, plusieurs pages, clavier et écran tactile ; R2 et les mesures Q6 documentent la version réelle sans affirmer une réussite sur la seule compilation.

**Références :** FR-005/006/007/009/010/018 ; NFR-001/002/003/004 ; AR-06/08/09/12/14/16 ; UX-DR5/6/14/15/18/27/30/33/36/37/39–44/47–61.

**Dépendances :** 3.1 et 3.7 pour le contexte complet ; aucun domaine futur. L’agrégat est une projection, pas un nouveau modèle de facturation.
