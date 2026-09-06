# Script vidéo — Cadrer un projet avec BMAD et Codex

Durée cible : 12 à 14 minutes  
Format : face caméra courte + démonstration écran  
Projet fil rouge : un CRM web pour consultants et freelances

## Préparation avant l'enregistrement

- Ouvrir le dépôt `bmad-crm` dans Codex.
- Partir d'une nouvelle conversation Codex pour que les skills installés soient chargés.
- Garder le terminal, Codex et l'arborescence du dépôt visibles.
- BMAD Method utilisé dans cette démonstration : version 6.12.0.
- Si la vidéo est enregistrée un autre jour, ne pas annoncer un chemin daté exact : dire « dans le dossier PRD créé aujourd'hui ».

## 00:00 — Introduction

### À dire

« La première fois que j'ai regardé BMAD, j'ai cru que j'allais passer ma journée dans un terminal avec 40 commandes à apprendre.

En pratique, la commande installe BMAD. Ensuite, le cadrage se déroule dans Codex ou Claude Code, à travers des skills spécialisés.

Je vais partir d'un dépôt presque vide et cadrer un vrai projet : un CRM pour consultants et freelances.

À la fin, on aura un PRD écrit dans le dépôt, une revue critique et surtout la liste des décisions que l'IA ne peut pas prendre à notre place. »

### À l'écran

- Afficher brièvement le dépôt `bmad-crm`.
- Montrer qu'il contient `_bmad/`, `.agents/skills/` et `_bmad-output/`.
- Afficher le titre : « D'une idée floue à un PRD révisé ».

## 00:45 — Le projet fil rouge

### À dire

« Le projet s'appelle provisoirement BMAD CRM.

La cible, c'est un consultant ou un freelance qui gère lui-même son activité commerciale. Ses contacts sont dans plusieurs outils, ses notes traînent après les calls et certaines relances passent à la trappe.

La première version doit lui permettre de gérer ses contacts, ses opportunités et sa prochaine action commerciale depuis une seule interface.

Je garde volontairement quelques zones floues. Est-ce qu'on gère les entreprises en plus des contacts ? Est-ce qu'on envoie des rappels ? Est-ce que le produit doit devenir collaboratif ?

C'est précisément ce que BMAD va nous aider à faire ressortir. »

### À l'écran

Afficher une fiche très simple :

- Utilisateur initial : consultant ou freelance.
- Problème : informations dispersées et relances oubliées.
- Résultat attendu : savoir qui relancer et pourquoi.
- Questions ouvertes : entreprises, rappels, collaboration.

## 01:50 — Agents, skills, workflows et rôles

### À dire

« Avant de lancer la démo, quatre mots à comprendre.

Codex est l'agent IA qui travaille dans mon dépôt. Claude Code pourrait jouer le même rôle si j'avais choisi son intégration à l'installation.

Dans BMAD, un agent est une persona spécialisée. Mary travaille comme Business Analyst. John tient le rôle de Product Manager. Sally s'occupe de l'UX. Winston prend les décisions d'architecture. Amelia intervient sur l'implémentation et la revue du code.

Un skill est une capacité que je peux invoquer par son nom. Par exemple `bmad-prd` pour créer, mettre à jour ou valider un PRD.

Le workflow est le chemin suivi par ce skill : découverte, décisions, rédaction dans le dépôt, revue et validation humaine.

Et le rôle définit la responsabilité. John ne choisit pas mon business à ma place. Il m'aide à transformer mes décisions en exigences cohérentes. »

### À l'écran

Afficher ce schéma :

```text
Codex ou Claude Code
        ↓
Agent BMAD : John, Product Manager
        ↓
Skill : bmad-prd
        ↓
Workflow : découvrir → cadrer → rédiger → revoir → finaliser
        ↓
Artefacts : prd.md + addendum.md + .memlog.md
```

Puis montrer quelques dossiers dans `.agents/skills/` :

```text
bmad-agent-pm
bmad-prd
bmad-ux
bmad-architecture
bmad-build
```

## 03:20 — Installation et lancement du cadrage

