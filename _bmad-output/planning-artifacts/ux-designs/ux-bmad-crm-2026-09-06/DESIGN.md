---
name: bmad-crm
description: Direction compacte du CRM interne de Lilian, extraite de la variante Pipeline A choisie.
status: final
phase: complete
sources:
  - ../../prds/prd-bmad-crm-2026-09-05/prd.md
  - ../../../../PRODUCT.md
  - .memlog.md
updated: 2026-09-06
colors:
  background: '#FEFEFE'
  sidebar: '#F8F8F8'
  muted: '#F9F9F9'
  card: '#FEFEFE'
  accent: '#F1F1F1'
  border: '#E1E1E3'
  primary: '#0F141E'
  foreground: '#000000'
  muted-foreground: '#474156'
  ring: '#5684E7'
  stage-qualify: '#93959D'
  stage-discussion: '#3D76E9'
  stage-proposal: '#FECE19'
  stage-won: '#07B60C'
  stage-lost: '#EB5554'
typography:
  body:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.45'
  title:
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
  meta:
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.45'
rounded:
  sm: 6px
  md: 8px
spacing:
  '2': 8px
  '3': 12px
  '4': 16px
  '6': 24px
  panel-padding: 28px
components:
  navigation-active:
    background: '{colors.accent}'
    radius: '{rounded.md}'
  kanban-card:
    background: '{colors.card}'
    borderColor: '{colors.border}'
    radius: '{rounded.sm}'
  opportunity-panel:
    background: '{colors.background}'
    padding: '{spacing.panel-padding}'
  selected-card:
    borderColor: '{colors.ring}'
---

# CRM — Direction visuelle V1

**Composition retenue : [Pipeline A compacte](mockups/pipeline-a.png).** Lilian a choisi le menu latéral et le kanban compact avec panneau à droite. Les tokens ci-dessus transposent cette image ; leurs valeurs chiffrées sont des propositions extraites ou approximées, sans validation séparée. Les déclinaisons [Accueil](mockups/key-accueil-a.png), [Contacts](mockups/key-contacts-a.png) et [Relances](mockups/key-relances-a.png) sont également approuvées. Le dossier UX est clôturé : les quatre compositions sont acquises et la couverture documentaire des surfaces secondaires est acceptée. Les arbitrages fonctionnels résiduels restent ouverts dans EXPERIENCE.md.

## Brand & Style

**Validé par Lilian :** une interface simple et minimaliste inspirée de Folk ; un pipeline en kanban ; la variante A compacte comme référence de composition et de langage visuel. L’outil sert son suivi commercial interne sur ordinateur. La sobriété doit permettre de reconnaître les contacts, de lire l’avancée des opportunités et de repérer les tâches importantes.

Le système UI hérité des règles globales est **shadcn/ui avec les tokens Tailwind du projet**. Les composants standards héritent du système choisi ; seuls les écarts visuels explicitement arbitrés seront documentés ici. Cette contrainte ne choisit pas une palette, un thème shadcn, une police ou une stack d’architecture.

La [référence Folk](.working/reference-folk.md) documente l’intention et une consultation documentaire, sans inspection visuelle de l’application. Le [journal des décisions](.memlog.md) est la source des validations. Les comportements sont décrits dans [EXPERIENCE.md](EXPERIENCE.md). Les deux documents priment sur les maquettes en cas de conflit ; leurs mentions « à arbitrer » ne constituent pas des décisions.

## Colors

Surfaces presque blanches, menu et colonnes gris très clair, texte sombre, action principale presque noire. L’état actif du menu reste gris ; le bleu souligne la carte sélectionnée. Les pastilles d’étape utilisent gris, bleu, jaune, vert et rouge avec un libellé toujours présent. Ce langage vient de A, sans palette ajoutée depuis une autre référence.

Les clés de thème `background`, `foreground`, `card`, `muted`, `muted-foreground`, `border`, `primary`, `accent` et `ring` proposent les adaptations des tokens shadcn ; `sidebar` et `stage-*` les complètent. Autres rôles hérités du thème shadcn choisi à l’implémentation. Les valeurs exactes du raster, leurs positions et limites figurent dans l’[inventaire visuel](.working/pipeline-a-visual-inventory.md). Contrastes, erreurs et focus restent à vérifier sur des composants réels ; aucune conformité n’est déclarée à partir d’une image. Le mode sombre n’est pas défini.

