---
title: 'Créer et retrouver un contact sans perdre ma saisie'
type: 'feature'
created: '2026-09-07'
status: 'in-review'
route: 'dispatch'
baseline_commit: '7219864f281fa1aa3cb33360ff3bb1da75184bea'
review_loop_iteration: 0
context:
  - /Users/a1207/CODE/apps/bmad-crm/AGENTS.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/epic-2-context.md
  - /Users/a1207/CODE/apps/bmad-crm/_bmad-output/implementation-artifacts/setup-2-1.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

Livrer la première fonction métier : créer un contact avec son prénom ou son nom, le retrouver dans Contacts et modifier sa fiche. Lilian demande d’accélérer jusqu’à cette fonction utilisable et délègue les décisions. Les garanties de saisie de la story 2.1 restent intégrales.

## Boundaries & Constraints

Toujours : propriétaire authentique côté serveur et base ; prénom ou nom après trim, aucun autre champ obligatoire. Liste compacte, panneau droit, Ajouter/Enregistrer/Annuler, fermeture avec Enregistrer/Abandonner/Continuer. Pagination 25, tri français nom/prénom/UUID. Idempotence, versions par champ et brouillon récupérable après reconnexion du même propriétaire.

Jamais : email, photo, notes, sociétés, opportunités, recherche ou suppression dans cette tranche ; écriture directe, clé privilégiée dans l’application, données réelles de démonstration, autosave à chaque frappe, skills hors BMAD.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Création | Au moins un nom/prénom | Une fiche persistée, liste et panneau puis rechargement cohérents | Vide refusé sans perte |
| Correction | Champs modifiés et versions lues | Mise à jour des seuls champs, confirmation après commit | Brouillon conservé, projections confirmées restaurées |
| Réessai | Réponse perdue après commit | Même clé/empreinte retourne le même résultat, aucun doublon | Même clé/autre payload refusée |
| Conflit | Deux onglets, même champ | Refus sans écrasement, choix explicite puis nouvelle version contrôlée | Champs indépendants compatibles |
| Brouillon | Offline, expiration, réponse tardive, nouvelle saisie | Même propriétaire retrouve texte/versions/commande/génération ; ancienne confirmation ne nettoie pas nouvelle saisie | Aucun succès inventé |
| Sécurité | Visiteur/autre compte, requête directe | RLS refuse données ; mutation directe interdite ; RPC contrôle propriétaire | Données et panneaux masqués à expiration |
| Liste | Vide, panne, fiche absente, plus de 25 lignes | États distincts, total global et toutes pages accessibles | Réessai sans perte du brouillon |

</frozen-after-approval>

## Code Map

- `lib/auth.ts`, `lib/supabase/server.ts` : identité authentique et client SSR par requête ; réutiliser sans clé admin.
- `components/auth/session-guard.tsx` : masque actuellement son descendant puis navigation complète ; étendre la protection aux panneaux portalisés et vider les caches à expiration.
- `app/(dashboard)/layout.tsx`, `components/dashboard-skeleton.tsx` : shell existant, ajouter Contacts et état actif exact.
- `components/ui/` : Input/Button/Label/Card/Skeleton présents ; consulter Context7 et installer Table/Sheet/Dialog requis avec CLI shadcn.
- `setup-2-1.md` : contrats DB, coordination et preuves ; créer seulement Contact et supports nécessaires.

## Tasks & Acceptance

- [ ] `supabase/migrations/`, `scripts/verify-contacts-db.mjs` : schéma Contact, registre propriétaire privé, reçus transactionnels, RLS/droits, RPC create/update idempotente et conflits par champ ; tests directs adversariaux.
- [ ] `lib/validations/contacts.ts`, `lib/contacts.ts`, `app/actions/contacts.ts` : contrats Zod, lectures paginées et commandes authentifiées, résultats canoniques sans secrets.
- [ ] `lib/contacts-drafts.ts`, `lib/contacts-cache.ts` : brouillons par propriétaire/cible/génération, commande reprise, cache isolé et réponses obsolètes ignorées.
- [ ] `app/(dashboard)/contacts/`, `components/contacts/`, `components/ui/` : liste, chargement, création et fiche droite rapides ; préchargement, URL locale sans RSC au clic ; erreurs/conflits/reprise et fermeture complète.
- [ ] `components/auth/session-guard.tsx`, shell/navigation/skeleton : purge des surfaces privées y compris portails, sans effacer les brouillons ni casser la vérification temporaire au focus.
- [ ] `scripts/verify-contacts.mjs` : exécution réelle de chaque ligne de matrice, pagination et clavier/cinq formats ; mesures de fluidité contextualisées, sans déclarer une cible atteinte sans mesure.

Acceptation : Given Contact créé, When rechargement/reconnexion, Then données retrouvées ; Given erreur/conflit, When réessai explicite, Then aucune saisie perdue ni duplication. Démonstration finale locale et hébergée avec un contact fictif identifiable, aucun module futur.

## Implementation Notes

Approbation déléguée par demande actuelle ; aucune question d’intention restante. Empreinte : un domaine et supports transversaux nécessaires. Migration et déploiement coordonnés par parent après inspection. Hébergement 1.3 avance indépendamment ; ne pas toucher ses fichiers.

## Spec Change Log

