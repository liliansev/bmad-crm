# CRM BMAD

CRM interne privé, en français. Connexion e-mail/mot de passe, récupération d’accès et Accueil réservé à un propriétaire unique. Aucune inscription publique ni commande de déconnexion n’est exposée. Le périmètre métier est livré dans les stories suivantes.

## Démarrage local

1. Utiliser Node **24.20.0** (`nvm use`) et pnpm **9.15.1**.
2. Installer avec `pnpm install --frozen-lockfile`.
3. Copier `.env.example` vers `.env.local` puis renseigner l’URL du projet Supabase dédié, sa clé **publique**, l’UUID privé du propriétaire et `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Ne jamais mettre une clé `service_role` dans l’application.
4. Démarrer `pnpm dev` et ouvrir [localhost:3000](http://localhost:3000).

La configuration est validée par Zod lors du chargement Next : une valeur absente/invalide bloque le démarrage. Les inscriptions publiques et anonymes doivent être désactivées dans Supabase ; le propriétaire est créé par administration. En complément, chaque accès serveur compare l’identité obtenue par `getUser()` à `SUPABASE_OWNER_ID`.

Le serveur local reste actif durant le développement. `pnpm typecheck` contrôle TypeScript sans modifier le build.

## Origine et choix du socle

Adapté de [l’exemple officiel Next.js with-supabase](https://github.com/vercel/next.js/tree/fc4f062ba96f37f971bcbab8858d96e413d86bf9/examples/with-supabase), figé au SHA `fc4f062ba96f37f971bcbab8858d96e413d86bf9` : clients navigateur/serveur, renouvellement des cookies et base du formulaire. Adaptations : Next 15 middleware, Tailwind 4, interface française compacte, RHF/Zod, refus sans configuration, vérification propriétaire, suppression des parcours publics et de démonstration.

Next 15.5.25, React 19.2.8, Supabase JS 2.115.0 / SSR 0.12.6, Tailwind 4.3.3 sont épinglés dans le manifeste et le lockfile. TypeScript 5.9.3 est retenu pour l’API de configuration Next 15. Les composants Button, Input, Label, Skeleton et Card proviennent du CLI shadcn ; leurs styles utilisent les tokens de l’UX BMAD approuvée. L’utilitaire `cn` est local et partagé.

## Garanties de session

- Client serveur par requête ; aucune clé privilégiée dans le serveur web ou le navigateur.
- Identité authentique contrôlée dans le middleware, le layout, la page privée et l’API de session. L’API ne renvoie qu’un booléen.
- Réponses privées `no-store`, cookies renouvelés propagés jusque dans les redirections ; refus et purge des cookies non propriétaires ou invalides.
- Au focus, retour de visibilité, restauration de page et changement Auth, le contenu est masqué avant vérification. Un contrôle périodique couvre aussi les changements de cookie provenant d’un autre onglet. Un échec entraîne une navigation complète vers la connexion, pour vider la mémoire de navigation.
- Aucun journal ne doit contenir des valeurs du formulaire ou de session. Le mot de passe est effacé après chaque tentative envoyée ; l’adresse reste disponible en cas d’erreur.

## Vérification réelle

`pnpm verify:auth` nécessite le serveur local et la CLI `agent-browser` déjà installée. Le script lit le fichier local ignoré `.local/bootstrap-secrets.json`, réservé au bootstrap/QA, et vérifie son projet cible dédié. Il crée un seul utilisateur Auth fictif sans e-mail, exerce son refus, puis le supprime dans un bloc `finally` et relit son absence. Le propriétaire n’est jamais supprimé ni déconnecté globalement.

La preuve de suppression exige explicitement `user_not_found` avec statut 404 ; une panne ou un refus administratif ne prouve jamais l’absence.

Le script exerce les accès HTTP et RSC, les cookies invalides, une expiration locale déclenchant un refresh réel (JWT encore valide), le refus d’un refresh irréparable, les formulaires, les coupures réseau, la navigation clavier et les formats ordinateur/tactile. Les sorties booléennes et captures sont écrites sous `_bmad-output/implementation-artifacts/verification/1-1/` (ignoré). Les captures de formulaires utilisent des coordonnées fictives ou des champs vides ; aucun secret n’est enregistré dans les preuves.

Ces vérifications locales Chromium ne constituent pas une validation d’un déploiement, d’un vrai iPhone/Safari ou de la réception d’un e-mail.

Les contrôles de revue (`node scripts/verify-auth.mjs --review-only`) ciblent les transports bloqués, les réponses de session retardées, les courses de visibilité et SIGNED_OUT, ainsi que la stabilité du contrôle périodique. Un second serveur temporaire utilise exclusivement des paramètres et cookies fictifs contre une URL HTTPS `.invalid` pour vérifier la panne fournisseur dans l’action et l’API. Son dossier et son processus sont retirés ; le serveur principal 3000 reste actif.

## Livraison HTTPS

La cible dédiée retenue est [bmad-crm.vercel.app](https://bmad-crm.vercel.app). L’état réellement observé, la révision livrée et les limites sont consignés dans [setup-1-3.md](_bmad-output/implementation-artifacts/setup-1-3.md) ; cette URL seule ne prouve pas une livraison réussie.

1. Vérifier l’identité Vercel, le projet dédié `bmad-crm`, son plan gratuit Hobby et Node **24.x**, puis la cible Supabase dédiée. Aucun achat ni service SMTP supplémentaire.
2. Configurer dans Vercel les quatre variables ci-dessous. `.vercelignore` exclut les secrets locaux, les outils BMAD, les scripts de recette et les preuves de l’upload ; les variables Vercel restent nécessaires.
3. Définir la Site URL Supabase sur l’origine HTTPS et ajouter exactement `https://bmad-crm.vercel.app/reinitialiser` à l’allowlist de redirection, en conservant `http://localhost:3000/reinitialiser`. Le template natif Supabase est conservé.
4. Contrôler TypeScript puis effectuer le build de livraison avec Node 24, hors du serveur de développement. Contrôler le diff, pousser la révision prévue, confirmer le SHA distant et suivre le déploiement Vercel jusqu’à **Ready**. Ne pas effectuer un second déploiement pour compenser une attente de build. Relancer le serveur local après le build.
5. Exécuter la recette HTTPS ci-dessous sur le domaine attribué à la révision vérifiée. En cas d’échec, corriger puis revérifier ; Ready seul ne valide aucun parcours.

