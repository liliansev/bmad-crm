---
title: 'Corriger un échange sans déformer son historique'
type: 'feature'
created: '2026-09-08'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-2-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/mandat-v1-avant-bmad06.md
---

<frozen-after-approval reason="human-owned intent — décisions déléguées et mandat du 8 septembre">

## Intent

Corriger date, canal, notes, contact et société historique d’un échange existant. Retrouver des historiques et dernières interactions recalculés après correction, sans créer un nouvel échange ou altérer d’autres relations.

## Boundaries & Constraints

Toujours : mêmes validations date/Paris/DST, canal et texte qu’en 2.4 ; un contact obligatoire dans cet epic, société historique facultative. Correction explicite ; modifier le contact ne réécrit pas implicitement la société historique déjà enregistrée. Patch des seuls champs modifiés et leurs versions initiales ; contrôles atomiques sur les états nécessaires. Conflit ciblé sans mutation partielle, choix local/distant explicite ; champs indépendants compatibles.

Enregistrer/Annuler, brouillon propriétaire, commande idempotente et générations ; fermeture protégée. Recalculer anciennes et nouvelles projections après commit, y compris vers un échange précédent ou aucun échange. Garder création et UUID de l’échange : tri par instant, création, UUID décroissants.

Jamais : suppression, archivage, restauration, audit de toutes les versions, mutation de société actuelle du contact ou déplacement des autres échanges. Ne pas casser commandes et reçus de création 2.4. Aucune opportunité créée par anticipation, aucun déploiement ou refactorisation finale.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Correction | Date/canal/notes valides ou notes effacées | Même échange relu, seuls champs ciblés changés | Erreur ciblée, saisie gardée |
| Relations | Contact A → B ; société X → Y → aucune | Historique retiré/ajouté explicitement, autres fiches intactes | Contact vide/interdit refusé |
| Dernier | Date reculée ou lien changé | Maximum global recalculé, ancien ou vide | Indépendant de la page |
| Concurrence | Même champ changé ailleurs | Conflit sans écriture partielle | Nouvelle version requise au remplacement |
| Indépendance | Notes et date modifiées séparément | Deux corrections compatibles | Pas de conflit global artificiel |
| Reprise | Réponse perdue, expiration ou saisie ultérieure | Résultat rejoué sans deuxième mutation | Brouillon et génération conservés |

</frozen-after-approval>

## Code Map

- Références existantes : `lib/contacts-drafts.ts` et `components/contacts/contact-editor.tsx` pour générations/choix de conflit ; ne pas refactoriser leur implémentation.
- Prévus en 2.4, noms à confirmer au dispatch : `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/`, `components/exchanges/`, migration Échange et `scripts/verify-exchanges*.mjs`. Étendre leurs contrats plutôt que créer un moteur parallèle.
- Réutiliser les primitives de domaine introduites par 2.3 et retenues par 2.4 ; lectures/projections communes contact/société. Ne jamais modifier une migration déjà appliquée ni enrichir rétrospectivement un reçu.

## Tasks & Acceptance

- [ ] Ajouter la commande update transactionnelle avec clé idempotente, verrou, versions ciblées et validation des relations propriétaire ; migration additive si nécessaire.
- [ ] Étendre formulaire et brouillons existants au patch et conflit par champ ; conserver identité/création et commande pending initiale.
- [ ] Invalider les projections des anciens et nouveaux contacts/sociétés, y compris lors d’une réponse tardive ; ne pas écraser les brouillons ouverts.
- [ ] Couvrir la matrice, choix mixtes de conflits et changements concurrents indépendants ; revue indépendante avant clôture.

**AC :** Given un échange existant, When une correction confirme, Then le même UUID est relu et le retry n’augmente plus sa révision. Given une société historique corrigée, When les fiches sont relues, Then seules les projections de cet échange changent, pas l’employeur du contact ni les autres échanges. Given le dernier échange d’un contact, When sa date ou son contact change, Then l’ancien contact retrouve son précédent maximum ou l’état vide et le nouveau obtient le bon maximum. Given deux onglets, When un patch périmé est envoyé, Then aucun champ du patch n’est partiellement enregistré et la saisie reste disponible. Given une tentative directe non propriétaire, When lecture ou correction est demandée, Then aucune donnée privée n’est retournée ni modifiée.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

Préalable : 2.4 terminée, relire ses interfaces et preuves ; rattacher les fichiers exacts avant exécution. TypeScript Node 24 ; tests RPC/transport ciblés, puis parcours agent-browser édition, retry, expiration, conflits mixtes, pagination et retour de focus. Rejouer dates Paris et refus serveur de futur ; vérifier révisions et projections en DB. Fixtures isolées avec empreintes et nettoyage exact, exclusivité distante coordonnée par le parent. Consigner mesures et limites sans annoncer une preuve non exécutée.
