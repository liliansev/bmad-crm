---
name: bmad-crm
description: Expérience V1 consolidée après approbation des quatre maquettes, arbitrages résiduels conservés.
status: final
phase: complete
sources:
  - ../../prds/prd-bmad-crm-2026-09-05/prd.md
  - ../../../../PRODUCT.md
  - .memlog.md
  - reconcile-accueil.md
updated: 2026-09-06
---

# CRM — Expérience V1

**Quatre maquettes approuvées :** [Pipeline A avec panneau opportunité](mockups/pipeline-a.png), [Accueil](mockups/key-accueil-a.png), [Contacts](mockups/key-contacts-a.png) et [Relances](mockups/key-relances-a.png). Leurs compositions sont acquises. Le dossier UX est clôturé après acceptation de la couverture documentaire des surfaces secondaires et refus de la revue facultative. Les arbitrages résiduels ci-dessous restent ouverts et seront repris avant la conception ou l’implémentation concernée. « Validé UX » désigne une décision explicite de Lilian ; « Hérité PRD » conserve le statut des exigences source. Les hypothèses Axx restent proposées sauf décision postérieure explicite. Images statiques et données fictives : aucune application ni validation runtime.

## Foundation

Application web privée, compte propriétaire unique, saisie manuelle. **Validé UX : ordinateur prioritaire**, peu d’usage mobile. Le système UI hérite de shadcn/ui et des règles globales ; [DESIGN.md](DESIGN.md) transpose la référence A choisie en tokens proposés : fond `{colors.background}`, navigation active `{colors.accent}`, sélection `{colors.ring}`. Ces valeurs ne prouvent pas une conformité d’accessibilité ; les composants réels restent à vérifier.

**Validé UX :** arrivée sur un accueil présentant jusqu’à cinq tâches commerciales prioritaires, avec une vue Relances distincte. Cette décision postérieure remplace l’arrivée sur les relances du PRD ; voir la [réconciliation de l’accueil](reconcile-accueil.md). Le PRD source n’a pas été modifié. Les rendez-vous restent dans l’agenda externe, sans affichage ni intégration agenda dans le CRM ; ils priment dans la journée de Lilian et ne sont pas classés parmi les tâches.

## Information Architecture

Le choix de A établit le menu latéral dans l’ordre Accueil, Contacts, Sociétés, Pipeline, Relances pour la vue ordinateur. Les surfaces complémentaires assurent la couverture du PRD sans créer implicitement d’autres entrées de navigation.

| Surface | Accès et contenu | Statut / parcours |
|---|---|---|
| Accueil | À l’ouverture après connexion ; jusqu’à cinq tâches : en retard/du jour privilégiant la proximité de signature, puis prochaines échéances s’il reste des places. | Validé UX ; UJ-002. Composition approuvée ; départage résiduel ouvert. |
| Contacts | Navigation ; informations de liste définies ci-dessous. | Validé UX ; UJ-001 et parcours complémentaire Contacts. |
| Sociétés | Accès direct dans la navigation ; liste des entreprises. | Validé UX ; UJ-003. Colonnes et interactions à arbitrer. |
| Pipeline | Navigation ; kanban aux cinq étapes fixes. | Validé UX ; UJ-001. |
| Relances | Navigation séparée de l’accueil ; liste complète et rubriques du PRD ; terminer une tâche ou modifier sa date directement dans la liste. | Validé UX ; UJ-002. |
| Panneau opportunité | Ouverture depuis une carte du kanban, à droite ; montant, étape et une zone unique de notes libres modifiables prioritaires. | Validé UX ; UJ-001. Ouverture depuis les autres vues à arbitrer. |
| Fiche contact / création de contact | Depuis Contacts ou une relation ; données, note de contact et échanges du PRD. | Besoin hérité ; parcours Contacts. Minimum validé en architecture : prénom ou nom suffit. Forme et validations résiduelles A05 à préciser. |
| Fiche société / création de société | Depuis Sociétés ou une relation ; contacts, opportunités, montant des opportunités gagnées et échanges. | Besoin hérité ; UJ-003 proposé. Nom obligatoire validé en architecture ; forme et autres champs A06 à préciser. |
| Création d’opportunité / relations | Depuis le pipeline (bouton approuvé) ou une société (accès proposé) ; champs du PRD. | Besoin hérité ; UJ-001 et UJ-003. Création préliée prévue par FR-006. |
| Saisie et consultation d’échanges | Liées aux fiches ; notes après appel, dernier échange et entreprise historique. | Besoin hérité ; UJ-001, UJ-003, Contacts. Accès et correction à arbitrer A10. |
| Gestion et historique des prochaines actions | Terminer et modifier la date depuis la liste Relances : validé UX. Accès Prochaine action depuis le panneau approuvé ; création, annulation, rétablissement : formulaires et séquences à concevoir. | Capacités héritées ; UJ-001/002. Présentation et historique A09 ouverts. |
| Choix de clôture avec action en cours | Lors du passage à Gagnée/Perdue, depuis le kanban ou la fiche. | Règle PRD validée ; UJ-001 variante. Dialogue à concevoir dans les règles acquises. |
| Connexion / récupération / reconnexion | Hors session ; e-mail/mot de passe, récupération par e-mail, retour à la saisie. | Validé PRD ; parcours complémentaire Accès. Aucun écran d’inscription. |
| Recherche de fiches | Emplacement non décidé. | Proposition A11 ; utilisée conditionnellement dans les parcours. |

