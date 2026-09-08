# Vérification — noms de contacts sans chiffres

Implémentation locale du 8 septembre 2026, branche `codex/contacts-noms-sans-chiffres`, base `2a06b01d308617c9723cc9195699d3230d9b9ae2`. Aucune dépendance ajoutée, aucun push ou déploiement frontend.

## Changement

Les nouveaux noms refusent les chiffres décimaux Unicode Nd. Les plages Unicode 17 explicites sont identiques dans le module JS et la fonction SQL, indépendamment de la version Unicode du navigateur. Le formulaire valide les nouveaux noms transmis ; un nom historique inchangé ne bloque pas la correction d’un autre champ. Les valeurs brutes ne sont pas filtrées. Les lectures, brouillons v1/v2 et commandes transport restent compatibles avec les anciens noms. Les deux RPC vérifient la règle après verrouillage et recherche d’un reçu existant, avant toute nouvelle écriture.

Migration additive `20260908120000_contact_names_without_digits.sql` appliquée via le helper local sur `bmad-crm` / `otadrkhrjxafutocstzo`. Contrôle préalable fourni par le parent : propriétaire et organisation Persos vérifiés, plan free, ACTIVE_HEALTHY. Retour de l’application : succès. Les recettes vérifient de nouveau identité Supabase et registre privé avant mutation.

## Preuves exécutées

Rapports locaux ignorés sous `_bmad-output/implementation-artifacts/verification/names/` ; Node v24.20.0.

- Rouge avant changement produit : `verify-contact-details-transport.mjs`, échec réel `Chiffre décimal refusé dans first_name: Jean2`, sortie 1. Rapport `red/transport-review-results.json`, erreur observée retranscrite dans `red/observed-failure.txt` (trace outil 84c94d).
- Vert : `pnpm typecheck` et `pnpm verify:contacts:transport`. Noms Unicode, champs, 200/201 points de code, blancs, schémas stricts v1/v2, héritage lisible, brouillons/pending v1/v2, génération transport, autres validations existantes.
- Vert : `pnpm verify:contacts:db`. RPC directes v1/v2 création/modification, refus sans mutation/révision, conservation des noms historiques non modifiés, simulation de reçus historiques sur fixtures exactes puis rejeu immuable, autres champs/conflits/idempotence/doublons/droits. Parité de 921 points entre JS et SQL (chaque Nd, voisins de plage, lettres internationales). Inventaire haché avant/après : tous contacts et reçus préexistants inchangés, fixtures et reçus exacts supprimés, absence relue ; utilisateur Auth de recette supprimé et absence confirmée.
- Vert : `pnpm verify:contacts:http`, enrichie du parcours navigateur ciblé. agent-browser CLI : erreurs des deux champs, texte conservé, création corrigée, nouvelle modification refusée sans mutation, correction Élodie / O’Connor sauvegardée et retrouvée après rechargement. HTTP v1/v2 direct création et modification avec chiffres ASCII/arabes/pleine chasse/mathématiques, protections origine/session/taille et validation e-mail. Console sans crash. Nettoyage fixtures/reçus exacts vérifié.
- Captures inspectées : `green/names-errors.png`, `green/names-persisted.png`. Les anciens contacts chiffrés restent visibles dans la liste, conformément au périmètre.

Commandes avec runtime Node24 fourni : préfixe PATH `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin`, variable `NAMES_PROOF_DIR=_bmad-output/implementation-artifacts/verification/names/green`. Recettes DB et navigateur exécutées séquentiellement.

## Limites explicites

Les anciennes recettes UI complètes `verify:contacts:ui`, `verify:contacts:review` et l’ancienne `verify-contacts-db.mjs` ont leurs fixtures alphabétiques adaptées mais n’ont pas été relancées dans cette intervention ; aucun résultat antérieur ne prouve leur version actuelle. Le scénario navigateur ciblé passe via `verify:contacts:http`. Aucun nouveau build/push/frontend en production. Les reçus historiques utilisés en DB sont des simulations sur fixtures nouvellement créées, jamais des reçus métier modifiés. Les anciens noms métier restent volontairement intacts.

## Clôture après revue

Trois couches de revue exécutées : blind, edge-case et verification-gap. Deux lacunes de couverture principales corrigées : le matcher JS réel est désormais comparé au corpus Unicode et le rejeu historique passe réellement à travers HTTP v1/v2. Ajouts navigateur : reprise des pending numériques, refus avec libération de commande, correction, édition d’une note puis d’un seul nom historique, focus après erreur directe et après confirmation de fermeture. Relecture indépendante des correctifs : aucun défaut résiduel concret relevé.

Le parent a relancé sur le code final `pnpm typecheck`, puis les recettes transport, DB et HTTP/navigateur ciblé. Rapports distincts dans `verification/names/final/` : transport 52 contrôles, DB 124 contrôles (dont parité de 921 points), HTTP/navigateur 117 contrôles. Tous réussis ; console et erreurs runtime à zéro ; données et reçus préexistants inchangés ; nettoyage des seules fixtures vérifié. Les comptes/résultats HTTP et UI du même passage désignent la même recette et ne s’additionnent pas.

Les fixtures de `scripts/verify-contacts.mjs` sont aussi alphabétiques ; contrôle de syntaxe réussi, ancien parcours UI complet non relancé (contrat d’interface 2.1). Les preuves antérieures restent séparées du résultat final.

Un seul cas préexistant low est consigné dans `deferred-work.md` : un reçu créé directement par RPC v1 avec des espaces périphériques ne correspond pas au payload normalisé par HTTP v1. Les commandes canoniques de l’application conservent leur protocole historique ; aucun changement de ce protocole ici. Ce n’est pas un défaut introduit par l’interdiction des chiffres.


Empreinte produit du passage final HTTP/navigateur : `7eb011630309017f86434dee272d603688e5a6e556d74bbe7ca7422d12605565`.
