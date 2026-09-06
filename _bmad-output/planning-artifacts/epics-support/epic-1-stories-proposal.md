---
status: approved
workflowStage: stories-approved
epic: 1
updated: 2026-09-06
sources:
  - ../epics.md
  - ../architecture/architecture-bmad-crm-2026-09-06/ARCHITECTURE-SPINE.md
  - ../architecture/architecture-bmad-crm-2026-09-06/arbitrages-restants.md
---

# Stories approuvées pour l’epic 1

Lilian approuve les trois stories et autorise le passage à l’epic 2 par « oui ». Leur portée est validée ; leurs prérequis ouverts doivent encore être résolus avant développement. Les stories sont intégrées dans epics.md.

## Epic 1: Accéder à son CRM privé

Le propriétaire peut ouvrir un espace privé, se connecter, récupérer son accès et utiliser la version hébergée. Cet epic livre un accès fonctionnel ; les contacts, opportunités et priorités métier arrivent avec leurs epics respectifs.

**Couverture :** FR-018 pour accès, récupération et gestion technique de session ; NFR-003/004 et partie Auth de NFR-006. NFR-002 et FR-018 relatifs aux brouillons métier seront vérifiés dès les premières saisies en epics 2/3, pas déclarés entièrement satisfaits ici. NFR-001 reste proposé sous Q6. NFR-005 reste retiré.

**Architecture :** AR-01/02/10/11/13 et conventions applicables AR-03/08/09/14/15. Aucune table Contacts/Sociétés/Opportunités/Tâches/Échanges créée à l’avance. Les mécanismes d’écriture métier, idempotence et conflits seront introduits avec leur première utilisation.

**UX :** UX-DR1 pour la structure et la destination Accueil ; UX-DR24/25/35 pour l’accès et les états de session ; UX-DR27/36/39–44/48–61 pour les règles applicables. Le contenu des cinq priorités et la navigation métier complète restent à livrer ultérieurement. Les maquettes métier guident le langage visuel sans valider des écrans Auth inexistants. Aucune nouvelle maquette exigée.

### Story 1.1: Initialiser le projet depuis le starter et ouvrir mon espace privé

As a propriétaire du CRM,
I want me connecter à un espace privé avec mon e-mail et mon mot de passe,
So that je puisse accéder à mon application sans exposer son contenu à d’autres comptes.

**Acceptance Criteria:**

**Given** un environnement Supabase de développement identifié et autorisé sous Q7, avec les paramètres requis disponibles hors des fichiers versionnés,
**When** l’application est initialisée depuis la référence officielle with-supabase et démarrée,
**Then** elle utilise le socle validé Next.js 15, TypeScript strict, Supabase Auth, Tailwind 4 et shadcn/ui avec les adaptations de stack-evidence.md,
**And** les exemples publics et chemins d’inscription sont retirés, les variables sont validées au démarrage et aucune table métier future n’est créée.

**Given** le compte propriétaire unique créé par la procédure d’installation et son identifiant privé configuré,
**When** ses identifiants valides sont soumis,
**Then** la session est établie et l’utilisateur arrive sur Accueil dans une structure compacte cohérente avec DESIGN.md,
**And** l’écran intermédiaire ne présente ni fausses tâches, ni faux indicateur de CRM terminé, ni liens vers des routes non livrées ; la navigation finale conserve son ordre approuvé à mesure que les routes sont introduites.

**Given** une session absente, invalide ou appartenant à un autre UUID que le propriétaire,
**When** une route privée ou un point d’accès protégé est demandé directement,
**Then** l’accès est refusé côté serveur indépendamment de la visibilité des boutons,
**And** le test avec une session non propriétaire ne nécessite pas d’ajouter une inscription ou une invitation publique ; aucun contenu privé ni secret privilégié n’est envoyé au navigateur.

**Given** des champs de connexion vides, des identifiants incorrects ou un échec réseau,
**When** la connexion est tentée,
**Then** l’utilisateur reçoit un retour français compréhensible avec états attente, succès et échec distincts,
**And** il peut réessayer, son adresse reste saisie, le mot de passe et les tokens ne sont ni journalisés ni stockés dans le mécanisme de brouillon métier.

