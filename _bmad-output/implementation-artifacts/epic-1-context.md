# Epic 1 Context: Accéder à son CRM privé

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permettre au propriétaire unique d’ouvrir son CRM privé, de se connecter par e-mail et mot de passe, de récupérer son accès et d’utiliser une URL HTTPS vérifiée. Le contenu commercial arrive ensuite ; l’Accueil intermédiaire ne simule pas de tâches.

## Stories

- Story 1.1: Initialiser le projet depuis le starter et ouvrir mon espace privé
- Story 1.2: Récupérer mon accès par e-mail
- Story 1.3: Utiliser mon espace privé depuis son URL hébergée

## Requirements & Constraints

- Un seul compte, créé à l’installation. Aucune inscription publique, invitation ou connexion anonyme. Toute route privée et opération serveur refuse les sessions absentes, invalides ou d’un autre propriétaire, même en accès direct.
- Récupération par e-mail : réponse neutre à la demande, erreurs d’envoi explicites, lien inutilisable traité sans faux succès. Vérifier réception réelle, changement de mot de passe et reconnexion ; une réponse HTTP positive ne prouve pas la réception.
- À expiration irréversible, demander la reconnexion et purger les données privées visibles et caches. Ne conserver ni mot de passe ni token dans un brouillon ou les journaux. La récupération des brouillons métier sera livrée dès la première saisie concernée.
- Les décisions de réalisation déléguées priment sur les anciennes questions ouvertes : Q1–Q6 sont tranchées. Pour cet epic, la commande de déconnexion explicite est exclue ; expiration et purge techniques restent requises. Aucun nouveau menu documentaire requis.
- Supabase et Vercel sont les seuls services retenus. Aucun achat implicite, sauvegarde quotidienne, rétention de sept jours ou objectif associé de restauration. Exclus : Neon, Prisma, Better Auth, API publique et intégrations commerciales.
- Contrôle TypeScript et exécution réelle des parcours via agent-browser requis. Tester accès propriétaire, refus hors session/autre compte, erreurs, expiration et récupération. Après hébergement, vérifier la version, l’état Ready et les parcours sur l’URL HTTPS réelle ; build ou Ready seul ne vaut pas succès fonctionnel.
- Développement et démonstration utilisent uniquement des données métier fictives ; les coordonnées Auth du propriétaire en restent distinctes.

## Technical Decisions

- Next.js 15 App Router, TypeScript strict, Supabase PostgreSQL/Auth, Tailwind 4 et shadcn/ui. Partir de la référence officielle with-supabase après inspection : remplacer son entrée proxy par middleware Next 15, adapter Tailwind 3 vers 4 et supprimer démonstration, signup et contournement de protection lorsque l’environnement manque.
- Candidats documentés à revérifier au scaffold : Next 15.5.25, React/DOM 19.2.8, Node local 24.20.0 et Vercel 24.x, Supabase JS 2.115.0, SSR 0.12.6, Tailwind/PostCSS 4.3.3. Context7 et inspection des composants shadcn précèdent le code ; manifeste et lockfile feront ensuite autorité.
- Auth SSR par cookies avec clients navigateur/serveur distincts et client serveur par requête. Renouveler les cookies et vérifier une identité authentique, pas une simple lecture de session. Comparer chaque accès à l’UUID propriétaire placé en configuration privée, modifiable uniquement par administration.
- Secrets séparés des clés publiables ; environnement validé au démarrage avec Zod. Aucune clé privilégiée au navigateur ou dans les requêtes ordinaires, aucun cache serveur partagé de données privées. Les origines et redirections Auth doivent être explicitement autorisées.
- Ne créer aucune table métier future. Lors de leur introduction, les entités recevront RLS propriétaire et commandes communes validées ; RPC transactionnelles, idempotence et conflits seront introduits à leur première utilisation. Les migrations seront reproductibles et compatibles avant déploiement du code dépendant ; leur échec bloque ce déploiement.
- Q7 reste un prérequis externe : identifier les projets/comptes Supabase et Vercel, le plan, le propriétaire, les origines et le destinataire admissible à l’e-mail avant les opérations concernées. Ne pas inventer de paramètres. L’envoi d’essai Supabase est limité aux adresses admissibles ; aucune solution SMTP payante n’est implicitement adoptée.

## UX & Interaction Patterns

- Interface française, sobre et compacte inspirée de Folk : surfaces presque blanches, textes sombres, navigation discrète. Les écrans Auth documentés ne nécessitent pas de nouvelle maquette. Transposer les tokens et vérifier le rendu réel.
- Arrivée sur Accueil. Introduire seulement les routes livrées, en conservant l’ordre final Accueil, Contacts, Sociétés, Pipeline, Relances. 
- Distinguer attente, réussite et échec ; préserver l’adresse saisie en cas d’erreur, permettre le réessai, associer erreurs et champs. Chargement sans déplacement de disposition, navigation clavier, focus visible, Échap sur dialogues ; aucune action essentielle au survol uniquement.
- Recette desktop 1440×900 et 2560×1440, tactile 402×874, tablette portrait/paysage. Aucun défilement horizontal de page. Mesurer les cibles de fluidité retenues ; la recette sur jeu métier complet attend les entités correspondantes.

## Cross-Story Dependencies

La connexion locale de 1.1 précède la récupération de 1.2 ; les deux sont vérifiées avant l’hébergement de 1.3. Q7 doit être résolu pour l’environnement Supabase dès 1.1, pour destinataire et redirection dès 1.2, puis pour la cible Vercel de 1.3. Les epics 2 et 3 réutiliseront l’autorisation et la session, en appliquant les garanties de persistance et brouillons dès chaque nouvelle saisie.
