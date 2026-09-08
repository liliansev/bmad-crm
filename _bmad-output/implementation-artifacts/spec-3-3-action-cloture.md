---
title: 'Programmer une action et clôturer une opportunité sans incohérence'
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

Programmer une seule prochaine action par opportunité et choisir explicitement son devenir lors de la clôture, sans annulation ou achèvement involontaire.

## Boundaries & Constraints

Introduire Tâche seulement ici, avec intitulé requis après trim, échéance requise de type `date`/`YYYY-MM-DD` et statut à faire/terminée/annulée. Nouvelle action : intitulé initial vide, date préremplie aujourd’hui Europe/Paris, visible et modifiable vers le passé ; Ajouter/Annuler. L’opportunité du contexte reste fixe, ouverte ou close. Afficher la tâche active dans son panneau, modifier intitulé/date par dialogue Enregistrer/Annuler ; pas d’autosave par frappe.

Au plus une tâche active par opportunité, même gagnée/perdue : verrouiller le parent avant les tâches dans un ordre stable et index unique partiel. Étape et tâche relèvent de la même révision de workflow ; chaque mutation de tâche/étape l’incrémente, les Notes/montant n’y touchent pas. Clôture avec tâche active depuis toutes entrées : Conserver la tâche / Annuler la tâche / Abandonner, sans choix par défaut. Conserver/annuler effectue une seule transaction contrôlée ; abandon ne modifie rien, annuler ne termine jamais. Réouverture ne réactive aucune tâche.

Commandes propriétaires validées Zod/RPC, RLS et permissions minimales ; vérifier propriétaire de la tâche et du parent. Clé idempotente, empreinte et reçu conservés ; même clé/contenu rejoué sans doublon, autre contenu refusé. Conflit atomique, brouillon et versions d’origine préservés ; générations récentes protégées lors de fermeture/reconnexion. Succès uniquement après commit ; si la réponse se perd, conserver la commande pour réessai et ne pas prétendre que son abandon annule un commit.

Ne pas livrer création de tâche avant protection de toutes les commandes d’étape, y compris HTTP/RPC directes et anciens contrats. Terminer/rétablir et historique viennent en 3.4 ; Relances/Accueil ensuite. Aucun agenda, rappel externe, suppression, restauration d’annulée ou déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Création | Opportunité ouverte/close, titre, date passée/du jour/future | Une tâche active liée, date identique relue sans heure | Champs vides/date impossible refusés avec saisie conservée |
| Double création | Deux commandes simultanées sur le même parent | Une seule active, autre conflit/refus sans écriture partielle | Aucun contournement HTTP/RPC/table |
| Édition | Intitulé/date corrigés puis Enregistrer/Annuler | Patch validé ou aucune mutation ; une seule tâche | Conflit conserve brouillon et état confirmé |
| Clôture | Gagnée/Perdue avec tâche active | Choix obligatoire, conserver/annuler atomique | Absence de choix refusée côté serveur |
| Abandon | Dialogue de clôture quitté | Étape/tâche inchangées | Une réponse perdue reste une commande non confirmée à réconcilier |
| Concurrence | Tâche créée/modifiée ou étape changée après ouverture | Révision workflow obsolète : refus de toute clôture | Notes/montant indépendants ne bloquent pas la clôture |
| Réouverture | Opportunité close avec tâche annulée/terminée | Aucun statut de tâche réactivé | Pas de tâche automatique |
| Reprise | Retry identique, clé réutilisée autrement, expiration | Reçu rejoué ou refus, même propriétaire uniquement | Aucune perte de génération ou fausse confirmation |
| Navigation | Fermer formulaire avec saisie non confirmée | Enregistrer/Abandonner/Continuer ; fermeture après succès seulement | Échec conserve dialogue et focus utilisable |

</frozen-after-approval>

## Code Map

Instantané documentaire du 8 septembre ; dépendances 3.1/3.2 non implémentées à cette lecture, à relire impérativement au dispatch.

- Réels : `lib/auth.ts`, `lib/contacts.ts`, `app/actions/companies.ts`, `app/api/companies/command/route.ts`, `lib/validations/companies.ts` et migration `supabase/migrations/20260908200000_companies.sql` montrent accès privé, validation et RPC ; préserver les reçus existants.
- Réels : `components/companies/company-editor.tsx`, `lib/companies-drafts.ts`, `components/auth/session-guard.tsx` pour fermeture et reprise ; ne pas supposer le brouillon mono-champ adapté sans extension ciblée.
- À relire après 3.1/3.2 : service/commande d’étape Opportunité, révision de workflow, cache, brouillons, panneau et cartes sous les chemins proposés `lib/opportunities*`, `components/opportunities/` et `app/api/opportunities/`. Aucun de ces contrats n’est fixé ici.
- Nouveaux proposés : `lib/validations/tasks.ts`, `lib/tasks.ts`, `lib/tasks-{drafts,transport}.ts`, `app/actions/tasks.ts`, `app/api/tasks/`, `components/tasks/`, migration additive Tâche et extension atomique des commandes d’étape. Partager un utilitaire de jour Paris utilisable plus tard par Relances/Accueil.
- UI existante : `components/ui/{button,dialog,input,label,sheet,skeleton}.tsx`. Inventaire et Context7 avant ajout de primitive nécessaire ; aucun composant standard réinventé.

## Tasks & Acceptance

- [ ] Introduire schéma Tâche, contraintes, droits/RLS, index unique, reçus et verrouillage parent ; sécuriser toutes les entrées d’étape dans la même livraison.
- [ ] Livrer dialogues d’ajout/édition/clôture et tâche active ; validation de dates sans conversion en instant, erreurs/brouillons et générations conservés.
- [ ] Invalider panneau/cartes et projections présentes après commit ; réessai exact et revalidation focus/réseau/reconnexion.
- [ ] Tester les courses et contournements directs de la matrice, puis revue indépendante avant clôture.

**AC1 :** Given une opportunité sans action, When Ajouter est confirmé, Then une seule action avec intitulé/date requis existe, même si l’affaire est close ou l’échéance passée.

**AC2 :** Given deux créations concurrentes, When elles arrivent, Then verrou parent et index garantissent une active au maximum ; le refus préserve la saisie et le retry ne duplique rien.

**AC3 :** Given une action active, When Gagnée/Perdue est demandé depuis fiche ou kanban, Then choix explicite obligatoire, étape et conservation/annulation atomiques ; abandon ne change rien.

**AC4 :** Given un workflow modifié concurremment, When la clôture est confirmée, Then conflit global sans écrasement ; Notes indépendantes ne bloquent pas, réouverture ne réactive rien.

**AC5 :** Given tous les points d’entrée, When R2 est exécuté puis rechargé, Then unicité, choix de clôture, édition et persistance tiennent sans contournement.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni preuve d’exécution. Confirmer clôture 3.1/3.2 au dispatch ; TypeScript Node 24, tests ciblés SQL/HTTP/RPC d’unicité, concurrence, ancien contrat et reçus ; parcours agent-browser réel clavier/tactile, captures inspectées et relecture après recharge. Tester dates Paris autour de minuit/DST sans heure stockée. Fixtures nominatives et nettoyage exact selon mandat ; un seul agent réalise les mutations distantes. Aucun build pendant développement ni déploiement frontend.