« Sociétés » est le libellé UX validé pour l’entité « Entreprise » du PRD ; ce n’est pas une nouvelle entité. Agenda, archives, génération de devis et écran d’administration ne sont pas ajoutés.

## Voice and Tone

Les libellés métier acquis sont conservés : « À qualifier », « Échange en cours », « Proposition envoyée », « Gagnée », « Perdue » ; « En retard », « À faire aujourd’hui », « À venir », « Opportunités sans prochaine action » ; « Montant des opportunités gagnées ». Ce dernier ne signifie ni facturation ni encaissement.

Les écrans approuvés adoptent des libellés français courts et directs. Conserver ce ton pour nommer les actions et leur état. Une erreur indique que la saisie reste disponible ; « enregistré » ne s’affiche qu’après réussite réelle. Les textes de démonstration ne sont pas des exigences mot à mot ; les écrans secondaires reprennent ce vocabulaire.

## Component Patterns

Les noms correspondent aux lignes de DESIGN.md. Les primitives shadcn héritent de leurs comportements standards et des exigences d’accessibilité globales ; le tableau décrit le comportement métier et les points non décidés.

| Composant | Règles et décisions restantes |
|---|---|
| Navigation principale | Menu latéral gauche dans l’ordre Accueil, Contacts, Sociétés, Pipeline, Relances, retenu avec A. Sociétés et Relances ont leur entrée directe. Conservation du contexte entre vues et adaptation mobile à préciser. |
| Priorités de l’accueil | **Règle validée : cinq tâches maximum, d’abord en retard ou prévues aujourd’hui, en privilégiant la proximité de signature ; puis, s’il reste des places, tâches à venir aux dates les plus proches.** Relancer après un devis envoyé passe devant une relance de premier contact dans le premier groupe. Afficher moins de cinq tâches si moins sont disponibles. Pas de rendez-vous ni de score. La [maquette Accueil](mockups/key-accueil-a.png) fixe une liste Tâche, Opportunité liée, Étape, Échéance, avec accès au contexte et « Voir toutes les relances ». Aucun emplacement vide pour atteindre cinq. Validé ensuite en architecture : sélection limitée aux opportunités ouvertes ; tâches des opportunités gagnées/perdues conservées dans Relances. Départage à importance/date égales et correspondance exhaustive des étapes encore ouverts. |
| Liste de contacts | La [liste approuvée](mockups/key-contacts-a.png) fixe l’ordre : prénom, nom, e-mail, titre professionnel, dernière interaction, LinkedIn, société, opportunité. Liens LinkedIn externes et relations accessibles ; bouton Nouveau contact. Sans photo ni prochaine interaction dans cette composition. Champs visibles ≠ champs obligatoires ; aucune récupération automatique de photo. Sens/calcul de dernière interaction à concilier avec FR-004 ; aucune modification de note ne crée implicitement un échange. |
| Liste de sociétés | Accès direct validé ; consultation et création/modification héritées du PRD. Colonnes, ouverture des fiches, recherche et tri non arbitrés. |
| Kanban | Cinq étapes fixes dans l’ordre du PRD. **Validé UX : cliquer sur le montant ou les notes de la carte, modifier, puis cliquer ailleurs déclenche automatiquement l’enregistrement en quittant le champ**, sans bouton Enregistrer ni ouverture préalable du panneau. Le clic d’édition ne doit ni ouvrir la fiche ni démarrer un déplacement. Glisser-déposer validé pour changer d’étape ; commande depuis la fiche conservée. Tout passage autorisé ; règles de clôture et réouverture du PRD applicables. La [carte approuvée](mockups/pipeline-a.png) affiche titre, société, montant et aperçu de notes ; bouton Nouvelle opportunité au-dessus du kanban. Les compteurs 1–5 du raster ne sont pas des valeurs métier. |
| Panneau opportunité | Ouvert à droite depuis le kanban visible. Montant estimé HT en euros, étape et notes directement modifiables. Le montant reste facultatif. **Validé UX : une seule zone de notes libres que Lilian met à jour**, sans création d’entrée datée à chaque édition. Modifier les notes ne crée pas un échange et ne met pas à jour la dernière interaction. La [composition du panneau](mockups/pipeline-a.png) place société, contact et accès « Ajouter une prochaine action » en second niveau. Validé ensuite en architecture : Notes constitue le champ unique de contexte de l’opportunité, sans Description séparée ; carte et panneau éditent le même texte, distinct des échanges datés. Le formulaire de prochaine action, l’accès aux échanges et la sauvegarde du panneau restent à préciser ; la composition retenue n’est pas à rouvrir. |
| Fiche contact | Note de contact distincte d’un échange ; lien LinkedIn externe selon FR-002 ; échanges et liens consultables selon PRD. Page/panneau et modalités d’édition à choisir. |
| Fiche société | Afficher les relations et le montant des opportunités gagnées avec compteur séparé des montants manquants. Conserver l’entreprise historique des échanges. Forme et hiérarchie ouvertes. |
| Formulaire métier | Conserver la saisie en cas d’échec. Relations entreprise/contact principal indépendantes ; aucun rattachement forcé. Validé en architecture : contact avec prénom ou nom, société avec nom, montant facultatif non négatif, étape initiale À qualifier, tâche avec intitulé et date. Autres validations de champs et sauvegarde des formulaires restent à préciser. |
| Suivi des actions | Au plus une action à faire par opportunité ; date sans heure Europe/Paris. **Validé UX : marquer une tâche comme faite ou modifier sa date directement dans la liste Relances, sans ouvrir l’opportunité.** Terminer puis pouvoir programmer la suivante, report, annulation et correction selon FR-013. Une action sur opportunité close reste visible ; aucune seconde action active implicite. La [vue approuvée](mockups/key-relances-a.png) groupe les lignes En retard, À faire aujourd’hui, À venir, Opportunités sans prochaine action ; commande Fait et champ de date sur chaque tâche. Création de la suivante et historique restent à concevoir. |
| Journal d’échanges | Un contact ou une opportunité au minimum, les deux possibles ; entreprise historique préremplie et modifiable selon PRD. Notes générales et notes d’échange ne sont pas assimilées. Canal, dates, correction/suppression et présentation restent proposés A10. |
| Accès au compte | Compte unique créé à l’installation ; aucune inscription. Récupération par e-mail. Expiration pendant saisie : retrouver le contenu après reconnexion sans le déclarer enregistré. Déconnexion explicite proposée A11. |
| Recherche de fiches | Si A11 validée : noms/e-mails des contacts, noms des sociétés, titres des opportunités ; aucun résultat permet de créer. Pas de recherche universelle ou de raccourci ajouté implicitement. |
| Retour d’état | Distinguer chargement, réussite et échec ; conserver le contenu à réessayer. Ne pas confondre déplacement visuel d’une carte et sauvegarde confirmée. Traitement exact ouvert. |

