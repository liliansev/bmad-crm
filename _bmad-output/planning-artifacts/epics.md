---
stepsCompleted:
- step-01-validate-prerequisites
- step-02-design-epics
- step-03-create-stories
- step-04-final-validation
status: final
workflowStage: complete
inputDocuments:
- prds/prd-bmad-crm-2026-09-05/prd.md
- ux-designs/ux-bmad-crm-2026-09-06/DESIGN.md
- ux-designs/ux-bmad-crm-2026-09-06/EXPERIENCE.md
- architecture/architecture-bmad-crm-2026-09-06/ARCHITECTURE-SPINE.md
- architecture/architecture-bmad-crm-2026-09-06/reconcile-inputs.md
- architecture/architecture-bmad-crm-2026-09-06/arbitrages-restants.md
- architecture/architecture-bmad-crm-2026-09-06/stack-evidence.md
- architecture/architecture-bmad-crm-2026-09-06/hosting-options.md
- ../specs/spec-bmad-crm/SPEC.md
- ../specs/spec-bmad-crm/coverage.md
- epics-support/decisions-deleguees.md
updated: '2026-09-06'
---

> **Périmètre courant réduit le 8 septembre 2026 sur demande de Lilian pour limiter temps/crédits :** POC Contacts + Pipeline kanban simple. Société retirée de l’interface principale, données historiques conservées. Stories3.3–3.8 reportées ; pagination globale25 et recette ciblée pour3.2 remplacent sa version étendue. Le détail ci-dessous reste le backlog initial, pas la promesse du livrable courant. Voir `../implementation-artifacts/mandat-v1-avant-bmad06.md`.


# bmad-crm - Epic Breakdown

## Overview

Inventaire, trois epics et stories des epics 1/2 approuvés par Lilian. Epic 3 et poursuite vers le skill suivant délégués explicitement. Le plan comporte 16 stories ; revue finale terminée, aucune n’est annoncée implémentée. Le [contrôle de préparation](implementation-readiness.md) conserve une réserve opérationnelle Q7 avant exécution ; le suivi peut être généré en backlog.

**Source actuelle pour les anciens arbitrages : [décisions déléguées](epics-support/decisions-deleguees.md).** Q1–Q6 sont résolus par ces décisions de réalisation. Leurs règles concrètes font partie des critères d’acceptation de chaque story qui les référence, même lorsque le texte historique dit « Q à arrêter ». FR-016/recherche et suppression d’échange ne sont pas dans le POC ; FR-017 et NFR-005 restent retirés. Q7 désigne seulement les paramètres externes à identifier avant utilisation. Les garanties transversales R2 sont intégrées à chaque nouvelle saisie, jamais reportées.

Le [découpage approuvé](epics-support/epic-proposal.md) conserve la justification des trois epics. Les propositions sources dans epics-support servent de traces, pas de fichiers de stories prêts à développer. epics.md est l’unique entrée canonique du générateur de sprint.

## Requirements Inventory

### Functional Requirements

FR-001: Ajouter et modifier un contact. Les valeurs enregistrées sont retrouvées après rechargement. Un e-mail mal formé empêche la sauvegarde et affiche une erreur près du champ sans effacer la saisie. Une adresse déjà utilisée sur un autre contact déclenche un avertissement non bloquant.

Statut : Noyau validé ; format e-mail et avertissement de doublon restent proposés sous Q2.

FR-002: Accéder à LinkedIn. Une URL HTTP(S) renseignée ouvre le profil dans un nouvel onglet. Une URL invalide est refusée ; sans URL, aucune action de profil n'est affichée.

Statut : Lien LinkedIn retenu dans l’UX ; validation détaillée de l’URL sous Q2.

FR-003: Notes de contact. Le freelance peut ajouter, modifier ou vider une note libre ; cette opération n'ajoute aucun échange.

Statut : Note de contact héritée du PRD, distincte des échanges ; formulaire et champs résiduels sous Q2.

FR-004: Dernier échange du contact. La fiche affiche le canal et la date/heure de l'échange le plus récent associé à ce contact, ainsi que l'accès à ses notes. Sans échange, elle affiche « Aucun échange enregistré ».

Statut : Dernière interaction retenue ; accès et détails de saisie sous Q3, départage sous Q1.

FR-005: Gérer une entreprise. Le freelance crée et modifie une entreprise, consulte les contacts et opportunités liés et ouvre leurs fiches. Un nom vide empêche l'enregistrement.

Statut : Nom obligatoire et accès Sociétés validés ; autres champs et présentation sous Q2.

FR-006: Relier les opportunités. Une opportunité créée depuis l'entreprise est préliée ; depuis une opportunité, le freelance peut choisir une entreprise existante ou retirer ce lien. La relation apparaît de façon identique sur les deux fiches après sauvegarde. Réalise UJ-003.

Statut : règles validées dans le PRD et ses corrections.

FR-007: Montant des opportunités gagnées. **Validé :** afficher la somme des montants HT renseignés des opportunités actuellement gagnées liées à l’entreprise, toutes dates confondues, et le nombre d’opportunités gagnées sans montant. Un montant absent est exclu de la somme et signalé, jamais présenté comme un montant zéro renseigné. Un zéro explicitement saisi reste un montant renseigné. Le total et le compteur sont recalculés après modification d’un montant, changement d’étape ou changement d’entreprise. En l’absence de montant renseigné, afficher 0 € avec le compteur de montants manquants s’il est non nul. Libellé : « Montant des opportunités gagnées ».

Statut : règles validées dans le PRD et ses corrections.

FR-008: Contact principal. Choisir, remplacer ou retirer le contact principal d'une opportunité. Le choix est indépendant de l'entreprise de l'opportunité ; changer l'employeur d'un contact ne force pas à modifier les opportunités dont il est contact principal.

Statut : règles validées dans le PRD et ses corrections.

FR-009: Modifier les liaisons. Modifier une relation ne supprime ni la fiche liée ni les échanges historiques. Les différences d'entreprise entre contact principal et opportunité ne bloquent pas la modification. Le rattachement historique d'entreprise des échanges est conservé ; sa correction est explicite sur l'échange.

Statut : règles validées dans le PRD et ses corrections.

FR-010: Dernier échange sur chaque fiche. **Validé :** le contact affiche ses échanges ; l'opportunité affiche ceux explicitement liés à elle ; l'entreprise affiche les échanges dont elle est l'entreprise historique enregistrée. Un changement d'employeur ou d'entreprise de l'opportunité ne déplace pas les anciens échanges. L'entreprise de l'échange est préremplie depuis l'opportunité, sinon depuis le contact, et reste modifiable. `[ASSUMPTION A07 — détails résiduels]` La date la plus récente détermine le dernier échange ; à date identique, le dernier créé est retenu. Sans entreprise préremplissable, le lien reste vide jusqu'à modification explicite.

