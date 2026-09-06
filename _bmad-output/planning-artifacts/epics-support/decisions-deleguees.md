---
status: adopted-by-delegation
updated: 2026-09-06
authority: "Lilian : oui je valide tout ça, fais un accéléré sur taches et relance choisis à ma place pour qu'on passe au skill suivant"
---

# Décisions de réalisation prises par délégation

Lilian approuve l’epic 2 et demande à l’agent de choisir pour accélérer et passer au skill suivant. Les choix ci-dessous sont des décisions de l’agent dans ce mandat, pas des réponses explicites de Lilian à chaque ancienne question. Les détails routiniers des formulaires déjà approuvés sont précisés avec les propositions conservatrices du PRD afin de rendre les stories exécutables. Aucun nouveau module, suppression ou abonnement n’est autorisé par ce document.

Ces décisions postérieures priment sur les mentions « proposé », « Q à résoudre » ou « validation attendue » des inventaires et propositions historiques pour les points expressément résolus ci-dessous. Les autres invariants du PRD, UX et AD-1 à AD-8 restent inchangés.

## Q1 — Classement et départages

- Accueil : uniquement tâches à faire d’opportunités ouvertes. Premier groupe : échéance passée ou aujourd’hui Paris, tri par étape Proposition envoyée, Échange en cours, À qualifier ; puis échéance croissante, création de tâche croissante, UUID croissant. Retard et aujourd’hui appartiennent au même groupe ; l’étape départage d’abord.
- Compléter jusqu’à cinq avec les tâches futures : échéance croissante, même ordre d’étapes, création croissante, UUID croissant. Zéro à cinq lignes, sans remplissage fictif, pas de score affiché.
- Relances : rubriques En retard, À faire aujourd’hui, À venir, Opportunités sans prochaine action. Chaque liste de tâches est triée par échéance, puis création, puis UUID croissants. Cela remplace le départage par titre anciennement proposé. Sans action : opportunités ouvertes par création puis UUID croissants.
- Le jour métier est Europe/Paris, échéances de type date ; une date d’aujourd’hui n’est pas en retard. Recalcul à minuit Paris et au retour au premier plan.
- Dernière interaction : date/heure de l’échange décroissante, puis date/heure de création décroissante, puis UUID décroissant. Une politique commune aux fiches et listes, indépendante de la pagination.
- Ordres sans commande de tri supplémentaire : Contacts par nom, prénom et UUID croissants ; Sociétés par nom puis UUID croissants, comparaison française insensible à la casse ; cartes du kanban par création décroissante puis UUID croissant dans chaque étape.
- Pages de listes : 25 éléments avec commande explicite pour accéder aux suivants ; compteurs globaux, sans troncature par la limite d’une API. Historique des tâches : 10 par page.

## Q2 — Champs et validations minimales

- Contact : prénom et nom, au moins un non vide après suppression des espaces aux extrémités ; un e-mail facultatif, titre professionnel facultatif, lien LinkedIn facultatif et note libre facultative. Société actuelle zéro ou une. Pas de téléphone, photo ou e-mails supplémentaires.
- E-mail : supprimer les espaces aux extrémités, refuser une syntaxe invalide, afficher l’erreur près du champ. Doublon comparé sans distinction de casse : avertissement non bloquant mentionnant les contacts concernés, aucune fusion ni contrainte d’unicité métier.
- LinkedIn : URL absolue valide HTTP ou HTTPS ; autres protocoles refusés. Champ vide autorisé. Ouverture externe dans un nouvel onglet avec protections de lien, sans enrichissement ni récupération automatique.
- Opportunité : la date de clôture prévisionnelle facultative conservée dans l’ancien PRD §5.3/A08 est écartée explicitement de ce POC minimal par décision de réalisation déléguée. Les dates opérationnelles sont celles des tâches ; ce retrait ne supprime aucune donnée existante, car le code et la base métier ne sont pas encore créés.
- Société : nom obligatoire uniquement ; pas d’autres coordonnées ajoutées au POC. Liste : Nom et accès à la fiche ; les relations et le montant gagné figurent dans la fiche.

## Q3 — Échanges

- Date/heure de l’échange requise, préremplie à maintenant Paris, date future refusée côté serveur ; stockage de l’instant UTC. La saisie d’un horaire local ambigu lors d’un changement d’heure demande de choisir l’occurrence avec son décalage UTC ; un horaire inexistant est refusé sans perte de saisie.
- Canal requis, sans sélection implicite : Téléphone, E-mail, Visio, Autre. Notes facultatives. Formulaire explicite Ajouter/Enregistrer.
- Contact et opportunité préremplis depuis le contexte connu ; au moins l’un des deux requis, tous deux possibles. Société historique préremplie depuis l’opportunité si elle en a une, sinon le contact, et modifiable ou retirable explicitement. Sans source, le lien reste vide. Changer ce lien n’affecte ni le contact ni les autres échanges.
- Sections « Échanges » dans les fiches contact, société et opportunité, avec date, canal et accès aux notes. Dernière interaction dans Contacts ; date/canal/notes accessibles dans la fiche. Action « Ajouter un échange » depuis contact/opportunité ; pas de création isolée depuis une société sans choisir au moins un contact/opportunité.
- Correction autorisée de date, canal, notes et relations, avec les mêmes contraintes et conflits par champ. Un changement de date/lien recalcule toutes les projections affectées, même si le résultat redevient vide. Pas de suppression d’échange dans le POC : la branche de suppression d’A10 est écartée, pas implicitement autorisée.

## Q4 — Formulaires, panneau et tâches