## State Patterns

Règles globales héritées : chargement aux dimensions du contenu attendu, état réussi et échec explicite ; focus clavier perceptible et erreurs associées aux champs. Le détail des composants d’état relève de la conception et de l’implémentation dans ces garanties ; il ne constitue pas un arbitrage humain pour chaque détail visuel. Aucune capacité hors ligne avec synchronisation n’est validée.

| Surfaces | États à couvrir et limites du brouillon |
|---|---|
| Accueil | Chargement, zéro à cinq tâches disponibles, erreur de chargement, focus sur chaque action. S’il y a moins de cinq tâches en retard/du jour, compléter avec les prochaines échéances disponibles ; si aucune tâche n’est disponible, afficher un état vide, sans tâche inventée. Messages ouverts ; ne jamais conclure que toutes les relances sont faites d’après la seule sélection de l’accueil. |
| Contacts / Sociétés | Chargement, liste pleine/vide, erreur, sélection/focus, absence de valeurs ou de relations. Recherche sans résultat seulement si validée. La liste Contacts approuvée est sans photo. |
| Pipeline | Chargement, colonne vide, kanban vide, carte sélectionnée, champ en édition, enregistrement déclenché à la sortie du champ, réussite ou échec, déplacement en cours, échec de changement d’étape, choix de clôture abandonné. Une erreur conserve la valeur saisie pour réessayer et ne la présente pas comme enregistrée. En abandon de clôture, garder l’étape et l’action initiales. Animation et présentation du retour d’enregistrement ouvertes. |
| Relances | Rubriques vides/remplies, chargement/erreur, focus, terminaison en cours et modification de date depuis la ligne. Après réussite, une tâche terminée sort des tâches à faire ; une date modifiée la replace dans la rubrique correspondante. En cas d’échec, conserver la saisie et signaler la modification non enregistrée. Anciennes échéances d’abord ; compteurs de rubriques présents dans la maquette approuvée. Départage par titre et filtres réinitialisables restent des propositions PRD. À venir accessible ; actions closes exclues, opportunités closes avec action à faire incluses. |
| Panneau et fiches contact/société | Chargement, entité trouvée, accès impossible/entité introuvable, absence d’échange ou de liens, focus ; sauvegarde en attente/réussie/échouée. Détails de retour vers la liste et fermeture avec saisie non enregistrée ouverts. |
| Création / relations / échanges / actions | Valeurs vides, saisie, erreur de validation, attente, réussite, échec, session expirée. Historique vide et conflit de rétablissement d’action à traiter selon PRD ; détails de formulaires ouverts. |
| Choix de clôture | Action en cours : choisir explicitement conserver ou annuler ; abandon possible. Aucun achèvement automatique. Échec de sauvegarde sans succès trompeur ; restitution de l’état à préciser. |
| Connexion / récupération / reconnexion | Hors session, soumission, réussite, échec ; expiration pendant saisie avec récupération après reconnexion. Erreur d’envoi et lien de récupération inutilisable à concevoir. Données privées inaccessibles hors session. |
| Recherche de fiches | Si validée : saisie, résultats, aucun résultat, chargement, erreur et focus. Présentation à choisir. |
| Toutes les surfaces de données | Connexion réseau perdue : signaler l’échec, préserver toute saisie et permettre de réessayer. Pas de promesse de lecture hors ligne ni de file de synchronisation. Hors session, réauthentification selon FR-018. |