Statut : Liens historiques validés ; départage de dates identiques sous Q1.

FR-011: Créer et modifier toute opportunité. Le freelance peut modifier chaque champ de toute opportunité, y compris gagnée ou perdue. Titre vide et montant négatif sont refusés sans perte des autres champs. Réalise UJ-001.

Statut : règles validées dans le PRD et ses corrections.

FR-012: Parcourir le pipeline. Voir les opportunités par étape et changer leur étape depuis leur fiche ; le déplacement par glisser-déposer est validé par l’UX, avec commande équivalente depuis la fiche. Tous les passages entre étapes sont autorisés. Passer à Gagnée ou Perdue demande, si une prochaine action est à faire, de choisir explicitement entre la conserver et l’annuler ; abandonner ce changement conserve l’étape et l’action. Une action annulée par ce choix ne compte pas comme réalisée. Rouvrir ne réactive pas les actions terminées ou annulées et place l'opportunité dans « Opportunités sans prochaine action » si nécessaire.

Statut : règles validées dans le PRD et ses corrections.

FR-013: Piloter la prochaine action. Créer ou modifier la prochaine action, y compris reporter sa date, puis la marquer terminée. Il ne peut pas exister deux actions à faire sur la même opportunité. Après achèvement, proposer une nouvelle action sans la rendre obligatoire ; l'action terminée reste consultable avec sa date d'achèvement. **Validé :** les opportunités gagnées ou perdues acceptent une prochaine action sans réouverture. Le freelance peut annuler une action inutile ou rétablir une action terminée par erreur ; si une autre action est déjà à faire, le rétablissement n’est pas effectué tant que cette action n’a pas été explicitement terminée ou annulée. Aucune seconde action à faire n’est créée silencieusement. Réalise UJ-001 et UJ-002.

Statut : Unicité, intitulé/date et transitions validés ; modalités de formulaire et historique sous Q4.

FR-014: Voir les relances. L’Accueil après connexion présente au plus cinq tâches d’opportunités ouvertes : échues/du jour par proximité de signature, puis prochaines échéances s’il reste des places. La vue Relances séparée présente, sans filtre actif par défaut, « En retard », « À faire aujourd’hui » et « Opportunités sans prochaine action ». Les tâches Gagnée/Perdue sont exclues des cinq priorités mais restent dans Relances. Toutes les actions des deux premières rubriques sont accessibles, triées par date croissante puis titre, avec compteurs et accès direct à l'opportunité. Les actions futures sont accessibles dans « À venir ». **Validé :** les actions à faire restent visibles quelle que soit l’étape de leur opportunité ; les actions terminées ou annulées sont exclues des relances. La rubrique « Opportunités sans prochaine action » ne contient que les opportunités ouvertes. Un filtre utilisateur éventuel est visible et réinitialisable ; il ne change pas les compteurs globaux. Terminer, annuler, rétablir ou reporter une action actualise la bonne rubrique. Un onglet laissé ouvert recalcule le jour à minuit Paris et lors du retour au premier plan. Réalise UJ-002.

Statut : Accueil et Relances distincts, cinq maximum et filtre ouvert validés ; départages/classement exhaustif sous Q1, filtres supplémentaires non adoptés.

FR-015: Journaliser un échange. `[ASSUMPTION A10]` Créer, modifier ou supprimer après confirmation un échange daté, avec canal Téléphone/E-mail/Visio/Autre et notes facultatives. Date/heure courante et contact sont préremplis quand connus ; une date future est refusée. **Validé :** un contact ou une opportunité doit être lié, les deux sont possibles. L'opportunité est préremplie depuis sa fiche. Le contact de l'échange peut différer du contact principal ; cela ne modifie pas ce dernier. L'entreprise historique suit FR-010. Sauvegarder actualise FR-004 et FR-010. Supprimer ou antidater l'échange le plus récent fait réapparaître le précédent, ou l'état vide. Réalise UJ-001.

Statut : Liens contact/opportunité et société historique validés ; modalités A10 sous Q3, suppression non autorisée implicitement.

FR-016: Retrouver une fiche. Rechercher les contacts par nom ou e-mail, les entreprises par nom et les opportunités par titre, sans distinction de casse. Aucune correspondance affiche un état vide avec possibilité de créer.

Statut : NON RETENUE POUR LE POC — Q5 délégué. Aucune story de recherche.

FR-017: Hors V1 : archivage et restauration de fiches. Exigence retirée du périmètre sur décision de Lilian ; identifiant conservé pour la traçabilité, sans comportement à implémenter.

Statut : RETIRÉE DU PÉRIMÈTRE. Aucun comportement à implémenter.

FR-018: Accès privé avec e-mail et mot de passe. **Validé :** la version hébergée est réservée à un compte propriétaire unique créé à l’installation, sans inscription publique ni invitation. Le propriétaire se connecte avec son adresse e-mail et son mot de passe ; il peut réinitialiser son mot de passe par e-mail en cas d’oubli. Sans session authentifiée, les données et leurs opérations sont inaccessibles. Si la session expire pendant une saisie, le contenu est récupéré après reconnexion au compte propriétaire sans ressaisie et sans prétendre qu’il a déjà été enregistré. Une sauvegarde en échec conserve la saisie et affiche une erreur claire. `[ASSUMPTION A11 — détail restant]` La déconnexion explicite reste proposée ; les modalités techniques de session et de réinitialisation appartiennent à l’architecture.

Statut : Accès et récupération validés ; paramètres d’essai sous Q7, déconnexion explicite proposée sous Q5.

### NonFunctional Requirements

NFR-001: Réactivité. Sur un jeu fictif de 100 contacts, 50 entreprises, 200 opportunités et 1 000 échanges, les vues principales deviennent utilisables en moins de 2 s et une sauvegarde reçoit confirmation en moins de 1 s dans au moins 19 essais sur 20, sur la configuration de recette documentée. L'ouverture d'une fiche et la soumission affichent une réaction visuelle en moins de 100 ms.

Statut : Cibles de recette retenues sous Q6 délégué ; jamais présentées comme déjà mesurées.

NFR-002: Persistance et échecs. Une sauvegarde confirmée résiste au rechargement et à la reconnexion. **Validé :** une erreur conserve la saisie, signale l’échec et permet de réessayer ; aucun succès trompeur. Après expiration de session, la saisie est récupérable après reconnexion conformément à FR-018 ; cela ne vaut pas confirmation d’enregistrement. Une soumission répétée pendant l'attente ne crée pas de doublon. **Validé en architecture :** avertir avant de remplacer un même champ modifié entre-temps dans un autre onglet, conserver la saisie et permettre un choix explicite. Aucun écrasement silencieux ; pas de collaboration temps réel attendue.

Statut : Garanties validées et renforcées par AD-3/7 ; aucun dernier-écrit-gagnant silencieux.

