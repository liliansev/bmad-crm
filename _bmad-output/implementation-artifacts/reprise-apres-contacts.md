# Point de reprise pour la formation

## Reprise actuelle : démarrage de BMAD 06

BMAD 05 est clôturé techniquement : lire [le bilan vérifié](bilan-bmad-05.md). Lilian a demandé de terminer les contrôles jusqu’au début de BMAD 06. Le code produit de référence est `c8ab921` ; aucun patch des trois constats conservés, aucun push/déploiement. Lire [le point de départ BMAD 06](tournage-bmad-06.md) et commencer par l’inventaire de dette en lecture seule. Ne pas démarrer la story 2.3 ni un refactoring sans le choix prévu pour la leçon. Les sections ci-dessous sont historiques.

## Actualisation après la session 2.2

Le point d’arrêt initial ci-dessous a été levé par « démarrons », puis la spécification 2.2 approuvée par « c’est bon implemente ». La story 2.2 est maintenant implémentée, testée et revue localement sur `codex/2-2-informations-contact` ; lire `spec-2-2-informations-contact.md` et `setup-2-2.md`. Le sprint la place en review selon BMAD. La story 2.3 reste en backlog.

Le client hébergé reste en 2.1. La migration Supabase additive 2.2 est appliquée et sa compatibilité avec le client hébergé a été vérifiée ; aucun push/déploiement 2.2 n’a été effectué. Le serveur local reste http://localhost:3000/contacts. Les sections suivantes conservent le point d’arrêt historique pour la formation.

## Consigne de Lilian du 7 septembre 2026

Terminer et vérifier la story 2.1 « Créer et retrouver un contact sans perdre ma saisie », puis s’arrêter avant toute préparation ou implémentation de la story 2.2 « Compléter les informations et notes de mon contact ». Lilian souhaite démarrer cette prochaine story dans une nouvelle session pour sa formation.

Cette consigne borne l’accélération déléguée. Elle ne demande ni de réinitialiser la base ni de supprimer les contacts, les comptes ou les décisions déjà validées. Ne pas créer automatiquement une nouvelle tâche Codex.

## État livré pour la reprise

- Hébergement 1.3 déployé et vérifié, récupération réelle du mot de passe vérifiée.
- Contacts 2.1 implémentée, revue et testée en local puis en ligne : création, correction, rechargement, brouillon, réessai sans doublon et résolution de conflit. Commit produit `dd110fcc5da9ce22741e3ffb2939380f6ceef638`, Vercel Ready sur cette révision.
- URL : https://bmad-crm.vercel.app/contacts ; serveur local toujours disponible sur http://localhost:3000/contacts. Contact volontairement fictif conservé : Camille Démo / Martin (démo fictive).
- Limite mesurée : ouvertures du panneau au-dessus des cibles 50/16 ms. Sur le passage HTTPS, vue utilisable en 1,81 s et 20 confirmations sous 1 s. Voir setup-2-1 pour les conditions et autres passages.
- Les specs 1.3 et 2.1 sont clôturées techniquement ; le sprint les place en review selon le protocole BMAD, sans démarrer 2.2.
- Story 2.2 conservée en backlog, aucun travail commencé.

## Reprise après clôture de 2.1

Branche locale : `codex/contacts-first-functional`. Le commit local de clôture documentaire suit le commit produit déployé ; il ne change pas le code applicatif.

Lire `sprint-status.yaml`, `spec-2-1-creation-contact.md` et `setup-2-1.md` pour retrouver les preuves et le commit livré. Vérifier l’état Git et le serveur avant toute nouvelle action. Utiliser uniquement les skills BMAD, les décisions déléguées et les sources canoniques du projet.

Prompt de reprise : « Reprenons la formation juste après la story 2.1 d’ajout des contacts. Lis le point de reprise et l’état BMAD, puis accompagne-moi sur la story 2.2, sans recommencer les stories précédentes. »