Validé en architecture : avertir avant de remplacer un même champ modifié dans un autre onglet, conserver la saisie et laisser choisir. Le recalcul du jour à minuit Paris/retour au premier plan est une traduction technique de la visibilité des relances, à vérifier en recette.

## Interaction Primitives

- **Validé UX :** clic sur un champ de la carte → édition en place ; ouverture de la fiche → panneau à droite ; glisser-déposer → changement d’étape, avec choix conserver/annuler si clôture et action en cours. La zone précise d’ouverture de fiche reste à définir pour éviter tout conflit avec les champs éditables. Réouverture possible sans réactiver une ancienne action terminée/annulée.
- **Hérité :** alternative de changement d’étape dans la fiche ; aucune action essentielle réservée au déplacement ou au survol. Commandes clavier standard accessibles, Échap pour fermer les dialogues.
- **Validé UX :** l’édition du montant et des notes sur carte s’enregistre automatiquement à la sortie du champ. La réussite n’est annoncée qu’après confirmation effective ; en cas d’échec, la saisie est conservée. Aucune sauvegarde pendant la frappe n’est déduite de ce choix.
- **Validé UX :** terminer une tâche ou changer sa date depuis sa ligne dans Relances ; aucun passage préalable par la fiche opportunité n’est requis.
- **À arbitrer :** sauvegarde des créations et autres formulaires, fermeture avec modification en attente, ouverture depuis Contacts/Relances, emplacement des commandes d’action. Aucun raccourci dédié ni réordonnancement manuel des cartes n’est validé.

