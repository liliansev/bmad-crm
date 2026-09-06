# Préparation du découpage

Le 6 septembre 2026, Lilian valide l’architecture et autorise le passage à la spécification, puis au découpage en epics et stories. Les sources déjà identifiées dans cette session sont reprises : PRD, paire DESIGN/EXPERIENCE, architecture et ses compagnons, SPEC et couverture. Aucun document concurrent ni choix de dossier ambigu n’a été trouvé.

Étape courante : `step-01-validate-prerequisites`. Les exigences sont extraites dans `epics.md` ; cette extraction est distincte de la validation de l’architecture. Les choix Q1–Q7 restent proposés ou différés. Aucune liste d’epics ni story n’est créée dans cette étape.

Le passage à `step-02-design-epics` attend la confirmation de cet inventaire par Lilian. `stepsCompleted` reste vide tant que cette confirmation n’a pas été reçue. Les documents et règles déjà validés ne sont pas à redemander individuellement.

Vérification de l’inventaire : 18 identifiants FR (dont FR-016 proposé et FR-017 retiré), six identifiants NFR (dont NFR-005 retiré), 16 exigences d’architecture et 61 points UX avec statuts et provenance. Les dix documents d’entrée et neuf compagnons de SPEC sont présents. Les marqueurs réservés au découpage futur sont conservés. Extraction UX détaillée : [ux-requirements-extraction.md](ux-requirements-extraction.md).

Lilian confirme l’inventaire par « c ». Étape 1 terminée ; passage à la conception des epics, sans validation implicite des arbitrages Q1–Q7.

Étape 2 préparée : [proposition de trois epics](epic-proposal.md), avec couverture des 18 identifiants FR et attribution des exigences transversales. Relecture indépendante terminée : aucun besoin de quatrième epic ; contrôle des extensions de relations, FR-018 transversal, fiabilité dès la saisie et arbitrage Q1 aussi pour les échanges. Ces points figurent dans la proposition. Liste non approuvée à ce stade ; attente de validation de Lilian avant intégration définitive et création de stories.

Lilian valide les trois epics et leur ordre par « valider et continuer ». Liste et couverture intégrées dans epics.md ; étape 2 terminée. Étape 3 engagée, epic 1 en premier ; Q1–Q7 restent ouverts.

Epic 1 : trois stories proposées dans epic-1-stories-proposal.md (1.1 accès privé, 1.2 récupération par e-mail, 1.3 recette hébergée), avec 17 scénarios Given/When/Then/And. Vérification documentaire et relecture indépendante terminées sans anomalie ; dépendances séquentielles, Q7 explicite, Q5/Q6 non arbitrés, garanties métier reportées uniquement à leur première saisie. Ces stories restent proposées en attente de revue utilisateur ; aucune story des epics suivants ni étape finale chargée. Aucun runtime exécuté.

Lilian approuve les trois stories de l’epic 1 par « oui » et autorise le passage à l’epic 2. Stories 1.1–1.3 intégrées dans epics.md, sans prétendre leurs prérequis résolus ni leur code exécuté. Étape 3 toujours en cours.

Epic 2 préparée : cinq stories proposées (2.1 contact minimal fiable, 2.2 informations et note, 2.3 sociétés et relations, 2.4 échanges et dernière interaction, 2.5 correction d’échange), 28 scénarios structurés. Sources et numérotation vérifiées ; relecture indépendante terminée. Clarification appliquée en 2.1 : rendu optimiste en cours, confirmation seulement après commit, retour des projections à la valeur confirmée en cas d’échec avec brouillon conservé. Couverture contact/société complète ; aucune recherche/suppression ni décision Q ajoutée. Stories en attente de validation utilisateur avant intégration. Aucun runtime exécuté.

Lilian approuve les cinq stories de l’epic 2 et délègue les décisions pour accélérer tâches/relances et passer au skill suivant sans menus. Les détails de réalisation Q1–Q6 sont enregistrés dans decisions-deleguees.md comme choix de l’agent, sans prétendre une validation individuelle. Huit stories epic 3 intégrées ; total 16. Q7 reste externe. Étape 3 terminée, revue finale engagée. Titre 1.1 précisé pour rendre visible le starter déjà compris dans son périmètre, sans changement fonctionnel.

Revue finale terminée : 16 stories, 82 scénarios, couverture FR/UX/AR/NFR/SM vérifiée et relecture indépendante corrigée. Menus de validation non répétés conformément au mandat utilisateur. Skill create-epics-and-stories terminé ; bmad-help consulté, catalogue confirme Sprint Planning comme prochaine étape requise. bmad-sprint-planning exécuté : plan PASS, verdict global CONCERNS pour Q7 externe ; génération du backlog poursuivie dans la délégation, aucun ready-for-dev implicite.
