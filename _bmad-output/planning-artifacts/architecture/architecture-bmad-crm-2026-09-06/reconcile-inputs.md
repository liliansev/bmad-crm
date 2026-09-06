# Décisions d’architecture et exigences source

Ce rapprochement accompagne le PRD et les documents UX. Le journal `.memlog.md` conserve les validations de Lilian. L’architecture est validée. Les décisions déléguées postérieures précisent les anciens arbitrages de réalisation.

| Source | Décision postérieure validée | Conséquence pour le développement |
| --- | --- | --- |
| PRD NFR-005 / A12 : sauvegarde de secours | Exigence quotidienne sur sept jours retirée explicitement par Lilian pour le POC, après validation antérieure. | Bloc et objectifs associés retirés des critères du POC. Aucune automatisation ou souscription correspondante. Persistance des enregistrements conservée. |
| PRD NFR-002 / A12 : dernier enregistrement réussi prioritaire entre onglets, règle proposée | Avertir avant le remplacement d’un champ modifié entre-temps ; conserver la saisie et permettre un choix explicite | Remplace le dernier-écrit-gagnant silencieux. Contrôle atomique côté serveur ; conflit conservant le brouillon, sans fusion automatique. |
| PRD A05/A06 : minimum de création proposé | Contact : au moins un prénom ou un nom. Société : nom obligatoire. Autres informations facultatives. | Appliquer les mêmes contraintes dans toutes les vues ; dériver le nom affiché sans champ obligatoire supplémentaire. Ne pas adopter implicitement les autres champs proposés par A05/A06. |
| PRD A03 : relations du contact proposées | Zéro ou une société actuelle par contact ; plusieurs opportunités possibles. | Un changement de société ne déplace ni les échanges historiques ni les sociétés des opportunités existantes. |
| UX : éligibilité des tâches post-clôture dans les cinq priorités ouverte | Accueil limité aux tâches des opportunités ouvertes. | Les tâches des opportunités gagnées/perdues restent dans Relances. Plafond cinq, sélection temporelle et absence de remplissage artificiel inchangés. |
| PRD description / UX Notes : articulation ouverte | Un seul champ Notes pour l’opportunité, sans Description séparée. | Carte et panneau éditent le même texte. Les échanges datés restent distincts ; modifier Notes ne change pas la dernière interaction. |
| PRD A08/A09 : valeurs initiales et saisie minimale proposées | Nouvelle opportunité par défaut À qualifier ; montant facultatif mais positif ou nul ; tâche avec intitulé et échéance obligatoires. | Validations communes à toutes les entrées. Montant vide distinct de zéro, étape modifiable, échéance à la journée. |
| Conventions générales : Neon, Prisma et Better Auth | Orientation spécifique de Lilian : POC Supabase + Vercel. | Supabase PostgreSQL et Supabase Auth proposés comme socle commun ; contraintes métier conservées. La sauvegarde de secours planifiée a ensuite été retirée du POC par Lilian. |

La [réconciliation UX](../../ux-designs/ux-bmad-crm-2026-09-06/reconcile-accueil.md) reste applicable : accueil distinct avec jusqu’à cinq priorités et vue Relances séparée. Les décisions UX validées sur le glisser-déposer, le panneau droit et les notes éditables sur carte priment sur les propositions antérieures incompatibles.

Les autres hypothèses du PRD et d’EXPERIENCE.md restent ouvertes sauf validation explicite dans le journal d’architecture.

## Précisions postérieures prises par délégation

Les [décisions déléguées](../../epics-support/decisions-deleguees.md) résolvent Q1–Q6 et complètent les critères des stories. Q7 reste un prérequis de paramètres réels. Elles remplacent les anciennes mentions de propositions pour les seuls points explicitement listés et écartent recherche et suppression du POC.

La date de clôture prévisionnelle optionnelle de PRD §5.3/A08 est explicitement écartée du POC par les décisions déléguées Q2 ; aucun champ correspondant à ajouter au modèle ou aux formulaires.
