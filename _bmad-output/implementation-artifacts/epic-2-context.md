# Epic 2 Context: Retrouver ses contacts, sociétés et échanges

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Fournir un carnet de relations indépendant du pipeline : contacts, sociétés, notes et échanges réels avec dernière interaction et contexte historique. Chaque saisie doit rester fiable après erreur réseau, reconnexion ou modification concurrente.

## Stories

- Story 2.1: Créer et retrouver un contact sans perdre ma saisie
- Story 2.2: Compléter les informations et notes de mon contact
- Story 2.3: Relier mes contacts à leurs sociétés
- Story 2.4: Enregistrer un échange et retrouver la dernière interaction
- Story 2.5: Corriger un échange sans déformer son historique

## Requirements & Constraints

- Un contact requiert un prénom ou un nom non vide après trim. E-mail, titre professionnel, LinkedIn et note sont facultatifs ; zéro ou une société actuelle. Société : nom obligatoire uniquement. Aucun téléphone, photo, enrichissement ou e-mail supplémentaire.
- E-mail : trim, validation syntaxique bloquante et erreur près du champ ; doublons insensibles à la casse signalés sans interdire la sauvegarde ni fusionner. LinkedIn : URL absolue HTTP(S), ouverture externe protégée ; aucune action si vide.
- Les notes du contact sont indépendantes des échanges et ne changent jamais la dernière interaction. Un changement de société ne déplace aucun échange historique et ne supprime aucune fiche.
- Un échange de cet epic conserve au moins son contact, sa date/heure, son canal explicitement choisi (Téléphone, E-mail, Visio, Autre), ses notes facultatives et sa société historique facultative. Celle-ci est préremplie depuis le contact puis librement corrigible ou retirable. Date initiale : maintenant Paris ; date future refusée côté serveur. Heure locale inexistante refusée ; heure ambiguë résolue par choix explicite de l’occurrence et du décalage UTC.
- Les corrections de date, canal, notes et relations recalculent toutes les projections affectées, y compris vers un état vide. Dernière interaction : instant de l’échange, création, puis UUID, tous décroissants ; calcul global indépendant de la page chargée.
- Pagination explicite de 25 éléments et compteurs globaux. Contacts triés par nom, prénom, UUID ; sociétés par nom, UUID ; comparaison française insensible à la casse.
- Recherche, suppression, archivage, restauration, intégration commerciale et Realtime sont exclus. Les arbitrages délégués sont acquis et remplacent les anciennes réserves Q1–Q6 ; ne pas relancer leurs validations.

## Technical Decisions

- Stack adoptée : Next.js 15, Node 24, TypeScript strict, Supabase Auth/PostgreSQL, Zod, React Hook Form, shadcn et Tailwind 4. Aucun schéma métier avant sa story.
- Session authentique et UUID propriétaire privé vérifiés à chaque lecture/commande ; tables protégées par RLS. Aucun cache serveur partagé ni clé privilégiée ordinaire. Server Actions validées par Zod puis RPC transactionnelles contrôlant propriétaire et paramètres. Écritures directes interdites ; RPC mutatrices `SECURITY DEFINER`, noms qualifiés, `search_path = ''`, EXECUTE limité aux fonctions authentifiées autorisées. Migrations versionnées couvrant schéma, droits et contraintes.
- UUID en base ; UTC rendu Europe/Paris. Contrats partagés : succès canonique, validation, unauthenticated, forbidden, conflict, not_found ou unavailable.
- Patch des seuls champs modifiés avec leurs versions lues ; verrouillage, contrôle atomique et incrément des versions/révision au commit. Champs indépendants compatibles ; champ obsolète refusé. Remplacement explicite à nouveau contrôlé.
- Idempotence transactionnelle : conserver propriétaire, clé, commande, empreinte et résultat pendant le POC. Après réponse perdue, reprendre la même commande ; contenu différent avec la même clé refusé.
- Brouillons sessionStorage par propriétaire/cible/champ : versions initiales, commande, génération, aucun secret. Restaurer après authentification du même propriétaire. Sérialiser les écritures d’un champ ; nettoyer seulement la génération confirmée ou explicitement abandonnée. À expiration, purger les données visibles et caches, préserver le brouillon récupérable.
- Panneau piloté par shell client/URL sans navigation serveur au clic. Cache propriétaire/entité/révision ; ignorer réponses anciennes, invalider projections affectées. Revalider au focus/reconnexion/retour réseau sans écraser les brouillons. Skeletons, éditeurs montés et préchargement dès le scaffold.

## UX & Interaction Patterns

- Composition A compacte, ordinateur prioritaire, primitives shadcn et tokens du projet. Contacts et Sociétés accessibles directement ; panneaux droits conservant le contexte de liste, fermeture et retour de focus, adaptation tactile sans défilement horizontal de page.
- Liste Contacts finale : Prénom, Nom, E-mail, Titre professionnel, Dernière interaction, LinkedIn, Société, Opportunité. Ajouter les colonnes avec leurs capacités réelles ; aucune relation ou commande vers une fonctionnalité non livrée. Liste Sociétés : nom et accès à la fiche.
- Création : Ajouter/Annuler ; correction : Enregistrer/Annuler, sans autosave à chaque frappe. Fermeture avec saisie non confirmée : Enregistrer / Abandonner / Continuer la saisie. Fermer après sauvegarde seulement si elle réussit.
- Distinguer chargement, vide, données, absence/inaccessibilité, édition, enregistrement, confirmation et échec/conflit. Optimisme = attente, jamais preuve de sauvegarde ; échec restaure les projections confirmées et conserve le brouillon. Commandes accessibles au clavier, erreurs associées aux champs et focus géré.

## Cross-Story Dependencies

L’accès privé de l’epic 1 précède les écritures. La chaîne 2.1 → 2.2 → 2.3 → 2.4 → 2.5 étend les mêmes garanties de sécurité, concurrence et reprise. L’epic 3 ajoutera opportunités, leurs relations et agrégats ; l’annuaire ne doit pas en dépendre.

Chaque story exige TypeScript et parcours agent-browser sur données fictives : persistance, reconnexion, droits RLS/RPC, retries, conflits, pagination, erreurs et clavier. Mesurer réaction <100 ms, vues <2 s et confirmation <1 s dans 19 essais sur 20, sans relâcher la fluidité des panneaux/éditeurs ; consigner les conditions. Vérifier cible et plan avant opération distante ; aucun déploiement implicite.
