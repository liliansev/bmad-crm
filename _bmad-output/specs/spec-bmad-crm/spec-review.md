# Revue de la spécification CRM

Revue du 6 septembre 2026, limitée à la cohérence et à la préservation du contrat documentaire. Rapport opérationnel, hors `companions:` ; aucun document source ou ADR modifié.

## Verdict

**Cohérence : conforme. Préservation : conforme. Aucun blocage pour préparer les epics.** Les stories dépendant de Q1–Q7 restent soumises à leur arbitrage avant implémentation.

- Les huit capacités CAP-1 à CAP-8 ont chacune un `intent` décrivant le besoin et un `success` vérifiable. Leurs identifiants correspondent au journal canonique et sont uniques.
- Les contraintes orientent effectivement la construction ; exclusions et signal de réussite sont explicites. Le noyau reste sans diagramme et renvoie les prescriptions techniques aux compagnons.
- Les neuf compagnons existent. PRD, UX, architecture et décisions postérieures sont adoptés, ce qui conserve les exigences détaillées au-delà des résumés des capacités. Aucun journal, README ou rapport de revue n’est adopté.
- Les règles acquises sur contacts, sociétés, Notes unique, tâches, clôture, conflits, Accueil et Relances correspondent au rapprochement d’architecture. Les protections AD-1 à AD-8 sont conservées sans nouvelle variante.
- Q1–Q7 restent ouverts : aucun ordre commercial exhaustif, départage, validation résiduelle, formulaire secondaire, historique, recherche, suppression, déconnexion explicite, cible complémentaire de recette ou paramètre de déploiement n’est implicitement adopté.
- NFR-005 et ses objectifs associés sont retirés ; persistance et récupération des saisies demeurent requises. Aucun abonnement, export périodique ou dispositif de sauvegarde n’est réintroduit.

## Amélioration de traçabilité non bloquante

`coverage.md` référence SM-001 mais ne nomme pas SM-002, SM-C01 et SM-C02. Leurs obligations sont préservées par le PRD adopté et les capacités CAP-5/6/8 ; il ne s’agit pas d’une perte du contrat. Pour l’extraction vers les epics, ajouter une ligne explicite pour la visibilité exhaustive des relances, la persistance et l’absence de faux retards. Conserver Q6 pour le nombre d’essais proposé.

## Limite

Cette revue ne revérifie pas les versions logicielles sur Internet et ne teste aucune application. Les preuves documentaires du socle restent celles du compagnon `stack-evidence.md`, avec vérification réelle prévue au scaffold.
