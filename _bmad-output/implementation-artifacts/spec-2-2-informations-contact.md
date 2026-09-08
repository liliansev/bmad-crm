---
title: 'Compléter les informations et notes de mon contact'
type: 'feature'
created: '2026-09-07'
status: 'done'
route: 'dispatch'
baseline_commit: 'bf7baaf919008f51a2b1367719ea1e3322a1781f'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-2-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/setup-2-2.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Compléter la fiche Contact avec un e-mail, un titre professionnel, un lien LinkedIn et une note libre. Ces champs restent facultatifs, modifiables et effaçables. Retrouver les informations confirmées après rechargement, avec les garanties de saisie de 2.1.

## Boundaries & Constraints

Toujours : propriétaire authentique et RLS ; Ajouter/Enregistrer/Annuler, sans autosave ; fermeture avec Enregistrer/Abandonner/Continuer. E-mail trimé, syntaxe valide, doublon insensible à la casse signalé sans bloquer ni fusionner. LinkedIn accepte une URL absolue HTTP(S), ouverte dans un nouvel onglet protégé ; aucune commande si vide. Notes indépendantes des échanges, sans date d’interaction créée. Ordre de liste : Prénom, Nom, E-mail, Titre professionnel, LinkedIn ; notes seulement dans la fiche.

Jamais : photo, téléphone, e-mails supplémentaires, sociétés, opportunités, enrichissement, envoi de message, suppression ou journal d’échanges. Ne pas casser le client 2.1 déployé, modifier ses reçus historiques ou perdre ses brouillons. Aucun déploiement implicite de 2.2 ; migration additive après contrôle de la cible et recette locale complète.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Informations | Ajouter, corriger ou vider chacun des quatre champs | Valeurs persistées, facultatifs vides acceptés | Erreur associée au champ, saisie intacte |
| E-mail | Format incorrect ou adresse déjà présente, casse différente | Format refusé ; doublon averti avec contacts concernés, sauvegarde permise | Aucun doublon masqué par pagination |
| LinkedIn | HTTP(S), vide, protocole interdit | Lien externe protégé ou aucune action | Format refusé sans perdre le formulaire |
| Notes | Texte multiligne, correction, effacement | Note seule changée, texte brut conservé | Aucun échange artificiel ni contenu journalisé |
| Fiabilité | Offline, réponse perdue/tardive, conflit, reconnexion | Même commande reprise ; champs indépendants compatibles ; génération récente conservée | Choix de conflit par champ, pas d’écrasement |
| Continuité | Client ou brouillon 2.1, reçu ancien | Ancien contrat utilisable, noms et textes conservés | Lecture réelle des nouveaux champs avant raccord |

</frozen-after-approval>

## Code Map

- `lib/validations/contacts.ts`, `lib/contacts.ts`, `app/actions/contacts.ts` : contrats Zod et lectures privées. Le schéma 2.1 est strict, y compris ses deux versions ; préserver son contrat.
- `supabase/migrations/20260907160000_contacts.sql` : migration appliquée, ne pas éditer. RPC à reçu immuable, verrou de commande et versions des noms ; nouvelle migration additive et projection explicite ancienne.
- `lib/contacts-drafts.ts`, `lib/contacts-cache.ts`, `lib/contacts-transport.ts` : génération, commande pending, cache propriétaire et HTTP abortable à réutiliser.
- `components/contacts/`, `components/dashboard-skeleton.tsx` : liste compacte, panneau, conflits et squelette ; étendre les champs avec les mêmes états.

## Tasks & Acceptance

- [x] `supabase/migrations/` : ajouter les quatre champs et leurs versions séparées, RPC 2.2, recherche de doublons privée ; garder les données et le contrat 2.1.
- [x] `lib/validations/contacts.ts`, `lib/contacts.ts`, `app/actions/contacts.ts`, `app/api/contacts/` : contrats 2.2, validations, projection et avertissements exhaustifs ; transport borné adapté aux notes.
- [x] `lib/contacts-drafts.ts`, `lib/contacts-cache.ts`, `lib/contacts-transport.ts` : étendre versions/reprise, importer les brouillons anciens sans altérer une commande en attente.
- [x] `components/contacts/`, `components/ui/textarea.tsx`, `components/dashboard-skeleton.tsx` : champs, erreurs, avertissement et lien ; liste et panneau utilisables au clavier et sur les cinq formats.
- [x] `scripts/verify-contact-details.mjs`, `scripts/verify-contact-details-db.mjs` : couvrir la matrice sur fixtures isolées, versions anciennes/nouvelles, doublon hors page, conservation des données existantes et nettoyage vérifié.

Given un contact 2.1 existant, when ses informations sont complétées puis rechargées, then noms et nouveaux champs restent cohérents. Given une note modifiée, when un autre champ change ailleurs, then les deux changements compatibles sont conservés. Given une erreur ou une session expirée, when la saisie reprend, then aucune valeur ni commande confirmée n’est perdue.

## Implementation Notes