| Variable | Valeur / portée |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase dédié |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique du même projet |
| `SUPABASE_OWNER_ID` | UUID propriétaire privé, côté serveur |
| `NEXT_PUBLIC_APP_URL` | `https://bmad-crm.vercel.app` sur Vercel ; localhost dans `.env.local` |

Les variables `NEXT_PUBLIC_*` sont intégrées au build : un changement nécessite une nouvelle livraison. Ne jamais ajouter `service_role`, mot de passe propriétaire ou lien de récupération à Vercel, Git, une commande ou un journal. Les secrets de recette restent dans `.local/bootstrap-secrets.json`, ignoré.

```sh
CRM_QA_ORIGIN=https://bmad-crm.vercel.app node scripts/verify-hosted.mjs
```

La recette refuse une origine absente ou différente de la cible vérifiée avant toute lecture de secrets. Elle contrôle visiteur, cookie falsifié et vrai compte non propriétaire en HTML/RSC/API, puis connexion propriétaire, rechargement, perte de session, récupération invalide, clavier et cinq formats Chromium. Elle n’envoie aucun e-mail. La fixture Auth fictive est supprimée dans `finally`, avec relecture explicite de son absence. Résultats et captures : [verification/1-3/](_bmad-output/implementation-artifacts/verification/1-3/) (fichiers locaux ignorés). Le fichier `hosted-results.json` précise le résultat global et sépare la réception e-mail non testée.

## Recette de récupération reçue réellement

Demander un lien depuis le formulaire de récupération sur l’origine à vérifier, attendre sa réception réelle dans la messagerie et enregistrer **le lien exact reçu**, son `message_id` et son `received_at` dans un fichier JSON local ignoré. Ne pas déduire la réception d’un HTTP 200, d’un quota ou d’un lien généré par administration.

| Origine | Fichier reçu | Commande | Preuves |
| --- | --- | --- | --- |
| Locale, inchangée | `.local/recovery-mail.json` | `node scripts/verify-recovery-real.mjs` | `verification/1-2/real-mail-results.json` |
| HTTPS vérifiée | `.local/recovery-hosted-mail.json` | `CRM_QA_ORIGIN=https://bmad-crm.vercel.app node scripts/verify-recovery-real.mjs` | `verification/1-3/recovery/real-mail-results.json` |

Le script contrôle le domaine Supabase, le type recovery et la redirection exacte, ouvre le vrai lien, change le mot de passe, vérifie la reconnexion, refuse le lien consommé et le rejeu de la preuve. Le mot de passe initial est restauré dans `finally`, puis revérifié auprès d’Auth et dans le navigateur. Le fichier de lien est supprimé en fin de recette ; ni URL secrète ni tokens ne sont enregistrés dans les preuves. Exécuter cette recette seule pour éviter une autre connexion pendant le changement temporaire.

L’option existante `--generated-link` utilise des fichiers distincts (`recovery-generated-link.json` en local, `recovery-hosted-generated-link.json` en HTTPS) et marque les résultats comme contrôle administrateur ; elle ne remplace jamais la preuve de réception. Les essais sur formats Chromium ne prouvent pas le comportement de Safari sur un appareil physique.
