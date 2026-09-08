---
title: 'Lire le montant gagné et le contexte complet d’une société'
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

Lire depuis la fiche société son contexte commercial complet et le montant des opportunités actuellement gagnées, avec contacts, affaires et échanges navigables sans confondre ce montant avec une facturation.

## Boundaries & Constraints

Projection Montant des opportunités gagnées : somme de tous les montants EUR HT renseignés des opportunités actuellement Gagnée liées à la société, toutes dates confondues ; exclure ouvertes/perdues. Compteur distinct des gagnées dont montant absent. Zéro saisi est renseigné ; aucune gagnée ou toutes sans montant donne 0 €, compteur des absents visible s’il est non nul. Calcul global sur toutes pages autorisées, exact en centimes entiers avec transport chaîne entière ; domaine de somme évitant débordement et aucune conversion flottante. Projection non modifiable, jamais qualifiée de facturation/encaissement.

Changement confirmé de montant/étape/société invalide montants, compteurs et listes/panneaux des sociétés anciennes et nouvelles. Revalidation commune focus/visibilité/réseau/reconnexion, cache privé, résultats obsolètes ignorés ; erreur explicite plutôt que faux zéro ou faux total confirmé. Préserver tout brouillon local et versions/générations de l’éditeur.

Fiche société rassemble nom éditable, contacts actuels, opportunités liées et échanges de sa société historique, création d’opportunité préliée mais lien modifiable. Relations navigables et pages exhaustives de 25 avec compteurs globaux selon leurs tris existants. Liste Sociétés reste Nom et accès fiche ; ne pas y ajouter colonnes agrégées. Changer l’employeur d’un contact ou la société d’une affaire ne déplace pas les échanges historiques ; correction explicite du journal seulement.

Propriétaire authentique côté serveur, relations/projections privées, données et paramètres validés ; vues éventuelles sous sécurité appelant. Réutiliser le panneau, les services et commandes déjà livrés, pas de nouveau domaine de facturation. Terminer l’intégration des trois epics localement ; la clôture documentaire n’affirme ni déploiement frontend ni seuil de recette sans preuve.

Jamais : filtre de période, recherche, revenu prévisionnel, paiement/facture, suppression, intégration, nouvel audit de toutes versions ou déploiement implicite.

## I/O & Edge-Case Matrix

| Cas | Entrée | Résultat attendu | Échec |
|---|---|---|---|
| Somme | Gagnées 10,01 + 0 + vide, ouverte 50, perdue 20 | 10,01 €, un montant absent ; zéro compté renseigné | Aucun montant ouvert/perdu ajouté |
| Vide | Aucune gagnée ou toutes gagnées sans montant | 0 €, compteur absent exact si non nul | Erreur réseau n’est pas 0 € |
| Global/exact | >25 gagnées, grosses valeurs et centimes | Somme entière exacte sur toutes pages, pas de débordement silencieux | Aucun arrondi flottant ou sous-total de page |
| Mutation | Modifier montant, gagner/perdre/réouvrir, changer A vers B/retirer société | Deux sociétés et contextes affectés revalidés après commit | Échec ne confirme pas de nouveau total |
| Réponses | Ancienne lecture termine après mutation/relecture récente | Agrégat récent conservé et brouillon nom intact | Cache isolé propriétaire/révision |
| Navigation | Société → contacts/affaires/échanges → création | Liens cohérents, création société préliée modifiable | Brouillon protégé avant quitter le contexte |
| Histoire | Contact change employeur/affaire change société | Contacts actuels changent, échange reste société enregistrée | Aucun déplacement rétroactif |
| Pages/absences | Relations vides, longues, plusieurs pages | Champs/colonnes UX présents, totaux globaux, navigation clavier/tactile | Chargement et erreur distincts du vide |
| Sécurité | Visiteur, UUID étranger, lecture directe projection | Aucune somme ou relation privée révélée | Pas de vue contournant RLS |

</frozen-after-approval>

## Code Map

- Réels : `lib/companies.ts` expose `readCompanies`, `readCompany`, `readCompanyContacts`, `lib/validations/companies.ts` leurs contrats ; `lib/companies-{cache,transport,drafts}.ts` gère lectures/saisies. Étendre seulement les projections nécessaires après relecture de la version finale.
- Réels : `components/companies/companies-shell.tsx` contient actuellement panneau Société et section de contacts, `components/companies/company-editor.tsx` édite le nom ; `app/(dashboard)/societes/{page,loading}.tsx`, `components/contacts/contact-company-editor.tsx` et `lib/auth.ts` sont les points de contexte/protection.
- À relire au dispatch : relations Opportunité livrées 3.1, journal/historiques corrigés 2.4/2.5/3.7 et invalidations 3.2–3.6. Chemins proposés `lib/opportunities*`, `lib/exchanges*`, `components/opportunities/`, `components/exchanges/` sont encore futurs dans cet instantané, aucune interface figée.
- Ajout proposé : projection globale du montant gagné dans le service Société et contrat/transport existants, composant de lecture dans le panneau. Vue/fonction/index SQL additif si nécessaire, sécurité appelant et agrégation exacte ; aucune table Facture/Revenu.
- Source finale : paire DESIGN/EXPERIENCE sous `_bmad-output/planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/`, composition A. Comparer tous champs/colonnes attendus au code intégré, pas au seul raster.

## Tasks & Acceptance

