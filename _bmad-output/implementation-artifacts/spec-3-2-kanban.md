---
title: 'Terminer le POC réduit Contacts et Pipeline'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
baseline_commit: 243d579651774d1ffccde7e91a8a1993d2fe3516
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
---

## Intent — réduction explicite du 8 septembre

Lilian demande de finir au plus vite pour économiser ses crédits, retirer Sociétés et plusieurs stories. Le parent conserve Contacts + Pipeline et les acquis fonctionnels déjà terminés. Reporter3.3–3.8 (tâches, relances, priorités, liens échanges/opportunités, agrégat société), sans supprimer les données. La spec initiale3.2 est archivée comme superseded, ses objectifs étendus ne bloquent plus ce POC.

## Périmètre réduit

Remplacer la table Pipeline3.1 par un kanban simple cinq étapes. Réutiliser la pagination globale existante25 opportunités/page, son total global et son tri ; chaque colonne annonce uniquement le nombre affiché sur cette page, jamais un faux total global d'étape. Aucune nouvelle RPC, migration ou bibliothèque. Les pages donnent accès à toutes les affaires.

Cartes : titre ouvre le panneau, montant/Notes éditables au clic/blur avec éditeurs montés. Réutiliser le store3.1 et ses protections, pas de deuxième moteur de sauvegarde. Drag simple par poignée, même commande transition, alternative clavier par étapes dans le panneau. Si drag demande une extension risquée, conserver uniquement cette alternative explicite et le consigner. Pas de pagination par colonne, compteur tâche ou chantier de performance.

Le parent retire navigationSociétés et colonne/éditeur Société dans Contacts, et fait de / l'accès au Pipeline. L'agent ne touche PAS ces fichiers. L'agent masque le sélecteur Société du panneau Opportunité, conserve sa valeur existante dans les commandes et retire les liens Société dans son UI ; backend/données historiques conservés. Aucun changement de Notes ou montants historiques.

## Organisation

Arrêter les deux sous-agents précédents : aucune projectionSQL board ni refonte du store à mener. Un seul agent implémente le petit lot UI : components/opportunities/* et app/(dashboard)/pipeline/loading.tsx, script de smoke ciblé si utile. Ne pas modifier spec, statuts ou commit. Node24 et dev3000 existants ; pas de build/push/déploiement. Un seul acteur QA navigateur/fixtures, propriétaire vérifié et nettoyage exact.

Réutiliser les docs Context7 déjà consultées. Une seule revue indépendante ciblée par le parent à la fin remplace les trois boucles BMAD et le plan massif de tests, à la demande explicite d'économie du user. Ne pas ouvrir un sous-agent de plus.

## Tasks & Acceptance

- [x] Kanban cinq colonnes, pagination globale honnête25, titre ouvre panneau.
- [x] Montant/Notes carte partagent le store ; blur unique, saisie conservée en cas d'erreur ; étapes accessibles.
- [x] Société masquée dans le panneau Opportunité, données conservées.
- [x] Smoke réel minimal : création, carte montant/Notes puis reload, étape puis reload, annulation sans écriture, affichage desktop/mobile sans débordement de page. Vérifier le nouveau drag si livré. Une fixture fictive, nettoyée exactement ; pas de rejeu de toutes les suites3.1.

## Verification

TypeScript Node24, contrôle du diff, smoke réel ciblé agent-browser. Une capture desktop et mobile inspectée. Les protections DB déjà validées3.1 sont réutilisées inchangées. Aucune certification Q6, charge ou cible16ms ; aucun déploiement.

## Review Triage Log

Revue indépendante unique du périmètre réduit, diff depuis243d579 et nouveau board lus : aucun défaut bloquant, perte de saisie ou contournement d'authentification identifié. Aucune revue stylistique ni campagne de tests additionnelle. Parent a relu les surfaces modifiées et les gardes carte/panneau.

Choix de réduction : pas de glisser-déposer ; les boutons d'étape de la fiche restent le chemin explicite et accessible. Pagination25 globale, compteurs de colonnes explicitement limités à la page. Ces limites remplacent le backlog étendu, elles ne sont pas présentées comme des fonctionnalités achevées.


### Résultat final

Smoke réel terminé le8septembre16:57UTC :22contrôles passés, `verification/3-2/smoke-results.json` success=true. Création, montant0/Notes sur carte (deux champs/deux commandes), panneau partagé, étape, rechargement, Annuler/Abandonner sans écriture, navigation réduite, Contacts sans Société, desktop/mobile sans débordement. Une fixture fictive, nettoyée exactement ; collect/cleanup/browser tous réussis, manifeste retiré. Captures1440×900 et402×874 inspectées par implémenteur et parent. TypeScript Node24 et diff-check propres ; aucune modification produit après la revue indépendante.

Aucun schéma/API nouveau, aucune campagne exhaustive ou performanceQ6, aucun build/push/déploiement. Les stories3.3–3.8 restent hors périmètre courant.
