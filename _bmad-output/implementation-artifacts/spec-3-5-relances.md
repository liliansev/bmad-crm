---
title: 'Retrouver et traiter toutes mes relances'
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

Retrouver toutes les tâches à faire et les affaires ouvertes sans prochaine action ; terminer ou reporter une tâche directement dans sa ligne sans dépendre des cinq priorités de l’accueil.

## Boundaries & Constraints

Route Relances accessible directement, quatre rubriques : En retard, À faire aujourd’hui, À venir, Opportunités sans prochaine action. Les trois premières incluent toutes tâches actives, même d’affaires gagnées/perdues, jamais terminées/annulées. Colonnes Fait, intitulé, opportunité ouvrable, étape et échéance. Sans prochaine action : uniquement affaires ouvertes sans active, lien au panneau et ajout explicite via 3.3. Pas de filtre supplémentaire.

Jour métier unique Europe/Paris ; échéances dates sans conversion en instant. En retard strictement avant aujourd’hui ; aujourd’hui jamais en retard. Rubriques de tâches triées échéance, création, UUID croissants ; sans action création puis UUID croissants. Pages explicites de 25 par rubrique, totaux globaux sur tout le périmètre privé ; aucun plafond API silencieux.

Fait et date en ligne utilisent les commandes 3.4 : date enregistrée sur changement validé ou blur, une seule commande par changement, éditeur monté et saisie conservée. Après succès, reclasser/disparaître et proposer éventuellement Ajouter la suivante sans obligation. Pendant commande état visible ; erreur revient aux projections confirmées sans effacer le brouillon, réessai avec même clé si réponse perdue. Aucun succès avant commit.

Créer/terminer/annuler/rétablir une tâche, fermer/réouvrir ou modifier une affaire invalide toutes rubriques affectées. Recalcul commun au minuit Paris, focus, visibilité, retour réseau et reconnexion ; ignorer réponses périmées et préserver brouillons/date en cours. Propriétaire et données/paramètres validés, RLS/RPC et cache privé ; même génération/jour pour lignes et compteurs affichés afin d’éviter une vue incohérente.

Jamais : tâches d’affaires closes masquées, option de filtre, accueil artificiellement rempli, nouvel agenda, suppression ou commande métier dupliquée. Aucun déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Éligibilité | Active passée/aujourd’hui/future sur chaque étape | Une rubrique exacte, closes incluses | Terminées/annulées absentes des actives |
| Sans action | Ouverte/close sans active, ou seulement tâches passées | Ouverte seule listée et ajout accessible | Aucune affaire close comptée |
| Exhaustivité | >25/rubrique, dates/timestamps égaux | Toutes pages accessibles, compteurs globaux, tri date/création/UUID | Aucune limite API implicite |
| Fait | Clic case, double événement, réponse perdue | Commande 3.4 unique/rejouée ; disparition après confirmation | Projection confirmée restaurée sur échec |
| Date | Reporter hier vers demain, aujourd’hui ou passé | Une commande, classement et compteurs recalculés | Date invalide garde texte/brouillon |
| Cycle | Créer/annuler/rétablir, clôturer/réouvrir ailleurs | Rubriques et sans-action corrects après commit | Aucun brouillon effacé par rafraîchissement |
| Temps | Minuit Paris, heure d’été/hiver, focus après veille | Jour recalculé, dates stockées identiques | Aucune tâche du jour classée en retard |
| Navigation | Ouvrir contexte avec date non confirmée | Fermeture/navigation protégée selon Q4 | Échec garde la saisie et possibilité de réessai |
| Incidents | Réponses inversées, hors-ligne, expiration | Anciennes ignorées ; vraie erreur distincte du vide | Aucun mélange de propriétaires/jours |

</frozen-after-approval>

## Code Map