- Lecture et écriture LinkedIn séparées : la projection stockée valide longueur et protocole sûr, sans réappliquer WHATWG/IDNA. Une valeur exotique acceptée en RPC reste lisible et corrigeable dans la fiche. Les commandes et formulaires gardent la validation complète `new URL` ; les liens de la liste et de la fiche sont activables seulement après cette même validation. Une valeur incompatible bloque la sauvegarde jusqu’à correction, avec erreur près du champ.
- Contrats v1 conservés dans `lib/validations/contacts-v1.ts`. Les commandes v2 portent `version: 2` ; elles partagent les reçus et le verrou SQL avec v1. Le transport v1 garde la normalisation historique avant RPC, sans changer la commande pending stockée ni sa clé.
- Stockage additif `details_versions` ; projection v2 fusionnée à six versions. La liste exclut les notes et ne peuple jamais le cache des fiches complètes. Un reçu v1 déclenche une vraie lecture de la fiche v2 avant raccord du brouillon.
- Brouillons `crm:contacts:draft:v2:` versionnés ; import v1 préservant les textes, générations et commandes. Les erreurs de format restent récupérables dans le stockage brut.
- Commandes HTTP limitées à 128 Kio avant accumulation ; doublons transmis par POST privé limité à 4 Kio pour éviter les coordonnées dans les URL. Doublons paginés globalement et non bloquants.
- Choix des conflits par champ ; notes en textarea shadcn, texte brut et limites visibles ; LinkedIn protégé ; focus clavier du textarea ajouté aux règles desktop existantes. Aucun paquet ajouté au bilan.
- `pnpm exec tsc --noEmit` exécuté avec Node 24 le 7 septembre 2026 : propre. Recette et revue finales coordonnées séparément avant clôture.

## Spec Change Log

## Review Triage Log

| Avis | Verdict | Preuve et traitement |
|---|---|---|
| B1 — conflit v1 réancré | high | Le transport remplace toutes les versions par la lecture récente mais conserve seulement les conflits du reçu. Le résolveur garde une saisie locale d’un autre champ et lui donne sa version récente : écrasement possible sans choix. Patch : recalculer les conflits des champs commandés contre la lecture effective. |
| B2 — NUL dans les notes | medium | `bounded` accepte U+0000 ; PostgreSQL JSON/text le refuse. Le transport conserve alors une commande impossible comme indisponible. Patch : validation de champ avant émission, avec conservation du texte corrigeable. |
| B3 — règles URL divergentes | medium | WHATWG accepte espaces/antislashs que le SQL refuse explicitement. Le lien paraît valide avant le refus serveur. Patch direct : appliquer les exclusions SQL dans la validation d’écriture du formulaire et serveur. |
| B4 — refus Auth après reçu v1 | medium | `fetchContact` renvoie bien le statut Auth mais le transport le remplace par indisponible ; le contrôle périodique ne compense qu’après délai. Patch : propager le refus, garder pending et laisser l’éditeur déclencher la reconnexion. |
| B5 — JSON v2 corrompu masque v1 | low | Le catch global court-circuite effectivement le fallback. Les écritures applicatives sont du JSON atomique ; une corruption externe n’est pas un cas quotidien. Rejet : le correctif ajouterait branches et gardes pour cet état exceptionnel. |
| B6 — erreur de saisie hors écran | medium | `trigger()` ne demande pas le focus et la confirmation reste ouverte lors du refus. Les six champs peuvent dépasser la hauteur du panneau. Patch : fermer la confirmation, puis focaliser le premier champ invalide. |
| B7 — focus doublons perdu | medium | Le bouton actif disparaît avec le résultat pendant le chargement. Patch : conserver le focus dans un conteneur stable lors de la pagination et vérifier le chemin clavier. |
| B8 — doublons périmés | medium | Les dépendances n’incluent pas la révision et la relance n’est exposée qu’en erreur. Une modification extérieure n’est pas vérifiable depuis l’avertissement réussi. Patch : rendre la commande existante de revérification accessible après succès et relancer sur révision. |
| B9 — note étire toute la fiche | medium | `field-sizing-content` n’a pas de plafond ; 20 000 caractères peuvent repousser les actions sur une grande hauteur. Patch direct : hauteur maximale et défilement interne du textarea de notes. |
| B10 — version inconnue acceptée | low | Tout `version` différent de 2 est retiré avant Zod et tombe en v1. Les clients courants utilisent absent/2, mais cette frontière introduite doit valider sa version. Patch direct : enum des versions supportées, refus 400 autrement. |
| E1 — NUL ou surrogate isolé | medium | Même défaut que B2, étendu à une séquence UTF-16 mal formée que JSON transmet mais PostgreSQL refuse. Groupe avec B2 : rejeter avant création de commande avec erreur de champ. |
| E2 — dernière page de doublons disparue | medium | Si le total tombe à 25 ou moins sur page 2, le résultat est vide et la pagination disparaît. Patch : ramener à la dernière page existante et relire, comme pour la liste Contacts. |
| V1 — choix mixtes non vérifiés | medium | Gap de recette confirmé par le réviseur : les conflits exercés ne concernent qu’un champ à la fois. Patch recette : deux conflits, un choix local et un distant, préparation bloquée tant qu’un choix manque, puis lecture DB des deux valeurs. |
| V2 — réponses doublons inversées non vérifiées | medium | Gap de recette confirmé : les retards existants concernent les commandes, pas les doublons. Patch recette : réponses réelles A/B livrées B puis A ; l’avertissement doit rester celui de B. |

