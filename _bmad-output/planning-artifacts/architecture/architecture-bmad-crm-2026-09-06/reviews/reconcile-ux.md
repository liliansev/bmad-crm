# Rapprochement UX → architecture

Date : 2026-09-06. Périmètre : traçabilité des décisions, sans audit visuel ni nouvelle revue des maquettes. Sources lues : DESIGN.md, EXPERIENCE.md, journal d’architecture, ARCHITECTURE-SPINE.md, reconcile-inputs.md et arbitrages-restants.md. Aucun code applicatif testé.

**Verdict : décisions essentielles conservées ; deux précisions documentaires à traiter avant de présenter l’ensemble comme entièrement harmonisé.** Le rapprochement n’ajoute aucune nouvelle validation métier.

## 1. Expérience principale conservée

AD-6 reprend les cinq tâches maximum, le groupe échues/du jour puis le complément à venir, l’exclusion validée des opportunités closes à l’accueil et leur maintien dans Relances. L’agenda reste externe. AD-7 conserve l’édition du montant et des notes sur carte avec enregistrement à la sortie du champ, le panneau droit, les brouillons en échec et la confirmation après persistance. Q4 conserve explicitement le report et l’achèvement depuis Relances. AD-5 conserve le champ Notes unique, distinct des échanges et de la dernière interaction.

La direction Folk compacte, l’usage ordinateur, la navigation dans l’ordre Accueil/Contacts/Sociétés/Pipeline/Relances, le kanban visible derrière le panneau et les colonnes de Contacts restent dans les deux sources UX liées par la spine. Leur absence de duplication détaillée dans la spine ne constitue pas une perte : les transmettre avec les deux sources aux stories d’interface.

## 2. Mentions UX devenues obsolètes — mineur

EXPERIENCE.md présente encore le minimum de création comme ouvert dans la carte des surfaces, Formulaire métier, le parcours Contacts et la table des arbitrages. DESIGN.md, ligne Liste de contacts, dit également « minimum de création encore ouvert ». Ces mentions ont été remplacées par les validations postérieures : contact avec prénom ou nom, société avec nom, autres informations facultatives (AD-5, Q2, reconcile-inputs.md).

EXPERIENCE.md indique également que les comportements multi-onglets restent à confirmer selon A12, alors que la protection des modifications concurrentes a été validée. Recommandation : marquer ces points comme tranchés en architecture, sans fermer les validations de format, champs supplémentaires, modalités de formulaire ni autres hypothèses A12. La règle de priorité du compagnon empêche déjà une contradiction opérationnelle, mais un lecteur UX isolé pourrait reposer les questions.

## 3. Granularité des conflits — précision de portée

La validation utilisateur porte sur un champ modifié entre deux lectures. AD-3 propose une révision de fiche entière : une modification indépendante, par exemple le montant dans un autre onglet, peut alors produire un conflit lors de l’enregistrement des notes. La protection validée est respectée, mais cette friction supplémentaire n’a pas été explicitement approuvée par Lilian. La spine la présente bien comme une proposition technique dans un dossier encore draft. Recommandation : conserver cette distinction lors de la validation de l’architecture ; ne pas attribuer à Lilian l’approbation de cette granularité. Une autre possibilité serait un contrôle atomique par champs concernés, sans imposer ici ce choix technique.

## 4. Arbitrages et périmètre POC correctement préservés

Q1 garde les départages et l’ordre commercial exhaustif ouverts ; Q2–Q5 ne transforment pas les surfaces documentées en ajout automatique de champs, recherche, historique ou suppression. Les modalités des formulaires hors carte restent ouvertes. Supabase + Vercel est le socle courant ; AD-8 et la conclusion des arbitrages retirent expressément NFR-005, sans remettre la sauvegarde quotidienne avec rétention sept jours à l’ordre du jour. La revue UX facultative déclinée n’a pas été exécutée dans ce rapprochement.