- Réels : `components/dashboard-nav.tsx` contient Accueil/Contacts/Sociétés à la lecture ; `app/(dashboard)/societes/{page,loading}.tsx`, `components/companies/companies-shell.tsx` fournissent route privée, pagination, générations et revalidation ; `lib/auth.ts` protège le propriétaire.
- Réels : `components/ui/{button,table,input,label,sheet,skeleton}.tsx`. Checkbox absent de cet inventaire ; relister et consulter Context7 avant ajout shadcn nécessaire.
- À relire au dispatch : services/commandes Tâche 3.3/3.4, jour Paris commun, panneau/cache Opportunité 3.1/3.2. Les chemins proposés `lib/tasks*`, `components/tasks/`, `components/opportunities/` ne sont pas encore des interfaces existantes.
- Nouveaux proposés : `app/(dashboard)/relances/{page,loading}.tsx`, `components/reminders/`, `lib/reminders.ts` et transport/API de lecture si nécessaire. Projections sécurisées dans le service ou vues SQL sous sécurité appelant ; pas de nouvelle entité métier ni seconde mutation Tâche.

## Tasks & Acceptance

- [ ] Construire lectures/projections globales privées et paramètres paginés validés ; centraliser jour/tri et compter indépendamment des pages.
- [ ] Livrer quatre rubriques compactes, vrai vide/chargement/erreur, liens et édition/Fait sur commandes partagées.
- [ ] Revalider après mutations et événements jour/session/réseau, sans écraser générations ni accepter réponses anciennes.
- [ ] Vérifier exhaustivité SM-002/SM-C02, frontières Paris, pagination et reprise R2 ; revue indépendante avant clôture.

**AC1 :** Given toutes actives, When Relances ouvre directement, Then rubriques exactes incluent les affaires closes avec colonnes, pages de 25 et compteurs globaux ; passées exclues.

**AC2 :** Given affaires sans active, When la quatrième rubrique ouvre, Then seules les ouvertes sont présentes avec panneau/ajout, et tout cycle métier les reclasse après commit.

**AC3 :** Given une ligne, When Fait/date change, Then 3.4 opère sans panneau, une seule commande par changement ; succès reclasse, échec restaure projection et conserve saisie.

**AC4 :** Given minuit/focus/réseau/DST, When la vue se revalide, Then jour Paris, ordre et totaux sont exacts sans modifier dates ni brouillon ; ancien résultat ignoré.

**AC5 :** Given vide/multipages/incidents, When R2 et SM-002/SM-C02 sont exercés, Then toutes échues actives sont accessibles sans faux positif dans En retard, au clavier et tactile.

## Implementation Notes

Préparation avant lecture des contrats Tâche définitifs :

- Une projection serveur renvoie `business_date` calculée par `(statement_timestamp() AT TIME ZONE 'Europe/Paris')::date`, plus quatre sections paginées et totaux du même instantané. Date métier serveur fait foi ; pas de paramètre HTTP autorisant un client à choisir arbitrairement « aujourd’hui » dans le chemin public. Les tests peuvent exercer une fonction pure interne de classement avec un jour explicite et l'horloge navigateur, sans changer l'horloge système ni exposer un override de production.
- Créer/réutiliser un seul service client de jour Paris à partir de Intl, sans dépendance supplémentaire : minuterie jusqu'au prochain changement de date Paris, recomputation après réveil/focus/visibility/online. Ne pas additionner 24 heures à minuit : les journées DST font 23/25 heures. La date issue du serveur et les lignes restent affichées ensemble ; après minuit conserver un état revalidation explicite plutôt que combiner nouveaux libellés et anciens compteurs. Une réponse d'un jour/epoch précédent ne remplace pas la projection actuelle.
- Lecture en quatre rubriques, pages indépendantes 25, sections et paramètres strictement validés, offset borné. Ramener une page devenue vide à sa dernière page valide après mouvement ; compteur global et tri complet appliqués avant LIMIT. Les fermées sont présentes parmi actives ; sans-action utilise NOT EXISTS active et étapes ouvertes, pas « aucune tâche historique ».
- Date en ligne : partager store Tâche et commande update des dialogues ; saisir sans envoi à chaque frappe, confirmer au changement validé ou blur sans double soumission, garder brouillon même si une relecture déplacerait la ligne. Le Fait utilise complete existant, double clic verrouillé, résultat exact de retry. Une réponse reçue doit confirmer la bonne génération avant de retirer son draft. Une date invalide reste visible avec erreur associée ; ouverture d'une affaire/pagination/navigation honore le guard Q4.
- L'ajout de checkbox standard nécessite l'inventaire UI et Context7 puis shadcn CLI, jamais un div simulé. Actions tactiles et clavier explicites. Les nouvelles surfaces réutilisent le panneau Opportunité, ses guards et cache, sans second moteur de mutations.
- Vérifications ciblées : oracle indépendant avec >25 par rubrique, égalités date/création, affaire close avec active et ouverte avec seulement passées ; hier/aujourd'hui/demain Paris, secondes avant/après minuit et DST. Comparer IDs/totaux/pages exacts, puis effectuer Fait/report réel et recharger. Ancienne réponse retenue après mutation ou changement de jour, autre onglet, expiration/stockage et ligne en saisie. Ne pas considérer tests purs du tri comme preuve du branchement réel de la minuterie et des événements navigateur.

