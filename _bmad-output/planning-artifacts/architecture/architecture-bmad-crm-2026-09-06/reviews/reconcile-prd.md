# Rapprochement PRD → architecture

Date : 6 septembre 2026. Revue documentaire ; aucune implémentation ou vérification runtime.

Sources : PRD final et ses arbitrages §10, journal d’architecture, `reconcile-inputs.md`, `ARCHITECTURE-SPINE.md`, `arbitrages-restants.md` ; EXPERIENCE consulté pour le statut des propositions secondaires.

**Verdict : cohérent sur les décisions centrales, avec deux corrections de traçabilité à intégrer avant clôture.** Aucun besoin de rouvrir les accords déjà donnés.

## Constats et corrections

1. **Déconnexion encore proposée devenue capacité acquise.** Le PRD FR-018/A11 conserve la déconnexion explicite comme proposition, et EXPERIENCE ligne 169 confirme ce statut après acceptation de la couverture documentaire. Aucun accord postérieur n’apparaît dans le journal. Pourtant Q5 dit « Déconnexion fonctionnelle prévue », en ne reportant que sa présentation. Correction : conserver la commande de déconnexion explicite comme arbitrage A11 ; AD-1 peut fixer dès maintenant la purge de données/cache lors de toute fin de session, sans décider implicitement de l’ajout d’un bouton. La connexion et la récupération de mot de passe restent acquises.

2. **Réutilisation future des règles d’échange seulement implicite.** NFR-006 demande à l’architecture d’expliquer comment une future importation réutiliserait les rattachements et calculs de dernière interaction sans ressaisie des fiches. AD-2 centralise déjà les écritures et AD-5 les règles, mais le lien avec cette demande n’est pas énoncé. Correction documentaire légère : préciser qu’un futur adaptateur d’import, uniquement après arbitrage de cette évolution, appellerait les mêmes commandes métier/RPC et les mêmes projections ; aucun connecteur ou contrat d’import n’est à construire pour le POC. Conserver le statut source proposé de NFR-006/A12 ; cette explication ne valide pas une future fonctionnalité.

## Accords correctement conservés

- L’orientation spécifique Supabase + Vercel remplace les anciennes conventions Neon/Better Auth ; aucun abonnement n’est autorisé implicitement.
- Le retrait explicite de NFR-005 prime sur l’acceptation antérieure : ni sauvegarde quotidienne, ni rétention sept jours, ni objectifs associés de restauration à remettre dans le POC. Persistance normale et conservation de saisie restent exigées.
- Notes unique sur l’opportunité, échanges datés distincts ; minimum contact/société ; société actuelle unique du contact ; relations historiques indépendantes ; montant facultatif positif ou nul ; étape initiale À qualifier ; intitulé et date de tâche sont conformes aux validations postérieures.
- Une action active maximum ; clôture conserver/annuler atomique ; réouverture sans réactivation ; rétablissement sans deuxième action active ; opportunités closes toujours admissibles dans Relances mais exclues des cinq priorités Accueil.
- Compteur des montants gagnés absents distinct de zéro ; totaux dérivés ; identité propriétaire, récupération d’accès, conservation des brouillons et absence de confirmation trompeuse sont présents.
- Les détails de classement, échanges, suppression, formulaires et recette restent ouverts. L’absence de catalogue exhaustif de champs dans un document d’architecture ne retire pas les champs hérités du PRD : le découpage doit continuer à lire les sources et leurs corrections.

## Point à expliciter lors de la validation d’architecture

AD-3 choisit un conflit à l’échelle de la fiche alors que l’accord utilisateur portait sur le même champ modifié entre onglets. Le texte annonce bien cette granularité conservatrice et le document est encore proposé à validation : ce n’est donc pas présenté comme un accord utilisateur antérieur. Conserver cette distinction lors de la validation globale, car modifier le montant dans un onglet pourra aussi interrompre une sauvegarde de notes dans l’autre.

