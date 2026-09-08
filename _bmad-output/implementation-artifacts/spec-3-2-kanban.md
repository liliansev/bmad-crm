---
title: 'Piloter le kanban et modifier mes cartes en place'
type: 'feature'
created: '2026-09-08'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-3-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/planning-artifacts/epics.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/planning-artifacts/epics-support/decisions-deleguees.md
---

<frozen-after-approval reason="human-owned intent — décisions déléguées et mandat du 8 septembre">

## Intent

Voir toutes les affaires dans le kanban compact, modifier montant/Notes directement sur une carte et changer leur étape sans perdre le contexte du panneau ni une saisie en cours.

## Boundaries & Constraints

Cinq colonnes fixes dans l’ordre À qualifier, Échange en cours, Proposition envoyée, Gagnée, Perdue. Carte : titre, société si renseignée, montant facultatif EUR HT et aperçu Notes ; mêmes valeurs que le panneau, zéro distinct de montant absent. Ordre par création décroissante puis UUID croissant dans chaque colonne ; pas de réordonnancement manuel. Pagination explicite de 25 cartes par colonne, compteurs globaux par étape et accès à toutes les cartes ; aucun faux compteur raster.

Montant/Notes : éditeurs toujours montés, activation au clic sans ouverture du panneau ni déplacement. Une seule commande au blur d’un champ modifié ; aucun envoi à chaque frappe ni double envoi par événement imbriqué. Les valeurs optimistes sont un état en cours, jamais une confirmation ; erreur/conflit conserve le brouillon. Commandes d’un champ sérialisées, versions de base et générations conservées. Fermeture ou changement de sélection avec saisie non confirmée : Enregistrer/Abandonner/Continuer ; échec interdit fermeture et abandon ne retire pas un commit reçu.

Shell client propriétaire de la sélection ; URL et historique cohérents sans navigation serveur à chaque carte. Cache privé par propriétaire/entité/révision, préchargement au survol/focus et voisins ±3, déduplication et refus des réponses périmées. Panneau droit conserve le kanban visible sur ordinateur ; revalidation au focus/retour réseau/reconnexion sans écraser les brouillons.

Toutes transitions d’étapes, y compris des affaires closes, passent par la même commande transactionnelle depuis déplacement ou sélection clavier dans la fiche. Révision de workflow séparée des Notes/montant, verrou parent ; erreur/conflit rétablit l’étape confirmée sans perdre un brouillon indépendant. 3.3 étendra obligatoirement ce chemin avant l’apparition des tâches.

Jamais : schéma Tâche, date/compteur d’action simulé, montant gagné agrégé, recherche/filtre supplémentaire, suppression, réordonnancement libre ou déploiement implicite. Aucune dépendance lourde sans usage ; charger séparément le module de déplacement si nécessaire. Composition A et tokens existants, aucune nouvelle maquette requise.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Colonnes | Zéro carte, colonne vide, >25 cartes, dates égales | Cinq étapes visibles, vrais vides, pagination et totaux globaux, tri stable | Erreur de lecture distincte d’un vide |
| Contenu | Titre/Notes longs, société absente, montant vide/0 | Lisible sans débordement ; absence distincte de zéro | Aucun contenu inventé |
| Édition | Clic montant/Notes, frappe, blur, blur répété | Éditeur monté ; aucun drag/panneau ; zéro commande si inchangé, une si modifié | Validation locale conserve texte et focus utilisable |
| Carte/panneau | Même champ visible des deux côtés | Valeur/état communs, une source de brouillon et file d’écriture | Aucun ancien résultat ne remplace le nouveau |
| Sélection | Carte A puis B, réponse A tardive, fermeture, retour/avance | B reste sélectionnée ; URL et panneau cohérents, focus restitué | Échec de chargement affiché avec réessai |
| Brouillon | Fermer, sélectionner ailleurs ou naviguer durant saisie | Trois choix Q4 ; Enregistrer attend commit | Échec/conflit garde contexte et génération récente |
| Déplacement | Toute paire d’étapes, même étape, clavier | Même commande d’étape ; destination triée sans position manuelle, même étape sans mutation inutile | Conflit/échec rétablit étape confirmée sans effacer Notes |
| Pages | Déplacement depuis/vers une colonne paginée | Totaux, pages affectées et carte revalidés globalement après commit | Pas de carte définitivement perdue entre pages |
| Concurrence | Étape vs étape ; étape vs Notes ; montant vs montant | Conflit workflow ciblé ; Notes indépendantes préservées ; conflit de champ explicite | Aucune écriture partielle ou réussite visuelle mensongère |
| Reprise | Réponse perdue, hors-ligne, expiration/reconnexion même propriétaire | Retry même clé, une mutation ; brouillon récupéré | Autre identité n’accède ni cache ni brouillon |
| Accessibilité | Clavier, tactile, petit écran, chargement | Aucun geste essentiel uniquement au survol ; seule zone kanban défile horizontalement | Focus, erreurs et états annoncés sans déplacer la page |

</frozen-after-approval>

## Code Map

