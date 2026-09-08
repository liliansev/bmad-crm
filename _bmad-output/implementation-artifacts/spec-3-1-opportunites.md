---
title: 'Créer une opportunité et la relier à mon contexte'
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

Créer et retrouver une affaire depuis Pipeline, un contact ou une société ; modifier ses informations et ses relations sans imposer de lien ni déplacer l’historique. Livrer l’entité Opportunité et son panneau avant le kanban de 3.2.

## Boundaries & Constraints

Toujours : titre requis après trim ; montant EUR HT et Notes facultatifs ; société et contact principal zéro ou un chacun, indépendants. Depuis un contact, préremplir uniquement le contact ; depuis une société, uniquement la société ; aucun lien depuis Pipeline. Préremplissage visible, modifiable et retirable. Un contact peut être principal de plusieurs affaires. Cinq étapes fixes : À qualifier par défaut, Échange en cours, Proposition envoyée, Gagnée, Perdue ; toutes transitions disponibles depuis la fiche, même réouverture. Les affaires closes restent entièrement éditables.

Montant stocké en centimes entiers exacts et transporté en chaîne entière ; vide distinct de zéro, deux décimales maximum, aucun négatif, flottant ni arrondi silencieux. Une unique colonne Notes, sans création d’échange. Création Ajouter/Annuler ; titre/montant/Notes sauvegardés une fois au blur si modifiés ; liens/étape sur sélection validée. Fermer, sélectionner une autre fiche ou naviguer avec brouillon propose Enregistrer/Abandonner/Continuer ; fermeture seulement après confirmation réussie.

Propriétaire authentique vérifié sur chaque lecture/commande et chaque relation ; Zod, RLS, RPC transactionnelles et reçus idempotents. Patch limité aux champs modifiés avec versions de base ; conflit atomique, indépendance des champs. Révision de cache et révision de workflow distinctes ; mutation d’étape verrouille l’opportunité et incrémente cette dernière, sans Notes/montant. Brouillons propriétaire/entité/champ avec commande et génération ; reprise du même propriétaire, aucune confirmation ne nettoie une génération récente.

Jamais : Tâche avant 3.3, kanban complet avant 3.2, liens Échange/Opportunité avant 3.7, montant gagné agrégé avant 3.8, Description parallèle, date de clôture prévisionnelle, suppression, archivage, recherche, intégration ou déploiement implicite. Les échanges historiques restent rattachés à leurs relations enregistrées. Aucun déplacement rétroactif ni fiche supprimée.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Création minimale | Titre seul | Une affaire À qualifier, liens/montant vides | Titre vide refusé, saisie conservée |
| Montant | Vide, 0, 0,01, 1234,56 | Respectivement null, « 0 », « 1 », « 123456 » centimes ; relecture exacte | Négatif, troisième décimale, exposant ou dépassement du domaine refusés sans arrondi |
| Contexte | Depuis contact A, société B ou Pipeline | Préremplissage du seul lien source, éditable ; Pipeline sans lien | Relation absente/interdite refusée sans écriture partielle |
| Indépendance | Contact de A et société B, puis changement de contact | Liens distincts conservés, aucune société imposée | Aucun déplacement des échanges existants |
| Projections | Ajouter, changer ou retirer société/contact principal | Anciennes et nouvelles fiches et liste Contacts actualisées après commit | Revalidation échouée visible, aucune fausse liste vide |
| Édition | Ouverte, gagnée ou perdue ; blur inchangé/modifié | Tous champs éditables ; zéro/une commande ; cinq étapes accessibles au clavier | Valeur confirmée et brouillon clairement distingués |
| Concurrence | Même champ puis champs différents entre onglets | Même champ en conflit ; patch indépendant accepté sans écraser l’autre | Refus atomique conserve versions et saisie |
| Reprise | Réponse perdue, retry, contenu différent sous même clé | Retry identique rejoué, une création ; autre empreinte refusée | Session expirée conserve brouillon du propriétaire et interdit l’écriture |
| Générations | Modifier durant sauvegarde puis fermeture/navigation | Réponse ancienne n’efface pas nouvelle saisie ; Enregistrer ferme après succès | Échec/conflit garde panneau et saisie |
| Sécurité | Appel HTTP/RPC direct, UUID étranger, écriture table | Aucun accès hors propriétaire ni mutation directe autorisée | Aucune fuite de relation privée |

</frozen-after-approval>

## Code Map

