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
- Fichiers 2.4 présents, à relire après clôture : `lib/validations/exchanges.ts`, `lib/exchanges.ts`, `lib/exchange-date.ts`, `lib/exchanges-drafts.ts`, `lib/exchanges-transport.ts`, `app/actions/exchanges.ts`, `app/api/exchanges/`, `components/exchanges/exchange-editor.tsx`, `exchange-history.tsx`, migrations Échange et `scripts/verify-exchanges*.mjs`. Étendre ces contrats plutôt que créer un moteur parallèle. Les reçus create restent relisibles exactement après ajout update.
- Réutiliser les primitives de domaine introduites par 2.3 et retenues par 2.4 ; lectures/projections communes contact/société. Ne jamais modifier une migration déjà appliquée ni enrichir rétrospectivement un reçu.

## Tasks & Acceptance

- [ ] `supabase/migrations/*_exchange_update.sql`, `lib/validations/exchanges.ts`, `app/actions/exchanges.ts` : ajouter la commande update transactionnelle avec clé idempotente, verrou, versions ciblées et validation des relations propriétaire ; migration additive si nécessaire.
- [ ] `components/exchanges/`, `lib/exchanges-drafts.ts`, `lib/exchanges-transport.ts` : étendre formulaire et brouillons existants au patch et conflit par champ ; conserver identité/création et commande pending initiale.
- [ ] `lib/exchanges.ts`, `components/contacts/contact-editor.tsx`, `components/companies/companies-shell.tsx` et historiques : invalider les projections des anciens et nouveaux contacts/sociétés, y compris lors d’une réponse tardive ; ne pas écraser les brouillons ouverts.
- [ ] `scripts/verify-exchanges-*.mjs` ou recettes correction dédiées : couvrir la matrice, choix mixtes de conflits et changements concurrents indépendants ; revue indépendante avant clôture.

**AC :** Given un échange existant, When une correction confirme, Then le même UUID est relu et le retry n’augmente plus sa révision. Given une société historique corrigée, When les fiches sont relues, Then seules les projections de cet échange changent, pas l’employeur du contact ni les autres échanges. Given le dernier échange d’un contact, When sa date ou son contact change, Then l’ancien contact retrouve son précédent maximum ou l’état vide et le nouveau obtient le bon maximum. Given deux onglets, When un patch périmé est envoyé, Then aucun champ du patch n’est partiellement enregistré et la saisie reste disponible. Given une tentative directe non propriétaire, When lecture ou correction est demandée, Then aucune donnée privée n’est retournée ni modifiée.

## Implementation Notes

Préparation avant clôture2.4 : son editor est actuellement un inline sans formulaire imbriqué sous ficheContact. Le parent compose dirty/save/discard avec contact/société ; toute édition depuis un historique Contact ou Société doit participer à la protection du panneau, pas seulement à son bouton Annuler. Étendre le même moteur aux commandes update, en isolant les brouillons par cible Échange et leurs bases originales. La version2.4 de création reste compatible. Réutiliser résolution Paris, sémantique des notes20000points et nettoyage par reçus. Une couche de composition dédiée à ces nouveaux éditeurs est permise si nécessaire à la fonctionnalité, sans refactorisation générale de l’application.

### Contrat retenu après lecture de 2.4

Commande update : `{operation:"update", command_id, exchange_id, fields, base_versions}`. Le patch est non vide ; les clés des versions sont exactement celles des champs modifiés. `contact_id` reste obligatoire ; `company_id` peut être null. Les métadonnées de lecture et l’identité ne sont pas modifiables. Les commandes create et leurs reçus historiques restent strictement compatibles.

Résultat conflict : état courant et `conflicting_fields` avec message. Résultat success update : état confirmé et `affected: {contact_ids, company_ids}` depuis les relations réelles sous verrou avant/après ; champ optionnel dans le schéma commun pour ne pas réécrire les reçus create. Même verrou de commande et même table de reçus entre opérations, empreinte de commande exacte. Verrouiller ensuite l’échange ; comparer toutes les versions avant écriture ; incrémenter seulement les champs du patch et une seule révision globale. Aucune version de société exigée pour un changement indépendant de contact. Pas de transformation rétroactive des reçus.

Ajouter une lecture unitaire propriétaire `readExchange(id)` et GET `/api/exchanges?id=UUID` pour retrouver une correction déplacée hors de la page courante. Reprendre les projections optionnelles `contact_name` et `company_name`. Après reçu rejoué, revalider l’état actuel et toutes projections concernées ; ne jamais remplacer une révision récente par l’état historique du reçu. Les maxima restent calculés globalement par les RPC.

Brouillons update séparés des create v1, isolés par propriétaire et UUID, valeurs/versions initiales, commande pending immuable et générations par champ (ou équivalent démontré). Un succès avance les bases sans effacer de saisie ultérieure. Conflits : choix local/distant par champ, nouvelle clé et versions fraîchement lues ; conserver les champs indépendants du patch, accepter qu’un second conflit survienne.

La correction apparaît depuis chaque ligne d’historique Contact/Société. Réutiliser les champs et règles du formulaire Échange, avec identifiants DOM propres à la cible pour éviter les doublons. Agréger dirty/busy/save/discard/focus au parent ; ne jamais fermer/abandonner un panneau pendant sa commande. Une erreur annule également toute navigation différée. Préserver les fixes de 2.4 : stockage indisponible ne recharge pas une génération plus ancienne, Entrée dans les champs d’échange ne soumet pas Contact, première erreur focalisée, heures ambiguës affichées avec leur offset.

Migrations additives seulement après `20260908212000_exchanges_read_names.sql`. Le mandat autorise la cible Supabase dédiée après vérification de son identité/plan ; coordonner l’exclusivité DB et navigateur avec le parent. Node 24 disponible à `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin`. Context7 avant utilisation des bibliothèques ; seuls les skills BMAD sont autorisés. Aucun push/build/déploiement ni refactorisation finale.

## Spec Change Log

## Review Triage Log

## Verification

Préalable : 2.4 terminée, relire ses interfaces et preuves ; rattacher les fichiers exacts avant exécution. TypeScript Node 24 ; tests RPC/transport ciblés, puis parcours agent-browser édition, retry, expiration, conflits mixtes, pagination et retour de focus. Rejouer dates Paris et refus serveur de futur ; vérifier révisions et projections en DB. Fixtures isolées avec empreintes et nettoyage exact, exclusivité distante coordonnée par le parent. Consigner mesures et limites sans annoncer une preuve non exécutée.
