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

État relu pendant 3.1 le 8 septembre : module Opportunité et Pipeline minimal présents, pas encore de kanban. Relire leur version finale après commit3.1 avant dispatch ; cette préparation ne vaut pas clôture3.1.

- Fondations réelles : `components/companies/companies-shell.tsx` et `components/contacts/contacts-shell.tsx` (sélection, URL, générations, préchargement, événements de session et données), `lib/companies-cache.ts` et `lib/contacts-cache.ts` (caches isolés). Étendre le pattern existant, sans créer un cache global privé.
- Éditeurs actuels : `components/companies/company-editor.tsx`, `components/contacts/contact-editor.tsx`, `lib/contacts-drafts.ts`, `lib/companies-drafts.ts`. Leurs formulaires explicites ne prouvent pas encore le contrat blur par champ du kanban : s’appuyer sur celui livré en 3.1.
- Disponibles : `components/ui/{button,card,dialog,input,label,sheet,skeleton,table,textarea}.tsx`, `app/globals.css`, `components/dashboard-nav.tsx`. Relire l’inventaire avant ajout shadcn et documentation Context7 avant usage de bibliothèque.
- Présents par 3.1 : `app/(dashboard)/pipeline/{page,loading}.tsx`, `lib/opportunities.ts`, `lib/validations/opportunities.ts`, `lib/opportunities-{cache,drafts,transport}.ts`, `components/opportunities/{opportunities-shell,opportunity-editor}.tsx`, `app/actions/opportunities.ts`, `app/api/opportunities/`. `createOpportunityStore` est la source commune (ensure/get/subscribe/change/save/refresh/revalidate/discard/dirty/busy/resolve/expire), cache distinct pour lectures confirmées. Réutiliser reçus, conversions decimalToCents/centsToDecimal et transition avec base_workflow_revision ; aucune deuxième commande de changement d’étape. Migration appliquée `20260908230000_opportunities.sql` : table, droits, reçus, opportunity_read/opportunities_page/opportunity_command et projection privée qui convertit amount_cents en texte. Recettes `scripts/verify-opportunities-{contract,db}.mjs` et nettoyage `opportunities-qa-cleanup.mjs` présents ; transport/UI : `scripts/verify-opportunities-{transport,ui,http-security,counts}.mjs` ; relire leurs modes et les corrections finales3.1. `20260908231000_contact_opportunity_counts.sql` fournit une projection privée groupée25contacts, à conserver sans fetch par ligne.
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

Préparation du 8 septembre pendant 3.1, à confronter à son code final avant dispatch :