NFR-003: Usage web. Recette à 1440 × 900 et 402 × 874, sans défilement horizontal de la page ; un pipeline peut défiler dans sa propre zone. Champs nommés, erreurs associées, parcours clavier, focus perceptible et fermeture des dialogues par Échap. Une action essentielle ne dépend jamais du glisser-déposer ou du survol.

Statut : Conventions d’accessibilité et adaptation applicables ; protocole de recette complémentaire sous Q6.

NFR-004: Confidentialité. Vérifier l'accès propriétaire pour toute lecture/écriture de données, y compris accès direct. Connexion chiffrée dès qu'hébergée hors de la machine locale, secrets absents du client, aucune note ni coordonnée complète dans les journaux techniques. Utiliser exclusivement des données fictives pour les démonstrations enregistrées.

Statut : Accès privé et confidentialité appliqués par AD-1/8.

NFR-005: Retirée du POC : sauvegarde de secours planifiée. Le 6 septembre 2026, Lilian retire la sauvegarde quotidienne conservée sept jours pour le POC Supabase + Vercel. Le bloc associé de perte maximale de 24 heures et de restauration en moins d’une journée n’est plus un critère de recette du POC. Aucun mécanisme de sauvegarde de secours ni abonnement correspondant à prévoir. La persistance des enregistrements et la conservation de saisie de NFR-002 restent applicables.

Statut : RETIRÉE DU POC : ni sauvegarde quotidienne, ni rétention sept jours, ni coût associé à prévoir.

NFR-006: Évolution. La V1 fonctionne sans intégration commerciale externe ; l’envoi d’e-mails de récupération d’accès est inclus. L'architecture doit expliquer comment une future importation d'échanges réutilisera les mêmes règles de rattachement et de dernier échange, sans imposer de ressaisie des contacts et opportunités existants. Aucun connecteur ni API publique à construire maintenant.

Statut : Extension ultérieure via règles existantes seulement ; aucun connecteur à construire.

### Additional Requirements

- AR-01 — **Socle à traiter dans la première story de fondation :** Next.js 15 sur Vercel, Supabase PostgreSQL/Auth ; référence officielle `with-supabase` à adapter, pas à reprendre aveuglément. Épingler versions du socle sourcées, middleware Next 15, Tailwind 4, retirer signup et démonstration publique ; Context7 et inspection shadcn avant code.
- AR-02 — AD-1 : compte propriétaire unique initialisé hors inscription publique, UUID propriétaire vérifié dans les lectures/commandes et RLS ; aucune clé privilégiée côté navigateur.
- AR-03 — AD-2 : Server Actions et validations Zod partagées, mutations RPC transactionnelles ; droits DML directs supprimés, fonctions autorisées seulement et vérification propriétaire. Migrations versionnées pour schéma, fonctions, contraintes et permissions.
- AR-04 — AD-3 : versions par champ pour conflit, révision globale pour cache, commande idempotente persistée atomiquement ; ne pas effacer un brouillon ou doubler une écriture après une réponse réseau perdue.
- AR-05 — AD-4 : index unique partiel d’action active et verrouillage parent-opportunité avant tâche ; révision de workflow et clôture/conservation-annulation atomiques ; réouverture sans résurrection d’action.
- AR-06 — AD-5 : noms minimaux, liens facultatifs indépendants, Notes unique, société historique stockée ; calcul commun des dernières interactions et sommes de gains avec compteur de montants absents.
- AR-07 — AD-6 : politiques partagées de date Paris et sélection ; Accueil ne limite pas Relances. Pagination explicite et compteurs globaux ; Q1 avant classement définitif.
- AR-08 — AD-7 : brouillons par propriétaire/entité/champ avec versions de base et génération ; confirmation limitée à la génération enregistrée, revalidation des vues à focus/reconnexion/reprise réseau sans perdre la saisie.
- AR-09 — AD-7 et conventions projet : shells client, panneau/cache par entité, édition montée, préchargement, états de chargement aux dimensions finales, modules lourds chargés séparément ; aucun aller-retour de navigation serveur à chaque ouverture de panneau.
- AR-10 — AD-8 : données fictives pour développement et démonstration, seed séparé, environnements validés, aucune cible réelle touchée implicitement ; migrations compatibles avant code consommateur, déploiement dépendant bloqué si migration échoue.
- AR-11 — AD-8 : journaux sans notes/coordonnées complètes/tokens ; récupération Auth e-mail à tester avec une adresse admissible au service d’essai Supabase ou à résoudre sous Q7. Aucune souscription implicite.
- AR-12 — Conventions : UUID, montants exacts en centimes avec absence distincte de zéro, dates de tâches sans conversion en instant ; horodatages des échanges UTC, affichage Paris ; DTO partagés et retours d’erreur typés.
- AR-13 — Périmètre : Supabase et Vercel seuls ; pas de Neon, Prisma, Better Auth, sauvegarde de secours, API publique, connecteurs, Realtime collaboratif ou fonction de template ajoutée par défaut.
- AR-14 — Recette : parcours SM-001 chronométrés selon bornes validées, rechargement et récupération, conflits entre onglets et refus d’accès exécutés réellement ; QA navigateur via agent-browser, aucune revendication de réussite fondée sur compilation seule. Q6 pour les cibles complémentaires.
- AR-15 — Arbitrages Q1–Q7 : un choix partagé avant toute story dépendante ; jamais un choix différent par epic. Les questions n’empêchent pas de préparer les tranches indépendantes, mais aucune story concernée ne devient prête sans réponse.

- AR-16 — Recette métier complémentaire : SM-002 toutes les relances échues à faire sont accessibles avec compteurs exacts ; SM-C01 aucune perte après rechargement ; SM-C02 zéro tâche du jour/future/terminée/annulée en retard. Nombre d’essais sous Q6.

### UX Design Requirements

Cette extraction accompagne la préparation du découpage ; elle ne contient ni epics ni stories. Les règles validées et héritées ci-dessous sont distinguées des propositions encore ouvertes. La validation de l’architecture ne transforme pas Q1–Q7 en décisions. Les détails de transposition technique peuvent être résolus en respectant les comportements acquis, sans validation humaine de chaque pixel.

Sources abrégées : **D** = DESIGN.md ; **E** = EXPERIENCE.md ; **R** = reconcile-inputs.md ; **Q** = arbitrages-restants.md. Les chemins complets figurent dans inputDocuments en tête de ce document. « Acquis » désigne une décision explicite ou une exigence PRD/globales héritée dans ces documents ; « Proposition » reste hors critères fermes tant que son arbitrage manque. Une composition approuvée n’est pas une preuve de fonctionnement.

#### Composants nommés et comportements vérifiables

