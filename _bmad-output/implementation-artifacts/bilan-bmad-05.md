# BMAD 05 — Bilan vérifié et passage à BMAD 06

Clôture technique du 8 septembre 2026, à la demande de Lilian. Code produit : `c8ab921e89d457dba684bfd84bd20476da286281`, branche `codex/contacts-noms-sans-chiffres`. Aucun changement applicatif, migration, push ou déploiement pendant cette clôture. Le serveur reste actif sur http://localhost:3000/contacts. Le tournage lui-même n’est pas déclaré terminé par cette vérification technique.

## Résultats de cette exécution

Runtime Node v24.20.0. Rapports datés isolés sous `verification/bmad-05-final-20260908/` (ignorés par Git). Commandes exécutées séquentiellement pour les accès DB/navigateur :

| Contrôle | Commande / preuve | Résultat |
| --- | --- | --- |
| TypeScript | `pnpm typecheck`, `typecheck.log` | Sortie 0 |
| Validations et transport | `pnpm verify:contacts:transport`, `transport-review-results.json` | 52 contrôles réussis |
| Base réelle Supabase | `pnpm verify:contacts:db`, `db-results.json` | 124 contrôles réussis |
| Parcours complet UI et HTTP | `pnpm verify:contacts:ui`, `ui-current-results.json` | 309 assertions réussies en un passage complet |
| Accès A/B directs complémentaires | `node .local/verify-bmad05-access.mjs`, `access-results.json` | 18 contrôles réussis |
| Console / runtime navigateur | `browser-diagnostics-ui.json` | 0 erreur console, 0 crash |
| Accessibilité automatique | `details-a11y.json` | 0 violation détectée ; 3 contrôles incomplets, pas une certification |

Les 190 résultats dédupliqués de `ui-results.json` représentent le même passage que les 309 assertions de `ui-current-results.json` : ne pas les additionner. Empreinte produit de ce passage : `7eb011630309017f86434dee272d603688e5a6e556d74bbe7ca7422d12605565`.

Les captures `details-desktop.png` et `details-iphone.png` ont été inspectées. La recette couvre également les formats large et iPad, création, modification, rechargement, noms invalides, brouillons/reprises, conflits, coupure réseau, doublons, limites et accès HTTP. Les anciennes valeurs chiffrées restent volontairement lisibles.

## Droits démontrés

A est le propriétaire unique autorisé ; B est un compte temporaire authentifié non autorisé. Ce n’est pas un scénario de deux commerciaux autorisés.

- A crée et lit une fixture ; B ne peut pas la lire directement avec Supabase (RLS), ni lire la fiche ou la liste par HTTP.
- B et le visiteur sans session ne peuvent pas modifier la fixture par HTTP v1/v2, même avec son identifiant exact. Leur accès à la page privée est redirigé vers la connexion.
- Les RPC, doublons, requêtes de mauvaise origine et limites de corps sont couverts par les recettes DB/UI.
- Fixture inchangée après les tentatives ; données et reçus préexistants inchangés dans les recettes DB/UI. Le complément A/B contrôle également l’inventaire des contacts avant/après.
- Nettoyage exact des contacts/reçus de test et suppression du compte B avec absence vérifiée. Sessions QA fermées, navigateur QA fermé ; session utilisateur non manipulée.

Le complément A/B est un script de preuve local ignoré, pas une nouvelle commande portable livrée. Il reprend les clients, authentification cookie et nettoyage déjà utilisés par le dépôt. Les recettes nécessitent la configuration privée locale ; cette limite reste explicite.

## Secrets et frontières de sécurité

Relecture indépendante en lecture seule : identité Supabase `getUser()` puis UUID propriétaire privé dans les guards, contrôles répétés aux frontières, RLS et absence de droits d’écriture directs, RPC avec search_path vide. Aucune faille concrète d’autorisation trouvée dans ce périmètre.

- 419 fichiers suivis : seul `.env.example` est un fichier env suivi, avec placeholders. `.env.local` et `.local/` sont ignorés.
- 451 blobs de l’historique accessible par les refs locales : aucun motif de clé privée, secret/PAT Supabase, secret Stripe, token GitHub, JWT complet ou URL DB avec mot de passe détecté.
- Aucun match exact des trois valeurs privées locales comparées (mot de passe DB, service role, mot de passe propriétaire) dans les fichiers suivis, les blobs historiques ou les 866 bundles JS présents sous `.next/static` lors du scan.
- Aucune valeur secrète affichée. Le client produit reçoit uniquement URL et clé publique Supabase ; les erreurs env affichent les noms de champs, pas leurs valeurs.

Limites : scan ciblé, pas preuve universelle d’absence de secrets ; historique accessible localement, pas objets supprimés ou autres clones. Bundles présents de développement, pas build production fraîchement généré. Les trois contrôles d’accessibilité incomplets concernent notamment focus/ARIA/contraste. Les réglages de production et de récupération d’accès seront à revérifier dans BMAD 06.

## Décisions et fin de périmètre

La revue BMAD du commit a été présentée. Lilian a choisi de conserver les trois actions ouvertes : helper de test absent de Git (P2), périmètre des modes ciblés (P3), version Unicode de l’oracle (P3). Aucun patch autorisé ou appliqué sur ces trois points. Détails : `spec-contact-noms-sans-chiffres.md`, section Review Findings. Les autres limites historiques restent dans `deferred-work.md`.

Le cycle rouge/correction/vert de la règle « noms sans chiffres » est déjà documenté dans `setup-contact-noms-sans-chiffres.md`. Cette clôture ajoute une exécution complète sur le commit actuel ; elle ne fabrique pas un nouveau défaut pour le tournage.

Les contrôles critiques du périmètre contacts sont exécutés et observables. Les recettes séparées `verify:auth`, `verify:contacts:review` et les anciens scripts 2.1 n’ont pas été relancés ici ; leurs preuves antérieures ne sont pas comptées. Aucune prochaine action, relance, suppression, société ou opportunité n’a été ajoutée. Reprise : `tournage-bmad-06.md`, au premier inventaire en lecture seule.