- **Projection du tableau :** une lecture authentifiée cohérente renvoie les cinq colonnes, chacune avec `stage`, `page`, `total` global et au plus 25 opportunités, ordre `created_at DESC, id ASC`. Accepter un objet strict de pages par étape, entiers positifs bornés ; aucune page d’une colonne ne doit modifier celle des autres. Calculer totaux et lignes depuis le même instantané SQL, sans cinq requêtes HTTP indépendantes ni décompte sur la page courante. Une page devenue hors plage après mutation revient à la dernière page valide et affiche son vrai numéro. Une erreur reste une erreur, pas cinq colonnes vides.
- **Réutilisation :** conserver les lectures contextuelles contact/société de 3.1 ; ajouter une projection du tableau distincte si son contrat de pagination diffère. Réutiliser les DTO monétaires avec centimes texte exacts, reçus et commande `transition` existants. Aucune valeur BIGINT exposée comme nombre JavaScript. Les étapes proviennent de la constante canonique, jamais d’un deuxième enum divergent.
- **Édition partagée :** brancher la carte sur la même source propriétaire/opportunité/champ que le panneau 3.1, avec ses mêmes générations et commandes en attente. Un clic sur montant/Notes active l’éditeur monté ; clic sur titre ou zone d’ouverture ouvre le panneau ; aucune propagation ne déclenche simultanément édition, ouverture et déplacement. Le passage carte → panneau du même objet ne doit pas fabriquer un conflit ni deux envois au blur. Le changement vers une autre carte et la pagination qui masquerait une saisie non confirmée passent par le guard existant. Le brouillon d’une carte sortie de sa page reste récupérable, jamais supprimé par démontage.
- **Sauvegarde ciblée :** préserver aussi un champ dirty non envoyé déjà modifié avant le snapshot pending (génération identique au snapshot ne signifie pas confirmé). Les objets receipt/actual/cache et leurs field_versions sont immuables, clonés avant construction d’une base mixte. Après retry d’un pending, Enregistrer tout doit encore vider les autres champs demandés ; un conflit Notes ne vaut jamais acceptation de la version distante d’un Titre dirty indépendant. Réutiliser les tests store3.1 pour ces trois cas.
- **Déplacement :** identifier une poignée explicite et désactiver l’initiation depuis inputs/textarea/boutons/liens ou pendant une commande d’étape. Ne pas déplacer sur simple clic ou sélection de texte. Le mécanisme peut utiliser les APIs natives si le clavier/tactile essentiel reste utilisable par la sélection d’étape du panneau ; ne pas ajouter de dépendance uniquement pour un réordonnancement non demandé. Si une bibliothèque est réellement nécessaire, Context7 avant usage et module séparé chargé à la demande. Même étape : aucune commande. Cible inconnue : aucun effet. Toute autre transition appelle le chemin 3.1 avec `base_workflow_revision`, conserve la clé sur retry et ignore les événements de drop répétés.
- **Après transition :** déplacer visuellement seulement l’état optimiste en cours, puis revalider les colonnes source/destination, leurs totaux globaux et les projections contact/société affectées. Le panneau sélectionné reste celui de l’affaire déplacée même si sa carte n’est plus sur la page. Le serveur reste seul responsable du tri de destination ; pas de position de drag persistée. Un échec restaure l’étape confirmée et conserve les brouillons indépendants ; un conflit expose l’état actuel sans écrasement silencieux.
- **Revalidations et cache :** invalider par propriétaire/identifiant et epoch de lecture ; une réponse d’avant mutation ne peut remplacer les nouvelles colonnes/compteurs. Précharger sur survol/focus et voisins ±3 dans la liste réellement affichée, dédupliquer sans précharger tous les détails des 200 affaires. Fermer une fiche pendant son chargement/erreur reste possible et une réponse tardive ne la rouvre pas. Le retour navigateur respecte le même arbitrage de brouillons et l’URL effectivement retenue.
- **Recette minimale propre à 3.2 :** plus de 25 affaires dans deux colonnes, égalités de création, montants absents/zéro/grands, notes longues. Faire un vrai drag via agent-browser, un changement au clavier et une action tactile par sélection d’étape ; vérifier les requêtes envoyées, rechargement, pagination source/destination, totaux et absence de duplication. Carte/panneau même champ, blur répété, déplacement avec Notes locales, réponses inversées, fermeture en lecture lente et expiration sont des chemins réels. Réutiliser les tests DB de versions/idempotence de 3.1 et ajouter ceux de la nouvelle projection, sans réécrire toute la suite.
- **Mesures :** capturer événements → mise à jour DOM et événements → première peinture séparément ; pas de double requestAnimationFrame systématique qui impose artificiellement deux frames. Documenter cache froid/chaud et exécuter les mesures sur les surfaces prévues dans Verification. Une conformité Q6 globale attend le jeu intégré de 3.8. Captures et résultats sous `verification/3-2`, fixtures tracées avant envoi et finaliseurs indépendants ; créneau distant exclusif, aucune donnée préexistante modifiée.

### Organisation au dispatch

L'agent réalise cette seule story sans commit ni changement des statuts/spec. Il peut déléguer UI/cache et backend/projection sur fichiers explicitement disjoints après contrats publiés. Un seul propriétaire des migrations/fixtures puis un seul des recettes navigateur ; cible bmad-crm/Persos/free/otadrkhrjxafutocstzo revalidée, données existantes préservées, manifests et finaliseurs exacts. Garder localhost:3000 actif, Node24 au chemin déjà documenté ; aucun build/push/deploy.

Acquis à conserver de la revue3.1 : listes de relations keyed par contexte pour ne jamais afficher A sous B ; conflits de relations affichant des noms et non UUID ; suppression du blur lors d'Annuler, remise à zéro même après relâchement extérieur/pointercancel. Les tests de ces gestes doivent utiliser une vraie interaction pointeur et non seulement HTMLElement.click(). L'ordre de pages est vérifié contre un oracle indépendant, avec dates égales à la frontière25. Si les scripts historiques Pipeline dépendent de son ancienne table, faire évoluer seulement les sélecteurs nécessaires sans affaiblir leurs assertions métier.

## Spec Change Log

## Review Triage Log

## Verification

Draft documentaire, aucune exécution ou mesure revendiquée. Après clôture 3.1 : TypeScript Node 24 et agent-browser, captures inspectées sur 1440×900/2560×1440, 402×874 et tablette portrait/paysage ; tester drag réel, clavier, blur, retour/avance, réseau et deux onglets. Recette ciblée >25 cartes dans une étape et déplacement entre pages avec total global. Mesurer panneau froid ≤50 ms/chaud ≤16 ms, édition ≤16 ms, réaction visuelle <100 ms ; cibles NFR vues <2 s et sauvegarde <1 s dans 19/20 essais sur jeu convenu, avec version/matériel/navigateur/réseau et chaud/froid consignés. Les mesures globales sur 200 opportunités et 1 000 échanges n’équivalent pas à une preuve si le jeu complet n’est pas encore exécuté. Fixtures exactes, mutations distantes par un seul agent, nettoyage limité au manifeste ; aucune donnée existante effacée, aucun build de développement ou déploiement frontend.
