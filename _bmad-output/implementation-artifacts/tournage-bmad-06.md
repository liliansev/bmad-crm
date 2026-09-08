# BMAD 06 — Reprise sur le POC réduit

Périmètre réduit le8septembre à la demande de Lilian pour économiser temps et crédits. Le POC Contacts + Pipeline est vérifié localement et prêt pour la reprise de la vidéo06 avant refactorisation et déploiement.

## Périmètre du tournage

- Contacts : création, informations/Notes, protection des noms sans chiffres, échanges déjà livrés.
- Pipeline : opportunités, montant exact, Notes, cinq étapes ; kanban simple avec pagination globale25.
- Sociétés : accès retiré ; données historiques et code sous-jacent préservés.
- Reporté : tâches et clôture associée, Relances, cinq priorités, échanges liés aux opportunités et montant gagné Société (stories3.3–3.8). Ne pas les présenter comme implémentés.

## Arrêt prévu

Reprendre avant l'inventaire de dette et la refactorisation choisis pour la vidéo, puis build de livraison et déploiement explicitement autorisé. Aucun de ces travaux n'est lancé automatiquement. Le dernier client hébergé est antérieur au code local ; relire l'état exact avant livraison. Supabase a reçu les migrations additives des stories déjà terminées ; ne pas les rejouer, réconcilier le registre comme indiqué dans deferred-work.md.

Pour démarrer le tournage : « Le POC Contacts + Pipeline est notre périmètre. Utilise uniquement BMAD. Fais d'abord un inventaire de dette en lecture seule et propose le plus petit lot de refactorisation utile ; ne déploie rien sans mon instruction. »

## Vérification finale

TypeScript Node24 et diff-check propres ; revue indépendante ciblée sans défaut bloquant. Smoke agent-browser22contrôles réussis : création, montant/Notes carte et panneau, changement d’étape, persistance après reload, annulation sans écriture, navigation et Contacts sans Société. Captures desktop/mobile inspectées ; fixture nettoyée, navigateur fermé. Preuve locale : verification/3-2/smoke-results.json.

Limites assumées : changement d’étape depuis la fiche (pas de glisser-déposer), pagination globale25 avec compteurs de colonnes limités à la page. Les mesures de chargeQ6 et l’objectif16ms ne sont pas certifiés. Les preuves historiques restent dans les specs. Le serveur local reste disponible sur http://localhost:3000/pipeline.