## Typography

Sans-serif neutre, titres courts, hiérarchie compacte. `{typography.body}` propose une famille système comme approximation explicite ; aucune police de Folk n’est identifiée. Corps 14 px, métadonnées 13 px, titre 24 px : transpositions approximatives de la maquette, à ajuster au rendu. La taille finale des saisies sur tactile devra respecter les règles du projet.

## Layout & Spacing

**Choisi :** navigation latérale dans l’ordre Accueil, Contacts, Sociétés, Pipeline, Relances ; cinq colonnes visibles dans la vue ordinateur de référence ; fiche opportunité à droite laissant le kanban visible. La maquette mesure 1672 × 941 px : navigation ≈13,6 %, panneau ≈23,1 %, centre ≈63,3 %. Ces proportions décrivent la référence et ne fixent pas des pourcentages obligatoires sur chaque écran.

Transposition proposée : espacement de cartes `{spacing.2}`, intérieur des cartes `{spacing.3}`, marge centrale `{spacing.6}`, intérieur du panneau `{spacing.panel-padding}`. Conserver montant, étape et notes au premier plan ; relations et prochaine action en second niveau. Accueil limité à cinq tâches maximum, Relances séparées, rendez-vous dans l’agenda externe.

**À définir :** largeur minimale lisible des cartes, seuil de défilement, adaptation du panneau et navigation sur petits écrans. Ne pas réduire indéfiniment les cinq colonnes pour reproduire A à toute largeur.

## Elevation & Depth

Séparation par fonds proches et bordures fines. Panneau à bordure gauche, sans voile sombre visible ; cartes planes, sélection bleue. Épaisseur proposée ≈1 px. Aucune ombre forte à importer. Les états de survol, déplacement et menus héritent des primitives shadcn et restent à vérifier.

## Shapes

Angles légèrement arrondis : `{rounded.sm}` pour cartes et champs, `{rounded.md}` pour zones plus larges. Les 6/8 px sont des approximations du raster, pas des mesures contractuelles. Icônes fines et discrètes. La liste Contacts approuvée ne comporte pas de photo. Aucun avatar ni récupération automatique à ajouter à cette composition.

## Components

Les noms ci-dessous sont partagés avec EXPERIENCE.md. Ce sont des ensembles fonctionnels, à composer avec les primitives shadcn adaptées lors de l’implémentation. Les règles distinguent composition approuvée, surfaces non maquettées et détails à résoudre dans le système UI, sans validation séparée de chaque valeur.