| ID | Composant / surface | Exigence vérifiable | Statut et provenance |
|---|---|---|---|
| UX-DR1 | Navigation principale | Sur ordinateur, afficher un menu latéral gauche dans l’ordre Accueil, Contacts, Sociétés, Pipeline, Relances. Sociétés et Relances ont chacune un accès direct. Après connexion, ouvrir Accueil. | Acquis UX ; D Layout, E Foundation/Information Architecture. |
| UX-DR2 | Priorités de l’accueil — éligibilité | Afficher de zéro à cinq tâches à faire, liées uniquement aux opportunités ouvertes. Ne pas ajouter de ligne vide pour atteindre cinq ; ne pas inventer de tâche. Les tâches des opportunités gagnées/perdues restent consultables dans Relances. | Acquis UX puis R ; E Component/State Patterns. |
| UX-DR3 | Priorités de l’accueil — sélection | Remplir d’abord avec les tâches en retard ou du jour, en privilégiant la proximité de signature, puis avec les dates à venir les plus proches si des places restent disponibles. Dans le premier groupe, une relance après devis envoyé précède une relance de premier contact. Ne pas transformer ce classement en score affiché. | Acquis UX ; E Component Patterns. Ordre exhaustif et égalités : Q1, non validés. |
| UX-DR4 | Priorités de l’accueil — composition | Présenter Tâche, Opportunité liée, Étape et Échéance ; fournir l’accès au contexte et « Voir toutes les relances ». Signaler le retard sans traiter une échéance du jour comme déjà en retard. Garder l’accès à Relances même quand la sélection est vide. | Acquis composition ; D Components, E State Patterns/UJ-002. Forme du retour au contexte ouverte. |
| UX-DR5 | Liste de contacts | Afficher dans cet ordre Prénom, Nom, E-mail, Titre professionnel, Dernière interaction, LinkedIn, Société, Opportunité. Fournir les relations accessibles, LinkedIn en lien externe et « Nouveau contact ». Ne pas ajouter photo, avatar, récupération automatique de photo ou prochaine interaction à la composition approuvée. | Acquis UX ; D/E Components. Les colonnes ne rendent pas les champs obligatoires. |
| UX-DR6 | Liste de sociétés | Rendre la liste accessible directement depuis Sociétés et permettre les capacités PRD de consultation, création et modification. Employer « Sociétés » pour l’entité Entreprise du PRD, sans créer une deuxième entité. | Acquis navigation/capacités ; D Components, E Information Architecture. Colonnes, tri et forme d’ouverture non validés ; Q2/Q4, recherche Q5. |
| UX-DR7 | Kanban — colonnes | Présenter les cinq étapes fixes dans cet ordre : À qualifier, Échange en cours, Proposition envoyée, Gagnée, Perdue. La vue ordinateur de référence montre les cinq colonnes ; aucune personnalisation des étapes n’est ajoutée. | Acquis UX/PRD ; D Layout, E Voice/Component Patterns. |
| UX-DR8 | Kanban — carte | Sur chaque carte, montrer titre, société, montant et aperçu des notes. Présenter « Nouvelle opportunité » au-dessus du kanban. Les chiffres 1–5 présents sur le raster ne doivent pas être utilisés comme compteurs métier. | Acquis composition ; D Components/Defauts raster, E Kanban. |
| UX-DR9 | Kanban — édition en place | Un clic sur le montant ou les notes permet de modifier le champ sur la carte, sans ouvrir le panneau. Ce clic ne doit ni ouvrir la fiche ni démarrer un déplacement. Carte et panneau modifient la même valeur. | Acquis UX ; E Kanban/Interaction Primitives, R Notes. |
| UX-DR10 | Kanban — sortie de champ | Quitter le champ montant ou notes déclenche automatiquement la sauvegarde ; aucun bouton Enregistrer ni sauvegarde à chaque frappe n’est déduit de ce choix. Distinguer saisie, enregistrement en cours et confirmation réelle. | Acquis UX ; D Kanban, E Interaction Primitives. |
| UX-DR11 | Kanban — changement d’étape | Autoriser le glisser-déposer entre étapes et conserver une commande de changement d’étape dans la fiche. Le déplacement visuel n’est pas une preuve de sauvegarde. Aucun réordonnancement manuel dans une colonne n’est implicitement adopté. | Acquis UX/PRD ; E Kanban/Interaction Primitives. |
| UX-DR12 | Panneau opportunité — composition | Depuis le kanban, ouvrir la fiche à droite en laissant le kanban visible. Mettre montant estimé HT en euros, étape et Notes au premier plan ; société, contact et accès « Ajouter une prochaine action » au second niveau. | Acquis UX/composition ; D/E Panneau opportunité. Dimensions et modalité techniques à résoudre. |
| UX-DR13 | Panneau opportunité — Notes | Fournir une unique zone de texte Notes modifiable, partagée avec la carte, sans Description distincte et sans entrée datée créée à chaque édition. Modifier Notes ne crée aucun échange et ne modifie pas Dernière interaction. | Acquis UX puis R ; E Panneau opportunité/UJ-001. |
| UX-DR14 | Fiche contact | Rendre consultables informations, relations et échanges prévus au PRD ; ouvrir LinkedIn à l’extérieur si renseigné. La note du contact reste distincte d’un échange et son édition ne crée pas de fausse interaction. | Hérité PRD ; D/E Fiche contact, parcours Contacts. Forme page/panneau et modalités d’édition ouvertes Q4. |
| UX-DR15 | Fiche société | Présenter les contacts, opportunités et « Montant des opportunités gagnées » avec un compteur distinct de montants absents. Distinguer absence de montant et zéro ; ne pas nommer cet agrégat facturation, encaissement ou chiffre d’affaires facturé. Conserver l’accès au contexte des échanges historiques. | Hérité PRD ; D/E Fiche société, UJ-003. Forme, hiérarchie et séquence A04 encore proposées Q4. |
| UX-DR16 | Formulaire métier — création minimale | Autoriser la création d’un contact avec au moins un prénom ou un nom, et d’une société avec son nom. Ne pas imposer d’autre information pour ces minimums. Une opportunité a un titre obligatoire et commence par défaut à À qualifier, étape modifiable. | Acquis R, E Formulaire métier/UJ-001. Champs résiduels Q2. |
| UX-DR17 | Formulaire métier — montant et action | Le montant reste facultatif ; s’il est saisi il est positif ou nul, et une absence n’est pas convertie en zéro. Une tâche exige un intitulé et une échéance à la journée, sans heure. Appliquer ces contraintes dans toutes les vues de saisie. | Acquis R ; E Formulaire métier/Suivi des actions. |
| UX-DR18 | Formulaire métier — relations | Permettre zéro ou une société actuelle par contact et plusieurs opportunités. Société et contact principal d’une opportunité sont facultatifs et indépendants ; ne pas forcer leur concordance. Changer la société du contact ne déplace ni ses échanges historiques ni les sociétés des opportunités existantes. | Acquis R et PRD hérité ; E Formulaire métier/UJ-003. |
| UX-DR19 | Suivi des actions — composition Relances | Afficher les rubriques En retard, À faire aujourd’hui, À venir, Opportunités sans prochaine action et leurs compteurs contextuels. Chaque tâche présente Fait, tâche, opportunité, étape et échéance éditable. | Acquis composition ; D/E Suivi des actions/State Patterns. |
| UX-DR20 | Suivi des actions — actions directes | Permettre de marquer une tâche faite ou de changer sa date directement dans la ligne Relances, sans ouverture préalable de la fiche opportunité. Après réussite, une tâche terminée sort des tâches à faire et une date modifiée replace la tâche dans la rubrique correspondante. | Acquis UX ; E Suivi des actions/UJ-002. |
| UX-DR21 | Suivi des actions — périmètre et cohérence | Relances contient toutes les tâches à faire, y compris celles des opportunités gagnées/perdues ; les tâches terminées/annulées en sont exclues. Sans prochaine action ne contient que les opportunités ouvertes concernées. L’accueil limité à cinq ne doit jamais tronquer cette vue complète. | Hérité PRD + R ; E State Patterns/UJ-002. |
| UX-DR22 | Suivi des actions — cycle | Maintenir au plus une action à faire par opportunité. Permettre de programmer la suivante après achèvement, de reporter, annuler et corriger conformément au PRD ; rétablir une action ne doit jamais créer deux actives ou remplacer implicitement une autre. | Hérité PRD ; E Suivi des actions/UJ-002. Accès, formulaire et historique restent Q4. |
| UX-DR23 | Journal d’échanges | Chaque échange possède au moins un lien vers contact ou opportunité, éventuellement les deux. Garder son entreprise historique préremplie mais modifiable explicitement. Ne pas assimiler notes générales et notes d’échange. | Hérité PRD ; E Journal d’échanges. Date, canal, accès, correction/suppression et présentation restent Q3. |
| UX-DR24 | Accès au compte | Proposer connexion e-mail/mot de passe et récupération par e-mail pour le compte propriétaire unique créé à l’installation ; ne pas ajouter d’écran d’inscription. Hors session, aucune donnée privée n’est accessible. | Acquis PRD ; D/E Accès au compte/parcours Accès. Paramètres du test de récupération Q7. |
| UX-DR25 | Accès au compte — reconnexion | Une expiration de session pendant la saisie mène à une reconnexion permettant de retrouver le contenu sans ressaisie ; ce contenu retrouvé n’est pas présenté comme enregistré avant confirmation effective. | Acquis PRD ; E State Patterns/parcours Accès. Forme du retour Q4. |
| UX-DR26 | Recherche de fiches | Si Q5 est validé, prévoir recherche sur noms/e-mails des contacts, noms des sociétés et titres des opportunités, avec possibilité de création en absence de résultat. Ne pas ajouter recherche universelle ou raccourci par déduction. | **Proposition uniquement** A11/Q5 ; D/E Recherche de fiches. Aucun écran ou commande à implémenter par défaut. |
| UX-DR27 | Retour d’état | Distinguer chargement, réussite et échec. Une réussite d’enregistrement n’est annoncée qu’après sauvegarde effective ; un rendu optimiste ou une carte déplacée n’est pas une confirmation. En cas d’échec, conserver le contenu et permettre le réessai. | Hérité global/PRD + UX ; D/E Retour d’état/State Patterns. |
| UX-DR28 | Choix de clôture | Lors d’un passage à Gagnée/Perdue avec action en cours, demander explicitement de conserver ou annuler l’action ; ne jamais la terminer automatiquement. Autoriser l’abandon, qui conserve étape et action initiales. Une réouverture ne réactive aucune ancienne tâche terminée/annulée. | Acquis PRD ; E Information Architecture/State Patterns/Interaction Primitives. Dialogue à concevoir Q4. |