## Accessibility Floor

Appliquer les règles globales : champs nommés, erreurs reliées, parcours clavier logique, actions essentielles accessibles sans glisser-déposer ni survol. Les composants modaux doivent gérer le focus, le restituer et se fermer par Échap ; la modalité technique du panneau reste à résoudre en architecture. Une étape ou une erreur ne doit pas dépendre seulement de la couleur. Contrastes et traitements de focus visuels restent à définir dans DESIGN.md, puis à tester ; aucun audit de conformité réalisé.

## Responsive & Platform

Ordinateur prioritaire confirmé. Les dimensions de recette du PRD (1440 × 900 et 402 × 874) restent des propositions A12, pas des nouveaux choix UX. Les règles globales demandent une interface utilisable au clavier et sur tactile, sans défilement horizontal de page ; le kanban peut disposer de son propre défilement. La navigation compacte et le devenir du panneau sur petit écran restent ouverts ; aucun breakpoint n’est fixé.

## Inspiration & Anti-patterns

La [référence Folk](.working/reference-folk.md) étaye uniquement l’intention de simplicité et le kanban ; le glisser-déposer et le panneau droit ont été validés séparément par Lilian. Ne pas déduire de Folk une personnalisation des étapes, un enrichissement, une intégration ou sa palette. Ne pas transformer « préparer un devis » en module de devis. Ne pas confondre rendez-vous et tâche commerciale, note et échange, montant gagné et montant facturé.

## Key Flows

Les noms UJ sont repris exactement du PRD. Les étapes concrétisent les besoins : seules les mentions « validé » valent arbitrage d’interface. Les variantes et parcours complémentaires ci-dessous restent des propositions de séquence, même lorsqu’ils réalisent des capacités acquises.

### UJ-001 — Après l'appel

1. Lilian retrouve l’opportunité dans le Pipeline (**validé UX** ; recherche éventuelle A11). Il peut ouvrir la fiche dans le panneau à droite, mais ce n’est pas requis pour éditer un champ visible sur la carte.
2. Après l’appel, il clique sur le montant ou les notes de la carte pour les modifier en place, puis clique ailleurs pour déclencher leur enregistrement automatique ; il change l’étape par déplacement ou depuis la fiche (**validé UX**). La zone unique de notes reste le même texte modifiable sur carte et dans le panneau ; cette édition n’enregistre pas automatiquement un échange. L’accès à la saisie distincte d’un échange reste **à arbitrer**.
3. Il définit une prochaine action datée (**validé PRD**), via l’accès Prochaine action du panneau approuvé ; son formulaire reste **à concevoir**. Sans contact, un échange peut être rattaché directement à l’opportunité.
4. **Point culminant :** après confirmation réelle d’enregistrement, Lilian retrouve notes, étape et action au rechargement (**objectif validé PRD**). Le montant et les notes sur carte sont enregistrés à la sortie du champ ; le geste d’enregistrement de la prochaine action reste ouvert.

Échec : conserver la saisie, montrer l’erreur et permettre de réessayer ; expiration → reconnexion et récupération. Variante clôture : déplacement vers Gagnée/Perdue avec action en cours → conserver ou annuler explicitement ; abandon sans changement. Variante création : bouton Nouvelle opportunité du pipeline approuvé ; titre, relations existantes et action dans un formulaire encore à concevoir. Le parcours sous une minute est mesuré selon le PRD, pas encore testé.

### UJ-002 — La reprise du matin