- Fiches contact/société/opportunité en panneau droit réutilisant les primitives shadcn. Contexte et retour à la liste conservés ; commande de fermeture et gestion de focus adaptées à la modalité. Les petits écrans utilisent une présentation qui garde les champs et commandes lisibles, sans scroll horizontal de page.
- Créations et corrections contact/société/échange : formulaire avec Enregistrer (Ajouter à la création) et Annuler. Envoyer uniquement les champs modifiés et leurs versions de base pour une édition. Aucun autosave à chaque frappe.
- Opportunité : titre requis, montant et Notes facultatifs. Création explicite Ajouter. Dans la fiche, montant/Notes/titre sauvegardés à la sortie du champ ; étape et liens lors d’une sélection validée. Montant/Notes de la carte gardent le blur approuvé. Les choix de clôture restent une commande transactionnelle distincte.
- Une fermeture avec une saisie non confirmée affiche Enregistrer / Abandonner / Continuer la saisie. Enregistrer ferme seulement après succès ; échec ou conflit garde la saisie. Abandonner efface seulement le brouillon concerné, pas une commande déjà confirmée. La navigation, les confirmations et revalidations ne nettoient jamais une génération plus récente.
- Nouvelle action : dialogue avec intitulé obligatoire vide et échéance obligatoire préremplie aujourd’hui Paris, clairement visible et modifiable, y compris vers le passé. Boutons Ajouter/Annuler. L’opportunité est celle du contexte et n’est pas changée implicitement.
- Modifier la tâche : dialogue avec intitulé/date et Enregistrer/Annuler. Dans Relances, date editable sur place, enregistrée au changement validé ou à la sortie du champ, une seule commande par changement ; Fait sur la case directement. Échec : projections reviennent au dernier état confirmé, saisie conservée et réessai possible.
- Après achèvement, proposer discrètement « Ajouter la suivante » sans ouvrir automatiquement un formulaire. L’utilisateur peut ignorer cette proposition. Une seule tâche active, même sur une opportunité gagnée/perdue.
- Annuler une tâche demande une confirmation ; elle reste dans l’historique comme annulée, jamais réalisée. Réparation d’une tâche terminée par erreur : commande Rétablir, refusée s’il existe déjà une autre tâche active. Ne pas terminer/annuler celle-ci automatiquement. Pas de restauration d’une tâche annulée ajoutée par défaut.
- Historique des tâches dans une section repliable du panneau opportunité : intitulé, échéance, statut et date d’achèvement si terminée ; ordre de dernier changement de statut décroissant puis UUID. Pagination 10. Le rétablissement retire la date d’achèvement courante ; pas d’audit de toutes les versions ou transitions créé pour le POC.
- Passage à Gagnée/Perdue avec tâche active : dialogue « Conserver la tâche » / « Annuler la tâche » et possibilité d’abandonner. Aucun choix implicite. Étape et action changent atomiquement, avec révision de workflow séparée des champs Notes/montant. Réouverture ne réactive aucune ancienne action.
- Accueil : clic sur l’opportunité ouvre son panneau et « Voir toutes les relances » mène à la vue dédiée. Les actions Fait/report restent sur Relances, sans multiplier les éditeurs de l’accueil. Relances : liens de contexte, cases Fait et échéances éditables, compteurs globaux et aucune option de filtre supplémentaire.

## Q5 — Fonctions écartées de ce POC

Recherche FR-016, suppression définitive (dont échanges), archivage, restauration de fiches et commande de déconnexion explicite ne sont pas ajoutés. La fin/expiration de session et la purge technique sont conservées. Ces exclusions ferment la question du périmètre actuel ; toute réintroduction sera une demande distincte.

## Q6 — Recette

Les conventions globales de contrôle TypeScript et parcours réels agent-browser s’appliquent à chaque livraison. Respecter les objectifs de fluidité de l’architecture dès le scaffold. Les valeurs NFR-001 deviennent des cibles de recette du POC à mesurer, pas une preuve obtenue : jeu fictif 100 contacts, 50 sociétés, 200 opportunités, 1 000 échanges ; vues utilisables <2 s, confirmation de sauvegarde <1 s dans 19 essais sur 20 ; retour visuel <100 ms, sans assouplir les cibles plus strictes des panneaux/éditeurs du projet. Consigner matériel, navigateur, réseau, version, chaud/froid et résultats.

Parcours après appel : cinq essais sur données fictives, chacun sous une minute selon les bornes PRD ; valeurs retrouvées après rechargement. Vérifier exhaustivité des échues et compteurs, absence de tâche du jour/future/terminée/annulée dans En retard, absence de perte des valeurs confirmées. Recette ordinateur 1440×900, 2560×1440 ; tactile 402×874 et tablette portrait/paysage conformément aux conventions. Les erreurs, conflits, navigation clavier et horaires Paris sont exercés, aucune nouvelle maquette imposée.

## Q7 — Seul prérequis externe restant

Les comptes/projets réels Supabase et Vercel, plan, origines autorisées et destinataire admissible à la récupération e-mail restent à identifier avant les opérations qui les utilisent. Aucun identifiant ni abonnement n’est inventé. Le plan de développement peut être suivi en backlog ; la story concernée ne passe prête à exécuter qu’après résolution de ses paramètres. Le contrôle de préparation doit signaler cette réserve explicitement et ne pas annoncer un déploiement ou une authentification réalisés.

## Effet sur le workflow

La délégation vaut poursuite des étapes de stories, revue finale et skill suivant sans menus de validation supplémentaires. Les contrôles sont réalisés ; seul le rituel de confirmation est remplacé par le mandat utilisateur. Un problème technique reste à corriger et une donnée externe manquante reste manquante. Aucun code, compte ou service n’est créé par cette décision documentaire.