#### États, accessibilité, adaptations et parcours

| ID | Exigence vérifiable | Statut et provenance |
|---|---|---|
| UX-DR29 | Accueil doit traiter chargement, zéro à cinq résultats, erreur et focus de chaque action. Un accueil vide ou peu rempli ne doit pas affirmer que toutes les relances sont faites. | E State Patterns ; acquis. Texte exact ouvert. |
| UX-DR30 | Contacts et Sociétés doivent traiter chargement, liste vide/remplie, erreur, sélection/focus, valeurs absentes et relations absentes. L’état aucun résultat de recherche ne s’applique que si Q5 est validé. | E State Patterns ; garanties héritées. |
| UX-DR31 | Pipeline doit traiter kanban vide, colonne vide, chargement, carte sélectionnée, champ édité, sauvegarde déclenchée/en cours/réussie/échouée, déplacement en cours/échoué et abandon du choix de clôture. Une erreur doit préserver la saisie pour réessayer. | E State Patterns ; acquis/hérité. |
| UX-DR32 | Relances doit traiter rubriques vides/remplies, chargement, erreur, focus, terminaison et report en cours. Les anciennes échéances viennent d’abord dans leurs rubriques ; le départage par titre et les filtres réinitialisables ne sont pas validés. | E State Patterns ; garanties acquises, départage Q1. |
| UX-DR33 | Panneau et fiches doivent couvrir chargement, entité trouvée, introuvable/accès impossible, absence de liens/échanges, focus et sauvegarde en attente/réussie/échouée. | E State Patterns ; garanties héritées. Retour liste/fermeture avec brouillon Q4. |
| UX-DR34 | Créations, relations, échanges et actions doivent couvrir valeurs vides, saisie, erreur de validation, attente, réussite, échec et session expirée ; le rétablissement d’une action doit traiter l’existence d’une autre action active. | E State Patterns ; acquis/hérité. Présentation et historique Q3/Q4. |
| UX-DR35 | Connexion et récupération doivent couvrir hors session, soumission, réussite et échec ; traiter échec d’envoi, lien invalide/expiré et réessai sans exposer de données privées. | E State Patterns/parcours Accès ; capacité acquise, composition à définir et environnement Q7. |
| UX-DR36 | Sur toutes les surfaces de données, une perte réseau doit être signalée, préserver la saisie et permettre de réessayer. Ne pas promettre de consultation hors ligne ni de file de synchronisation. | E State Patterns ; hérité, périmètre limité. |
| UX-DR37 | Si un même champ a été enregistré depuis un autre onglet, avertir avant son remplacement, conserver la saisie et permettre un choix explicite ; aucun dernier-écrit-gagnant silencieux ni fusion automatique. | Validation postérieure R, E State Patterns. |
| UX-DR38 | Classer les échéances à la journée Europe/Paris. Vérifier le recalcul du jour à minuit Paris et au retour au premier plan pour que l’état des relances reste juste. | E Suivi des actions/State Patterns ; traduction technique des règles acquises. |
| UX-DR39 | Utiliser les primitives standard shadcn/ui et les tokens Tailwind du projet ; les ensembles métier nommés ci-dessus sont composés avec ces primitives. Ne pas remplacer les composants UI standards par des primitives personnalisées. | D Brand/Components, E Foundation ; règle globale héritée. |
| UX-DR40 | Donner un nom aux champs, relier leurs erreurs et assurer un parcours clavier logique avec focus perceptible. Les étapes et erreurs ont un libellé ou signal complémentaire à la couleur. | E Accessibility Floor/State Patterns, D Colors ; règles globales héritées. |
| UX-DR41 | Toute action essentielle est utilisable sans survol ni glisser-déposer. Les modaux gèrent/restaurent le focus et se ferment avec Échap. Résoudre la modalité du panneau sans supprimer ces garanties. | E Interaction Primitives/Accessibility Floor ; hérité. |
| UX-DR42 | Les chargements occupent les dimensions du contenu attendu afin d’éviter le saut de mise en page. Vérifier contraste, focus et erreurs sur les composants réels ; aucune conformité n’est déduite du raster. | E State Patterns/Accessibility Floor, D Colors ; hérité. |
| UX-DR43 | Concevoir d’abord pour ordinateur, mais préserver l’usage au clavier et sur tactile sans défilement horizontal de page. Un défilement propre au kanban est permis ; ne pas compresser indéfiniment ses cinq colonnes. | D Layout, E Responsive ; priorité validée et garanties globales. |
| UX-DR44 | Déterminer les largeurs minimales lisibles, seuils de défilement, adaptation du panneau et navigation petit écran ; aucun breakpoint ni ratio universel n’est validé. Les dimensions de recette 1440×900 et 402×874 restent A12 proposées ; ne pas les présenter comme un arbitrage UX autonome. | D Layout, E Responsive ; travail technique à résoudre, cibles chiffrées rattachées Q6. |
| UX-DR45 | Préserver UJ-001 « Après l'appel » : retrouver l’opportunité, modifier montant/notes et étape, définir une prochaine action, puis retrouver les valeurs après rechargement et confirmation. Échec : brouillon conservé/réessai ; expiration : reconnexion/récupération. L’objectif de saisie sous une minute reste acquis, sans prétendre l’avoir mesuré. | E Key Flows ; capacités acquises. Accès échanges et formulaire d’action Q3/Q4 ; protocole Q6. |
| UX-DR46 | Préserver UJ-002 « La reprise du matin » : Accueil limité, Relances complète, contexte disponible, relance réelle faite hors CRM puis tâche terminée ou reportée depuis la liste ; après réussite, la tâche traitée disparaît et la prochaine est visible à son échéance. | E Key Flows ; acquis. Commandes de suite/historique Q4. |
| UX-DR47 | Préserver UJ-003 « La lecture d'une entreprise » : entrée Sociétés, accès aux relations et montant gagné, création d’une opportunité préliée et retour à son contexte historique. Absence de liens/échanges identifiable, brouillon conservé en cas d’échec. | E Key Flows ; capacités PRD acquises, séquence A04/placement encore proposés Q4. |
| UX-DR48 | Utiliser des libellés français courts : étapes et rubriques exactes de UX-DR7/19 et « Montant des opportunités gagnées ». Le texte d’erreur explique que la saisie reste disponible. Les phrases et données de démonstration ne sont pas des exigences mot à mot. | D Brand, E Voice and Tone ; acquis de composition. |