- [ ] Ajouter projection globale exacte et compteur distinct, avec protection propriétaire et traitement honnête vide/erreur.
- [ ] Intégrer montant gagné et contexte complet dans la fiche sans élargir la liste Sociétés ; préserver tris/pages/liens et création préliée.
- [ ] Invalider anciennes/nouvelles sociétés après mutations et ignorer réponses obsolètes sans perdre brouillons.
- [ ] Exécuter parcours intégré des trois epics, sécurité/fiabilité R2 et mesures Q6 réelles ; revue indépendante avant clôture locale, bilan distinct du déploiement réservé BMAD 06.

**AC1 :** Given ouvertes/gagnées/perdues, When fiche ouvre, Then seule somme des montants renseignés gagnés liés apparaît toutes dates confondues, avec compteur absent séparé, zéro renseigné et vocabulaire non comptable.

**AC2 :** Given aucune gagnée ou seulement sans montant, When projection se lit, Then 0 € et absents exacts sont affichés sur tout le périmètre, indépendamment des pages.

**AC3 :** Given montant/étape/société modifié, When commit confirme, Then anciennes/nouvelles sommes et contextes se revalident ; aucune erreur/réponse ancienne ne confirme un faux total ni perd un brouillon.

**AC4 :** Given les epics intégrés, When parcours société → relations → création préliée s’exécute, Then tous champs/colonnes UX et historiques restent corrects avec absences, pages, clavier/tactile ; R2/Q6 documentent la version réelle, pas seulement sa compilation.

## Implementation Notes

### Recette intégrée finale à exécuter après cette story

Réutiliser un seul manifeste de fixtures pour les 100 contacts, 50 sociétés, 200 opportunités et 1000 échanges de Q6 ; tâches en nombre documenté. Préparer avant envoi les UUID/commandes et un oracle indépendant des projections : montants en centimes exacts, priorités triées, maximum d’échanges et IDs attendus par rubrique/page. Couvrir >25 dans une colonne, une société et En retard, >10 tâches historiques, >5 priorités, égalités de dates, montants zéro/absent/grands, et liens facultatifs/historiques indépendants. Les données existantes sont séparées et leur empreinte préservée.

Trois parcours intégrés : (1) Après l’appel, cinq affaires, note de deux phrases/montant/étape/action datée, chronométrage ouverture du formulaire → dernière confirmation et relecture après reload ; (2) Reprise du matin, oracle Accueil 0–5 puis toutes pages Relances, Fait/report/rétablissement/refus/clôture explicite, minuit et DST sans modifier l’horloge système ; (3) Société complète, navigation et brouillon protégé, montant/étape/société A→B→aucune actualisant les deux totaux, correction du dernier échange et distinction avec Notes générales.

Réutiliser les recettes R2 déjà passées par domaine. Ajouter les vérifications intégrées qui traversent des frontières nouvelles : vieille lecture après mutation ne remplace pas le total récent, projection indisponible ne signifie pas zéro, réponse perdue puis retry/génération, expiration/reconnexion, stockage défaillant, clôture concurrente et champs indépendants. Tester focus/online/retour de session avec fiche maintenue ouverte. Un seul acteur coordonne DB/fixtures ; la concurrence est limitée aux scénarios prévus.

Mesures dans le navigateur, sans inclure la latence des appels CLI : vues utiles <2s, séries de confirmations avec durées brutes et répartition par chemin, 19/20 <1s sur la série annoncée ; ne pas prétendre qu’une moyenne globale prouve chaque chemin. Panneau froid ≤50ms / chaud ≤16ms, édition ≤16ms, retour visuel <100ms. Mesurer séparément mutation DOM et première frame ; ne pas ajouter deux RAF artificiellement puis les interpréter comme coût de l’application. Définir précisément froid/chaud, version, matériel, navigateur, réseau et taille réelle du jeu. Les parcours automatisés chronométrent l’exécution automatisée, pas la vitesse de rédaction humaine.

Surfaces Q6 : 1440×900, 2560×1440, 402×874 et tablette portrait/paysage ; captures inspectées, clavier/Tab/Échap/focus, manipulation tactile des actions essentielles et scroll horizontal limité au kanban. Preuves success/failed/non-exécuté distinctes ; aucune mesure absente transformée en réussite. Nettoyage exact par provenance dans l’ordre des dépendances, finaliseurs indépendants, empreinte préexistante inchangée et deuxième nettoyage idempotent. Tout nettoyage incomplet reste explicite avec manifeste conservé.

Ce lot est une recette fonctionnelle et de performance avant BMAD06. Il ne lance ni inventaire final de dette, ni refactorisation pédagogique, ni build/push/déploiement.


## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni mesure revendiquée. Après vérification des clôtures 3.1/3.7 et de l’intégration courante : TypeScript, tests ciblés somme exacte/absents/globalité/droits, agent-browser sur montant/étape/société et relecture des deux fiches, navigation, création préliée et histoire après changement d’employeur. Recette Q6 du jeu fictif 100 contacts/50 sociétés/200 opportunités/1 000 échanges : vues <2 s, sauvegarde <1 s dans 19/20 essais, réaction <100 ms, cinq parcours après appel sous une minute ; consigner chaque résultat et toute cible non exécutée/échouée. Captures desktop 1440×900/2560×1440, mobile 402×874/tablette inspectées, persistance après rechargement. Manifeste, empreintes et nettoyage exact des fixtures, mutation distante sérialisée ; aucune donnée préexistante effacée. Pas de build pendant développement ni déploiement frontend ; préparation/refactorisation/livraison production restent BMAD 06.
