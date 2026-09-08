# Epic 3 Context: Faire avancer ses opportunités et agir au bon moment

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Compléter le cycle commercial du CRM privé : créer les opportunités dans leur contexte, actualiser le kanban, suivre une prochaine action unique et retrouver les priorités au bon moment. Relier ce travail aux échanges et aux sociétés sans réécrire l’historique. L’accueil aide à choisir, tandis que Relances conserve l’exhaustivité ; les rendez-vous restent dans l’agenda externe.

## Stories

- Story 3.1: Créer une opportunité et la relier à mon contexte
- Story 3.2: Piloter le kanban et modifier mes cartes en place
- Story 3.3: Programmer une action et clôturer une opportunité sans incohérence
- Story 3.4: Terminer, reporter et corriger mes prochaines actions
- Story 3.5: Retrouver et traiter toutes mes relances
- Story 3.6: Voir jusqu’à cinq priorités à l’ouverture
- Story 3.7: Relier mes échanges à mes opportunités
- Story 3.8: Lire le montant gagné et le contexte complet d’une société

## Requirements & Constraints

- Opportunité : titre requis, montant EUR HT et Notes facultatifs, société et contact principal facultatifs et indépendants. Aucun lien forcé depuis Pipeline ; le contexte contact/société préremplit un lien modifiable. Toutes les opportunités restent éditables, même closes. Pas de Description parallèle ni de date de clôture prévisionnelle.
- Cinq étapes fixes : À qualifier par défaut, Échange en cours, Proposition envoyée, Gagnée, Perdue. Toutes les transitions sont permises. Au plus une tâche à faire par opportunité, y compris close ; intitulé et échéance requis, dates passées autorisées.
- Clôturer avec une tâche active exige conserver ou annuler explicitement ; abandon ne change rien. Annuler ne signifie jamais terminer. Réouvrir ne réactive rien. Rétablir une tâche terminée exige l’absence d’une autre tâche active ; les annulées ne sont pas restaurables. Proposer une tâche suivante reste facultatif.
- Relances expose toutes les tâches actives, même des opportunités closes, dans En retard/Aujourd’hui/À venir ; seules les opportunités ouvertes entrent dans Sans prochaine action. Dates métier Europe/Paris sans heure ; aujourd’hui n’est pas en retard. Tri des tâches : échéance, création, UUID croissants ; sans action : création puis UUID. Pages de 25, compteurs globaux ; aucun filtre supplémentaire.
- Accueil : zéro à cinq tâches actives d’opportunités ouvertes. Échues et du jour ensemble, triées par Proposition envoyée, Échange en cours, À qualifier, puis échéance/création/UUID. Complément futur : échéance, même ordre d’étapes, création/UUID. Aucun remplissage fictif ni score.
- Échanges : contact ou opportunité requis, les deux permis. Société historique préremplie depuis l’opportunité si renseignée, sinon le contact, puis modifiable explicitement. Changer les relations des fiches ne déplace aucun échange. Dernière interaction : instant d’échange, création puis UUID décroissants, indépendamment des pages. Les Notes générales n’en créent jamais.
- Montant gagné d’une société : somme de tous les montants renseignés actuellement gagnés, compteur distinct des absents. Zéro saisi reste renseigné ; somme vide affichée 0 €. Projection globale, jamais facturation ni encaissement.
- Aucun module devis, agenda, recherche, suppression, archivage, intégration ou sauvegarde quotidienne. Données fictives exclusivement. Mesurer les parcours après appel sous une minute et la persistance après rechargement ; mesurer les cibles de charge sur 100 contacts, 50 sociétés, 200 opportunités, 1 000 échanges : vues <2 s, sauvegarde <1 s dans 19/20 essais, réaction visuelle <100 ms. Ne pas annoncer ces résultats sans exécution.

## Technical Decisions