État relu après implémentation de 2.5, revue finale en cours ; confirmer sa clôture au dispatch. Les exemples de contrats ci-dessous sont réels.

- Accès existant : `lib/auth.ts`, `lib/contacts.ts` (`contactsClient`), `lib/supabase/`, `app/actions/companies.ts` et `app/api/companies/command/route.ts`. Suivre la frontière validée puis RPC, sans second mécanisme d’identité.
- Exemples réels : `lib/companies.ts` (`readCompanies`, `readCompany`, `readCompanyContacts`), `lib/validations/companies.ts`, `lib/companies-{cache,drafts,transport}.ts`. Cache créé par shell/propriétaire, déduplication, révisions et générations ; étendre le pattern pour le patch par champ, sans recopier aveuglément le brouillon mono-champ Société.
- Surfaces existantes : `components/contacts/{contacts-shell,contact-editor}.tsx`, `components/companies/{companies-shell,company-editor}.tsx`, `app/(dashboard)/{contacts,societes}/`, `components/dashboard-nav.tsx`. Intégrer création contextuelle et liens ouvrables ; préserver liste Sociétés limitée au nom.
- Composants disponibles : `components/ui/{button,card,dialog,input,label,sheet,skeleton,table,textarea}.tsx`. Inventorier de nouveau et consulter Context7 avant ajout shadcn nécessaire.
- Nouveaux proposés : `lib/validations/opportunities.ts`, `lib/opportunities.ts`, `lib/opportunities-{cache,drafts,transport}.ts`, `app/actions/opportunities.ts`, `app/api/opportunities/`, `components/opportunities/`, `app/(dashboard)/pipeline/{page,loading}.tsx` et migration additive dédiée. Les noms sont une proposition d’implémentation, pas des interfaces déjà présentes.
- Dernière migration actuelle : `supabase/migrations/20260908220000_exchange_update.sql`, appliquée. Contrats Échange réels : `lib/validations/exchanges.ts`, `lib/exchanges-drafts.ts` (acknowledgeExchangeUpdate / revalidateExchangeUpdate), `lib/exchanges-transport.ts`, `components/exchanges/{exchange-editor,exchange-update-editor,exchange-history}.tsx`. Les panneaux Contact/Société composent plusieurs handles dirty/busy/save/discard ; préserver leurs protections lors d’ajout d’une surface Opportunité. Aucun fichier Opportunité ou Tâche n’existe dans cet instantané.

## Tasks & Acceptance

- [ ] Créer l’entité et les seules relations requises ; contraintes/versions, révision de workflow, droits privés, RPC et reçus transactionnels sans nettoyage des reçus existants.
- [ ] Définir conversion décimale exacte partagée et bornes explicites cohérentes UI/Zod/SQL ; titre et Notes suivent les conventions de texte Unicode du projet, sans appliquer l’interdiction des chiffres des noms de contacts.
- [ ] Livrer entrée Pipeline minimale, création contextuelle et panneau éditable ; chargement utile, vrai vide, erreurs, cache et brouillons isolés dès leur apparition.
- [ ] Afficher/ouvrir les opportunités liées dans Contacts et les fiches contact/société ; pagination explicite de 25, totaux globaux, ordre création décroissante puis UUID croissant. La liste Sociétés conserve son contrat.
- [ ] Vérifier matrice complète, rechargement, liens anciens/nouveaux, HTTP/RPC, clavier et reprise ; revue indépendante avant clôture.

**AC1 — Création :** Given un titre valide, When Ajouter est confirmé, Then une seule opportunité À qualifier est relue avec montant exact, Notes et liens facultatifs ; titre vide et montant négatif sont refusés sans perte.

**AC2 — Contexte :** Given contact/société/Pipeline, When le formulaire ouvre puis les liens sont changés, Then seul le contexte source est prélié et rien n’impose la société du contact ; plusieurs opportunités peuvent partager le contact principal.

**AC3 — Édition et relations :** Given toute étape, When un champ/lien/étape est enregistré selon Q4, Then seules les valeurs ciblées changent, les surfaces liées se revalident et l’historique reste inchangé.

**AC4 — Fiabilité et portée :** Given échec/retry/concurrence ou accès interdit, When R2 et les appels directs sont exécutés, Then aucun doublon, écrasement ou fuite n’apparaît ; la story fonctionne sans schéma Tâche et les cinq étapes sont utilisables depuis la fiche.

## Implementation Notes

Contrats arrêtés pendant la réalisation 2.5, à confronter à ses interfaces finales au dispatch :

