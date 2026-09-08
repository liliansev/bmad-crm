# BMAD 06 — Point de départ du tournage

Préparé le 8 septembre 2026 à partir de [la leçon Notion](https://app.notion.com/p/3ce5d2efba7f81f38e1be514e6cc311f), consultée à cette date. Arrêt au démarrage : inventaire de dette, refactoring, build de livraison et déploiement restent à faire pendant BMAD 06.

## État disponible

- Code produit `c8ab921`, branche `codex/contacts-noms-sans-chiffres`.
- Application locale : http://localhost:3000/contacts ; serveur conservé actif.
- Contacts : création, édition des noms/email/titre/LinkedIn/notes, reprise de saisie, protection des noms sans chiffres et des données historiques.
- [Bilan BMAD 05](bilan-bmad-05.md) : TypeScript, 52 contrôles transport, 124 DB, 309 assertions UI/HTTP et 18 contrôles d’accès complémentaires réussis. Secrets et limites documentés.
- [Revue du commit](spec-contact-noms-sans-chiffres.md) : trois actions ouvertes conservées par décision humaine. [Autres limites](deferred-work.md).
- Dernier client hébergé connu plus ancien que le code local ; état production exact à relire avant livraison, pas de promesse de déploiement actuel.

BMAD 06 est un épisode de formation, pas le nom d’un skill. Seuls les skills BMAD sont autorisés. `bmad-help` oriente ; après inventaire et choix humain, `bmad-build` peut traiter le lot de maintenance, puis revue BMAD si utile. Préférer une nouvelle conversation pour la reprise, sans la créer automatiquement.

## Premier prompt à lancer à l’écran

> Analyse le dépôt et l’historique récent. Liste la dette technique observée, avec une preuve pour chaque point. Classe-la par risque utilisateur, risque de sécurité, coût de maintenance et effort. Prends en compte les constats conservés dans la revue du commit c8ab921 et deferred-work.md, sans considérer leur correction comme déjà approuvée. Ne modifie encore aucun fichier. Seuls les skills BMAD sont autorisés.

## Adapter la leçon au dépôt réel

Le scénario à livrer est connexion → création d’un contact → édition → rechargement → refus d’un visiteur et d’un compte non propriétaire. Les prochaines actions et relances du script général ne sont pas encore implémentées : ne pas les créer pour remplir la vidéo. Story 2.3 et suivantes restent en backlog.

Le dépôt n’a pas de `pnpm test` ou `pnpm lint` génériques : utiliser `pnpm typecheck`, `pnpm verify:contacts:transport`, puis les recettes DB/UI pertinentes successivement, et `git diff --check`. Les scripts utilisent Node 24 ; sur ce Mac le binaire vérifié est `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin`. Les recettes distantes ont besoin des secrets QA privés et du helper local ; ne rien afficher de `.local` pendant le tournage.

## Déroulé restant pour BMAD 06

1. Inventaire en lecture seule et choix d’un petit lot ; aucune correction des trois constats n’est automatiquement validée.
2. Plan de refactoring, validation humaine, lots avec vérifications et commits distincts.
3. Préparation de livraison à partir du dépôt réel : build, variables présentes sans valeurs affichées, migrations appliquées/en attente, configuration auth, cible et plan Vercel/Supabase.
4. Vérification Git/remote/branche exacte et stratégie de retour arrière. Les migrations sont additives mais la base distante est partagée avec la version hébergée : ne pas les réappliquer aveuglément.
5. Livraison explicitement autorisée au moment prévu ; suivre le déploiement jusqu’à Ready.
6. Rejouer le parcours contacts et les refus d’accès sur l’URL de production ; ne dire « déployé et vérifié » qu’après cette preuve.

Ne pas lancer de build pendant le développement ni tuer le serveur pour préparer cette reprise. Aucun push, déploiement ou travail de la prochaine story n’a été effectué pour ce point de départ. Aucun statut Notion de tournage n’est changé automatiquement.
