---
title: 'Voir jusqu’à cinq priorités à l’ouverture'
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

Afficher à l’ouverture les prochaines actions qui méritent attention, jusqu’à cinq, avec accès au contexte et à toutes les relances. Une sélection courte ne signifie pas que tout le travail est terminé.

## Boundaries & Constraints

Éligibles : seulement tâches à faire d’opportunités ouvertes. Zéro à cinq lignes affichant tâche, opportunité, étape et échéance. Affaires gagnées/perdues exclues d’Accueil, tâches conservées dans Relances. Aucun score, rendez-vous agenda, Fait/report en ligne ou remplissage artificiel.

Classement global Q1 avant limite : premier groupe = dates passées et aujourd’hui Paris ensemble ; Proposition envoyée avant Échange en cours avant À qualifier, puis échéance, création de tâche, UUID croissants. Retard n’est pas un groupe prioritaire distinct d’aujourd’hui. Compléter si moins de cinq avec futures par échéance croissante, puis même ordre d’étapes, création et UUID croissants. Ne pas limiter une première page de Relances pour produire ce classement.

Jour Europe/Paris commun à Relances, échéances dates sans heure. Recalcul après confirmation de création, achèvement, report, annulation/rétablissement et changement d’étape ; minuit Paris/focus/visibilité/retour réseau/reconnexion également. Cache propriétaire isolé, réponses périmées ignorées ; session propriétaire et projection validées côté serveur. Erreur de lecture distincte d’un accueil vide, loading aux dimensions finales, aucune confirmation fictive.

Clic sur une opportunité ouvre son panneau avec contexte ; Voir toutes les relances mène à la vue exhaustive, y compris depuis le vide. Panneau et brouillons réutilisent les commandes/patterns existants, sans nouveau moteur de mutation ni écrasement de saisie. Composition compacte approuvée, clavier/tactile et focus cohérents.

Jamais : priorité numérique inventée, revenu agrégé anticipé, intégration agenda, nouvelles options de filtre, dépendance à 3.7/3.8 ou déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Cardinalité | 0, 1, 5, >5 actives éligibles | Exactement min(5, éligibles), aucun remplissage | Erreur jamais présentée comme zéro |
| Premier groupe | En retard À qualifier et aujourd’hui Proposition envoyée | Proposition envoyée avant À qualifier ; date départage après étape | Pas de priorité absolue du retard |
| Complément | <5 échues/du jour, futures variées | Futures par date puis étape, création/UUID | Aucune future avant le premier groupe |
| Égalités | Dates/créations identiques, >25 candidates | Départage UUID global stable avant limite cinq | Pas de sélection depuis une page tronquée |
| Exclusion | Active sur gagnée/perdue, terminée/annulée sur ouverte | Aucune dans Accueil ; actives closes accessibles dans Relances | Aucun score/date factice |
| Mise à jour | Fait/report/étape/annulation/rétablissement ailleurs | Sélection recalculée après commit | Réponse périmée n’écrase pas le classement récent |
| Temps | Minuit Paris, veille puis focus, DST | Libellés et groupes corrects, dates inchangées | Aujourd’hui jamais indiqué en retard |
| Navigation | Clic opportunité, lien toutes relances, brouillon panneau | Contexte/panneau et Q4 conservés, accès exhaustif | Pas de nouvelle édition Fait/report sur Accueil |
| Session/réseau | Expiration, reconnexion, erreur lecture | Protection propriétaire, reprise et réessai explicites | Aucun cache privé partagé |

</frozen-after-approval>

## Code Map

- Réels : `app/(dashboard)/page.tsx` est actuellement un accueil privé informatif avec `requireOwner` et Card ; `app/(dashboard)/loading.tsx` emploie `HomeSkeleton` de `components/dashboard-skeleton.tsx`. Remplacer contenu/skeleton par la surface métier après lecture au dispatch.
- Réels : `components/dashboard-nav.tsx`, `lib/auth.ts`, `components/auth/session-guard.tsx`, `components/companies/companies-shell.tsx` et caches Contacts/Sociétés pour conventions de navigation/session/revalidation.
- À relire après 3.5 : service de jour Paris, projections Tâche/Relances, invalidations et panneau Opportunité introduits 3.1–3.5 ; ils n’existent pas dans l’instantané documentaire. Réutiliser la même politique de dates, pas un deuxième calcul local indépendant.
- Nouveaux proposés : `lib/priorities.ts`, `components/priorities/` et lecture/transport sécurisé si requis ; projection serveur globale triée puis limitée à cinq. Pas de nouvelle table ni commande de tâche ; fonctions/index additifs seulement si nécessaires.
- UI disponible : `components/ui/{button,card,sheet,skeleton,table}.tsx`. Inventaire à relire et Context7 avant usage/ajout de bibliothèque.

## Tasks & Acceptance

- [ ] Définir sélection globale déterministe Q1 et contrat validé, en réutilisant dates/accès privés existants.
- [ ] Livrer zéro à cinq lignes, loading/vide/erreur honnêtes, panneau et lien Relances ; aucune nouvelle édition d’action sur l’accueil.
- [ ] Relier invalidations et recalcul temporel commun, ignorer réponses périmées et préserver brouillons du panneau.
- [ ] Vérifier cas de cardinalité/tri/cycles, parcours reprise du matin et R2 ; revue indépendante avant clôture.

**AC1 :** Given actives ouvertes/closes, When Accueil ouvre après connexion, Then zéro à cinq actives ouvertes seules apparaissent, les closes restant dans Relances.

**AC2 :** Given échues et du jour, When cinq places sont attribuées, Then étape puis date/création/UUID ordonnent le groupe et tout excédent reste accessible dans Relances.

**AC3 :** Given moins de cinq dans ce groupe, When sélection complète, Then futures sont classées date puis étape/création/UUID sans remplissage fictif.

**AC4 :** Given sélection visible, When commande confirmée ou jour/focus/réseau change, Then classement et libellés sont recalculés sans réponse obsolète.

**AC5 :** Given accueil vide/rempli, When opportunité/lien Relances est activé, Then contexte/vue complète s’ouvre et R2/reprise du matin est vérifié, sans Fait/report ajouté ici.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni preuve d’exécution. Au dispatch vérifier clôture 3.5 et code des dépendances. TypeScript et tests ciblés de classement global (dont contre-exemple retard/aujourd’hui et candidates au-delà de 25) ; agent-browser réel sur accueil après connexion, panneau, lien Relances, mutation depuis autre onglet et retour au focus. Tester minuit/DST Paris avec méthode de contrôle consignée. Recette matin, desktop/mobile/tablette, captures inspectées et persistance ; mesurer les cibles Q6 sans déclarer de résultat non exécuté. Fixtures exactes, mutation distante sérialisée ; aucun build de développement ni déploiement frontend.
