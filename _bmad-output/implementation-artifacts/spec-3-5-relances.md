---
title: 'Retrouver et traiter toutes mes relances'
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

Retrouver toutes les tâches à faire et les affaires ouvertes sans prochaine action ; terminer ou reporter une tâche directement dans sa ligne sans dépendre des cinq priorités de l’accueil.

## Boundaries & Constraints

Route Relances accessible directement, quatre rubriques : En retard, À faire aujourd’hui, À venir, Opportunités sans prochaine action. Les trois premières incluent toutes tâches actives, même d’affaires gagnées/perdues, jamais terminées/annulées. Colonnes Fait, intitulé, opportunité ouvrable, étape et échéance. Sans prochaine action : uniquement affaires ouvertes sans active, lien au panneau et ajout explicite via 3.3. Pas de filtre supplémentaire.

Jour métier unique Europe/Paris ; échéances dates sans conversion en instant. En retard strictement avant aujourd’hui ; aujourd’hui jamais en retard. Rubriques de tâches triées échéance, création, UUID croissants ; sans action création puis UUID croissants. Pages explicites de 25 par rubrique, totaux globaux sur tout le périmètre privé ; aucun plafond API silencieux.

Fait et date en ligne utilisent les commandes 3.4 : date enregistrée sur changement validé ou blur, une seule commande par changement, éditeur monté et saisie conservée. Après succès, reclasser/disparaître et proposer éventuellement Ajouter la suivante sans obligation. Pendant commande état visible ; erreur revient aux projections confirmées sans effacer le brouillon, réessai avec même clé si réponse perdue. Aucun succès avant commit.

Créer/terminer/annuler/rétablir une tâche, fermer/réouvrir ou modifier une affaire invalide toutes rubriques affectées. Recalcul commun au minuit Paris, focus, visibilité, retour réseau et reconnexion ; ignorer réponses périmées et préserver brouillons/date en cours. Propriétaire et données/paramètres validés, RLS/RPC et cache privé ; même génération/jour pour lignes et compteurs affichés afin d’éviter une vue incohérente.

Jamais : tâches d’affaires closes masquées, option de filtre, accueil artificiellement rempli, nouvel agenda, suppression ou commande métier dupliquée. Aucun déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Éligibilité | Active passée/aujourd’hui/future sur chaque étape | Une rubrique exacte, closes incluses | Terminées/annulées absentes des actives |
| Sans action | Ouverte/close sans active, ou seulement tâches passées | Ouverte seule listée et ajout accessible | Aucune affaire close comptée |
| Exhaustivité | >25/rubrique, dates/timestamps égaux | Toutes pages accessibles, compteurs globaux, tri date/création/UUID | Aucune limite API implicite |
| Fait | Clic case, double événement, réponse perdue | Commande 3.4 unique/rejouée ; disparition après confirmation | Projection confirmée restaurée sur échec |
| Date | Reporter hier vers demain, aujourd’hui ou passé | Une commande, classement et compteurs recalculés | Date invalide garde texte/brouillon |
| Cycle | Créer/annuler/rétablir, clôturer/réouvrir ailleurs | Rubriques et sans-action corrects après commit | Aucun brouillon effacé par rafraîchissement |
| Temps | Minuit Paris, heure d’été/hiver, focus après veille | Jour recalculé, dates stockées identiques | Aucune tâche du jour classée en retard |
| Navigation | Ouvrir contexte avec date non confirmée | Fermeture/navigation protégée selon Q4 | Échec garde la saisie et possibilité de réessai |
| Incidents | Réponses inversées, hors-ligne, expiration | Anciennes ignorées ; vraie erreur distincte du vide | Aucun mélange de propriétaires/jours |

</frozen-after-approval>

## Code Map

- Réels : `components/dashboard-nav.tsx` contient Accueil/Contacts/Sociétés à la lecture ; `app/(dashboard)/societes/{page,loading}.tsx`, `components/companies/companies-shell.tsx` fournissent route privée, pagination, générations et revalidation ; `lib/auth.ts` protège le propriétaire.
- Réels : `components/ui/{button,table,input,label,sheet,skeleton}.tsx`. Checkbox absent de cet inventaire ; relister et consulter Context7 avant ajout shadcn nécessaire.
- À relire au dispatch : services/commandes Tâche 3.3/3.4, jour Paris commun, panneau/cache Opportunité 3.1/3.2. Les chemins proposés `lib/tasks*`, `components/tasks/`, `components/opportunities/` ne sont pas encore des interfaces existantes.
- Nouveaux proposés : `app/(dashboard)/relances/{page,loading}.tsx`, `components/reminders/`, `lib/reminders.ts` et transport/API de lecture si nécessaire. Projections sécurisées dans le service ou vues SQL sous sécurité appelant ; pas de nouvelle entité métier ni seconde mutation Tâche.

## Tasks & Acceptance

- [ ] Construire lectures/projections globales privées et paramètres paginés validés ; centraliser jour/tri et compter indépendamment des pages.
- [ ] Livrer quatre rubriques compactes, vrai vide/chargement/erreur, liens et édition/Fait sur commandes partagées.
- [ ] Revalider après mutations et événements jour/session/réseau, sans écraser générations ni accepter réponses anciennes.
- [ ] Vérifier exhaustivité SM-002/SM-C02, frontières Paris, pagination et reprise R2 ; revue indépendante avant clôture.

**AC1 :** Given toutes actives, When Relances ouvre directement, Then rubriques exactes incluent les affaires closes avec colonnes, pages de 25 et compteurs globaux ; passées exclues.

**AC2 :** Given affaires sans active, When la quatrième rubrique ouvre, Then seules les ouvertes sont présentes avec panneau/ajout, et tout cycle métier les reclasse après commit.

**AC3 :** Given une ligne, When Fait/date change, Then 3.4 opère sans panneau, une seule commande par changement ; succès reclasse, échec restaure projection et conserve saisie.

**AC4 :** Given minuit/focus/réseau/DST, When la vue se revalide, Then jour Paris, ordre et totaux sont exacts sans modifier dates ni brouillon ; ancien résultat ignoré.

**AC5 :** Given vide/multipages/incidents, When R2 et SM-002/SM-C02 sont exercés, Then toutes échues actives sont accessibles sans faux positif dans En retard, au clavier et tactile.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni résultat acquis. Après clôture 3.3/3.4 : TypeScript, tests ciblés de classement et compteurs, agent-browser sur ligne Fait/date et liens, deux onglets et reprise. Tester jour Paris de part et d’autre de minuit et DST avec horloge contrôlée explicitement documentée ; vérifier dates persistées. Jeu couvrant >25 lignes par rubrique, étapes closes, états passés, cas sans action et égalités. Desktop 1440×900/2560×1440, mobile 402×874/tablette, captures inspectées et rechargement. Mesures Q6 avec version/matériel/réseau ; seuils seulement si exécutés. Fixtures exactes, un seul agent en mutation distante ; aucun build de développement ou déploiement frontend.
