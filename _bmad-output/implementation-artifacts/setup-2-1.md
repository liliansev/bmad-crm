# Réalisation Contact minimal — décisions techniques et coordination

## Portée

Créer la story 2.1 intégrale : seulement prénom/nom, liste, panneau et modifications fiables. La création des champs facultatifs appartient à 2.2. Les décisions métier validées sont condensées dans epic-2-context.md. Aucun nouveau menu de validation ; propriétaire unique, prototype fictif.

Vous pouvez déléguer un sous-agent aux seuls SQL et script de vérification DB, après communication du contrat ci-dessous ; gardez les fichiers applicatifs et UI. Maximum un sous-agent à la fois : un autre agent travaille sur hébergement. Scopes disjoints. Ne modifier ni README.md, .vercelignore, scripts/verify-hosted.mjs, scripts/verify-recovery-real.mjs ni setup/spec 1.3. Parent seul sur sprint-status, déploiement, configuration et setup 2.1. Votre spec peut recevoir des Implementation Notes.

## Contrat recommandé

Valider le contrat partagé dans lib/validations/contacts.ts avant partage SQL/UI. Choix de réalisation : noms snake_case alignés PostgreSQL pour éviter adaptations multiples. Contact : id UUID, first_name, last_name, field_versions {first_name,last_name}, revision, created_at, updated_at. owner_id en base, pas de valeur issue du client pour les mutations. Longueur max 200 caractères par champ, trim et invariant au moins un non vide à toutes les frontières, dont SQL.

Commande : operation create/update, command_id UUID, contact_id UUID pour update, fields contenant uniquement first_name/last_name réellement modifiés et base_versions correspondantes (update). RPC `public.contact_command(p_command jsonb)` ; résultat JSON discriminé status success/validation/unauthenticated/forbidden/conflict/not_found/unavailable, contact canonique ou erreur typée. Les Server Actions retournent ce même contrat après validation. Les versions se comparent seulement pour les champs envoyés ; conflit inclut les valeurs/versions serveur nécessaires au choix explicite de remplacement (nouveau contrôle ensuite). Aucun écrasement global d’une fiche.

Idempotence : reçu privé unique propriétaire/command_id, opération + empreinte canonique + résultat atomiques dans la même transaction. Verrouiller correctement contre deux commandes simultanées de même clé. Une même clé avec payload différent échoue. Conserver les reçus pendant POC. Une erreur/conflit est distinguée d’un résultat committé et le réessai de remplacement porte une nouvelle commande contrôlée. Pas de hash faible si facilement évitable : SHA-256 PostgreSQL ou représentation JSON canonique comparée directement sont possibles sans dépendance.

## Base et autorisation

Projet dédié Supabase `otadrkhrjxafutocstzo` confirmé ; pas de table métier existante attendue. Collations ICU françaises disponibles (inspection API). Registre du propriétaire dans schéma privé initialisé séparément par parent depuis UUID privé déjà vérifié ; migration ne contient pas d’UUID réel codé en dur. Toute lecture RLS et RPC doit exiger à la fois auth.uid et ce propriétaire enregistré ; un autre compte ne peut pas créer ses propres lignes. Révoquer INSERT/UPDATE/DELETE et EXECUTE par défaut aux rôles publics/anon, SELECT seulement selon RLS, RPC de mutation authentifiée SECURITY DEFINER avec search_path vide et noms qualifiés. Aucun ALTER permissif sur tables Auth. Un SQL de support privé et Contact seulement.

Source Context7 consultée : `/supabase/supabase`, RLS/security-definer, EXECUTE limité, helper privé autorisé. RLS ne protège pas automatiquement les fonctions ; garde explicite dans RPC obligatoire. Maintenir migration reproductible et transactionnelle ; parent l’applique après lecture avec Management API, sans contourner des migrations échouées. Pour la pagination, comparaison française insensible à la casse via collation ICU de colonnes ou expression contrôlée ; nom/prénom/UUID stables, total exact, pages 25.

Quand SQL prêt, transmettre son chemin au parent et attendre confirmation application/registre propriétaire pour exécution DB réelle. Vous pouvez compiler UI et écrire tests pendant ce délai. Le script DB utilise les secrets de `.local/bootstrap-secrets.json` en mémoire, jamais affichés, jamais clé admin dans produit. Les tables/reçus fixtures doivent être nettoyés en finally via administration réservée QA, sans supprimer les données utilisateur. Toute modification SQL après application devient une migration suivante ou fait l’objet d’une réapplication explicite contrôlée.

## Fiabilité et fluidité

Cache et brouillons isolés par UUID propriétaire authentifié transmis au shell serveur après garde, aucune lecture d’un autre namespace. sessionStorage conserve texte, versions de base, commande en cours et génération. Pas de stockage de token/mot de passe. Une réponse ambiguë conserve la commande originale ; réessai identique avant toute nouvelle commande. Une saisie pendant attente est permise et ne doit pas être effacée par confirmation tardive ; réancrer les versions pour cette nouvelle génération après résultat canonique. Aucun autosave : Ajouter/Enregistrer explicites.