1. Lilian ouvre l’**Accueil** sur ordinateur et voit jusqu’à cinq tâches : en retard ou du jour en privilégiant les opportunités proches de la signature, puis les prochaines tâches à venir s’il reste des places (**validé UX**, remplace l’arrivée PRD). Son agenda reste externe.
2. Il consulte **Relances**, vue séparée validée, pour toutes les actions en retard/du jour, À venir et les opportunités ouvertes sans prochaine action. Les rubriques, dates et disposition de la [vue Relances](mockups/key-relances-a.png) sont approuvées ; le détail du retour au contexte reste à concevoir.
3. Il retrouve le contexte si nécessaire, effectue la relance hors CRM, puis marque la tâche comme faite directement dans Relances (**validé UX**). Il peut ensuite programmer la suivante (**capacité PRD**, accès à concevoir). Pour changer la date, il agit également directement dans la liste (**validé UX**).
4. **Point culminant :** la relance traitée sort des actions à faire et la suite apparaît à son échéance. Il sait ce qui reste à faire sans perdre les tâches absentes de la sélection de l’accueil.

Échec : erreur de sauvegarde → aucun succès annoncé ; le traitement reste à confirmer/réessayer. Variante report depuis la liste validée ; annulation/rétablissement selon FR-013, sans deux actions actives ; commandes correspondantes et historique à arbitrer. Si aucune tâche prioritaire n’est éligible, l’accueil ne doit pas masquer l’accès à Relances ; message encore ouvert.

### UJ-003 — La lecture d'une entreprise

1. Lilian entre dans **Sociétés** par la navigation (**validé UX**) et ouvre une fiche (**forme à arbitrer**).
2. Il consulte contacts, opportunités, montant des opportunités gagnées, compteur de montants absents et dernier échange (**besoins PRD ; séquence A04 proposée**).
3. Il crée une opportunité préliée, choisit éventuellement un contact principal indépendant de l’entreprise et enregistre (**capacité PRD ; accès proposé**).
4. **Point culminant :** il retrouve l’opportunité sur la fiche société et conserve le contexte des échanges historiques. Le placement de ces informations reste à valider.

Échec : saisie conservée si sauvegarde échoue. État vide : absence de relations/échanges identifiable ; libellés à choisir. Un montant absent n’est pas un zéro saisi ; aucune lecture comme chiffre d’affaires facturé.

### Parcours complémentaire proposé — Contacts

1. Lilian ouvre Contacts et reconnaît la personne avec les champs de liste validés ; recherche si A11 retenue.
2. Il ouvre la fiche, consulte/modifie les données ou une note, puis accède aux relations ou à LinkedIn si renseigné (forme de fiche et édition ouvertes).
3. **Point culminant :** après enregistrement, le contexte est retrouvé sans créer de faux échange. Pour un nouveau contact, le minimum validé en architecture est un prénom ou un nom.

Échec : données invalides ou sauvegarde refusée → conserver les valeurs ; validation e-mail/URL et avertissement de doublon selon propositions PRD à arbitrer. Sans échange, prévoir l’état vide de FR-004.

### Parcours complémentaire proposé — Accès

1. Lilian se connecte avec son compte propriétaire ; s’il a oublié son mot de passe, il utilise la récupération par e-mail (**capacités validées PRD**).
2. Il arrive sur Accueil. Si la session a expiré pendant une saisie, il se reconnecte et retrouve son contenu (**validé PRD**, retour concret à concevoir).
3. **Point culminant :** il poursuit sa saisie sans ressaisie et obtient une confirmation seulement après sauvegarde réussie.

Échec : erreur de connexion/récupération expliquée sans exposer les données ; aucun faux état enregistré. Lien de récupération invalide/expiré et réessai à concevoir. Déconnexion explicite encore A11.

## Traçabilité et arbitrages ouverts

Couverture fonctionnelle du PRD : FR-001 à FR-004 → Contacts ; FR-005 à FR-010 → UJ-003, Contacts et UJ-001 ; FR-011/012/015 → UJ-001 ; FR-013/014 → UJ-001/002 ; FR-016 → recherche conditionnelle ; FR-017 hors V1 ; FR-018 → Accès et erreurs UJ-001. NFR-001/002 et SM-001 → confirmation/persistance UJ-001 ; visibilité des relances → UJ-002 ; NFR-003 → accessibilité/responsive ; NFR-004 → accès ; NFR-005 retirée du POC par décision ultérieure de Lilian en architecture ; NFR-006 → architecture, sans écran ajouté. Les identifiants facilitent la lecture du PRD sans recopier ses exigences ni transformer A01–A13 en décisions.

