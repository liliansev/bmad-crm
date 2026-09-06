# Vérification du socle du POC

Vérifié le 6 septembre 2026. Recherche documentaire et lecture de manifests uniquement : aucun paquet installé, aucun starter exécuté, aucun service provisionné. Ce relevé prépare le scaffold ; il ne constitue pas un test de compatibilité de l'application.

## Socle candidat vérifié

| Élément | Version ou cible | Preuve et portée |
| --- | --- | --- |
| Next.js App Router | **15.5.25** | Dernière version stable de la branche 15 dans le [registre éditeur](https://registry.npmjs.org/next), publiée le 31 août 2026. Le [manifest exact](https://registry.npmjs.org/next/15.5.25) accepte Node `^18.18.0 \|\| ^19.8.0 \|\| >=20.0.0` et React/React DOM `^19.0.0`. La contrainte utilisateur Next 15 est conservée. |
| React et React DOM | **19.2.8** chacun | [React](https://registry.npmjs.org/react/19.2.8) et [React DOM](https://registry.npmjs.org/react-dom/19.2.8). React DOM exige React `^19.2.8`. Cette paire satisfait les peer dependencies déclarées de Next 15.5.25. |
| Node.js local | **24.20.0 LTS** | Dernier Node 24 LTS observé dans l'[index officiel](https://nodejs.org/dist/index.json), publié le 26 août 2026, nom LTS Krypton. |
| Node.js sur Vercel | **24.x** | Vercel prend en charge 24.x et choisit les mises à jour mineures/correctives ; le patch exact ne peut pas y être verrouillé. [Versions Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). |
| SDK Supabase | **@supabase/supabase-js 2.115.0** | [Manifest exact](https://registry.npmjs.org/@supabase%2fsupabase-js/2.115.0) : Node **>=22.0.0**. Node 24 satisfait cette contrainte ; ne pas reprendre un environnement Node 20 du starter. |
| Auth SSR par cookies | **@supabase/ssr 0.12.6** | [Manifest exact](https://registry.npmjs.org/@supabase%2fssr/0.12.6) : SDK Supabase `^2.114.0`, satisfait par 2.115.0. |
| Tailwind CSS et plugin PostCSS | **4.3.3** chacun | [Tailwind](https://registry.npmjs.org/tailwindcss/4.3.3), [@tailwindcss/postcss](https://registry.npmjs.org/@tailwindcss%2fpostcss/4.3.3). Intégration Next.js décrite dans le [guide officiel Tailwind](https://tailwindcss.com/docs/installation/framework-guides/nextjs). |
| shadcn CLI | **4.21.0** observé | [Manifest exact](https://registry.npmjs.org/shadcn/4.21.0), Node >=20.18.1. La [documentation shadcn](https://ui.shadcn.com/docs/tailwind-v4) couvre Tailwind 4 et React 19. Les composants sont du code copié dans le projet, pas une bibliothèque UI runtime uniformément versionnée 4.21.0. |
| Supabase PostgreSQL/Auth et Vercel | Services gérés | Aucun projet inspecté ou créé. La version PostgreSQL réellement fournie devra être relevée au provisionnement ; elle n'est pas inventée dans ce dossier. |

Le [bulletin officiel Next.js du 25 août](https://nextjs.org/blog/august-2026-security-release) donne 15.5.24 comme correctif de sécurité. Le registre contient depuis 15.5.25 : conserver la branche 15 ne signifie pas figer une version antérieure au correctif. Les versions devront être revérifiées lors du scaffold, puis le manifeste et le lockfile deviendront la source de vérité.

## Package d'authentification Supabase

Pour une application Next.js avec session en cookies, la recommandation officielle reste **@supabase/ssr avec @supabase/supabase-js**. `@supabase/server` répond aux identités transmises dans les en-têtes de requête ; il ne remplace pas `@supabase/ssr`. Supabase précise que les deux peuvent être composés, avec davantage de configuration. Cette couche additionnelle ne répond à aucun besoin identifié du POC. [Choix du package](https://supabase.com/docs/guides/auth/choosing-a-server-package).

La mise en place doit conserver les clients navigateur/serveur distincts, le cycle de renouvellement des cookies et la vérification de l'identité avant d'accéder aux données. Ne pas traiter l'objet utilisateur obtenu d'une simple lecture de session comme une autorisation suffisante. [Guide de création des clients SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Ce que contient réellement le starter officiel

Source examinée : [with-supabase du dépôt Vercel Next.js](https://github.com/vercel/next.js/tree/fc4f062ba96f37f971bcbab8858d96e413d86bf9/examples/with-supabase), fichiers bruts de la branche `canary` lus le 6 septembre 2026. Le dernier commit retourné pour ce sous-dossier était `fc4f062ba96f37f971bcbab8858d96e413d86bf9` ; cette branche reste mobile. Avant toute reprise, figer et relire la révision utilisée.

Le [package.json observé](https://github.com/vercel/next.js/blob/fc4f062ba96f37f971bcbab8858d96e413d86bf9/examples/with-supabase/package.json) utilise `next: latest`, les deux packages Supabase en `latest`, React `^19.0.0`, **Tailwind ^3.4.1**, `eslint-config-next: 15.3.1`, `@types/node: ^20` et `tailwindcss-animate`. Il fournit des composants shadcn/Radix, un thème et des écrans de démonstration. Il n'est donc pas un scaffold directement conforme aux contraintes Next 15 et Tailwind 4 du CRM.

Le starter propose une inscription publique via [sign-up-form.tsx](https://github.com/vercel/next.js/blob/fc4f062ba96f37f971bcbab8858d96e413d86bf9/examples/with-supabase/components/sign-up-form.tsx) et un lien d'inscription dans [auth-button.tsx](https://github.com/vercel/next.js/blob/fc4f062ba96f37f971bcbab8858d96e413d86bf9/examples/with-supabase/components/auth-button.tsx). Le [rafraîchissement de session](https://github.com/vercel/next.js/blob/fc4f062ba96f37f971bcbab8858d96e413d86bf9/examples/with-supabase/lib/supabase/proxy.ts) laisse la racine `/` publique et ignore le contrôle quand les variables d'environnement manquent. Il s'agit de comportements de démonstration à remplacer.

## Adaptations indispensables avant utilisation

1. **Conserver Next 15.** Épingler Next 15.5.25 et une configuration ESLint cohérente ; fixer React et React DOM ensemble. Le starter courant possède `proxy.ts` et un export `proxy`. Next 15 utilise **middleware.ts avec export middleware** : adapter le fichier d'entrée, ses imports et le renouvellement de session conformément à la [documentation Next 15](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware). Un simple changement de version dans package.json ne suffit pas.
2. **Passer réellement à Tailwind 4.** Employer son plugin PostCSS, son import CSS et les tokens validés du CRM ; ne pas conserver les directives et la configuration Tailwind 3 du starter. Relire les composants existants avant ajout via shadcn et respecter les conventions du projet. La compatibilité documentaire React 19/Tailwind 4 ne dispense pas de la vérification visuelle.
3. **Rendre le compte unique effectif.** Retirer les routes/formulaires/liens de signup et désactiver `Allow new users to sign up` dans Supabase Auth ; désactiver les connexions anonymes. Créer le propriétaire par administration lors de l'initialisation, et vérifier son identifiant côté serveur ainsi que dans les politiques RLS. Masquer seulement le bouton signup ne suffit pas. [Configuration Auth officielle](https://supabase.com/docs/guides/auth/general-configuration).
4. **Protéger toutes les données du CRM.** La racine Accueil est privée. Retirer le contournement lorsque l'environnement manque, valider l'environnement au démarrage et vérifier l'autorisation sur chaque opération serveur. Le client Supabase serveur est construit par requête, avec la session du propriétaire ; aucune clé secrète d'administration ne doit devenir une clé navigateur. Les migrations et politiques RLS sont des travaux du scaffold, absents de la preuve actuelle.
5. **Conserver la récupération du mot de passe.** Adapter les redirections `/protected` de démonstration vers l'Accueil et paramétrer les URL autorisées. Vérifier le cycle complet e-mail → lien → nouveau mot de passe → connexion. Le service e-mail intégré est limité aux essais et aux adresses admissibles ; voir les limites déjà consignées dans [hosting-options.md](hosting-options.md).
6. **Remplacer le contenu de démonstration.** Reprendre les écrans UX approuvés, les validations Zod/RHF du projet et les règles métier centralisées. Ni les exemples de formulaires du starter ni son thème par défaut ne valident les règles du CRM.

Le starter officiel est une **référence d'intégration à adapter**. Le moyen de scaffold peut être choisi à l'implémentation après inspection Context7/shadcn ; aucune commande `create-next-app`, installation ou exécution distante n'a été lancée pour cette vérification.

## Limites et décisions conservées

- Les plages de versions et les engines ont été confrontés aux manifests éditeurs, mais aucun graphe de dépendances n'a été installé ou résolu. TypeScript, lint, exécution Next 15, cookies/refresh, RLS, connexion et rendu ne sont pas testés.
- Le compte Supabase, son SMTP, la version PostgreSQL, le plan et le runtime effectif Vercel restent non inspectés. Les valeurs du tableau sont des candidats documentés, pas des versions actuellement installées dans le CRM.
- La contrainte utilisateur **Supabase + Vercel pour le POC, sans sauvegarde quotidienne ni rétention de sept jours à mettre en place**, reste inchangée. Cette recherche ne réintroduit aucune sauvegarde automatique, export périodique ou offre payante.
- La compatibilité d'ensemble devra être démontrée au scaffold et à l'exécution des parcours réels ; aucun résultat « ça fonctionne » n'est revendiqué ici.