- Réalisation du 7 septembre : une suspension réelle du transport Next Server Action a démontré qu’un simple Promise.race libérait le bouton sans libérer la file de requêtes. Le transport navigateur des contacts devient HTTP same-origin avec délai et AbortController, sous garde propriétaire/Zod et RPC identiques ; mutations contrôlent aussi Origin. Intention, champs, idempotence et versions inchangés. Préserver les brouillons et la commande originale pendant toute reprise. Les nouvelles routes privées et leur adaptateur client font partie du Code Map et de la tâche frontières/recette.

## Review Triage Log


Revue croisée du candidat, trois couches lancées avant triage. Les nouveaux agents étaient refusés par la limite de threads de l’hôte ; les trois agents de revue existants ont été réengagés avec les instructions de couche. Aucun auteur Contacts/SQL ne révise sa propre implémentation. Vérification hébergée finale reste condition de clôture.

| ID | Couche / constat individuel | Verdict | Preuve et route |
|---|---|---|---|
| B1 | Recette supplemental modifie le premier contact préexistant | high | Sélecteur global suivi fill/save ; fixtures Set ne protège pas cette lecture. Patch : cibler UUID de fixture connue, vérifier donnée préexistante intacte. |
| B2 | Pagination recette suppose base vide | medium | Assertions fixes 2 pages/2 lignes ; un contact démo supplémentaire suffit à échouer. Patch : totaux initiaux et pages calculés. |
| B3 | Conserver ma saisie remplace un champ conflictuel remis à sa valeur initiale | high | replaceConflict assimile égalité à base à absence de modification sans exclure conflict.fields. Patch : préserver toujours les champs conflictuels choisis. |
| B4 | Utiliser version enregistrée supprime aussi champ local indépendant | high | freshDraft remplace les deux valeurs alors que le conflit peut concerner un seul champ. Patch : résoudre seuls champs conflictuels et réancrer versions, conserver autres saisies. |
| B5 | Échec removeDraft silencieux après abandon | low | Exception possible si stockage devient inaccessible ; lecture échoue alors aussi. Situation non courante, correctif nécessitant nouveaux états/branches de suppression. Rejet low conformément à la règle, pas une preuve de suppression physique du stockage. |
| B6 | Squelette de session reste celui Accueil sur Contacts | low | DashboardSkeleton appelle HomeSkeleton sans route ; visible à chaque contrôle de premier plan. Patch cosmétique direct : squelette Contacts et navigation mobile correspondant à la route. |
| B7 | popstate ignore page et perd destination après fermeture | medium | Seul panel est lu ; requestClose ne conserve aucune destination, close réécrit URL. Patch : synchroniser page et garder navigation attendue jusqu’à confirmation, annuler proprement si poursuite saisie. |
| B8 | Longueur SQL et Zod divergent sur caractères supplémentaires | medium | 101 caractères U+20BB7 =202 unités UTF16 mais101 caractères SQL ; RPC accepte puis schéma lecture rejette. Patch : convention commune et cas traversant RPC/lecture, nouvelle migration si SQL changé. |
| B9 | Mesures de fluidité ne couvrent pas vues/sauvegardes/froid | medium | Vingt durées finies sont une collecte, pas assertion de cible ; warm16ms déjà explicitement non prouvé. Manquent mesures contextualisées vues/sauvegardes. Patch recette : consigner froid/chaud et confirmations sur20 essais, résultats cibles explicites sans les annoncer atteints par défaut. |
| B10 | Limite body appliquée après chargement mémoire | low | Vrai pour corps d’un propriétaire authentifié ; middleware refuse visiteurs avant route et UI ne génère pas de corps massif. Risque hors usage quotidien ; streaming ajoute complexité. Rejet low, limite4096 reste validation de commande et non garantie de mémoire transport. |
| E1 | Prélecture terminée après démontage redirige propriétaire valide | medium | cache.clear change epoch, load renvoie unauthenticated, callback garde permitted true après cleanup. Patch : garde génération de cycle de vie et invalidation sans événement Auth après démontage. |
| E2 | Unicode SQL/client divergents | medium | Même démonstration que B8, vérifiée séparément aux frontières SQL/Zod. Patch commun B8. |
| E3 | Recette supplemental casse avec contact existant | medium | Totaux et reliquat fixes, indépendamment du bon fonctionnement produit. Patch commun B2. |
| V1 | Assertion confidentialité portail auto-sélectionne ses marqueurs | medium | Pré-vérifié : every sur les seuls éléments marqués, collection vide passe ; enlever marqueur au contenu ne fait pas échouer test. Patch : inspecter sheet/input/Dialog par sélecteurs indépendants et existence. |
| V2 | Concurrence champs indépendants vérifiée seulement RPC | medium | Pré-vérifié : scripts DB fabriquent fields manuellement, aucun passage makeCommand avec distant sur autre champ. Patch : modifier deux champs distincts via UI+RPC et relire résultat/versions. |

Groupes patch : B1 ; B2/E3 ; B3 ; B4/V2 ; B6 ; B7 ; B8/E2 ; B9 ; E1 ; V1. Aucun changement d’intention ni de champ métier. Corrections limitées aux états et frontières démontrés ; aucun nouveau service/public métier.

## Verification

`npx tsc --noEmit`, scripts DB et navigateur (agent-browser, sans Playwright), rechargement réel et vérification sur URL hébergée après déploiement. Pas de build pendant développement. Aucun commit/push par sous-agent.