| Arbitrage fonctionnel à conserver pour Lilian | Incidence réelle |
|---|---|
| Sélection des priorités | Départage à importance/date égales et ordre commercial exhaustif. L’exclusion des opportunités closes des cinq priorités a été validée en architecture. La règle temporelle est validée ; toutes les actions concernées restent visibles dans Relances. |
| Créations et données | Minimum de saisie et société actuelle unique du contact validés en architecture. Restent les autres champs et validations A05/A06 ; les colonnes visibles ne les décident pas. |
| Après un échange ou une tâche terminée | Description/notes unifiées par validation en architecture ; les échanges datés restent distincts. Restent ouverts : saisie de l’action suivante, correction/historique A09/A10 et sauvegarde des formulaires non couverts par l’édition sur carte. |
| Surfaces complémentaires et portée | Forme des fiches contact/société, composition de Sociétés et des créations ; recherche/déconnexion encore proposées A11. Leur couverture documentaire sans maquette supplémentaire est acceptée ; les propositions fonctionnelles non tranchées restent ouvertes. |

**Condition de reprise des arbitrages :** traiter les règles de données avant de figer le modèle concerné ; traiter le classement avant l’implémentation de l’accueil ; traiter les formulaires, échanges et actions avant les stories correspondantes. Toute décision métier nouvelle reste soumise à Lilian. Ces points ne bloquent pas le démarrage de l’architecture.

**À transmettre à l’architecture et à l’implémentation :** transposition exacte des tokens, largeurs minimales, breakpoints et défilement du kanban, focus/modalité du panneau, séparation clic/édition/déplacement, retours de sauvegarde, minuit Paris et reprise multi-onglets. Ces détails doivent respecter les comportements approuvés et l’accessibilité ; aucune validation humaine pixel par pixel n’est requise. Les écrans encore absents et les règles métier ouvertes sont distincts de ces choix techniques.

## Couverture à la clôture

| Niveau | Surfaces | Preuve / limite |
|---|---|---|
| `mocked` — 4 images approuvées | Pipeline **et panneau dans une seule image**, Accueil, Contacts, Relances | Liens canoniques dans les sections correspondantes ; sidecars `mockups/*.json` approuvés. Composition et langage visuel acquis. |
| `spine-only` — parcours documentés, sans maquette complète | Sociétés, fiches contact/société, créations et relations, échanges, création/historique d’actions, choix de clôture, connexion, récupération/reconnexion, états alternatifs et adaptation petit écran | Besoins et garanties décrits ci-dessus ; couverture documentaire acceptée à la clôture. Un exemple de colonne/groupe vide dans une image ne couvre pas tous les états. |

**Contrôle mécanique de distillation :** les trois UJ conservent protagoniste, étapes, point culminant et échec ; composants et surfaces sont reliés aux besoins PRD. Les quatre compositions sont approuvées, les tokens restent une transcription de référence. Les chiffres 1–5 du kanban, « Enregistré » pendant une édition et le rouge d’« Aujourd’hui » sur l’accueil sont des défauts raster exclus : réussite uniquement après sauvegarde confirmée, aujourd’hui distinct d’un retard. La revue UX facultative a été proposée puis déclinée par Lilian. La couverture documentaire des surfaces secondaires est acceptée. La clôture du dossier ne vaut ni validation des hypothèses restantes ni vérification d’une application.

## Précisions de réalisation déléguées

Les [décisions déléguées](../../epics-support/decisions-deleguees.md), postérieures à la validation des maquettes, précisent Q1–Q6 sans changer la direction A compacte. Elles priment sur les anciennes propositions de classement/formulaires et écartent recherche et suppression du POC. Les valeurs visuelles restent à transposer et vérifier, sans nouveau gate de maquette. Q7 reste un prérequis externe avant utilisation.