| Composant | Structure visuelle acquise ou héritée | Complément restant |
|---|---|---|
| Navigation principale | Cinq entrées : Accueil, Contacts, Sociétés, Pipeline, Relances. | Navigation gauche et état actif gris retenus avec A ; adaptation mobile à définir. |
| Priorités de l’accueil | [Accueil approuvé](mockups/key-accueil-a.png) : liste Tâche, Opportunité liée, Étape, Échéance ; cinq maximum, sans case vide de remplissage. Accès au contexte, lien Voir toutes les relances et indication du retard. Aucun rendez-vous. | États alternatifs à décliner ; règles de départage résiduelles dans EXPERIENCE.md. |
| Liste de contacts | [Contacts approuvés](mockups/key-contacts-a.png) : tableau Prénom, Nom, E-mail, Titre, Dernière interaction, LinkedIn, Société, Opportunité dans cet ordre ; liens bleus, sortie externe LinkedIn, bouton Nouveau contact. Sans photo ni prochaine interaction. | Largeurs adaptatives et liens multiples à transposer ; minimum de création encore ouvert. |
| Liste de sociétés | Surface accessible directement depuis la navigation. | Colonnes, densité et accès aux fiches. |
| Kanban | Cinq colonnes aux étapes fixes ; cartes déplaçables ; montant et notes éditables par clic directement sur la carte, sans bouton Enregistrer : sauvegarde à la sortie du champ. | [A approuvée](mockups/pipeline-a.png) fixe titre, société, montant et notes courtes, avec bouton Nouvelle opportunité. Retours véridiques de sauvegarde, déplacement et défilement à implémenter. |
| Panneau opportunité | À droite du kanban ; montant, étape et une zone unique de notes libres modifiables au premier plan. | [Composition A retenue](mockups/pipeline-a.png) : société, contact et accès Prochaine action en second niveau. Dimensions adaptatives et formulaire d’action à concevoir. |
| Fiche contact | Informations et échanges prévus au PRD ; vocabulaire commun à la liste. | Forme page/panneau, regroupements et champs de création. |
| Fiche société | Contacts, opportunités et montant des opportunités gagnées prévus au PRD. | Forme page/panneau, dernier échange et présentation du compteur de montants absents. |
| Formulaire métier | Champs et commandes issus de shadcn ; erreurs au voisinage des champs selon les règles globales. | Composition des créations/modifications et déclenchement de sauvegarde. |
| Suivi des actions | [Relances approuvées](mockups/key-relances-a.png) : groupes En retard, À faire aujourd’hui, À venir, Opportunités sans prochaine action, compteurs contextuels ; lignes avec Fait, tâche, opportunité, étape, échéance éditable. | Création de la suivante et historique à concevoir ; retours d’échec à transposer. |
| Journal d’échanges | Date, contexte et informations d’échange selon le PRD ; distinct de la zone unique de notes de l’opportunité. | Présentation, accès et commandes de correction des échanges. |
| Accès au compte | Connexion e-mail/mot de passe et récupération d’accès. | Composition des écrans, traitement de la reconnexion pendant une saisie. |
| Recherche de fiches | Aucun motif visuel adopté : recherche encore proposée A11. | Validation de la fonction, emplacement et résultats. |
| Retour d’état | Chargement, réussite et erreur distingués selon les règles globales ; état d’enregistrement véridique. | Traitement visuel issu du thème, messages et emplacement. |

## Do's and Don'ts

| À conserver | À éviter |
|---|---|
| Simplicité et minimalisme choisis par Lilian. | Copier toutes les fonctions ou l’identité de Folk. |
| Jusqu’à cinq tâches commerciales prioritaires à l’accueil. | Transformer l’accueil en agenda ou inventer un score. |
| Montant, étape et notes au premier plan de l’opportunité. | Supprimer silencieusement les autres capacités du PRD. |
| Héritage shadcn pour les primitives UI. | Construire des primitives personnalisées à la place des composants standards. |
| Marquer les choix encore ouverts. | Présenter une valeur extraite du raster ou une surface non maquettée comme une validation distincte. |

**Couverture visuelle :** `mocked` = **4 images approuvées** : [Pipeline et panneau ensemble](mockups/pipeline-a.png), [Accueil](mockups/key-accueil-a.png), [Contacts](mockups/key-contacts-a.png), [Relances](mockups/key-relances-a.png). Les sidecars `mockups/*.json` portent leur approbation et ses limites ; les [variantes B/C](.working/pipeline-compositions.md) ne sont pas retenues. `spine-only` = Sociétés, fiches contact/société, créations et relations, échanges, formulaires/historique d’actions, choix de clôture, connexion/récupération/reconnexion, états alternatifs et petits écrans : parcours documentés dans EXPERIENCE.md, sans maquette complète. Lilian accepte cette couverture documentaire et décline la revue UX facultative lors de la clôture. Aucun arbitrage résiduel ne devient implicitement validé.

**Défauts raster exclus :** les chiffres 1–5 de A ne sont pas des compteurs métier ; « Enregistré » ne doit pas annoncer la réussite pendant une saisie encore en cours ; le rouge d’« Aujourd’hui » dans l’accueil ne doit pas assimiler une échéance du jour à un retard. Les données d’exemple restent fictives. Valeurs de couleur échantillonnées et polices approximées sont une transcription de référence, pas autant d’arbitrages humains. Contrastes, focus, responsive et états seront vérifiés sur l’interface réelle.

## Précisions de réalisation déléguées

Les [décisions déléguées](../../epics-support/decisions-deleguees.md), postérieures à la validation des maquettes, précisent Q1–Q6 sans changer la direction A compacte. Elles priment sur les anciennes propositions de classement/formulaires et écartent recherche et suppression du POC. Les valeurs visuelles restent à transposer et vérifier, sans nouveau gate de maquette. Q7 reste un prérequis externe avant utilisation.