### À dire

« L'installation officielle tient dans cette commande : »

### À l'écran

```bash
npx bmad-method install
```

### À dire

« Je sélectionne le module BMad Method et Codex comme outil. L'installateur place ensuite la configuration dans `_bmad` et les skills Codex dans `.agents/skills`.

Pour la démonstration, je vais charger John, le Product Manager, puis lancer son entrée PRD. Je pourrais aussi invoquer `bmad-prd` directement. »

### Prompt à saisir dans Codex

```text
Utilise bmad-agent-pm. Je veux créer le PRD d'un CRM web pour consultants et freelances. Commence en mode création et guide-moi dans le cadrage.
```

Lorsque John affiche son menu, saisir :

```text
PRD
```

### À dire

« Le rôle rend l'échange plus cohérent sur toute la session. Le skill direct est plus rapide quand je sais déjà exactement quel livrable je veux. »

## 04:25 — Explorer le besoin

### À dire

« BMAD commence par une phase de découverte. Je lui donne tout le contexte d'un coup avant de répondre aux questions détaillées. »

### Prompt à saisir

```text
Le produit est un CRM web destiné d'abord aux consultants et freelances qui gèrent seuls leur prospection.

Aujourd'hui, ils gardent des contacts dans plusieurs outils, prennent leurs notes ailleurs et oublient parfois la prochaine relance. Je veux qu'en ouvrant le CRM le matin, ils voient immédiatement les actions commerciales à effectuer.

Pour la V1, j'imagine des contacts, des opportunités, un pipeline et une prochaine action datée. Je veux une interface rapide sur ordinateur et utilisable sur mobile. La saisie manuelle est obligatoire. L'import CSV serait utile, mais je ne sais pas encore s'il doit entrer dans la V1.

Le projet est destiné à devenir un produit public. Je veux donc un cadrage assez solide pour enchaîner ensuite sur l'UX et l'architecture.

Certaines décisions restent ouvertes : gestion des entreprises, rappels par email, personnalisation du pipeline et collaboration en équipe.
```

### À dire pendant la réponse de BMAD

« Là, je ne cherche pas la formulation parfaite. Je lui donne le contexte, les doutes et les contraintes connues.

BMAD va normalement vérifier s'il manque quelque chose, calibrer l'enjeu du projet et me proposer un mode de travail. Pour cette démo, je choisis le parcours coaching afin de montrer les questions de cadrage. »

### Réponse à saisir lorsque le choix apparaît

```text
Je choisis le parcours coaching. Propose-moi le meilleur point d'entrée à partir de ce que je viens de décrire.
```

## 06:00 — Clarifier utilisateurs, problèmes, objectifs et contraintes

### À dire

« Les questions exactes peuvent varier. C'est normal. BMAD s'adapte au contexte au lieu de dérouler un formulaire figé.

Je veux tout de même obtenir quatre choses avant de laisser l'agent rédiger : un utilisateur précis, un problème observable, un objectif mesurable et des limites de V1. »

### Réponses de démonstration

Utiliser ces éléments pour répondre naturellement aux questions de BMAD :

**Utilisateur principal**

« Le premier utilisateur est un consultant indépendant qui gère entre 20 et 100 contacts actifs et qui fait lui-même ses calls de découverte, ses propositions et ses relances. »

**Problème vécu**

« Après un call, il prend une note, promet une action puis change de sujet. Quelques jours plus tard, il ne sait plus quelles opportunités attendent une relance ni depuis combien de temps. »

**Objectif produit**

« En moins d'une minute, il doit pouvoir créer ou mettre à jour une opportunité et définir la prochaine action. Chaque matin, aucune relance échue ne doit rester invisible. »

**Contraintes et périmètre**

« La V1 est mono-utilisateur, responsive et centrée sur la saisie manuelle. Elle couvre les contacts, les opportunités, le pipeline et les prochaines actions. La facturation, l'envoi de campagnes marketing et les automatisations complexes restent hors périmètre. »

### À dire

« Regarde ce qui se passe : BMAD relie les features à une situation réelle, un comportement attendu et une limite de périmètre.

