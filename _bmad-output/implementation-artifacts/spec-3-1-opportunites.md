---
title: 'Créer une opportunité et la relier à mon contexte'
type: 'feature'
created: '2026-09-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: a49853d99deb4295ba79e717a94d9e3a3e22b0fd
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

État relu après clôture 2.5, commit a49853d ; sa revue et les corrections ont passé. Les exemples de contrats ci-dessous sont réels.

- Accès existant : `lib/auth.ts`, `lib/contacts.ts` (`contactsClient`), `lib/supabase/`, `app/actions/companies.ts` et `app/api/companies/command/route.ts`. Suivre la frontière validée puis RPC, sans second mécanisme d’identité.
- Exemples réels : `lib/companies.ts` (`readCompanies`, `readCompany`, `readCompanyContacts`), `lib/validations/companies.ts`, `lib/companies-{cache,drafts,transport}.ts`. Cache créé par shell/propriétaire, déduplication, révisions et générations ; étendre le pattern pour le patch par champ, sans recopier aveuglément le brouillon mono-champ Société.
- Surfaces existantes : `components/contacts/{contacts-shell,contact-editor}.tsx`, `components/companies/{companies-shell,company-editor}.tsx`, `app/(dashboard)/{contacts,societes}/`, `components/dashboard-nav.tsx`. Intégrer création contextuelle et liens ouvrables ; préserver liste Sociétés limitée au nom.
- Composants disponibles : `components/ui/{button,card,dialog,input,label,sheet,skeleton,table,textarea}.tsx`. Inventorier de nouveau et consulter Context7 avant ajout shadcn nécessaire.
- Nouveaux proposés : `lib/validations/opportunities.ts`, `lib/opportunities.ts`, `lib/opportunities-{cache,drafts,transport}.ts`, `app/actions/opportunities.ts`, `app/api/opportunities/`, `components/opportunities/`, `app/(dashboard)/pipeline/{page,loading}.tsx` et migration additive dédiée. Les noms sont une proposition d’implémentation, pas des interfaces déjà présentes.
- Dernière migration actuelle : `supabase/migrations/20260908220000_exchange_update.sql`, appliquée. Contrats Échange réels : `lib/validations/exchanges.ts`, `lib/exchanges-drafts.ts` (acknowledgeExchangeUpdate / revalidateExchangeUpdate), `lib/exchanges-transport.ts`, `components/exchanges/{exchange-editor,exchange-update-editor,exchange-history}.tsx`. Les panneaux Contact/Société composent plusieurs handles dirty/busy/save/discard ; préserver leurs protections lors d’ajout d’une surface Opportunité. Aucun fichier Opportunité ou Tâche n’existe dans cet instantané.

## Tasks & Acceptance

- [x] Créer l’entité et les seules relations requises ; contraintes/versions, révision de workflow, droits privés, RPC et reçus transactionnels sans nettoyage des reçus existants.
- [x] Définir conversion décimale exacte partagée et bornes explicites cohérentes UI/Zod/SQL ; titre et Notes suivent les conventions de texte Unicode du projet, sans appliquer l’interdiction des chiffres des noms de contacts.
- [x] Livrer entrée Pipeline minimale, création contextuelle et panneau éditable ; chargement utile, vrai vide, erreurs, cache et brouillons isolés dès leur apparition.
- [x] Afficher/ouvrir les opportunités liées dans Contacts et les fiches contact/société ; pagination explicite de 25, totaux globaux, ordre création décroissante puis UUID croissant. La liste Sociétés conserve son contrat.
- [x] Vérifier matrice complète, rechargement, liens anciens/nouveaux, HTTP/RPC, clavier et reprise. Trois revues indépendantes et leurs corrections vérifiées avant clôture.

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

### Organisation et vérification de cette implémentation

La story2.5 est clôturée localement, données de recette nettoyées, créneau distant libre. L’agent d’implémentation prend cette seule3.1 sans commit ni édition de statut/spec. Il peut déléguer UI/cache/brouillons/tests navigateur avec fichiers disjoints après publication des contrats, tout en conservant SQL/validation/service/tests DB. Il coordonne une seule mutation distante à la fois puis donne le créneau navigateur à son UI. Aucun schéma Tâche, kanban ou agrégat gagné n’est à réaliser ici.

Cible autorisée par mandat : bmad-crm/Persos/free/otadrkhrjxafutocstzo ; revalider avec `.local/verify-story-target.py` avant mutation. Migrations déjà appliquées par helper, ne pas rejouer les anciennes. Secrets `.local` jamais en sortie. Les recettes existantes montrent l’accès dédié et le nettoyage par reçus ; introduire une preuve de provenance exacte pour Opportunité, comptes/sessions fictifs et finaliseurs indépendants. Node24 : `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin`. Garder dev existant localhost:3000 actif. Context7 avant usage bibliothèques, seuls skills BMAD ; pas de build, push ou déploiement.

