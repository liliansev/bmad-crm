---
status: approved
workflowStage: epic-design-approved
updated: 2026-09-06
source: ../epics.md
---

# Proposition de découpage — trois epics

L’inventaire a été confirmé par Lilian. Ce découpage est approuvé par Lilian (« valider et continuer ») ; il ne contient aucune story. L’approbation du regroupement ne résout pas les arbitrages Q1–Q7 et ne réintègre aucune fonction retirée.

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

## FR Coverage Map

Chaque FR retenue a un responsable ; les extensions entre epics sont identifiées. Une couverture finale ne doit pas être annoncée dès une livraison partielle.

| FR | Attribution proposée | Limite de validation |
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

## Exigences transversales et recette

La fiabilité, la confidentialité et l’accessibilité accompagnent chaque livraison ; aucune epic finale de « durcissement » ne retarde ces garanties.

| Ensemble | Application |
|---|---|
| NFR-001 | Cibles complémentaires sous Q6 ; vérifier les surfaces de chaque epic lorsqu’elles existent. |
| NFR-002 | Mécanismes d’accès en epic 1 ; persistance, erreurs, brouillons, idempotence et conflits appliqués aux saisies des epics 2 et 3. |
| NFR-003 | Clavier, erreurs associées, dimensions adaptées et commandes alternatives dès chaque écran. |
| NFR-004 | Confidentialité dès epic 1 ; refus d’accès vérifié pour chaque entité introduite ensuite. |
| NFR-005 | Retirée du POC, aucune epic de sauvegarde. |
| NFR-006 | Règles d’échanges communes en epic 2, extension opportunités en epic 3 ; aucun connecteur ni API publique. |
| AR-01/02/10/11/13 | Socle et environnement epic 1 ; règles reconduites aux livraisons suivantes. |
| AR-03/04/06/08/09/12 | Intégration dans chaque domaine au moment de sa première lecture/saisie ; pas de couche technique isolée livrée comme valeur utilisateur. |
| AR-05/07/16 | Cohérence étapes/tâches, dates, priorités et exhaustivité Relances dans epic 3. |
| AR-14/15 | Arbitrages avant les stories dépendantes ; exécution réelle des parcours de chaque livraison. |
| UX-DR1/24/25/35 | Accès et structure epic 1, récupération de saisie métier epics 2 et 3 ; navigation finale complète epic 3. |
| UX-DR5/6/14/16/18/23/30 | Annuaire et journal epic 2, puis leurs extensions opportunités epic 3. |
| UX-DR2–4/7–13/15/17/19–22/28/29/31/32/38/45–47 | Suivi commercial et parcours complets epic 3. |
| UX-DR26 | Recherche conditionnelle Q5, aucun élargissement par ce découpage. |
| UX-DR27/33/34/36/37/39–44/48–61 | États, règles visuelles, accessibilité, limites et arbitrages appliqués aux surfaces concernées dans chaque epic ; conserver les statuts proposés des transcriptions visuelles. |

## Ordre et chevauchements

Ordre proposé : **1 → 2 → 3**. Une epic peut utiliser une précédente ; aucune ne nécessite la suivante pour son résultat intermédiaire annoncé. Les migrations de chaque domaine arrivent avec son usage. Les échanges contact/société sont utiles dès l’epic 2 et étendus, sans duplication du moteur métier, aux opportunités en epic 3.

Le passage 2 → 3 enrichit volontairement les fiches et relations existantes. Ce chevauchement est une extension identifiée, pas deux implémentations concurrentes du même formulaire. Les mutations de pipeline, tâches et clôture partagent davantage de comportements : elles restent regroupées dans l’epic 3. Les mécanismes transversaux sont réutilisés dès le départ.

Cette proposition comporte trois epics, pas trois stories. Le nombre et le détail des stories seront définis à l’étape suivante après approbation. Aucune durée de réalisation n’est engagée ici.

## Validation enregistrée

Lilian valide le regroupement et cet ordre, puis demande de continuer vers les stories. Les sources et arbitrages restent ceux de l’inventaire confirmé.