Quand une question touche à une décision produit, je réponds. Quand je ne sais pas, je dis que je ne sais pas. Une hypothèse visible vaut mieux qu'une fausse certitude cachée dans le PRD. »

## 08:10 — Compléter le PRD dans le dépôt

### À dire

« BMAD crée le dossier de travail dès le début du workflow. Une fois les éléments suffisamment clairs, je lui demande de compléter le PRD. »

### Prompt à saisir

```text
Tu as assez de matière. Complète maintenant le PRD dans le dépôt. Conserve explicitement les hypothèses et les questions qui nécessitent encore une décision humaine.
```

### À l'écran

Ouvrir le dossier créé sous :

```text
_bmad-output/planning-artifacts/prds/prd-bmad-crm-<date>/
```

Montrer :

```text
prd.md
.memlog.md
addendum.md        # seulement s'il a été nécessaire
```

Puis ouvrir `prd.md` et faire défiler rapidement : vision, utilisateurs ou parcours, critères de succès, exigences fonctionnelles numérotées, exigences non fonctionnelles, périmètre et questions ouvertes.

### À dire

« BMAD transforme l'échange du chat en artefact durable dans le dépôt.

Le fichier `.memlog.md` conserve les décisions prises pendant l'échange. L'addendum reçoit les détails utiles qui alourdiraient le PRD, par exemple des choix techniques ou des alternatives rejetées.

Je peux maintenant versionner ces fichiers, les relire et les transmettre à une autre session sans repartir de zéro. »

## 09:35 — Revue critique du PRD

### À dire

« Le premier PRD devient une base à challenger. J'ouvre une nouvelle conversation Codex, ce que BMAD recommande pour garder un contexte propre, puis je lance le mode validation. »

### Prompt à saisir dans une nouvelle conversation

```text
Utilise bmad-prd en mode Validate sur le PRD présent dans _bmad-output/planning-artifacts/prds/. Fais une revue exigeante : ambiguïtés, exigences non testables, contradictions, périmètre implicite et hypothèses non prouvées. Ne modifie pas encore le document.
```

### À dire pendant la revue

« Le validateur produit un rapport, classe les problèmes et me laisse arbitrer avant toute réécriture.

Je regarde d'abord les points critiques et élevés. Par exemple, “aucune relance ne doit rester invisible” sonne bien, mais il faut préciser ce qu'est une relance échue et comment elle apparaît. »

### Prompt de correction

Adapter les numéros aux résultats réellement obtenus :

```text
Passe maintenant en mode Update sur ce PRD.

Applique les corrections validées concernant les exigences ambiguës et les critères d'acceptation. Garde la collaboration en équipe et les rappels par email dans les questions ouvertes. Ne prends aucune décision business à ma place.
```

### À dire

« La correction repasse par le skill propriétaire du document, ici `bmad-prd`. Le PRD reste la source de vérité. »

## 11:05 — Vérifier les décisions humaines restantes

### À dire

« Dernière étape : isoler ce qui ressemble encore à une certitude alors que personne ne l'a décidé. »

### Prompt à saisir

```text
Liste les hypothèses et questions ouvertes restantes. Classe-les en deux groupes :

1. Bloquantes avant l'UX ou l'architecture.
2. Non bloquantes, avec un responsable et la condition qui déclenchera la décision.

Pour chaque point, indique où il apparaît dans le PRD. Ne propose pas de décision à ma place.
```

### À l'écran

- Rechercher `[ASSUMPTION]` dans le dépôt si le parcours rapide en a créé.
- Montrer la section « Questions ouvertes » du PRD.
- Montrer les dernières entrées de `.memlog.md`.

### À dire

« Sur notre exemple, le mode mono-utilisateur de la V1 peut être une décision assumée.

La durée de conservation des données, le besoin réel de gérer plusieurs membres d'une entreprise et le canal de rappel demandent encore une validation humaine ou utilisateur.

Je peux différer une décision non bloquante avec un responsable et une condition de réouverture. En revanche, une question qui change le modèle de données ou les parcours principaux doit être tranchée avant l'architecture.