Panneau client sélectionné en state, history.replaceState pour URL, pas router.replace au clic. Utiliser les données déjà listées pour première peinture immédiate puis revalider les données de panneau via cache/action, ignorer races. Éditeurs montés, callbacks stables, préchargement au survol et voisins, skeleton par route. Fermer un formulaire sale propose Enregistrer/Abandonner/Continuer ; fermeture seulement après succès et sans abandon implicite d’une génération plus récente. Conflit par champ : choix explicite, puis nouvelle commande portant les versions montrées.

SessionGuard actuel masque son DOM descendant, mais les Sheet/Dialog sont portalisés. Étendre proprement le masquage à ces surfaces dès vérification de session et purger cache/affichage sur refus, sans fermer/effacer le brouillon à chaque simple focus vérifié. Sur expiration puis reconnexion du même propriétaire, la reprise est proposée explicitement. Sur autre compte, aucun brouillon privé rendu. Ne pas mettre de donnée privée dans console, query-string ou journaux.

## Vérification

Node 24 disponible : `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin/node`. Dev localhost:3000 déjà actif ; ne pas en lancer un autre. Context7 avant composants/libs et CLI shadcn après inventaire. Skills BMAD seulement ; agent-browser CLI pour QA.

Recette DB : propriétaire/autre compte/anon, écriture directe refusée, trim/vide, idempotence concurrente et empreinte différente, conflit même champ et champs indépendants, propriétaire non falsifiable. Recette UI : créer/recharger/modifier, réseau coupé et réponse perdue après commit, fermeture sale, double clic, nouvelle saisie pendant réponse tardive, reprise après expiration, portails invisibles hors session, pagination dépassant 25, focus/reconnexion sans écraser brouillon, clavier et cinq formats. Les timings sont des mesures, pas une affirmation héritée des specs ; signaler les cibles non atteintes plutôt que les changer.

Après vérification parent, laisser un seul contact de démonstration explicitement fictif pour prise en main (choix parent). Ne pas peupler avec personnes réelles ni supprimer des lignes non créées par la recette.


## État vérifié pendant réalisation

- Migration `20260907160000_contacts.sql` relue puis appliquée transactionnellement via Management API au projet dédié. Registre privé initialisé séparément depuis UUID vérifié, fichier temporaire supprimé. Aucun UUID propriétaire réel dans migration.
- Recette DB réelle initiale sous Node 24 : 48 contrôles PASS, incluant huit commandes de création concurrentes, conflits par champ, collation FR et pagination. Correctif de recette ciblé ensuite pour vérifier erreurs signOut et absence Auth relue ; aucun changement du SQL appliqué.
- Le test navigateur de requête suspendue a révélé le blocage de la file Next Server Actions même après délai local. Transport HTTP same-origin abortable retenu pour les contacts, sans modifier les frontières Auth/Zod ni les transactions RPC. Ce choix de réalisation est délégué.
- Recettes UI finales, mesures, revue et démonstration hébergée : en cours ; ne pas lire ce journal comme validation finale.

## Revue finale et corrections du 7 septembre

Trois couches indépendantes ont produit 15 constats, triés individuellement dans la spec puis regroupés en 10 corrections. Les champs indépendants sont conservés lors des choix de conflit ; les prélectures terminées après démontage n’émettent plus de refus de session ; l’historique conserve sa destination/page après le choix de fermeture ; le squelette privé correspond à Contacts, y compris la navigation mobile. La limite de nom est de 200 points de code Unicode côté SQL et client ; aucune nouvelle migration nécessaire.

La recette cible uniquement les UUID de ses fixtures, vérifie les contacts préexistants intacts, calcule la pagination à partir du total initial et contrôle la confidentialité réelle du Sheet, des champs et du Dialog indépendamment des marqueurs CSS. 43 contrôles ciblés réussis dans `verification/2-1/review/ui-results.json`, TypeScript et diff-check propres.

Mesures ciblées locales Next dev : ouverture sans cache 134,7 ms, réouvertures 18,9–32,6 ms, vue utilisable 1,25 s et 20 confirmations 119–156 ms. Les cibles 50/16 ms d’ouverture ne sont pas atteintes ; vue sous 2 s et 19/20 confirmations sous 1 s atteintes. Mesure navigateur contextualisée, pas une garantie de peinture exacte. Les deux constats low rejetés (B5/B10) restent explicités dans le triage ; aucune nouvelle fonctionnalité ajoutée.

Build final de livraison après correctifs réussi dans une copie temporaire isolée sous Node 24, sans toucher au serveur local. Vérification complète finale et preuve HTTPS Contacts à consigner ci-dessous avant clôture.

## Frontière de formation

Instruction de Lilian : arrêt après 2.1, avant toute préparation de 2.2. Voir `reprise-apres-contacts.md`. Ne pas lancer automatiquement la story suivante ou créer une nouvelle session.

## Recette finale locale du candidat livré

84 contrôles UI principaux et 24 complémentaires réussis après les correctifs, en plus des 43 contrôles ciblés. Contacts et reçus de recette nettoyés ; contacts préexistants comparés avant/après. Captures desktop/tablette/mobile relues. Le passage principal mesure une ouverture sans cache de 129,6 ms, des réouvertures de 18,9–44,7 ms, une vue utilisable en 3,27 s et 20 confirmations entre 116 et 277 ms. Le seuil de vue 2 s varie donc selon les passages locaux et n’est pas garanti ; les cibles d’ouverture 50/16 ms restent manquées. Ces limites de performance ne sont pas masquées par les assertions fonctionnelles.