État lu le 8 septembre : aucun kanban ni module Opportunité encore présent. Relire l’implémentation finale 3.1 avant dispatch ; ne pas traiter les noms proposés comme du code acquis.

- Fondations réelles : `components/companies/companies-shell.tsx` et `components/contacts/contacts-shell.tsx` (sélection, URL, générations, préchargement, événements de session et données), `lib/companies-cache.ts` et `lib/contacts-cache.ts` (caches isolés). Étendre le pattern existant, sans créer un cache global privé.
- Éditeurs actuels : `components/companies/company-editor.tsx`, `components/contacts/contact-editor.tsx`, `lib/contacts-drafts.ts`, `lib/companies-drafts.ts`. Leurs formulaires explicites ne prouvent pas encore le contrat blur par champ du kanban : s’appuyer sur celui livré en 3.1.
- Disponibles : `components/ui/{button,card,dialog,input,label,sheet,skeleton,table,textarea}.tsx`, `app/globals.css`, `components/dashboard-nav.tsx`. Relire l’inventaire avant ajout shadcn et documentation Context7 avant usage de bibliothèque.
- Prévus par 3.1 : `app/(dashboard)/pipeline/{page,loading}.tsx`, `lib/opportunities.ts`, `lib/validations/opportunities.ts`, modules cache/brouillons/transport et commande d’étape, `components/opportunities/`. Réutiliser leurs contrats, reçus et conversions monétaires ; aucune deuxième commande concurrente de changement d’étape.
- Nouveaux proposés pour cette story : `components/opportunities/opportunities-board.tsx`, `opportunity-card.tsx` et module de déplacement séparé si justifié. Les lectures paginées par étape et leurs totaux prolongent le service de 3.1 ; migration additive uniquement si une projection/index nécessaire manque, sans nouvelle entité.
- Sources de composition : `_bmad-output/planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/` (paire DESIGN/EXPERIENCE) et architecture AD-7 ; le raster est référence visuelle, pas preuve d’état ou d’accessibilité.

## Tasks & Acceptance

- [ ] Remplacer l’entrée Pipeline minimale par cinq colonnes compactes paginées ; toutes cartes accessibles, ordre/compteurs globaux fiables et chargement aux dimensions finales.
- [ ] Partager valeur confirmée, brouillon et file de sauvegarde entre carte/panneau ; prémonter les éditeurs et séparer clairement édition, ouverture et déplacement.
- [ ] Relier drag et alternative clavier à la commande d’étape unique ; rollback ciblé, invalidation des colonnes/pages et projections liées après commit.
- [ ] Vérifier historique, fermeture protégée, changements rapides de sélection, revalidation et cache isolé sans requête RSC par clic.
- [ ] Exercer matrice, droits et reprise hérités ; mesure réelle desktop/tactile et revue indépendante avant clôture.

**AC1 — Vue complète :** Given les opportunités 3.1, When Pipeline ouvre, Then les cinq colonnes et contenu des cartes respectent A compacte, ordre et pagination explicites ; tous compteurs viennent des données globales.

**AC2 — Édition en place :** Given une carte, When montant/Notes est modifié puis quitté, Then l’éditeur reste monté, une seule sauvegarde part, la valeur est commune au panneau et ses états distinguent attente, confirmation, erreur et conflit avec brouillon conservé.

**AC3 — Panneau :** Given navigation de carte en carte puis historique navigateur, When les lectures arrivent dans n’importe quel ordre, Then sélection/URL/contexte/focus restent cohérents, le panneau garde le kanban visible sur ordinateur et une saisie non confirmée est protégée.

**AC4 — Étapes :** Given une opportunité sans tâche, When déplacement ou sélection clavier change l’étape, Then toutes transitions utilisent la même commande ; erreur/conflit revient au confirmé sans perte d’édition indépendante et aucune gestion de tâche n’est simulée.

**AC5 — Recette réelle :** Given vide, textes longs, pagination, petits écrans et incidents R2, When l’interface réelle est exercée, Then clavier, persistance, scroll limité au kanban, chargements, focus et fluidité sont vérifiés, sans déduire la conformité de la maquette.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Draft documentaire, aucune exécution ou mesure revendiquée. Après clôture 3.1 : TypeScript Node 24 et agent-browser, captures inspectées sur 1440×900/2560×1440, 402×874 et tablette portrait/paysage ; tester drag réel, clavier, blur, retour/avance, réseau et deux onglets. Recette ciblée >25 cartes dans une étape et déplacement entre pages avec total global. Mesurer panneau froid ≤50 ms/chaud ≤16 ms, édition ≤16 ms, réaction visuelle <100 ms ; cibles NFR vues <2 s et sauvegarde <1 s dans 19/20 essais sur jeu convenu, avec version/matériel/navigateur/réseau et chaud/froid consignés. Les mesures globales sur 200 opportunités et 1 000 échanges n’équivalent pas à une preuve si le jeu complet n’est pas encore exécuté. Fixtures exactes, mutations distantes par un seul agent, nettoyage limité au manifeste ; aucune donnée existante effacée, aucun build de développement ou déploiement frontend.
