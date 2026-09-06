# Couverture des exigences

Les capacités regroupent les exigences sans supprimer leurs règles détaillées, conservées dans les compagnons PRD, UX et architecture. Les arbitrages récents et NFR-005 retirée sont explicites dans le rapprochement d’architecture.

| Exigences source | Capacité | Contrat transversal |
| --- | --- | --- |
| FR-001 à FR-004 — Contacts | CAP-2, CAP-7, CAP-8 | AD-1/2/3/5/7 ; Q2/Q3 pour les détails proposés. |
| FR-005 à FR-010 — Sociétés et liens | CAP-2, CAP-3, CAP-7 | AD-1/2/3/5 ; historique et total calculés. |
| FR-011/012 — Opportunités | CAP-4, CAP-8 | AD-1/2/3/4/5/7 ; corrections UX prioritaires. |
| FR-013 — Actions | CAP-5, CAP-8 | AD-3/4 ; formulaires/historique sous Q4. |
| FR-014 — Relances et nouvelle arrivée Accueil | CAP-6 | AD-6 ; filtre des cinq priorités jamais appliqué à Relances. Q1 pour départages. |
| FR-015 — Échanges | CAP-7 | AD-5 ; au moins contact ou opportunité. Q3 pour modalités non validées. |
| FR-016 — Recherche proposée | Q5 | Pas de capacité acquise ou story prête avant arbitrage. |
| FR-017 — Archivage retiré | Non-goals | Ne pas réintroduire dans l’interface ou le modèle. |
| FR-018 — Accès privé | CAP-1, CAP-8 | AD-1/7/8 ; Q7 paramètres d’essai. |
| NFR-001 — Réactivité proposée | CAP-8, Q6 | Cibles chiffrées encore proposées, conventions de fluidité applicables. |
| NFR-002 — Persistance et échecs | CAP-8 | AD-2/3/4/7 ; protection par champ remplace dernier-écrit-gagnant. |
| NFR-003/004 — Web et confidentialité | Contraintes, CAP-1/8 | AD-1/7/8 ; conventions projet, interfaces accessibles. |
| NFR-005 — Sauvegarde retirée du POC | Non-goals | Aucune tâche de sauvegarde quotidienne/sept jours. |
| NFR-006 — Évolution | Architecture AD-2 | Futur adaptateur autorisé réutilise règles métier ; aucun connecteur POC. |
| SM-001 — Moins d’une minute | Success signal, CAP-4/5/8 | Protocole validé dans le PRD ; nombre d’essais encore Q6. |
| SM-002 — Aucune relance échue invisible | CAP-5/6 | Toutes les actions échues à faire accessibles, compteurs exacts après transitions. |
| SM-C01 / SM-C02 — Pas de perte, pas de faux retard | CAP-5/6/8 | Saisie persistée après rechargement ; du jour/future/terminée/annulée jamais en retard. Nombre d’essais sous Q6. |
| UJ-001 / UJ-002 / UJ-003 | CAP-2 à CAP-8 | Parcours et scénarios d’échec dans EXPERIENCE.md. |

Les journaux de discussion, menus de méthode, variantes visuelles non retenues et rapports intermédiaires ne sont pas reproduits dans le contrat. Les décisions qu’ils ont produites sont conservées dans les compagnons actifs ; les journaux restent disponibles pour traçabilité.
