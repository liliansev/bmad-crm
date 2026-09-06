# CRM BMAD

CRM interne privé, en français. La story 1.1 livre la connexion e-mail/mot de passe et un Accueil sobre, réservé à un propriétaire unique. Aucune inscription publique, donnée métier, récupération par e-mail ou commande de déconnexion n’est exposée à ce stade.

## Démarrage local

1. Utiliser Node **24.20.0** (`nvm use`) et pnpm **9.15.1**.
2. Installer avec `pnpm install --frozen-lockfile`.
3. Copier `.env.example` vers `.env.local` puis renseigner l’URL du projet Supabase dédié, sa clé **publique** et l’UUID privé du propriétaire. Ne jamais mettre une clé `service_role` dans l’application.
4. Démarrer `pnpm dev` et ouvrir [localhost:3000](http://localhost:3000).

La configuration est validée par Zod lors du chargement Next : une valeur absente/invalide bloque le démarrage. Les inscriptions publiques et anonymes doivent être désactivées dans Supabase ; le propriétaire est créé par administration. En complément, chaque accès serveur compare l’identité obtenue par `getUser()` à `SUPABASE_OWNER_ID`.

Le serveur local reste actif durant le développement. `pnpm typecheck` contrôle TypeScript sans modifier le build. Le déploiement est hors du périmètre de cette story.

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

Ces vérifications locales Chromium ne constituent pas une validation d’un déploiement, d’un vrai iPhone/Safari ou de la récupération d’accès par e-mail (stories suivantes).

Les contrôles de revue (`node scripts/verify-auth.mjs --review-only`) ciblent les transports bloqués, les réponses de session retardées, les courses de visibilité et SIGNED_OUT, ainsi que la stabilité du contrôle périodique. Un second serveur temporaire utilise exclusivement des paramètres et cookies fictifs contre une URL HTTPS `.invalid` pour vérifier la panne fournisseur dans l’action et l’API. Son dossier et son processus sont retirés ; le serveur principal 3000 reste actif.
