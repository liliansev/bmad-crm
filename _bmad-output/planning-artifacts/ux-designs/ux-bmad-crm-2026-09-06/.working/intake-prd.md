# Entrée en discovery UX — 6 septembre 2026

Source autorisée : [PRD CRM](../../../prds/prd-bmad-crm-2026-09-05/prd.md), extrait en lecture seule par un sous-agent. Le PRD est `final` / `complete`, avec hypothèses résiduelles explicitement non validées (lignes 1–14 et 131–143). Cette note est une extraction de travail, pas un contrat UX.

## Acquis utiles

- Outil interne web hébergé, privé, mono-utilisateur, saisie manuelle ; support pédagogique BMAD (16–30). Connexion e-mail/mot de passe sans inscription publique (195–201).
- Arrivée après connexion sur les relances : « En retard », « À faire aujourd’hui », « Opportunités sans prochaine action » ; accès à « À venir » (169–171, 207–209).
- Pipeline fixe : « À qualifier », « Échange en cours », « Proposition envoyée », « Gagnée », « Perdue ». Les étapes restent modifiables et les opportunités peuvent être rouvertes (175).
- Opportunité : titre requis, entreprise et contact principal facultatifs, montant estimé HT en euros facultatif, date prévisionnelle facultative, description, échanges et prochaine action (175–177, 189).
- Une seule prochaine action active par opportunité ; échéance à la journée en Europe/Paris ; terminer puis pouvoir programmer la suivante ; report à une autre date (129, 169, 209).
- Les relances incluent les opportunités gagnées/perdues. Le groupe sans prochaine action ne concerne que les opportunités ouvertes. À la clôture : choisir conserver ou annuler l’action en cours, jamais la terminer automatiquement (185).
- Contact principal indépendant de l’entreprise de l’opportunité. Échange lié au contact ou à l’opportunité ou aux deux ; entreprise historique préremplie, modifiable et non réattribuée automatiquement (181).
- Échec de sauvegarde : conserver la saisie. Expiration de session : récupération du contenu après reconnexion sans le présenter comme enregistré (201).
- Objectif validé : création/modification d’opportunité en moins d’une minute sur le périmètre défini ; persistance contrôlée après rechargement (205).

## Décisions UX à travailler avec Lilian

| Surface | Acquis | Décisions ouvertes |
|---|---|---|
| Navigation | Arrivée sur les relances | Entrées et ordre du menu, accès aux entreprises, appareil prioritaire, navigation mobile |
| Contacts | Consultation, modification et liaisons | Minimum de création et champs A05, colonnes, tri, filtres, ouverture d’une fiche |
| Pipeline | Cinq étapes fixes | Représentation, contenu visible par opportunité, geste de changement d’étape ; drag non requis par la proposition FR-012 |
| Fiche opportunité | Données et règles métier ci-dessus | Page/panneau, hiérarchie des informations, saisie et confirmation de sauvegarde |
| Relances | Rubriques temporelles et couverture ci-dessus | Disposition, actions directement disponibles, transition terminer/programmer, historique A09 |

Les entreprises, échanges et accès au compte doivent être couverts par les parcours, sans présumer de nouvelles entrées de menu.

## Parcours sources à conserver par leur nom

- **UJ-001 — Après l’appel** (52, 154, 169–171) : cœur validé note + étape + prochaine action ; séquence d’interface encore proposée.
- **UJ-002 — La reprise du matin** (54, 154) : lire les relances, retrouver le contexte, effectuer la relance hors CRM, terminer et éventuellement programmer la suivante ; détails d’interface ouverts.
- **UJ-003 — La lecture d’une entreprise** (56, 154) : parcours complémentaire proposé, à confirmer. Le montant gagné n’est pas du CA facturé (189).

## Autres arbitrages conservés

Champs et cardinalités résiduels A03/A05/A06 ; valeurs initiales A08 ; saisie et historique A09 ; correction/suppression des échanges A10 ; recherche et déconnexion A11 ; suppression définitive des fiches non décidée ; cibles proposées A12. Archivage et restauration hors V1. Pas d’ajout d’intégrations, de scoring ou de personnalisation du pipeline.

## Prochaine étape

Recueillir une session réelle racontée par Lilian, appareil et première intention compris. Reprendre ensuite navigation, contacts, pipeline, fiche opportunité et relances en conservant une validation explicite des choix nouveaux. Aucune palette, structure visuelle, maquette ou spécification finale n’est approuvée à ce stade.