C'est le point que je trouve le plus utile avec BMAD : l'IA avance, mais les arbitrages restent visibles. »

## 12:25 — Conclusion

### À dire

« On est parti d'une idée assez simple : créer un CRM pour freelances.

BMAD nous a aidés à choisir le bon rôle, explorer le besoin, préciser la cible, cadrer la V1, écrire le PRD dans le dépôt et soumettre ce document à une vraie revue.

La suite logique serait `bmad-ux`, puis `bmad-architecture`, la création des epics et stories, le sprint planning et enfin `bmad-build` pour implémenter chaque unité de travail.

Si tu veux tester, installe BMAD dans un dépôt puis lance `bmad-help`. Il regarde les artefacts existants et te recommande la prochaine étape.

Et surtout, garde les questions ouvertes visibles. Une IA très sûre d'elle peut rédiger une mauvaise décision avec beaucoup d'élégance. »

### À l'écran

```text
npx bmad-method install
bmad-help
```

Puis afficher le parcours :

```text
Brief ou PRD → UX → Architecture → Epics et stories → Sprint planning → Build
```

## Titres proposés

1. **BMAD avec Codex : de l'idée au PRD**
2. **J'ai cadré un CRM avec BMAD et Codex**
3. **BMAD Method : agents, skills et PRD**

## Concepts de miniature

1. **Écran partagé** : à gauche une idée floue et des notes dispersées, à droite un fichier `prd.md` propre. Texte : « IDÉE → PRD ».
2. **Capture annotée** : arborescence `_bmad-output` avec `prd.md` entouré et visage de Lilian en bas à droite. Texte : « BMAD EN VRAI ».
3. **Schéma simple** : logos BMAD et Codex reliés à un document. Texte : « QUI DÉCIDE ? ».

## Prompt de miniature

```text
Create a 1280x720 YouTube thumbnail for a French technical tutorial about BMAD Method and Codex. Show a clean split-screen transformation: on the left, scattered CRM notes and ambiguous requirements in muted red tones; on the right, a clean code editor displaying a file named prd.md in green and dark blue tones. Add a cutout portrait of the presenter in the lower-right corner with a focused expression. Large bold French text: "IDÉE → PRD". Include small recognizable BMAD and Codex visual marks without clutter. High contrast, readable on mobile, modern technical tutorial style, no exaggerated clickbait.
```

## Description YouTube

Dans cette démonstration BMAD avec Codex, je transforme l'idée d'un CRM pour freelances en PRD relu et corrigé directement dans le dépôt.

Tu vas comprendre la différence entre agents, skills, workflows et rôles BMAD, puis voir comment lancer le cadrage, clarifier le besoin et garder les décisions humaines visibles.

⏱ Chapitrage :

- 00:00 Introduction
- 00:45 Le projet CRM fil rouge
- 01:50 Agents, skills, workflows et rôles
- 03:20 Installer BMAD et lancer le cadrage
- 04:25 Explorer le besoin
- 06:00 Clarifier utilisateurs, objectifs et contraintes
- 08:10 Générer le PRD dans le dépôt
- 09:35 Faire la revue critique
- 11:05 Vérifier les décisions humaines
- 12:25 La suite du parcours BMAD

📚 Ressources :

- BMAD Method : https://github.com/bmad-code-org/BMAD-METHOD
- Documentation BMAD : https://docs.bmad-method.org/

🎓 Mes formations :

- Apprendre Make : https://apprendre-make.com
- Formation n8n : https://formation-n8n.com

📬 Ma newsletter : https://lilian.yt/news  
🌐 Mon site : https://liliansevoumian.fr

#bmad #codex #claudecode #ia #vibecoding

## Sources de préparation

- Documentation officielle BMAD, installation : https://docs.bmad-method.org/start/install-bmad/
- Documentation officielle BMAD, choix du parcours de planification : https://docs.bmad-method.org/plan/choose-a-planning-path/
- Documentation officielle BMAD, skills et agents : https://docs.bmad-method.org/reference/skills-and-agents/