#### Direction visuelle et provenance

| ID | Exigence ou référence de transposition | Statut et provenance |
|---|---|---|
| UX-DR49 | Prendre Pipeline A compacte comme référence de composition : navigation latérale, kanban compact et panneau droit ; interface simple/minimaliste inspirée de Folk. Ne pas importer les autres fonctions, la palette ou l’identité de Folk. | D Brand/Inspiration, E Inspiration ; direction validée. |
| UX-DR50 | Conserver des surfaces presque blanches, navigation/colonnes gris clair, texte sombre, action principale presque noire, actif de navigation gris, carte sélectionnée soulignée en bleu et pastilles d’étape avec libellé. | D Colors ; langage de la composition approuvée, valeurs exactes proposées ci-dessous. |
| UX-DR51 | Référence de tokens couleur : background `#FEFEFE`, sidebar `#F8F8F8`, muted `#F9F9F9`, card `#FEFEFE`, accent `#F1F1F1`, border `#E1E1E3`, primary `#0F141E`, foreground `#000000`, muted-foreground `#474156`, ring `#5684E7`. Étapes : qualify `#93959D`, discussion `#3D76E9`, proposal `#FECE19`, won `#07B60C`, lost `#EB5554`. | **Transcription proposée**, D frontmatter/Colors, pas de validation séparée ni promesse de contraste. Les rôles shadcn complémentaires seront hérités du thème choisi. |
| UX-DR52 | Référence typographique : `ui-sans-serif, system-ui, sans-serif` ; corps 14 px/400/1,45 ; titre 24 px/600/1,25 ; métadonnées 13 px/400/1,45. Adapter les saisies tactiles aux règles du projet. | **Approximation proposée**, D Typography ; aucune police de Folk identifiée. |
| UX-DR53 | Référence d’espacement : 8 px entre cartes, 12 px intérieur de carte, 16 px token intermédiaire, 24 px marge centrale, 28 px intérieur panneau. Coins environ 6 px pour cartes/champs, 8 px pour zones larges ; bordures fines environ 1 px. | **Approximation proposée**, D frontmatter/Layout/Shapes ; pas de valeurs contractuelles individuellement approuvées. |
| UX-DR54 | Transposer les composants de thème nommés : `navigation-active` emploie accent/rounded.md ; `kanban-card` card/border/rounded.sm ; `opportunity-panel` background/panel-padding ; `selected-card` ring. Séparer les surfaces par bordures/fonds proches, sans importer d’ombre forte ; la référence montre une bordure gauche du panneau sans voile sombre visible. | D frontmatter/Elevation ; règles de transcription, détails de focus/modales à vérifier au rendu. |
| UX-DR55 | Les proportions de A à 1672×941 sont descriptives : navigation ≈13,6 %, centre ≈63,3 %, panneau ≈23,1 %. Ne pas les imposer à toutes les largeurs. Icônes fines/discrètes ; aucun mode sombre défini. | D Layout/Shapes/Colors ; référence, non-contrat responsive. |
| UX-DR56 | Utiliser les quatre images approuvées : `pipeline-a.png` (kanban et panneau ensemble), `key-accueil-a.png`, `key-contacts-a.png`, `key-relances-a.png`, dans le dossier UX `mockups/`, avec leurs sidecars `.json`. B et C ne sont pas retenues. D/E priment en cas de conflit avec les images. | D/E Couverture ; provenance acquise. Images statiques à données fictives, aucun fonctionnement testé. |
| UX-DR57 | Respecter la couverture documentaire acceptée sans exiger de nouvelles maquettes par défaut pour Sociétés, fiches contact/société, créations/relations, échanges, création/historique d’actions, clôture, accès/récupération/reconnexion, états alternatifs et petits écrans. Ces surfaces restent à concevoir dans les règles acquises. | D/E Couverture ; validation de couverture, pas validation des propositions fonctionnelles. Revue UX facultative déclinée. |
| UX-DR58 | Exclure les défauts raster : chiffres 1–5 non compteurs, aucune indication Enregistré pendant une saisie non sauvegardée, Aujourd’hui distinct d’un retard même si son texte était rouge. | D/E Couverture ; corrections explicites. |

