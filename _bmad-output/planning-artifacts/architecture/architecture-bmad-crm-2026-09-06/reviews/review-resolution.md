# Résolution des rapprochements et revues

Architecture proposée à validation. Revue documentaire, sans test de l’application.

| Origine | Constat | Résolution |
| --- | --- | --- |
| Rapprochements PRD/UX | Conflit au niveau fiche plus large que le champ validé | AD-3 corrigée : versions par champ, révision globale pour cache et révision de workflow pour opérations étape/tâche. Le constat historique est résolu. |
| Rapprochement PRD | Déconnexion explicite promue implicitement | Commande remise en Q5 ; purge technique à fin de session conservée. |
| Rapprochement PRD | Réutilisation future des règles d’échanges implicite | AD-2 nomme les mêmes commandes/projections pour un futur adaptateur autorisé ; aucun connecteur POC ajouté. |
| Rapprochement UX | Minima et concurrence encore ouverts dans EXPERIENCE | Sources UX/PRD et registres alignés sur les accords déjà enregistrés. |
| Rubric walker | Versions de base absentes de la persistance des brouillons | AD-7 conserve les versions de base avec chaque brouillon à travers la reconnexion. |
| Rubric walker | Ordre migrations/code non fixé | AD-8 définit migration compatible, code consommateur, retrait ultérieur ; échec bloque déploiement dépendant. |
| Revue de versions | Liens starter canary mobiles | Liens de preuve figés à la révision relevée ; réinspection demandée au scaffold. |
| Revue adversariale | Cache ancien au retour dans un onglet | Revalidation commune au retour premier plan, reconnexion et reprise réseau ; brouillons préservés. |
| Revue adversariale | Confirmation pouvant effacer une saisie plus récente | Confirmation limitée au champ, commande et génération concernés ; écritures du même champ sérialisées. |

Aucun blocage critique ou haut signalé par les trois reviewers. Les précisions ont été incorporées sans ajouter de décision métier ni réintroduire la sauvegarde retirée. Les choix Q1–Q7 restent soumis à leur condition de reprise ; les stories dépendantes ne sont pas autorisées à choisir chacune une règle différente.