### Précisions de recette avant dispatch

Le mot « passées » dans les lignes parlant d'exclusion désigne les tâches historiques terminées/annulées, jamais une échéance passée : les tâches todo en retard sont obligatoirement incluses, conformément au canon et à l'Intent. Ce rappel corrige une ambiguïté rédactionnelle sans nouvel arbitrage.

Chaque rubrique retourne sa page effectivement retenue après recalage, total et lignes sur le même instantané, business_date commun. Préférer le recalage serveur dans cette lecture ; ne pas montrer ancien total et nouveau numéro de page. Une mutation dans l'ongletB suivie de visibilitychange visible/focusA doit recharger A : les événements métier window seuls ne traversent pas les onglets. Aucune synchronisation instantanée en arrière-plan supplémentaire n'est requise.

La date serveur de la projection est l'autorité d'affichage. Une horloge client décalée déclenche au plus une revalidation raisonnable, jamais un rejet infini du jour serveur ou une boucle de requêtes. La recette distingue (a) classification SQL avec instant injecté uniquement dans une fonction interne non exposée et (b) vrai branchement minuterie/visibilité/focus → fetch ; changer uniquement Date navigateur ne simule pas statement_timestamp PostgreSQL.

Oracle réutilisable : 26tâches todo ouvertes aujourd'hui, créations égales et UUID connus, dont25 qualifying puis1 proposal en dernière positionUUID. Relances affiche25+1, Accueil doit commencer par la proposal malgré sa position page2. Reporter une qualifying àhier, terminer la proposal puis revenir sur l'onglet dont Aujourd'hui était page2 : total24/page1, En retard1. Déplacer successivement le même lot entre rubriques puis terminer ses tâches pour tester Sans prochaine action sans multiplier quatre jeux permanents. D−1/D/D+1 avant puis après minuit : 1/1/1 devient2/1/0 ; dates stockées inchangées. Tester joursParis23h/25h et réponse ancienne libérée après récente, sans perte de brouillon.

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni résultat acquis. Après clôture 3.3/3.4 : TypeScript, tests ciblés de classement et compteurs, agent-browser sur ligne Fait/date et liens, deux onglets et reprise. Tester jour Paris de part et d’autre de minuit et DST avec horloge contrôlée explicitement documentée ; vérifier dates persistées. Jeu couvrant >25 lignes par rubrique, étapes closes, états passés, cas sans action et égalités. Desktop 1440×900/2560×1440, mobile 402×874/tablette, captures inspectées et rechargement. Mesures Q6 avec version/matériel/réseau ; seuils seulement si exécutés. Fixtures exactes, un seul agent en mutation distante ; aucun build de développement ou déploiement frontend.