#### Limites du POC et arbitrages protégés

| ID | Exigence ou limite | Statut et provenance |
|---|---|---|
| UX-DR59 | Le CRM reste une application privée à propriétaire unique, saisie manuelle et usage prioritaire ordinateur. Rendez-vous dans l’agenda externe, sans écran ni intégration agenda ; préparer un devis est une tâche, pas un module de génération. Ne pas ajouter archives, scoring, enrichissement ou écran d’administration par inspiration visuelle. | E Foundation/Information Architecture/Inspiration, D Do’s/Don’ts ; périmètre acquis. |
| UX-DR60 | Retenir le socle spécifique POC Supabase + Vercel dans le rapprochement des exigences. NFR-005 est retirée : aucune sauvegarde quotidienne, rétention sept jours, automatisation ou souscription correspondante à mettre en place. Conserver l’exigence de persistance des enregistrements. | R ; décision ultérieure explicite, remplace la validation antérieure de sauvegarde. |
| UX-DR61 | Ne pas promouvoir les hypothèses restantes en critères fermes : les résoudre avant le modèle, formulaire, classement ou fonctionnalité concerné. Ne pas déduire une suppression définitive, cascade destructive ou commande de déconnexion explicite de la clôture du dossier. | E Traçabilité, R conclusion, Q ; garde de portée. |

#### Rattachement des décisions ouvertes

Les numéros Q ci-dessous sont ceux du compagnon d’architecture, sans renommage. Ils peuvent attendre leur tranche concernée, mais empêchent de traiter comme validées les propositions qui en dépendent.

| Arbitrage | Exigences liées | Ce qui reste ouvert et ce qui est déjà acquis |
|---|---|---|
| Q1 — classement et départages | UX-DR3, UX-DR5, UX-DR23, UX-DR32, UX-DR38 | Ordre exhaustif des étapes et égalités importance/date ; titre comme départage Relances ; dernier créé pour échanges au même instant. Sont acquis : plafond cinq, règle temporelle, devis avant premier contact, exclusion des opportunités closes à l’accueil et conservation dans Relances. |
| Q2 — champs et validations résiduels | UX-DR5/6, UX-DR14/16/17/18 | Formats e-mail/LinkedIn, avertissement de doublon, détails des sociétés. Ne pas ajouter téléphone, plusieurs e-mails ou photo. Les minimums contact/société, montant non négatif et indépendance des relations sont déjà validés. |
| Q3 — échanges | UX-DR13/14/15/23/34/45/47 | Dates, canal, accès, correction/suppression, présentation. Notes libres distinctes, liens et société historique sont acquis ; toute suppression attend une décision explicite. |
| Q4 — formulaires et historique | UX-DR6/12/14/15/16/20/22/25/28/33/34/45/46/47/57 | Formulaires, sauvegarde hors carte, accès/historique des tâches, forme des fiches secondaires, ouverture depuis les autres vues, retour liste et fermeture avec brouillon. Intitulé/date, une tâche active, commandes directes Relances et blur carte sont acquis. Pas de nouvelle maquette imposée. |
| Q5 — recherche et commandes | UX-DR26/30/59/61 | Recherche A11/FR-016, déconnexion explicite et suppressions non validées ; aucun bouton ni cascade destructive ajouté par défaut. Purge technique de fin de session et données privées hors session restent requises. |
| Q6 — recette complémentaire | UX-DR40/41/42/43/44/45/56 | Cibles chiffrées NFR-001, nombre d’essais A13 et dimensions de recette proposées A12 à cadrer. Objectif sous une minute, persistance et garanties fonctionnelles/accessibilité restent acquis ; aucune mesure obtenue ni conformité annoncée. |
| Q7 — environnement de démonstration | UX-DR24/35/60 | Projet Supabase, compte/plan Vercel, domaine et adresse Auth de test à identifier avant provisionnement et récupération réelle. SMTP d’essai limité aux membres du projet ; aucun service ou abonnement supplémentaire implicitement adopté. La sauvegarde retirée n’est pas à rouvrir. |

Les propositions purement visuelles UX-DR51 à UX-DR55 restent une transcription à ajuster et vérifier ; elles ne forment pas de nouvelles questions métier Q1–Q7. Cette extraction ne choisit pas d’implémentation supplémentaire et ne prétend pas avoir exécuté les parcours.

### FR Coverage Map

Chaque FR retenue a un responsable ; les extensions entre epics sont identifiées. Une couverture finale ne doit pas être annoncée dès une livraison partielle.

| FR | Attribution approuvée | Limite de validation |
|---|---|---|
| FR-001 | Epic 2 — contact, création et modification | Formats et doublons sous Q2. |
| FR-002 | Epic 2 — lien LinkedIn | Validation d’URL sous Q2. |
| FR-003 | Epic 2 — note de contact | Formulaire secondaire sous Q2/Q4. |
| FR-004 | Epic 2 — dernière interaction du contact | Q3 pour le journal ; Q1 pour les égalités. |
| FR-005 | Epic 2 — société et contacts ; epic 3 — opportunités liées | Couverture complète en epic 3 ; détails Q2/Q4. |
| FR-006 | Epic 3 — relation société/opportunité et création préliée | Règles acquises. |
| FR-007 | Epic 3 — montants gagnés et valeurs absentes | Règles acquises. |
| FR-008 | Epic 3 — contact principal facultatif et indépendant | Règles acquises. |
| FR-009 | Epic 2 — relation contact/société et histoire ; epic 3 — liaisons opportunité | Pas de déplacement rétroactif des échanges. |
| FR-010 | Epic 2 — historique contact/société ; epic 3 — historique opportunité | Une politique partagée ; Q1 pour les égalités. |
| FR-011 | Epic 3 — création/modification opportunité, montant, Notes | Notes unique, absence distincte de zéro. |
| FR-012 | Epic 3 — kanban, transitions et clôture cohérente avec les tâches | Pas de séparation du cycle de tâche. |
| FR-013 | Epic 3 — cycle de la prochaine action et historique | Formulaire et accès sous Q4. |
| FR-014 | Epic 3 — Accueil et Relances | Q1 pour l’ordre exhaustif et les départages. |
| FR-015 | Epic 2 — échanges liés à un contact ; epic 3 — lien facultatif à une opportunité, ou opportunité seule | Modalités Q3 ; aucune suppression implicitement autorisée. |
| FR-016 | Réserve conditionnelle : epic 2 pour contacts/sociétés, epic 3 pour opportunités | Proposition Q5, aucune story prête tant que non validée. |
| FR-017 | Aucune epic | Retirée : aucun archivage ni restauration à construire. |
| FR-018 | Epic 1 — accès/récupération ; epics 2 et 3 — préservation des saisies après expiration | Q7 pour paramètres réels ; déconnexion explicite Q5. |