**Given** une session qui expire ou ne peut plus être renouvelée pendant la consultation de l’espace,
**When** un accès privé est demandé,
**Then** une reconnexion est nécessaire et l’interface ne continue pas d’afficher un succès de session périmé,
**And** les éventuelles données privées en mémoire sont invalidées ; aucune commande de déconnexion explicite n’est ajoutée sans Q5, et la future récupération des brouillons métier conserve son contrat distinct.

**Given** le formulaire de connexion et la structure de navigation,
**When** ils sont parcourus au clavier et sur les tailles de recette applicables au projet,
**Then** les champs sont nommés, les erreurs associées et le focus perceptible, sans défilement horizontal de page,
**And** les composants standard proviennent de shadcn/ui, les états de chargement préservent la disposition et aucune fonction essentielle ne dépend du survol.

**Given** la story implémentée,
**When** sa recette est exécutée,
**Then** connexion correcte, refus hors session/non propriétaire, erreur de connexion et reconnexion sont exercés réellement et le contrôle TypeScript passe,
**And** les accès aux futures entités métier ne sont pas annoncés comme déjà testés ; leurs contrôles RLS et de commandes seront ajoutés lors de chaque introduction d’entité.

**Références :** FR-018 ; NFR-003/004 ; AR-01/02/10/13/14/15 ; UX-DR1/24/25/27/35/36/39–44/48–55/57/59–61 applicables à ces écrans.

**Dépendances :** aucune story. Q7 pour environnement et identité propriétaire ; Q6 seulement pour objectifs chiffrés complémentaires. La story réalise un parcours local connecté à l’environnement identifié, sans attendre l’hébergement de la story 1.3. La vérification Context7/shadcn précède tout code, conformément aux conventions projet.

### Story 1.2: Récupérer mon accès par e-mail

As a propriétaire du CRM,
I want réinitialiser mon mot de passe depuis un e-mail de récupération,
So that je retrouve mon accès si je l’ai oublié.

**Acceptance Criteria:**

**Given** la connexion fonctionnelle de la story 1.1 et une adresse propriétaire admissible au service d’envoi configuré,
**When** une récupération est demandée depuis la connexion,
**Then** Supabase déclenche le parcours de récupération vers cette adresse avec un retour autorisé dans l’environnement courant,
**And** la demande affiche un message neutre qui ne révèle pas si une adresse possède un compte, sans créer de compte supplémentaire.

**Given** un e-mail de récupération effectivement reçu,
**When** le propriétaire suit le lien valide et soumet un nouveau mot de passe conforme à la politique configurée,
**Then** le mot de passe est mis à jour et le propriétaire peut se reconnecter avec le nouveau,
**And** une tentative de connexion par l’ancien mot de passe échoue ; aucun token du lien ni mot de passe n’apparaît dans les journaux applicatifs.

**Given** un lien invalide, expiré ou déjà consommé selon le comportement Supabase,
**When** le parcours de changement de mot de passe est ouvert,
**Then** aucun changement de mot de passe ni accès privé n’est accordé,
**And** un message explique comment demander un nouveau lien sans afficher un faux succès.

**Given** un échec explicite du service d’envoi, une interruption réseau ou un refus de validation du nouveau mot de passe,
**When** la demande ou la mise à jour échoue,
**Then** le parcours conserve les informations non sensibles utiles, distingue l’erreur de la réussite et permet de réessayer,
**And** les champs et erreurs restent accessibles au clavier et les soumissions en attente ont un état identifiable.

**Given** l’environnement et le destinataire résolus sous Q7,
**When** la recette de récupération est effectuée,
**Then** elle vérifie la réception réelle, le lien, la mise à jour et la reconnexion avec le nouveau mot de passe,
**And** une réponse HTTP positive à la demande seule ne vaut pas preuve de réception ; le service d’essai Supabase est utilisé uniquement avec une adresse admissible, sans ajouter implicitement un SMTP payant.

**Références :** FR-018 ; NFR-003/004/006 ; AR-11/14/15 ; UX-DR24/27/35/36/39–44/48/57/59–61. Politique de mot de passe et comportement de lien suivent Supabase et son paramétrage vérifié, sans inventer une politique métier supplémentaire.

