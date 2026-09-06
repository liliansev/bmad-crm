# Inventaire visuel — Pipeline A compacte

Source inspectée : [pipeline-a.png](comps/pipeline-a.png), raster 1672 × 941 px. Choix explicite de Lilian : « vue A compacte ». Référence de composition et de langage visuel, sans validation séparée de chaque couleur ou mesure. Aucune police exacte ne peut être identifiée avec certitude depuis cette image.

## Couleurs échantillonnées

Lecture RGB avec Pillow, coordonnées depuis le coin supérieur gauche, bornes de zones exclusives à droite/en bas. Les valeurs sont des pixels exacts du raster généré, pas des valeurs CSS sources retrouvées. Les modes réduisent le bruit de génération ; les pigments et textes ponctuels peuvent contenir de l’anticrénelage. Palette proposée pour transposition en tokens shadcn ; vérifier les contrastes au rendu.

| Token | Hex | Provenance |
|---|---|---|
| background | `#FEFEFE` | zone (240,600)–(250,700), mode ; témoin (240, 600) |
| sidebar | `#F8F8F8` | zone (80,600)–(180,700), mode ; témoin (84, 600) |
| muted | `#F9F9F9` | zone (300,600)–(400,700), mode ; témoin (302, 600) |
| card | `#FEFEFE` | zone (285,210)–(430,218), mode ; témoin (285, 210) |
| accent | `#F1F1F1` | zone (100,330)–(190,336), mode ; témoin (117, 330) |
| border | `#E1E1E3` | zone (1313,340)–(1315,450), mode ; témoin (1313, 345) |
| primary | `#0F141E` | zone (1100,54)–(1250,78), mode ; témoin (1186, 54) |
| foreground | `#000000` | pixel (256, 47) |
| muted-foreground | `#474156` | pixel (388, 338) |
| ring | `#5684E7` | pixel (750, 202) |
| stage-qualify | `#93959D` | pixel (275, 167) |
| stage-discussion | `#3D76E9` | pixel (482, 167) |
| stage-proposal | `#FECE19` | pixel (690, 167) |
| stage-won | `#07B60C` | pixel (922, 167) |
| stage-lost | `#EB5554` | pixel (1113, 167) |

## Géométrie observée et approximation de transposition

- Navigation x≈0–227 : 13,6 % de la largeur ; panneau x≈1286–1671 : 23,1 % ; zone centrale restante 63,3 %.
- Cinq colonnes simultanément visibles ; début du tableau x≈254, y≈139, bas y≈866. Largeurs irrégulières ≈175–226 px, intervalles ≈7 px : artefacts à normaliser, pas cinq largeurs métier distinctes.
- Marge centrale gauche ≈26 px ; intérieur panneau ≈28 px ; intérieur des cartes ≈12–14 px.
- Carte sélectionnée x≈674–888, y≈202–391. Cartes sans image, titre, société, montant puis court texte de notes. Séparateurs fins ; poignée de déplacement discrète.
- Champs du panneau hauts ≈44 px, zone notes ≈124 px. Menu actif haut ≈52 px. Rayons visuels ≈6–8 px ; bordures ≈1 px. Pas d’ombre forte visible.
- Sans-serif neutre ; proposition système ui-sans-serif/system-ui/sans-serif. Taille de corps ≈14–16 px, métadonnées ≈13 px, titre ≈24 px. Graisses 400/600 et interlignages 1.45/1.25 proposés, non mesurables précisément depuis le raster.
- Transposition proposée : espacements 8/12/16/24/28 px, rayons 6/8 px. Ce sont des approximations de production, pas des valeurs validées individuellement.

## Limites à préserver

La séquence 1–5 des en-têtes n’est pas un vrai nombre d’opportunités : ne pas la reprendre comme compteur. « Enregistré » pendant une saisie est trompeur : afficher une réussite seulement après confirmation de persistance. Le choix de composition ne valide pas de nouvelles fonctions, un photo-avatar, ni tous les détails du panneau. Les contrats métier priment. Surfaces Accueil, Contacts, Relances : déclinaisons attendues, non approuvées. Sociétés et surfaces secondaires : documentaires.