- Titre : trim identique aux noms Société, 1–200 points de code, chiffres autorisés ; NUL et UTF-16 invalide refusés. Notes : 0–20000 points de code, préserver espaces/sauts de ligne, mêmes refus Unicode.
- Montant : null ou chaîne canonique de centimes de « 0 » à « 9223372036854775807 » inclus. Ce plafond est technique (bigint PostgreSQL signé), pas une borne métier inventée. Saisie décimale après trim, chiffres avec un séparateur virgule ou point, deux décimales au maximum ; refuser exposant, signe négatif, groupements de milliers et troisième décimale. Normaliser zéros initiaux. Conversion en chaînes/BigInt, jamais Number/parseFloat ni arrondi. Toutes projections, commandes et reçus transportent amount_cents en texte SQL explicite : to_jsonb(bigint) seul produit un nombre JSON imprécis. Future somme3.8 également en chaîne, sans plafond individuel.
- Create : `{operation:"create",command_id,fields:{title,amount_cents,notes,company_id,primary_contact_id}}`. Étape qualifying, revision=1, workflow_revision=1, versions champs=1.
- Update : `{operation:"update",command_id,opportunity_id,fields,base_versions}` ; patch non vide et clés exactes communes. Exclure stage de ce patch ordinaire : aucun chemin parallèle ne doit contourner les futurs choix de clôture.
- Transition : `{operation:"transition",command_id,opportunity_id,stage,base_workflow_revision}`. Fiche et futur kanban utiliseront ce même chemin. Vérifier la version de workflow sous verrou dès 3.1 ; toutes transitions possibles. Seul changement d’étape incrémente workflow_revision ; titre/montant/Notes/liens incrémentent uniquement révision générale et versions concernées. Étape inchangée sélectionnée ne doit pas déclencher de commande inutile.
- Toutes commandes partagent propriétaire/vérification des relations, verrou parent et reçu idempotent/empreinte. Préserver les reçus historiques immuables et ne pas appliquer un résultat historique plus ancien sur un cache récent.
- Compatibilité future, sans schéma Tâche anticipé : 3.3/3.4 feront incrémenter workflow_revision pour toutes mutations de tâche sous le même verrou parent. Une ancienne transition sans choix sera refusée lorsqu’une tâche active exige Conserver/Annuler. Choix explicite, nouvelle clé et révision de workflow affichée. Réouverture ne restaure aucune tâche.


### Fiabilité de l’édition en place

Relire les correctifs finaux2.5 avant de réutiliser les patrons. Une nouvelle saisie pendant pending conserve sa base observée : reçu confirmé pour champ envoyé, base initiale pour un champ indépendant ; jamais la relecture distante ultérieure comme acceptation implicite d’une modification tierce. Le choix local d’un conflit reste appliqué même si le texte est revenu à sa valeur initiale. Échec d’effacement de brouillon doit rester visible et bloquer un abandon prétendument accompli ; busy de plusieurs éditeurs se compose sans qu’un finally de l’un réactive les contrôles de l’autre.

Le blur d’un champ modifié envoie ce champ une seule fois, avec sa base/version ; sérialiser les commandes du même champ. Les commandes indépendantes et leurs réponses peuvent arriver dans un ordre différent : préserver toutes générations récentes et empêcher l’écrasement d’un cache récent par un reçu ancien. Le futur kanban doit consommer le même état confirmé/brouillon/file que le panneau, sans second propriétaire d’une saisie du même champ. Préparer cette composition dès3.1, tout en laissant le rendu du kanban à3.2.

## Spec Change Log

## Review Triage Log

## Verification

Préparation documentaire uniquement : aucune migration, recette ou performance exécutée par cette spec. Au dispatch confirmer clôture epic 2 et identité/cible Supabase selon mandat ; un seul agent effectue les mutations distantes. TypeScript Node 24, tests ciblés conversion/versions/idempotence/droits et parcours agent-browser réels avec captures inspectées ; valeurs relues après rechargement. Fixtures nominatives avec empreintes avant/après et nettoyage exact. Vérifier desktop 1440×900/2560×1440, mobile 402×874, tablette portrait/paysage, focus/Échap et absence de scroll horizontal de page. Mesurer ouverture panneau ≤50 ms à froid/≤16 ms à chaud et réaction d’édition ≤16 ms ; ne pas annoncer de mesure non effectuée. Aucun build pendant développement ni livraison frontend implicite.
