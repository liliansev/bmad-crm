---
gate: CONCERNS
planning_quality: PASS
execution_ready: false
updated: 2026-09-06
tracking_authorized: true
---

# Préparation à l’implémentation du POC CRM

Le contrôle bmad-sprint-planning est exécuté après la finalisation des trois epics et 16 stories. **Plan métier et technique : PASS. Verdict global : CONCERNS**, limité aux paramètres réels Q7 requis avant les opérations concernées. Aucun compte ni déploiement n’a été vérifié pendant cette phase documentaire.

Lilian demande explicitement de choisir à sa place pour accélérer et passer au skill suivant. La génération du suivi en backlog est poursuivie dans ce mandat, sans nouveau menu ; cela ne transforme aucune story en prête à exécuter et n’autorise aucun abonnement ou usage d’une cible inconnue.

## Sources et autorité

- PRD final, paire DESIGN/EXPERIENCE finale et quatre maquettes A validées.
- Architecture finale AD-1 à AD-8, rapprochements et preuves de stack.
- SPEC et ses dix compagnons, avec décisions déléguées postérieures.
- [epics.md](epics.md), unique fichier canonique du découpage ; les documents epics-support sont des traces de préparation, pas des doublons candidats à la génération.
- [Décisions déléguées](epics-support/decisions-deleguees.md), qui résolvent Q1–Q6 et prennent explicitement le pas sur les anciennes propositions. Q7 reste externe.
- [Couverture](epics-support/story-coverage.md) : 18 identifiants FR et 61 UX-DR, y compris exclusions explicites, plus NFR/AR/SM/UJ.

Le dossier docs et le suivi d’implémentation étaient absents au début du contrôle. Aucun ne masque une décision requise : les documents adoptés portent l’intention et les comportements. Le suivi sera créé par le générateur officiel.

## Résultats des contrôles

| Contrôle | Résultat |
|---|---|
| Couverture fonctionnelle | FR retenues attribuées à des stories avec critères ; recherche FR-016, archivage FR-017, branche suppression des échanges et sauvegarde NFR-005 explicitement hors POC. |
| Couverture UX | 61 identifiants reliés aux surfaces/stories ou à une exclusion explicite ; garanties R2 appliquées dès chaque écran. |
| Structure | Trois epics centrés sur accès privé, relations, cycle commercial ; 16 stories et 82 scénarios Given/When/Then/And. |
| Dépendances | Seulement antérieures ; annuaire autonome avant opportunités ; création du domaine Tâche et garde-fous de clôture dans la même story 3.3. |
| Starter | Story 1.1 initialise depuis with-supabase avec adaptations explicites Next 15/Tailwind 4/auth privée. Aucun modèle complet créé à l’avance. |
| Fiabilité | Idempotence, brouillons avec versions/générations et conflits par champ dès 2.1 ; unicité tâche, révision workflow et clôture atomique dès 3.3. |
| Architecture | Lint de la spine : zéro finding. Sources et compagnons locaux présents. |
| Revue indépendante | Trois remarques corrigées : retrait explicite de la date prévisionnelle issue du PRD, relations Société limitées à la fiche, formulation de refus d’échange sans lien clarifiée. Aucun autre défaut bloquant de structure ou concurrence signalé. |
| Chevauchements | Extension volontaire des relations de l’annuaire ; moteur d’échanges commun. Pipeline, tâches et relances groupés pour éviter des commandes incohérentes entre epics. |
| Vérification runtime | Non applicable à cette phase documentaire ; aucun parcours d’application n’est annoncé exécuté. |

## Réserve opérationnelle Q7

**À identifier avant les stories 1.1–1.3 et toute opération utilisant ces valeurs :** environnement/projet Supabase de développement et cible de démonstration, compte/projet/plan Vercel, identité propriétaire, origines Auth autorisées, destinataire admissible à la récupération e-mail et paramètres d’envoi. Vérifier la cible et l’identité par les outils disponibles au démarrage de la réalisation ; si une information manque réellement, la demander une seule fois de façon regroupée.

Ces paramètres ne changent pas les comportements enregistrés ; ils empêchent cependant de promettre une connexion, réception d’e-mail ou livraison hébergée réelle maintenant. Aucun secret dans les documents ni valeur fictive utilisée comme configuration réelle.

## Suite exécutée

Générer sprint-status.yaml depuis epics.md seulement, avec les 16 stories en backlog et les rétrospectives optionnelles. Aucun fichier individuel de story ready-for-dev créé. Le skill de réalisation suivant sera bmad-build, en commençant par 1.1 et la résolution des prérequis d’environnement ; il n’est pas lancé pendant cette demande de passage au sprint planning.

## Suivi généré et contrôlé

Le générateur officiel a écrit [sprint-status.yaml](../implementation-artifacts/sprint-status.yaml) : trois epics, seize stories en backlog, trois rétrospectives optionnelles, aucun ready-for-dev et aucun statut perdu. La réserve Q7 est également inscrite dans les métadonnées du suivi.

Deux avertissements du parseur concernent uniquement les en-têtes imposés par le template (« bmad-crm - Epic Breakdown » et « Epic List »), qui ne sont pas des epics/story à compter. Les trois vrais epics et seize stories sont tous reconnus ; aucune omission acceptée ni modification du parseur nécessaire.