Vérifier les trois entrées de création, blur une seule fois, valeurs exactes, clavier/étapes, liens anciens/nouveaux et pagination, droits HTTP/RPC, reprise/conflicts/générations/fermeture. Inclure Enregistrer des dialogues parents, pas seulement boutons internes. Les états chargement/erreur doivent rester fermables. Captures inspectées et résultats JSON sous verification/3-1 ignoré ; mesures brutes avec conditions, séparer ouverture DOM/chargement des données/confirmation, résultat fonctionnel et verdicts de seuil. Si mode ciblé, ne pas écraser la preuve de recette complète. Les mesures globales Q6 avec toutes entités restent à3.8.

- Colonne Opportunités de la liste Contacts : charger les compteurs globaux/liens de la page dans une projection groupée privée (au plus25 IDs strictement validés), ou enrichir sa lecture existante. Ne pas lancer25 lectures de pages Opportunités et transférer leurs Notes pour afficher25 compteurs. Les fiches conservent leurs listes contextuelles paginées complètes. Vérifier une page25contacts avec lecture groupée et revalidation après changement de lien. Cette précision évite un coût linéaire de requêtes ajouté par la nouvelle colonne.

## Spec Change Log

## Review Triage Log

| Avis | Verdict | Preuve et route |
|---|---|---|
| B1 — contexte Société réutilisé | medium | OpportunityContextLinks garde result/page et son appel Société n'est pas keyed. Pendant A→B, les liens A restent réellement actifs sous B. Patch : clé par contexte et recette de lecture retardée. |
| B2 — JSON local corrompu coupe la recherche | low | Le catch global de readOpportunityDraft interrompt bien le parcours après un JSON externe invalide. Les écritures applicatives JSON sont atomiques ; cas rare. Rejet BMAD : isoler chaque décodage ajoute des branches pour une corruption exceptionnelle, comme le cas historique2.2 B5. |
| B3 — sélecteurs rechargés ensemble | low | Promise.all et loading commun attendent les deux pages. Le refus réseau devient un résultat indisponible, puis les contacts réussis sont utilisables ; ce n'est pas un blocage permanent ni un lien imposé. Une pagination peut retarder temporairement l'autre sélecteur. Rejet : deux circuits d'états supplémentaires pour ce retard secondaire, sans perte de données. |
| B4 — UUID dans conflit de relation | medium | L'affichage générique lit company_id/primary_contact_id alors que le DTO contient les noms. Le choix utilisateur n'est pas intelligible. Patch direct : noms et libellés absence/indisponibilité ; recette de conflit relation. |
| B5 — file unique par opportunité | false | La file conserve tous les champs demandés pendant running et les traite après acquittement, avec bases mixtes protégées ; aucun champ n'est perdu. Le contrat exige la sérialisation d'un champ et n'exige pas d'écritures HTTP parallèles. Une file commune garantit le replay et la garde SaveAll, couverts par transport35. |
| B6 — limites non affichées avant blur | false | Le contrat retenu est validation à la sortie de champ avec erreur associée et saisie conservée, assuré par parseField/OpportunityInputError et le focus de save. Aucun compteur ou blocage pendant frappe n'est exigé ; le risque de perte annoncé n'existe pas. |
| B7 — indisponible pendant récupération | false | L'état initial représente un échec confirmé, et le compteur ajoute explicitement « Actualisation… » pendant loading. Garder le dernier échec jusqu'au succès ne prétend ni être vide ni avoir réussi. |
| B8 — fluidité stricte non acquise | medium | Seuil chaud16ms atteint seulement2/5, froid naturel non mesuré, comme indiqué explicitement dans Verification et la preuve. Le remède proposé « conserver exigence ouverte » est déjà présent : série globale et mesure finale3.8. Rejet de la modification de spec prescrite par la règle BMAD ; aucune conformité stricte n'est revendiquée. Le bilan V1 doit conserver cette limite et l'évaluer en3.8. |
| B9 — nouveau finaliseur DB non exécuté | medium | La condition de retrait du manifeste a changé après DB49 ; seul son contrôle syntaxique est attesté. Patch de recette ciblée du chemin courant, succès/nettoyage répété et échec contrôlé d'un finaliseur, sans réattribuer la preuve49. |
| B10 — reformater et renommer les phases | false | Le constat de lignes denses est exact, mais aucun caller divergent ni invariant violé n'est démontré par ce point. Refactorisation générale explicitement conservée pour BMAD06 ; ne pas la déclencher pour une préférence de présentation. |
| E1 — contexte Société réutilisé | medium | Vérification indépendante identique à B1 : absence de clé et état conservé au changement companyId. Même cause ; patch groupé avec B1 après verdict individuel. |
| E2 — preventBlur reste actif | medium | Seul pointerup sur le footer réinitialise le ref ; relâchement extérieur ou pointercancel laisse les futurs blurs inactifs. Patch : réinitialisation globale nettoyée, test des deux chemins et de l'annulation normale. |
| G1 — faux clic dans recette Annuler | medium | Gap pré-vérifié : HTMLElement.click ne reproduit pas le blur du pointeur. Patch : vrai clic agent-browser depuis Notes focalisées, Abandonner puis relecture inchangée. |
| G2 — ordre des pages non vérifié | medium | Gap pré-vérifié : tailles/unicité ne protègent ni ordre des dates ni égalités UUID. Patch : fixture transactionnelle ordonnée indépendamment, égalité à la frontière25 et comparaison exacte des deux pages. |