B2 et E1 partagent une cause et une correction. Les autres entrées restent distinctes. Aucun manque d’intention métier ni modification du bloc figé ; corrections bornées de chemins déjà présents. B5 est rejeté selon la règle BMAD des défauts faibles exceptionnels demandant de nouveaux gardes. Aucun travail différé à ce stade.


## Verification

TypeScript propre (`pnpm exec tsc --noEmit` sous Node 24), recette DB directe puis parcours réels agent-browser. Réutiliser la recette 2.1 pour vérifier la compatibilité, mesurer les durées sans prétendre corriger les limites héritées. Revue indépendante avant clôture ; serveur local maintenu sur http://localhost:3000. Aucun test ne modifie une fiche utilisateur.


### Preuves de la matrice

- Informations / e-mail / LinkedIn / notes : recette DB `verification/2-2/db-results.json` (77 contrôles), UI `verification/2-2/ui-results.json` (126 assertions distinctes, segments archivés). Ajout, correction, effacement, erreurs associées, doublons sur deux pages et conservation après rechargement ont été exécutés.
- Fiabilité / continuité : coupure simulée sur le vrai transport, commit sans réponse, confirmation tardive, modifications concurrentes compatibles ou conflictuelles, reconnexion réelle et import/rejeu v1 avec lecture v2 effective. Chaque résultat attendu est présent et passé dans les segments UI ; aucun code produit n’a changé entre ces segments.
- Contrôles HTTP authentifiés : 19 assertions du supplément, dont limite 128 Kio, limite 4 Kio, origine étrangère, validation serveur du champ et absence de mutation.
- Compatibilité : 50 contrôles DB historiques et 12 contrôles réels sur le client 2.1 hébergé, après migration. Preuves dans `verification/2-2/legacy-db.log` et `verification/2-2/legacy-production/results.json`.
- Cinq captures Chromium inspectées : 1440×900, 2560×1440, 820×1180, 1180×820 et 402×874. Clavier et Escape passés ; zéro violation a11y et zéro erreur navigateur/console relevée. Il s’agit de formats simulés, pas d’une certification Safari/iOS matériel.
- Les essais ne modifient que des fixtures fictives. Nettoyage exact des contacts, reçus et compte Auth de recette vérifié ; empreintes des données préexistantes inchangées. Aucun déploiement 2.2.


### Clôture après revue

Trois couches BMAD exécutées (blind, edge, verification-gap), puis triage individuel des 14 avis ci-dessus. Les corrections retenues ont été appliquées et une relecture indépendante ciblée n’a trouvé aucun défaut résiduel. Aucun travail différé ; le cas faible B5 est explicitement rejeté, sans modifier l’intention approuvée.

Vérification du code final : TypeScript Node 24 propre ; 20 contrôles du vrai transport et des brouillons via réponses HTTP contrôlées (`transport-review-results.json`) ; 43 exigences de recette navigateur après revue (`review/coverage-results.json`), incluant les deux lacunes de couverture. La recette DB a été relancée après ces corrections : 77/77. Accessibilité, erreurs runtime et console après corrections : zéro.

Les preuves UI initiales (126 assertions) et les preuves après revue restent séparées par empreinte produit. Les interruptions de helpers de recette sont conservées en échec dans leurs segments, avec reprise ciblée des étapes restantes ; seuls les contrôles effectivement passés sont cités. Le résultat final exige la couverture complète et un dernier segment réussi. Captures de la note de 20 000 caractères, du focus après erreur et des doublons inspectées par le parent.

Branche locale `codex/2-2-informations-contact`, serveur maintenu sur http://localhost:3000. Migration additive appliquée, mais aucun push ni déploiement du client 2.2. Story 2.3 toujours en backlog.

## Amendement approuvé — 2026-09-08

**Amendement approuvé le 8 septembre 2026 — noms sans chiffres :** toute nouvelle valeur de prénom ou nom transmise à la création ou correction refuse les chiffres décimaux Unicode (Nd), avec erreur près du champ et texte conservé. Accents, espaces, apostrophes, tirets et lettres internationales restent acceptés ; au moins un prénom ou nom après trim, maximum 200 points de code par champ. Les noms historiques non modifiés restent lisibles et ne sont pas nettoyés. Reçus confirmés rejoués sans mutation ; commandes anciennes non confirmées refusées et corrigeables. Validation formulaire, HTTP et RPC v1/v2 ; aucun autre champ modifié.
