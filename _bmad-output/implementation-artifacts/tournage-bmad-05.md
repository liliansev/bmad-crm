# BMAD 05 — Point de départ du tournage

Préparé le 7 septembre 2026 à partir de [la leçon Notion](https://app.notion.com/p/3ce5d2efba7f815d9055e413e613eeaf), consultée à cette date. Durée visée : 17–20 minutes.

## Ouvrir avant d’enregistrer

- Application : http://localhost:3000/contacts, session propriétaire habituelle.
- Commit produit à examiner : `948e5c4`, « compléter les informations et notes ». Son parent `bf7baaf` est la référence avant la story 2.2.
- Story : [spec-2-2-informations-contact.md](spec-2-2-informations-contact.md). Création initiale : [spec-2-1-creation-contact.md](spec-2-1-creation-contact.md).
- Commandes : `package.json`. Environnement montrable : `.env.example` et `.gitignore`.
- Terminal à la racine du dépôt, Node 24 actif (`node --version`). Le serveur doit rester lancé ; ne pas en démarrer un second si le port 3000 est déjà occupé.

La fonctionnalité de contact fonctionne déjà et a déjà été revue. Cette leçon apprend à vérifier un résultat existant. Aucun défaut n’est réintroduit pour la vidéo. Les résultats de préparation et les preuves antérieures ne remplacent pas les commandes exécutées à l’écran.

### Terminal sur ce Mac

Le Node système n’est pas Node 24. Avant d’enregistrer, activer le binaire Node 24 déjà présent et vérifié sur cette machine pour le terminal courant :

```bash
export PATH="/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin:$PATH"
node --version
```

Ce chemin est local à ce Mac, pas une instruction d’installation pour les élèves. Ailleurs, utiliser une installation Node 24 LTS. Les commandes pnpm ci-dessous doivent être exécutées dans ce même terminal.

Préflight de préparation du 7 septembre : `pnpm typecheck` terminé avec code 0 ; `pnpm verify:contacts:transport` terminé avec code 0 et 20 contrôles réussis. Le serveur local répond (redirection vers l’authentification pour une requête sans session). Aucune recette DB/UI n’a été rejouée pour cette préparation documentaire ; les preuves de la story restent dans `setup-2-2.md`. Le rapport transport précédent a été conservé dans `verification/bmad-05-preparation/` avant cette exécution. Aucun changement applicatif ni déploiement dans cette préparation.

## Périmètre réel de cette démonstration

Créer un contact, le retrouver, modifier prénom/nom, email, titre, lien LinkedIn et notes, vider un champ facultatif, enregistrer puis recharger. Préserver un brouillon et afficher une erreur de validation font partie du parcours.

Pas de suppression de contact, de prochaine action ni de date métier à tester à ce stade : ces exemples du script général sont remplacés par les champs existants. La story 2.3 et les suivantes restent en backlog. La V1 entière n’est pas nécessaire au prérequis de la leçon.

Le CRM autorise un propriétaire unique : A est ce propriétaire ; B est un compte authentifié non autorisé et doit être refusé. Ne pas présenter la démonstration comme celle de deux commerciaux autorisés.

## Conducteur

| Moment | Manipulation | Preuve attendue |
| --- | --- | --- |
| 00:00 | Introduire « un bouton qui marche ne suffit pas » | Annoncer validation, persistance, autorisation et secrets. |
| 00:55 | Ouvrir la story, `git show --stat 948e5c4`, puis package.json | Relier les contrôles à une fonctionnalité et une révision précises. |
| 03:00 | Créer `Alice Tournage / Démo fictive`, avec `alice.tournage@example.invalid` | Confirmation, contact visible et retrouvé après rechargement. Ne pas réutiliser une fiche réelle. |
| 04:00 | Modifier le titre et les notes ; saisir un email invalide, puis le corriger | Refus compréhensible, saisie préservée, correction sauvegardée. Vider ensuite un champ facultatif. |
| 05:00 | Tenter une création avec prénom et nom vides ; annuler. Recharger la fiche fictive | Refus sans création fantôme ; modifications précédentes persistantes. |
| 06:00 | Demander le plan minimal de tests ci-dessous ; lancer TypeScript puis la recette transport | Lire les assertions exécutées et le code de sortie, pas seulement une réponse de l’IA. |
| 08:40 | Ouvrir une nouvelle conversation pour `bmad-code-review` | Constats triés, confrontés à la story, sans correction automatique avant décision. |
| 11:10 | Lancer la recette DB, puis la recette HTTP, successivement | Vérifier le refus de B et des accès directs, même avec un identifiant connu. |
| 13:20 | Montrer `.gitignore`, `.env.example` et les contrôles Git ci-dessous | Distinguer configuration publique et secrets privés ; aucun secret à l’écran. |
| 15:10 | Traiter les constats validés, s’il y en a | Reproduction, correction ciblée, même test rejoué, suite concernée puis parcours navigateur. |
| 18:00 | Récapituler les résultats effectivement observés | Dire ce qui a été testé, ce qui reste hors périmètre ; livraison/prod dans la suite. |

Le contact fictif créé manuellement reste dans le CRM : il n’existe pas de bouton de suppression à ce stade. Ne pas promettre un nettoyage automatique de cette saisie. Les recettes automatisées nettoient uniquement leurs propres fixtures.

## Commandes disponibles

```bash
pnpm typecheck
pnpm verify:contacts:transport
```

Le transport teste le vrai code TypeScript de validation, brouillons et transport avec des réponses HTTP contrôlées. Il ne nécessite ni serveur ni secret ni base ; il ne prouve pas les droits PostgreSQL ou le parcours navigateur.

```bash
pnpm verify:contacts:db
pnpm verify:contacts:http
```

Ces deux recettes accèdent au vrai Supabase dédié. Elles exigent la configuration QA privée déjà provisionnée dans `.local`, notamment les accès de création/nettoyage de fixtures et l’accès Management via le Trousseau. `.env.example` seul ne suffit pas. La recette HTTP exige aussi le serveur local et agent-browser.

La recette DB crée un compte Auth B temporaire et des contacts fictifs, puis les supprime et vérifie le nettoyage. Laisser chaque commande se terminer, sans l’interrompre pour raccourcir la vidéo. En cas d’interruption brutale, contrôler et nettoyer les seules fixtures identifiées avant de reprendre ; le compte B n’a pas de manifeste persistant. Le serveur local utilise une base distante également utilisée par l’ancienne version hébergée.

Ne pas lancer deux recettes DB/UI simultanément, ni modifier un contact à la main pendant leur exécution : elles vérifient aussi que les données préexistantes n’ont pas changé.

Pour une recette approfondie, à lancer séparément et à laisser aboutir :

```bash
pnpm verify:contacts:ui
pnpm verify:contacts:review
```

La première couvre l’UI et les contrôles HTTP ; la seconde les régressions découvertes lors de la revue 2.2. Elles peuvent dépasser le temps du segment vidéo. Ne pas utiliser un résultat partiel comme preuve de suite complète. `pnpm verify:auth` est une recette distincte, inutile pour la seule démonstration contacts. Aucun `pnpm test` générique n’est défini.

Les recettes écrivent leurs résultats sous `_bmad-output/implementation-artifacts/verification/2-2/` (ignoré par Git). Certains rapports sont remplacés à chaque exécution : copier les preuves à conserver dans un dossier daté avant de rejouer. Ne pas additionner des preuves de versions différentes pour annoncer une couverture de la version courante.

## Prompts prêts à copier

### Plan de vérification

> Analyse les stories `_bmad-output/implementation-artifacts/spec-2-1-creation-contact.md` et `_bmad-output/implementation-artifacts/spec-2-2-informations-contact.md`, puis les scripts de vérification existants. Propose le plus petit ensemble de tests automatisés qui protège les règles métier et les frontières de données des contacts. Réutilise l’outillage présent, uniquement les skills BMAD et agent-browser pour le navigateur, sans Playwright. Présente le plan avant d’écrire. N’ajoute pas les prochaines actions, les dates ou la suppression, qui ne sont pas implémentées.

### Revue indépendante, dans une nouvelle conversation

> Utilise bmad-code-review sur le commit `948e5c4` du dépôt `/Users/a1207/CODE/apps/bmad-crm`, comparé à son parent `bf7baaf`. Prends `_bmad-output/implementation-artifacts/spec-2-2-informations-contact.md` et ses critères d’acceptation comme intention. Cherche les bugs, cas limites, failles d’autorisation, validations manquantes et trous de vérification. Le CRM autorise un propriétaire unique. Ne corrige rien avant de me présenter les constats triés. Seuls les skills BMAD sont autorisés.

### Corrections après validation des constats

> Corrige uniquement les constats que j’ai validés. Après chaque correction, relance le test ciblé, puis la suite pertinente et le parcours navigateur concerné avec agent-browser. Donne-moi les commandes exécutées et les résultats observés. Ne déploie pas.

Si la revue ne trouve aucun défaut confirmé, le dire. Une saisie invalide refusée est un test réussi, pas un test automatisé rouge. Un ancien constat déjà corrigé peut être expliqué comme historique, mais ne doit pas être présenté comme un bug actuel. Ne pas garantir un cycle rouge/vert avant d’avoir un défaut reproductible.

## Contrôles de secrets montrables

```bash
git ls-files -- '.env*' '**/.env*'
git grep -l -I -E '(sk_live_|AKIA|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)'
git status --short
```

Le second contrôle affiche uniquement les noms des fichiers candidats, jamais les valeurs. Son code de sortie 1 signifie « aucun motif trouvé », pas une panne. `.env.example` est attendu parmi les fichiers suivis. Des exemples ou tests peuvent produire des faux positifs ; examiner les candidats hors enregistrement. Ce contrôle limité des fichiers suivis ne prouve pas l’absence de tout secret et n’examine pas l’historique Git. Si une clé réelle est découverte, interrompre l’affichage et la révoquer/remplacer ; supprimer la ligne seule ne suffit pas.

Ne pas ouvrir `.env.local`, `.local`, le Trousseau, les cookies, les réponses Auth ou les en-têtes Authorization pendant le tournage. Console et réseau peuvent servir à observer le parcours, en évitant ces contenus.

## Bilan à remplir pendant la vidéo

| Contrôle | Résultat observé / preuve |
| --- | --- |
| Création, édition, rechargement | À exécuter pendant le tournage |
| Données invalides et brouillon conservé | À exécuter pendant le tournage |
| TypeScript et transport | À exécuter pendant le tournage |
| Refus du compte B, DB et HTTP | À exécuter pendant le tournage |
| Revue et décisions humaines | À exécuter pendant le tournage |
| Secrets : fichiers suivis et limites du contrôle | À exécuter pendant le tournage |
| Corrections et revalidation, si nécessaires | À compléter selon les constats |

Les preuves précédentes sont détaillées dans [setup-2-2.md](setup-2-2.md). Le présent conducteur prépare le début de la leçon ; il ne clôture pas sa vérification humaine.