**Dépendances :** story 1.1 ; Q7 pour destinataire admissible, service d’envoi et URL de retour de l’environnement de développement. L’essai fonctionne avant la story 1.3, qui vérifiera ensuite le parcours sur l’URL hébergée.

### Story 1.3: Utiliser mon espace privé depuis son URL hébergée

As a propriétaire du CRM,
I want ouvrir mon espace privé depuis une URL HTTPS,
So that je puisse l’utiliser sur mon ordinateur et présenter le POC dans l’environnement prévu.

**Acceptance Criteria:**

**Given** les stories 1.1 et 1.2 fonctionnelles, ainsi que le compte/projet Supabase, le compte/projet et plan Vercel, l’URL et l’adresse de test confirmés sous Q7,
**When** la version est déployée vers cette cible exacte,
**Then** le déploiement atteint l’état Ready et son URL HTTPS correspond à la version attendue,
**And** aucun nouvel abonnement, passage à des données réelles ou mécanisme de sauvegarde quotidienne n’est introduit implicitement.

**Given** les paramètres Auth et les variables de l’environnement hébergé,
**When** la version démarre et un parcours de connexion/récupération est suivi,
**Then** les URLs de retour utilisent uniquement les origines prévues et les secrets restent absents du client et du dépôt,
**And** les versions/migrations nécessaires précèdent le code qui en dépend ; une migration échouée bloque le déploiement dépendant.

**Given** l’URL hébergée réelle,
**When** la recette parcourt connexion propriétaire, refus hors session, accès direct avec un autre compte, récupération par e-mail et reconnexion,
**Then** chaque chemin est vérifié sur cette URL, y compris la réception réelle et le retour du lien de récupération,
**And** Ready ou une compilation réussie ne suffisent pas à déclarer le parcours validé ; les preuves de vérification indiquent la version et l’environnement.

**Given** la démonstration enregistrée et ses journaux,
**When** les écrans et traces sont inspectés,
**Then** aucun contenu métier réel, mot de passe ou token n’est exposé ; les données métier futures de démonstration seront fictives,
**And** les données d’authentification strictement nécessaires au compte propriétaire restent distinctes des données métier de démonstration.

**Given** la version hébergée et l’accès par ordinateur ou écran tactile,
**When** les écrans Auth sont utilisés avec clavier et saisie réelle,
**Then** les retours d’état, le focus, les erreurs et l’adaptation des formulaires fonctionnent comme en développement,
**And** les mesures complémentaires NFR-001 ne sont affirmées que si Q6 est résolu et le protocole exécuté ; les contrôles fonctionnels requis restent obligatoires.

**Références :** FR-018 pour la recette hébergée ; NFR-003/004 et récupération NFR-006 ; AR-10/11/13/14/15 ; UX-DR24/27/35/39–44/48/57/59–61. NFR-005 explicitement exclue.

**Dépendances :** stories 1.1 et 1.2 ; Q7 avant tout déploiement réel. Pas de dépendance aux epics 2/3. Les prochains déploiements devront conserver cette même vérification de cible et des parcours introduits.

## Couverture et validation du premier epic

| Élément | Attribution et limite |
|---|---|
| Connexion privée et contrôle propriétaire | 1.1 ; extension des contrôles aux entités en epics 2/3. |
| Récupération par e-mail | 1.2 en développement, puis 1.3 sur l’URL hébergée. |
| Session expirée et reconnexion | 1.1 pour les accès ; conservation/récupération des brouillons métier à couvrir explicitement dès leur apparition en epics 2/3. |
| Démonstration hébergée et confidentialité | 1.3 ; garanties applicables dès 1.1. |
| Recherche, suppression, déconnexion explicite | Non ajoutées ; Q5 conservé. |
| Sauvegarde quotidienne et rétention | Exclues, conformément à la décision POC. |

Ordre **1.1 → 1.2 → 1.3**. Chaque story a un parcours vérifiable sans dépendre d’une story future. Trois stories approuvées, aucune mesure runtime effectuée à ce stade documentaire.

Validation enregistrée : trois stories approuvées, passage à l’epic 2 autorisé. Cet accord ne choisit pas les paramètres Q7 et ne valide pas les propositions Q5/Q6.