- Monolithe Next.js/TypeScript, Supabase Auth/PostgreSQL, Zod et composants shadcn/Tailwind. Identité propriétaire authentique vérifiée sur chaque lecture et écriture, relations comprises ; RLS protège les tables, vues sous sécurité appelant, aucun cache serveur partagé privé.
- Server Actions validées puis RPC transactionnelles ; aucune mutation directe des tables accordée aux rôles ordinaires. RPC avec contrôle propriétaire, paramètres validés, noms qualifiés et `search_path = ''`. Schéma, contraintes, droits et policies dans des migrations compatibles et versionnées.
- Révision globale et versions par champ ; patch des seuls champs modifiés, conflit atomique sans écrasement silencieux. Chaque commande conserve clé d’idempotence, empreinte et résultat : retry identique rejoué, contenu différent refusé. Aucun nettoyage automatique des reçus.
- Tâches et étapes : verrouiller l’opportunité avant les tâches, ordre stable, index unique partiel pour la tâche active. Révision de workflow séparée, incrémentée à chaque mutation de tâche/étape ; une clôture concurrente devient conflit sans être bloquée par des Notes indépendantes.
- Montants exacts en centimes entiers, transport chaîne entière, conversion décimale sans flottant, négatif ou arrondi silencieux ; deux décimales maximum. Échéances `date`/`YYYY-MM-DD`, jamais instants ; échanges UTC, affichage Paris. Horaire local inexistant refusé, ambigu désambiguïsé ; échange futur refusé serveur.
- Brouillons isolés propriétaire/entité/champ avec valeurs, versions originales, commande et génération ; récupération après reconnexion du même propriétaire. Sérialiser les écritures d’un champ ; une réponse ne nettoie que sa génération. Échec et conflit conservent la saisie, succès seulement après commit.
- Invalider toutes les projections touchées, ignorer les réponses périmées ; revalider au focus, retour réseau et reconnexion sans écraser les brouillons. Service commun du jour Paris recalculé à minuit et au focus. Étendre le journal existant, sans deuxième moteur d’échanges.

## UX & Interaction Patterns

Composition A compacte inspirée de Folk, ordinateur prioritaire : navigation Accueil, Contacts, Sociétés, Pipeline, Relances ; kanban et panneau droit conservent le contexte. Montant et Notes éditables sur carte au clic, éditeurs montés et sauvegarde unique au blur ; séparer édition, ouverture et déplacement. Même texte dans carte et panneau. Étape accessible au clavier depuis la fiche en alternative au glisser-déposer ; pas de réordonnancement manuel.

Panneau piloté par état client et URL, cache isolé et préchargement ; pas de navigation serveur par sélection. Chargement, attente, confirmation, erreur et conflit restent distincts. Fermeture avec brouillon : Enregistrer/Abandonner/Continuer, sans fermer sur échec. Créations et dialogues de tâche explicites ; historique repliable, dix éléments par page, dernier changement de statut puis UUID décroissants. Fait et report directement dans Relances ; Accueil ouvre le contexte ou la vue complète sans nouveaux éditeurs.

Clavier, focus, erreurs associées et Échap requis. Aucun geste essentiel limité au survol. Tester ordinateur, mobile et tablette ; seul le kanban peut défiler horizontalement. La maquette ne prouve ni accessibilité ni performance, et ses faux compteurs/états de succès ne sont pas à recopier.

## Cross-Story Dependencies

L’epic 2 fournit contacts, sociétés et journal fiable ; l’epic 1 fournit l’accès privé et la récupération de saisie. Ordre principal : 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6. Ne créer Tâche qu’en 3.3, avec sa clôture atomique dès son apparition. 3.7 dépend de 2.4/2.5 et 3.1/3.2 ; 3.8 dépend de 3.1 et 3.7. Les décisions déléguées résolvent les anciens arbitrages de classement/formulaires : ne pas rouvrir ces validations. Aucun domaine futur n’est nécessaire à l’achèvement de l’epic.