B1/E1 partagent leur cause ; les autres constats restent individuels. Corrections bornées des chemins existants confiées à l'implémenteur initial. Aucune modification de l'intention figée, aucune refactorisation globale ni déploiement.

## Verification

Implémentation, vérifications réelles et revue indépendante terminées. Rapport détaillé et matrice des dix cas : `verification/3-1/integration-review.md` (preuves locales ignorées).

- Contrat40, DB49, compteurs groupés11, transport35, HTTP anonyme3 et authentifié6 : passés. Deux migrations additives appliquées sur cible privée vérifiée, aucun schéma Tâche.
- 128 assertions navigateur uniques passées sur plusieurs phases, dont clavier10 et finition16. Les premières recettes partielles en échec sont conservées avec leur cause et les contrôles ciblés ultérieurs ; ce résultat ne prétend pas être une recette complète unique rejouée.
- Création par trois entrées, exactitude des montants, champs/étapes/relations, pagination26, page25Contacts sans fetch par ligne, droits, conflits, réponse perdue, générations, vraie expiration/reconnexion, stockage indisponible, gardes et réponse tardive exercés.
- Captures finales inspectées : 2560×1440, 1440×900, 768×1024, 1024×768, 402×874. Fixtures supprimées par provenance exacte, finaliseurs et empreintes préexistantes vérifiés. TypeScript Node24 et diff-check propres.
- Ouverture DOM chaude : 39.1/19.8/9.7/19.6/9.6ms, seulement2/5 sous16ms. Réaction input→rAF : 3.5/4.4/4.4/2.6/2.6ms. Échantillon distinct : DOM23.7ms, contenu789.5ms, confirmation690.4ms. Peinture physique et ouverture froide naturelle non mesurées ; le seuil chaud strict n'est pas acquis. Série19/20 et volumeQ6 global restent3.8.
- La garde finale du script DB a été renforcée après sa recette49 et sa syntaxe vérifiée ; ne pas attribuer cette preuve antérieure au nouveau finaliseur. Aucun build, push ou déploiement frontend.


### Clôture après revue

Les trois couches indépendantes ont rendu14avis, tous triés individuellement ci-dessus. Les patchs retenus sont réalisés : composant contextuel keyed, noms de conflit lisibles, garde blur réinitialisée après geste interrompu. Les lacunes de recette sont couvertes sans relancer les domaines inchangés.

- Ordre global :28fixtures datées précisément, oracle JS indépendant, pages25+3 avec égalité à la frontière25 ; réussite. Finaliseur actuel : échec local injecté après révocation effective, manifeste conservé puis reprise réussie ; nettoyages répétés0 et empreintes intactes. Preuves `opportunities-db-review-{injected,finalizer-retry,summary}.json`, DB49 historique conservée.
- UI : contexte Société Apage2→Bpage1 vide durant attente puis B seule, réponseA tardive ignorée. Même parcours Contact dans `opportunities-review-contacts-only-ui-results.json` :11assertions réussies, finaliseurs tous vrais.
- Conflits société/contact, choix local/distant, absence et noms indisponibles : toutes assertions du segment editors réussies avant une interruption du helper pointeur. Segment pointer autonome ensuite réussi13assertions : véritable clic Annuler/Abandonner depuis Notes focalisées, valeur/révision inchangées ; relâchement extérieur et pointercancel après mousedown, puis blur qui sauvegarde. L'événement pointercancel est injecté ; press/release extérieurs et clics sont pilotés réellement par agent-browser.
- Fichiers partiels en échec conservés, causes d'instrumentation et reprises ciblées explicites ; aucune prétention de recette unique entièrement rejouée. Capture finale `opportunities-review-fixes.png` inspectée par le parent. Les finaliseurs des segments préservent les données préexistantes et retirent les fixtures exactes.
- Consolidation après revue :37assertions UI uniques, preuves sources conservées. TypeScript final Node24 et diff-check propres. La limite de performance chaude16ms reste celle déjà décrite, à mesurer sur la V1 intégrée3.8 ; aucune livraison frontend ou refactorisation générale.