## Epic List

### Epic 1 : Accéder à son CRM privé

**Résultat utilisateur :** le propriétaire accède à son espace hébergé avec son e-mail et son mot de passe, peut récupérer son accès par e-mail et bénéficie d’un espace inaccessible hors session.

**FR couverte :** FR-018 pour l’accès et la récupération ; les garanties de conservation des saisies métier sont intégrées et vérifiées dans les epics 2 et 3 dès que ces saisies existent.

**Périmètre :** socle Next.js 15, Supabase et Vercel adapté à l’architecture validée, compte unique installé sans inscription publique, connexion, récupération, session et structure de navigation. L’accueil métier sera apporté par l’epic 3 ; cette première livraison ne simule pas des priorités opérationnelles. Elle permet de vérifier un accès privé réel et sa récupération.

**Notes de réalisation :** AR-01 dans la première story future, sans créer tout le modèle CRM à l’avance. Configurations, sécurité propriétaire et mécanismes communs établis ici, puis appliqués aux entités lors de leur introduction. Aucun service supplémentaire ni provisioning vers une cible inconnue. Déconnexion explicite uniquement si Q5 est validé.

**Dépendances :** aucune autre epic. Q7 avant hébergement et récupération réels ; Q6 avant le protocole de recette complémentaire. Les sujets Q ne sont pas des dépendances à une epic future.

### Epic 2 : Retrouver ses contacts, sociétés et échanges

**Résultat utilisateur :** gérer un carnet de relations utilisable : contacts, sociétés, coordonnées retenues, notes libres et échanges réels, avec leur dernière interaction et leur contexte historique.

**FR couvertes :** FR-001, FR-002, FR-003, FR-004 ; parties contact/société de FR-005, FR-009, FR-010 et FR-015. Application de FR-018 aux formulaires métier.

**Périmètre :** listes Contacts et Sociétés accessibles directement, création et modification minimales, fiches et relations contact/société, lien LinkedIn, note de contact distincte du journal, création/consultation des échanges et conservation de leur société historique. Les modalités de correction des échanges restent conditionnées à Q3. Les champs supplémentaires et la recherche ne sont pas déduits du PRD par défaut.

**Autonomie :** un échange lié à un contact satisfait déjà la règle « contact ou opportunité ». Cet annuaire et son journal fonctionnent sans pipeline, tâches, montants gagnés ni schéma d’opportunité créé en avance. L’absence de fonctionnalités encore non livrées est explicite ; aucune commande vers un écran inexistant. La vue Contacts complète avec sa relation Opportunité sera achevée dans l’epic 3.

**Notes de réalisation :** conservation des brouillons après erreur/reconnexion, conflits par champ, idempotence et confidentialité effectives dès la première saisie. Les extensions de relations prévues dans l’epic 3 passent par les mêmes règles de domaine, sans modifier rétroactivement l’entreprise des échanges existants.

**Dépendances :** epic 1 seulement. Q2 avant schéma/formulaires concernés ; Q3 avant journal ; partie « échanges à même instant » de Q1 avant dernière interaction ; Q4 pour les formulaires secondaires. Q5 uniquement si une commande proposée est retenue.

### Epic 3 : Faire avancer ses opportunités et agir au bon moment

**Résultat utilisateur :** suivre une opportunité depuis le kanban, modifier montant et Notes sur sa carte, préparer la prochaine action, puis retrouver jusqu’à cinq priorités à l’accueil et toutes les relances dans leur vue dédiée.

**FR couvertes :** FR-006, FR-007, FR-008, FR-011, FR-012, FR-013, FR-014 ; extensions opportunités de FR-005, FR-009, FR-010 et FR-015. Application de FR-018 aux nouvelles saisies métier.

**Périmètre :** cinq étapes fixes, panneau droit, édition en place avec sauvegarde à la sortie du champ, liens facultatifs indépendants, échanges rattachés à une opportunité et montant des opportunités gagnées sur les sociétés. Cycle complet des tâches, une seule active par opportunité, clôture avec conservation/annulation explicite, réouverture sans résurrection, historique consultable selon Q4. Accueil limité aux tâches d’opportunités ouvertes ; Relances conserve toutes les tâches à faire, y compris gagnées/perdues. Actions faites et reports disponibles directement dans Relances.

**Notes de réalisation :** le regroupement garde ensemble les mutations d’étape et de tâche, le verrouillage, les compteurs et les mises à jour des vues. Il évite une epic « pipeline terminé » dont la clôture serait encore incohérente avec les tâches. Le découpage ultérieur produira des stories bornées et ordonnées dans cette epic, sans la transformer en une seule unité de développement.

**Dépendances :** epics 1 et 2. Q1 avant le classement définitif ; Q4 avant les formulaires, historique et choix de clôture concernés. Q3 reste la politique unique des échanges déjà arrêtée pour l’epic 2. Parcours complets après appel, reprise du matin et lecture d’une société vérifiés à ce stade.

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


**Amendement approuvé le 8 septembre 2026 — noms sans chiffres :** toute nouvelle valeur de prénom ou nom transmise à la création ou correction refuse les chiffres décimaux Unicode (Nd), avec erreur près du champ et texte conservé. Accents, espaces, apostrophes, tirets et lettres internationales restent acceptés ; au moins un prénom ou nom après trim, maximum 200 points de code par champ. Les noms historiques non modifiés restent lisibles et ne sont pas nettoyés. Reçus confirmés rejoués sans mutation ; commandes anciennes non confirmées refusées et corrigeables. Validation formulaire, HTTP et RPC v1/v2 ; aucun autre champ modifié.

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


**Amendement approuvé le 8 septembre 2026 — noms sans chiffres :** toute nouvelle valeur de prénom ou nom transmise à la création ou correction refuse les chiffres décimaux Unicode (Nd), avec erreur près du champ et texte conservé. Accents, espaces, apostrophes, tirets et lettres internationales restent acceptés ; au moins un prénom ou nom après trim, maximum 200 points de code par champ. Les noms historiques non modifiés restent lisibles et ne sont pas nettoyés. Reçus confirmés rejoués sans mutation ; commandes anciennes non confirmées refusées et corrigeables. Validation formulaire, HTTP et RPC v1/v2 ; aucun autre champ modifié.

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
