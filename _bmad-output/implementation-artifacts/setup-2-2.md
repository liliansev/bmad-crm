# Préparation de la story 2.2

## Reprise vérifiée

Demande de Lilian : « démarrons », après le point d’arrêt de formation avant 2.2. La délégation d’accélération jusqu’à la première fonction est terminée. Reprise du workflow BMAD normal sur cette story, sans rouvrir les décisions Q2/Q4 déjà arrêtées. Pas de story 2.3 engagée.

Git propre avant démarrage, branche créée `codex/2-2-informations-contact` depuis `bf7baaf919008f51a2b1367719ea1e3322a1781f`. Origin récupéré ; le dernier commit local est documentaire après le code 2.1 livré. Serveur local confirmé sur localhost:3000. Epic 2 compilé valide selon dates des sources, continuité 2.1 relue.

## Investigation

Parent : UI, contrats et transport. Agent indépendant : compatibilité SQL, reçus et anciens clients, en lecture seule. Même conclusion : modifier en place le contrat strict 2.1 casserait le client déjà déployé.

- Conserver `field_versions` avec exactement prénom/nom. Ajouter `email`, `job_title`, `linkedin_url`, `notes` et un stockage `details_versions` indépendant pour les quatre nouveaux champs. Valeurs initiales vides, version initiale 1. Fusionner les versions dans la projection interne 2.2 seulement.
- Une nouvelle migration doit aussi fixer les sérialisations de `contact_command` : `to_jsonb(v_contact)` expose toutes les colonnes, or le client 2.1 exige un schéma strict. Retourner sa projection historique explicite pour les nouveaux résultats v1. Ne réécrire aucun reçu existant. Les corrections v1 préservent les nouveaux champs.
- Contrat de commande et RPC 2.2 distincts, avec identification explicite de version. Partager le verrou et l’espace de reçus ; l’empreinte reste le JSON exact. Aucun changement d’UUID ou enrichissement automatique d’une ancienne commande en attente.
- Importer les brouillons 2.1 vers un format versionné en conservant texte brut, base, génération et transport v1 pour une commande déjà pending. Un reçu v1 ne prouve rien sur les champs nouveaux : les lire réellement avant raccord et préserver toute saisie plus récente. Tester aussi une commande v1 déjà committée dont la réponse a été perdue.
- La liste reçoit seulement ce dont elle a besoin ; ne pas transporter les notes longues dans chaque ligne. Distinguer les résumés de liste des fiches complètes dans le cache afin de ne jamais enregistrer une note supposée vide parce qu’elle n’a pas été chargée.
- Doublon : requête authentifiée globale, comparaison exacte normalisée sans casse, exclusion de la fiche courante. Afficher les contacts concernés et une pagination si nécessaire ; aucun avertissement tronqué à la première page de Contacts. Un avertissement n’est pas une réservation d’unicité et n’empêche jamais l’enregistrement.

## Décisions de réalisation

Réutiliser les garanties 2.1 et ne pas reconstruire l’Auth. Champs visibles dans la création et l’édition ; note multiligne en texte brut, jamais interprétée comme HTML. Préserver ses espaces et sauts de ligne. Limites techniques proposées pour borner les commandes : prénom/nom/titre 200 points de code, e-mail 254, URL 2 048, note 20 000 ; limite HTTP 128 Kio avec borne effective avant accumulation complète. Afficher les limites près des champs concernés. Aucune limite ne devient un champ obligatoire.

Context7 consulté avant implémentation : `/shadcn-ui/ui` (Textarea via CLI, label et aria-invalid), `/colinhacks/zod` (email/URL, HTTP(S), valeurs vides), `/supabase/supabase` (migrations, SECURITY DEFINER, search_path et droits EXECUTE). Inventaire de components/ui fait : Textarea absent, ajout via CLI shadcn nécessaire. Aucun nouveau paquet métier prévu.

Pas d’incertitude métier restante : formats, doublons non bloquants, champs, sauvegarde et notes sont déjà définis. Effet externe à contrôler avant exécution : migration additive du projet Supabase dédié, également utilisé par la version hébergée 2.1. Aucun achat, réinitialisation ou déploiement 2.2 implicite.

## État

Spécification relue puis approuvée par Lilian : « c’est bon implemente ». Implémentation terminée et revue ; bloc d’intention conservé. Aucun déploiement 2.2 autorisé implicitement.

## Coordination et préflight

Agent de réalisation : contrats/UI/cache/brouillons et sous-agent SQL sur la seule nouvelle migration. Agent QA : scripts verify-contact-details*.mjs, sans exécution distante avant application coordonnée. Parent : cible distante, PostgreSQL temporaire, application SQL après inspection et vérification finale. Aucun chevauchement de fichiers.

Projet Supabase bmad-crm / Persos vérifié actif, eu-west-3, plan free et propriétaire membre. PostgreSQL 17.10 déjà installé : cluster temporaire accessible uniquement par socket Unix privé sous .local, aucune écoute réseau. Schéma 2.1 appliqué et commande/reçu fictifs créés avant migration pour vérifier la compatibilité et l’immutabilité sur le vrai moteur. Aucun compte Auth réel copié localement.

La recherche de doublons utilise un corps POST, afin que l’e-mail ne figure pas dans les URLs et journaux d’accès. Garde propriétaire, origine, Zod et no-store identiques aux autres commandes privées.

## Migration et continuité vérifiées

Migration additive appliquée après préflight PostgreSQL et contrôle de la cible. Les empreintes du contact existant et de tous les reçus historiques sont identiques avant et après ; preuves locales dans `verification/2-2/migration-result.json`. Le cluster PostgreSQL temporaire est arrêté.

Recette DB 2.2 : 77 contrôles passés, dont versions indépendantes, conflits, formats, effacement, 27 doublons répartis sur deux pages et refus d’un autre compte. Les fixtures et leurs reçus ont été supprimés, leur absence relue et les données préexistantes conservées. La recette DB 2.1 passe encore ses 50 contrôles.

Le client 2.1 déjà hébergé a été vérifié directement en HTTPS après migration : connexion, création fictive, correction, rechargement et lecture indépendante, soit 12 contrôles avec nettoyage final. Aucun code 2.2 n’a été poussé ou déployé.


## Clôture locale

Les quatre champs, la liste et le panneau sont implémentés. Revue BMAD en trois couches, correctifs bornés et relecture indépendante sans défaut résiduel. TypeScript propre, transport ciblé 20/20, recette navigateur après revue 43/43 exigences, recette DB finale 77/77. Les preuves avant/après correctifs sont séparées et les interruptions des helpers ne sont pas transformées en réussites. Aucun travail différé ; aucun déploiement 2.2. La story 2.3 reste en backlog.
