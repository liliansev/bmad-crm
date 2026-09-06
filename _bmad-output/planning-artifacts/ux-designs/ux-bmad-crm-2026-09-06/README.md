# Expérience V1 du CRM

**Dossier UX clôturé le 6 septembre 2026. Maquettes validées par Lilian.** Usage ordinateur prioritaire, interface simple et minimaliste inspirée de Folk. Aucune application n’a été développée dans cet atelier.

## Documents

- [EXPERIENCE.md](EXPERIENCE.md) : navigation, comportements, états et parcours.
- [DESIGN.md](DESIGN.md) : référence visuelle et transcription des tokens.
- [Réconciliation avec le PRD](reconcile-accueil.md) : accueil de priorités distinct de Relances.
- [Journal des décisions](.memlog.md) : validations, corrections et questions encore ouvertes.

## Références visuelles approuvées

| Surface | Référence | Décisions principales |
|---|---|---|
| Pipeline et fiche opportunité | [Vue A compacte](mockups/pipeline-a.png) | Menu à gauche, cinq étapes, glisser-déposer, édition montant/notes sur carte et enregistrement à la sortie du champ ; panneau de fiche à droite. |
| Accueil | [Maquette Accueil](mockups/key-accueil-a.png) | Cinq tâches maximum : en retard/du jour par proximité de signature, puis prochaines échéances s’il reste des places. Agenda externe. |
| Contacts | [Maquette Contacts](mockups/key-contacts-a.png) | Prénom, nom, e-mail, titre, dernière interaction, LinkedIn, société et opportunité. Pas de prochaine interaction ; photo non retenue dans cette maquette. |
| Relances | [Maquette Relances](mockups/key-relances-a.png) | Vue séparée, rubriques temporelles ; terminer ou changer la date directement sur la ligne. |

Les quatre images sont des références statiques, avec données fictives signalées. Les sidecars JSON indiquent leur approbation et conservent les prompts ; les prompts sont aussi intégrés aux PNG. Les variantes B et C et les sources de travail restent dans `.working/` pour traçabilité.

## Portée de la validation

La validation porte sur les dispositions et comportements explicitement retenus. Les règles des documents priment sur les imperfections de génération : les chiffres des colonnes du kanban ne sont pas des compteurs réels ; une saisie en cours ne peut pas être présentée comme enregistrée ; une échéance du jour n’est pas une échéance en retard.

La liste et les fiches Sociétés, la fiche Contact, les formulaires de création, les écrans d’accès au compte et les états alternatifs restent décrits dans les documents. Leur couverture documentaire sans maquette supplémentaire est acceptée. Lilian a décliné la revue UX facultative et demandé de passer à la suite. Les arbitrages fonctionnels résiduels sont conservés dans EXPERIENCE.md et le PRD ; une maquette approuvée ne vaut pas leur validation implicite.

## Passage à la suite

Prochaine étape : `bmad-architecture`, à partir du PRD, de DESIGN.md, d’EXPERIENCE.md et de reconcile-accueil.md. Les décisions métier encore ouvertes restent soumises à Lilian avant de figer le modèle ou les stories concernés.
