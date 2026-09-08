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

## Spec Change Log

## Review Triage Log

## Verification

Draft sans baseline ni mesure revendiquée. Après vérification des clôtures 3.1/3.7 et de l’intégration courante : TypeScript, tests ciblés somme exacte/absents/globalité/droits, agent-browser sur montant/étape/société et relecture des deux fiches, navigation, création préliée et histoire après changement d’employeur. Recette Q6 du jeu fictif 100 contacts/50 sociétés/200 opportunités/1 000 échanges : vues <2 s, sauvegarde <1 s dans 19/20 essais, réaction <100 ms, cinq parcours après appel sous une minute ; consigner chaque résultat et toute cible non exécutée/échouée. Captures desktop 1440×900/2560×1440, mobile 402×874/tablette inspectées, persistance après rechargement. Manifeste, empreintes et nettoyage exact des fixtures, mutation distante sérialisée ; aucune donnée préexistante effacée. Pas de build pendant développement ni déploiement frontend ; préparation/refactorisation/livraison production restent BMAD 06.
