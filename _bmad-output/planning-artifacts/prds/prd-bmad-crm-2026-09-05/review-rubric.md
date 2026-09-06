# PRD Quality Review — CRM web pour consultants et freelances

## Overall verdict

Le PRD fournit une base solide pour commencer l’UX d’un CRM individuel pédagogique : problème, parcours après appel, visibilité des relances, relations historiques et exclusions structurantes sont explicites. Aucun manque produit majeur ne bloque cette étape ; avant de le présenter comme finalisé, il faut réconcilier les statuts documentaires avec les décisions récentes et conserver les détails résiduels comme propositions, sans les transformer en nouveaux arbitrages bloquants.

Revue du 5 septembre 2026, sur `prd.md` et `review-critique.md`. Aucun addendum présent. Aucun comportement implémenté ou testé n’est revendiqué.

## Decision-readiness — adequate

Les blocs validés donnent des décisions exploitables : un propriétaire, saisie manuelle, étapes fixes, prochaine action unique, suivi après clôture et archivage hors V1. Les choix de fournisseur, stockage et sessions sont correctement réservés à l’architecture. La demande actuelle de passer à l’étape suivante permet de présenter la sortie du PRD ; elle ne valide pas implicitement chaque détail des hypothèses A01–A13.

### Findings
- **medium** Statut de transition obsolète (§8) — « ne constitue pas un accord pour passer à l’étape UX » reflète la phase antérieure et contredit désormais la demande de progression. *Fix:* actualiser la position de sortie lors de la finalisation, avec les réserves restantes explicitement conservées. Ce point bloque une annonce honnête de finalisation, pas la préparation UX.

## Substance over theater — strong

Un seul utilisateur, un problème concret et deux objectifs opérationnels ; aucune persona marketing ni innovation artificielle. Les cibles NFR sont spécifiques au volume pédagogique et sont présentées comme proposées, pas mesurées. Le PRD ne nécessite ni étude de marché complémentaire ni promesse de différenciation pour cet usage interne.

## Strategic coherence — strong

Les fonctionnalités servent le même parcours : saisir après appel, relier l’échange à son contexte, décider de la prochaine action et retrouver les relances. SM-001 et SM-002 testent cette thèse ; SM-C01 et SM-C02 empêchent d’obtenir artificiellement de bons résultats par perte de données ou faux retards. Les reports des intégrations, du score, des étapes personnalisables et des archives soutiennent la simplicité de la V1.

## Done-ness clarity — adequate

Les FR décrivent des conséquences vérifiables, y compris les erreurs, états vides, corrections de relations et actions après clôture. SM-001 délimite désormais précisément le chronométrage et sépare les nouvelles relations. Les dates des relances, le fuseau et le comportement à minuit sont documentés.

### Findings
- **low** Recette des propositions (§5–7) — certains critères précis restent sous hypothèse : validation du montant, gestion des doublons, nombre d’essais, sauvegarde 7 jours. *Fix:* préserver leur statut de cible proposée dans le transfert UX/architecture ; les approuver ou ajuster au moment où ils deviennent nécessaires à une story. Ils ne justifient pas de retarder l’UX.

## Scope honesty — adequate

Les exclusions sont explicites et FR-017 est correctement retirée sans recycler son identifiant. La suppression définitive des fiches reste distincte de l’archivage et peut être décidée avant usage de vraies données. L’e-mail de récupération est distingué de l’intégration commerciale. Aucun connecteur anticipé n’est exigé.

### Findings
- **medium** Portée des hypothèses trop large (§3, §8, §9) — A03 qualifie encore de proposées des définitions contenant des règles validées ; A02 conserve Europe/Paris dans son libellé non validé alors que l’arbitrage dates l’a confirmé. La phrase « A01 à A13 restent à arbitrer » rend les accords partiels difficiles à extraire. *Fix:* distinguer, pour chaque bloc, décisions acquises et seuls détails restants ; ne pas rouvrir les décisions validées. Le mécanisme de regroupement reste utile, inutile de créer treize nouvelles étapes.

## Downstream usability — adequate

Glossaire, FR, NFR, parcours et critères sont identifiables et utilisables par UX puis architecture. Les trois parcours ont Lilian comme protagoniste. L’historique d’entreprise évite une ambiguïté importante du modèle. Les décisions d’interface comme le glisser-déposer ne sont pas imposées sans besoin.

### Findings
- **medium** Suivi de critique à consolider (`review-critique.md`, paragraphes historiques et suivis) — les suivis résolvent C01–C08, C10–C12 et E01–E03, mais des phrases antérieures disent encore « blocs restent proposés », « C12 reste ouvert ». C09 reste partiellement traité par le registre. *Fix:* ajouter en tête un état courant synthétique, puis conserver les constats datés comme historique ; l’UX doit lire immédiatement ce qui est encore ouvert.

## Shape fit — adequate

La forme spécification de capacités avec trois parcours est adaptée à l’outil interne et à la démonstration BMAD. La rigueur sur les relances et la persistance est utile, mais les nombreux blocs de validation rendent le document plus long que le produit ne l’exige. Une sortie accélérée peut conserver ces éléments en trace et présenter une synthèse canonique des décisions, sans nouvelle recherche ni nouveaux besoins.

## Mechanical notes

- FR-001 à FR-018 sont uniques ; FR-017 est explicitement retirée. NFR-001 à NFR-006 et UJ-001 à UJ-003 sont continus. Références de recette existantes cohérentes.
- A01 à A13 ont des entrées et des marqueurs correspondants ; le défaut porte sur le statut partiel, pas sur des identifiants manquants.
- Le paragraphe « Arbitrage validé — Après appel » cite encore définition du retard, tri, clôture et réouverture comme restant à arbitrer ; les blocs suivants les ont tranchés. Mettre cette phrase à jour ou la qualifier comme historique.
- Dates récentes bien reportées dans le bloc validé, FR-014 et A09 : journée sans heure, Europe/Paris, À venir, ancienneté et sorties des relances.
- Aucun blocage UX additionnel : champs secondaires, départage des échanges à date égale, taille de recette et mécanisme de sauvegarde peuvent rester ouverts avec responsable et moment de décision. La revue n’autorise ni implémentation de ces propositions ni exploitation avec données réelles.
