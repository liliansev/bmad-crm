# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Lilian, consultant indépendant, utilise ce CRM interne seul pour suivre ses contacts et opportunités commerciales. Usage principalement sur ordinateur, peu de mobile pour ces tâches : confirmé le 6 septembre 2026.

## Product Purpose

Retrouver le contexte commercial, savoir quelle action effectuer et éviter les relances oubliées. À l’ouverture du tableau de bord, Lilian veut voir immédiatement jusqu’à cinq tâches importantes : par exemple relancer, préparer un devis ou recontacter un client.

## Operating Context

Application web privée et hébergée, alimentée manuellement, également support d’une formation BMAD. Le PRD définit notamment « UJ-001 — Après l’appel » et « UJ-002 — La reprise du matin ». Leurs détails d’interface restent à définir avec Lilian.

Les rendez-vous planifiés sont dans l’agenda de Lilian et passent avant toutes les tâches commerciales : un client l’attend. Un R2 fixé est un rendez-vous, distinct d’une tâche à accomplir pour faire avancer une opportunité. Lilian confirme que son agenda suffit : les rendez-vous ne sont pas affichés sur l’accueil du CRM en V1. Aucune intégration agenda n’est nécessaire.

## Capabilities and Constraints

Le [PRD](./_bmad-output/planning-artifacts/prds/prd-bmad-crm-2026-09-05/prd.md) reste la source des exigences métier et de leur degré de validation. Contacts, entreprises, opportunités, étapes fixes, échanges, notes et prochaine action datée constituent le périmètre. Une seule prochaine action active par opportunité. Les actions sur opportunités gagnées ou perdues restent visibles.

La mise en avant de cinq tâches maximum ne supprime pas l’exigence de visibilité de toutes les relances échues. Règle validée : retenir d’abord les tâches en retard ou prévues aujourd’hui en privilégiant les opportunités proches de la signature ; s’il reste des places, compléter avec les tâches à venir aux dates les plus proches. Relancer après un devis envoyé passe devant une relance de premier contact dans le premier groupe. Ce classement ne s’applique pas aux rendez-vous fixés. Seules les tâches des opportunités ouvertes sont éligibles aux cinq priorités ; celles des opportunités gagnées ou perdues restent visibles dans Relances. Le départage à importance/date égales et la correspondance exhaustive entre étapes et proximité commerciale restent ouverts. Aucun score n’est validé. L’exemple « préparer un devis » désigne une tâche à effectuer ; il ne valide pas un module de génération de devis.

Intégrations, marketing, scoring, personnalisation du pipeline et archivage restent hors V1. Aucun changement de périmètre n’est implicite dans les propositions UX.

## Brand Commitments

Lilian cite Folk comme référence : une interface simple et minimaliste, avec un kanban pour le pipeline. Le 6 septembre 2026, il choisit la composition A compacte puis valide ses déclinaisons Accueil, Contacts et Relances : menu à gauche, surfaces claires, listes compactes et panneau opportunité à droite. Les [maquettes approuvées](./_bmad-output/planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/README.md) sont les références visuelles ; DESIGN.md transpose leurs valeurs et précise les approximations. Ce choix ne vaut pas adoption de toutes les fonctions de Folk ni validation des arbitrages restants du PRD.

## Evidence on Hand

- [PRD final, avec hypothèses résiduelles explicites](./_bmad-output/planning-artifacts/prds/prd-bmad-crm-2026-09-05/prd.md).
- [Journal des décisions UX](./_bmad-output/planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/.memlog.md).
- Réponse de Lilian du 6 septembre 2026 sur son usage ordinateur et les tâches à voir à l’ouverture, avec un plafond révisé à cinq.

## Product Principles

- Rendre les prochaines actions immédiatement repérables.
- Distinguer les rendez-vous fixés, prioritaires, des tâches commerciales classées selon leur proximité de la signature.
- Garder accessibles les relances échues au-delà des cinq tâches maximum mises en avant.
- Conserver le contexte et la saisie lors des erreurs d’enregistrement.
- Faire valider les décisions UX nouvelles par Lilian ; ne pas transformer les hypothèses du PRD en décisions acquises.
