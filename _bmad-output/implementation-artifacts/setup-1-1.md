# Investigation avant implémentation — story 1.1

## Autorité

Lilian a validé la story, délégué les choix de réalisation et demandé de continuer avec bmad-build. Dernière contrainte explicite : aucun skill hors BMAD. Ne pas appliquer impeccable, saas-fluidity-bootstrap ou agent-browser en tant que skills. Les règles du projet et les outils CLI/documentation/agent-browser restent applicables. Le design se transpose depuis les artefacts UX BMAD existants sans nouveau gate.

## Environnement vérifié

- Branche codex/1-1-acces-prive ; baseline documentaire enregistrée. Aucun push. Aucune autre session sur port 3000 au contrôle initial.
- Node système 25.9.0 ; Node 24.20.0 installé dans le cache npm, chemin `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin/node`. Préfixer PATH avec son répertoire pour pnpm/dev/vérifications. pnpm disponible 9.15.1.
- Supabase CLI connecté, organisation Persos `ptbvnsccszcxeiahojdc`, plan free vérifié par API. Projet dédié `bmad-crm`, ref `otadrkhrjxafutocstzo`, eu-west-3, ACTIVE_HEALTHY. Les autres projets sont exclus de toute opération.
- Propriétaire unique initialisé par administration sans envoi d’e-mail, conformément à l’identité admin globale donnée par l’utilisateur. Signup et anonyme désactivés puis relus. `.env.local` contient URL, clé publique et UUID propriétaire ; aucune clé admin dans l’app.
- `.local/bootstrap-secrets.json` (600) contient uniquement pour installation/QA : project_ref, database_password, service_role_key, anon_key, owner_id, owner_email, owner_password. Lire par programme, ne jamais imprimer, copier dans la sortie de test ou versionner ces valeurs. Créer les données Auth de test via admin sans envoyer d’e-mail et supprimer seulement le compte fixture créé par le test, jamais le propriétaire.
- Vercel CLI connecté comme liliansev ; aucun projet/deploy Vercel créé, c’est la story 1.3. Pas d’e-mail de récupération dans 1.1.

## Sources et versions inspectées

Starter officiel with-supabase au SHA `fc4f062ba96f37f971bcbab8858d96e413d86bf9`, fichiers package/server/client/proxy/login récupérés et lus dans `.local/starter/`. Conserver une provenance publique dans README ; adaptation manuelle autorisée par architecture, pas de création aveugle depuis latest.

Versions vérifiées au registre ce tour : next 15.5.25, react/react-dom 19.2.8, @supabase/supabase-js 2.115.0, @supabase/ssr 0.12.6, tailwindcss/@tailwindcss/postcss 4.3.3. Épingler. Autres paquets réellement nécessaires résolus au moment de l’installation, sans dépendances métier futures.

Context7 consulté : `/supabase/ssr` (clients par requête, cookies getAll/setAll, refresh), `/vercel/next.js/v15.1.11` (Server Actions, cookies async, erreurs), `/shadcn-ui/ui` (Tailwind4 et ajout des composants CLI). Exemples contenant any ou cookies sync ne priment pas sur TypeScript strict et await cookies du projet.

Auth serveur : utiliser getUser pour vérifier contre le serveur Auth, comparer à SUPABASE_OWNER_ID privé. Ne jamais autoriser par getSession ou un objet de cookie seulement. Middleware doit recopier cookies de réponse lors d’une redirection ; prochaine requête cohérente. Les composants serveur qui ne peuvent écrire les cookies s’appuient sur le middleware, sans catch générique qui masquerait un autre échec. Vérifier les types réels SSR 0.12.6 (setAll inclut potentiellement des headers).

## Design et vérification

Lire les valeurs de `_bmad-output/planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/DESIGN.md` comme source visuelle, pas comme nouveau skill. Connexion française simple et compacte, surfaces claires, police système, champs étiquetés, action principale sombre. Auth n’a pas de raster validé à reproduire ; aucun concours de maquettes. Accueil privé honnête : confirmation d’accès, pas de données ou liens futurs simulés.

shadcn via `pnpm dlx shadcn@latest add ...` après inventaire components/ui, pas de div custom remplaçant les primitives. Skeleton pour routes existantes ; pas de scaffolding de toutes les entités. Focus clavier desktop, saisie tactile >=16px et cibles 44px, aucun overflow de page. `scrollbar-gutter: stable`.

Tests effectifs : matrice de spec, scénario formulaire propriétaire à travers l’app et Supabase, mauvais mot de passe, cookie invalide, session non propriétaire réelle, réseau, expiration/reconnexion, rechargement, clavier. Le compte fixture non propriétaire est créé uniquement dans ce projet puis retiré ; pas de session propriétaire révoquée arbitrairement en dehors du test. Résultats sans données sensibles. Outil agent-browser CLI : `--help` puis `open → snapshot -i → ...`; re-snapshot après changements ; pas de Playwright ni autre skill. Ne pas fermer des sessions navigateur extérieures au test.

Conserver pnpm dev actif et fournir l’URL. Contrôle tsc --noEmit ; aucun build pendant dev. Pas de code pour récupération de mot de passe 1.2 ni pour déploiement 1.3. Créer scripts/verify-auth.mjs et preuves sous verification/ ignoré. Le test peut lire les secrets localement via fs et les injecter par stdin/script, jamais les interpoler dans une sortie journalisée.
