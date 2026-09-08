---
title: 'Terminer, reporter et corriger mes prochaines actions'
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

Maintenir une prochaine action fiable : terminer, reporter, annuler et réparer un achèvement erroné depuis l’opportunité ; conserver un historique lisible sans créer une tâche suivante obligatoire.

## Boundaries & Constraints

Terminer une tâche active enregistre un instant d’achèvement serveur et libère la place ; proposer Ajouter la suivante, sans ouvrir de formulaire ni créer automatiquement. Corriger intitulé/date réutilise le dialogue 3.3 et ses validations, échéance `YYYY-MM-DD` sans heure, date passée permise. Annulation confirmée conserve la tâche au statut annulée, sans date d’achèvement ni suppression.

Rétablir uniquement une tâche terminée et seulement en l’absence d’autre active ; retirer la date d’achèvement courante. Ne jamais terminer/annuler/remplacer l’autre active. Les opportunités closes restent compatibles avec une active. Historique repliable des tâches passées : intitulé, échéance, statut, date d’achèvement si terminée ; dix par page, total global, dernier changement de statut décroissant puis UUID décroissant. Rétablir retire la tâche de l’historique des passées et la montre active ; corriger une date/intitulé ne simule pas un changement de statut.

Toutes mutations utilisent les contrôles de 3.3 : propriétaire, Zod/RPC, verrou parent avant tâches, révision de workflow, versions ciblées et reçus idempotents. Conflits atomiques avec saisie conservée ; sérialisation/générations, session et revalidation sans remplacement des brouillons. Aucune fausse confirmation optimiste. Commandes partagées conçues pour Relances sans dépendre de cette vue.

Jamais : restauration d’une annulée, journal de toutes versions/transitions, suppression, tâche automatique, intégration agenda, Relances/Accueil anticipés ou déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Fait | Une active, clic puis retry | Terminée une fois, achèvement serveur stable, place libre | Échec revient au confirmé, aucune tâche inventée |
| Suivante | Terminer puis ignorer/accepter proposition | Ignorer ne crée rien ; accepter ouvre création explicite 3.3 | Formulaire jamais imposé |
| Report/correction | Intitulé/date changés, date passée | Valeurs exactes conservées, statut inchangé | Invalidité/conflit conserve saisie |
| Annulation | Confirmer ou abandonner | Annulée conservée sans achèvement, ou aucun changement | Retry identique ne supprime rien |
| Rétablissement | Terminée sans autre active | Active, achèvement retiré, échéance préservée | Avec autre active : refus sans altérer les deux |
| État interdit | Rétablir annulée, transition invalide directe | Refus serveur clair, aucune mutation | Pas de contournement par HTTP/RPC |
| Courses | Rétablir/créer, terminer/clôturer, annuler/éditer | Workflow/reçus protègent atomicité et unicité | Notes/montant indépendants conservés |
| Historique | >10, égalités de dates, aucune passée | Pagination exhaustive, tri statut/UUID stable, vrai vide | Erreur de lecture ne signifie pas aucun historique |
| Reprise | Perte réseau/expiration durant mutation, nouvelle génération | Rejouer même commande et préserver nouvelle saisie | Cache/brouillon uniquement du propriétaire |

</frozen-after-approval>

## Code Map

- Réels à la lecture : `lib/auth.ts`, `lib/contacts.ts`, `components/auth/session-guard.tsx`, `lib/companies-{cache,drafts,transport}.ts` et `components/companies/company-editor.tsx`. Exemples de fiabilité, pas encore implémentation Tâche.
- À relire au dispatch : fichiers Tâche/RPC/validation introduits par 3.3 (`lib/tasks*`, `app/actions/tasks.ts`, `app/api/tasks/`, `components/tasks/`, migration dédiée proposés) et panneau/cache Opportunité 3.1/3.2. Étendre ces commandes sans deuxième moteur ni nouvelle table d’audit.
- Ajouts proposés : section historique et proposition de suivante sous `components/tasks/`, projection paginée sécurisée dans le service Tâche ; migration additive si fonctions/contraintes doivent évoluer. Aucune interface nommée figée avant lecture de 3.3.
- UI existante : `components/ui/{button,dialog,input,label,skeleton}.tsx`. `collapsible` absent de l’instantané : vérifier l’inventaire puis Context7/shadcn si nécessaire, ne pas le réinventer.

## Tasks & Acceptance

- [ ] Étendre transitions partagées Fait/annuler/rétablir avec règles d’état, horodatage serveur, workflow et reçus.
- [ ] Livrer historique dix par page, modification explicite et proposition facultative Ajouter la suivante ; revalider actif/historique/projections présentes.
- [ ] Vérifier les courses et droits de la matrice, récupération des saisies et cinq parcours après appel mesurés ; revue indépendante avant clôture.

**AC1 :** Given une active, When Fait confirme, Then elle est terminée avec date serveur et la place est libre ; Ajouter la suivante reste facultatif.

**AC2 :** Given une active, When correction ou annulation confirme, Then les commandes partagées conservent jour Paris et statuts distincts ; annuler n’achève ni ne supprime.

**AC3 :** Given une terminée, When Rétablir arrive, Then elle redevient active sans achèvement seulement si aucune autre ne l’est, même face à une création/clôture concurrente.

**AC4 :** Given des passées, When Historique ouvre, Then données, tri et pagination Q4 sont exacts ; aucune restauration d’annulée ni audit de toutes versions.

**AC5 :** Given tâche/montant/Notes/étape après appel, When cinq essais Q6 et R2 sont exécutés, Then valeurs persistent et unicité tient ; seuil sous une minute revendiqué uniquement si mesuré.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni vérification acquise. Au dispatch confirmer 3.3 terminé et interfaces réelles. TypeScript Node 24, tests ciblés transitions/reçus/courses SQL et appels directs ; agent-browser pour Fait, report, annulation, rétablissement refusé/accepté, pagination, clavier et reprise. Exécuter cinq parcours après appel avec bornes Q6, consigner durée par essai, matériel/version/réseau et relecture après recharge, sans extrapoler la compilation. Fixtures exactes et mutation distante sérialisée ; aucun build de développement ni déploiement frontend.
