# Critique BMAD du PRD — 5 septembre 2026

Le PRD porte un problème clair et un parcours principal validé. Les détails ajoutés en mode rapide contiennent toutefois des restrictions non demandées et quelques cas non traités. Une critique identifie ces écarts ; elle ne remplace pas un arbitrage produit ni une validation terrain.

Deux lectures indépendantes : adversarial (12 constats) et edge-case-hunter (3 constats). Les recoupements sur l'annulation et la correction d'action sont conservés. Les constats se rapportent au brouillon avant arbitrages issus de cette critique. Les corrections proposées ci-dessous ne sont pas appliquées au comportement produit.

## adversarial

### C01 — §3 ; FR-011 ; FR-015

- Constat : Une opportunité peut exister sans contact, mais son échange exige un contact.
- Proposition : Proposer un échange lié à une opportunité ou un contact, avec au moins un des deux.
- Conséquence sans clarification : Le parcours après appel impose une création supplémentaire.

### C02 — A06 ; FR-008 ; FR-009

- Constat : Le contact principal doit appartenir à l'entreprise de l'opportunité.
- Proposition : Proposer des liens indépendants sans blocage en cas de différence.
- Conséquence sans clarification : Un prescripteur externe ou un changement d'employeur devient impossible à représenter simplement.

### C03 — FR-010

- Constat : Les échanges anciens suivent les liens actuels d'un contact changeant d'entreprise.
- Proposition : Arbitrer un rattachement historique d'entreprise conservé sur l'échange.
- Conséquence sans clarification : Le dernier échange d'une entreprise peut concerner une autre entreprise.

### C04 — FR-007

- Constat : Le CA gagné cumule les montants estimés sans période et assimile les absences à zéro.
- Proposition : Proposer Montant des opportunités gagnées — total cumulé, avec décompte des montants non renseignés.
- Conséquence sans clarification : Le total commercial est interprété comme du CA réel.

### C05 — FR-012 ; FR-013

- Constat : Une opportunité clôturée ne peut plus avoir de prochaine action.
- Proposition : Arbitrer le suivi après gain ou perte sans réouverture forcée.
- Conséquence sans clarification : Le suivi commercial fausse le pipeline et ses totaux.

### C06 — FR-012

- Constat : La clôture termine une action qui n'a pas été réalisée.
- Proposition : Distinguer action réalisée et action annulée.
- Conséquence sans clarification : L'historique rapporte une réalisation fictive.

### C07 — FR-013

- Constat : Aucun chemin ne corrige une action inutile ou terminée par erreur.
- Proposition : Proposer annulation et rétablissement avec contrôle de l'action active unique.
- Conséquence sans clarification : Corriger une erreur exige une duplication ou une fausse réalisation.

### C08 — SM-001 ; UJ-001

- Constat : Le chronométrage exclut recherche et création des relations.
- Proposition : Expliciter les bornes et mesurer séparément le nouveau prospect.
- Conséquence sans clarification : La recette réussit sans mesurer tout le parcours réel.

### C09 — §9

- Constat : Une hypothèse regroupe plusieurs décisions indépendantes.
- Proposition : Séparer en blocs d'arbitrage cohérents avec statut individuel.
- Conséquence sans clarification : Un accord partiel est interprété comme une validation globale.

### C10 — FR-017

- Constat : L'archivage a été ajouté sans besoin confirmé.
- Proposition : Soumettre son inclusion ou report comme arbitrage autonome.
- Conséquence sans clarification : Le périmètre pédagogique prend des états secondaires non nécessaires.

### C11 — FR-018 ; NFR-005

- Constat : La destination locale fictive ou hébergée réelle n'est pas fixée.
- Proposition : Arbitrer la destination avant les contraintes d'exploitation.
- Conséquence sans clarification : La formation absorbe un chantier d'exploitation non prévu.

### C12 — NFR-002 ; FR-018

- Constat : La redirection sur session expirée ne précise pas le sort de la saisie.
- Proposition : Définir la récupération après connexion ou le traitement de perte.
- Conséquence sans clarification : Les notes disparaissent malgré la promesse de conservation.

## edge-case-hunter

### E01 — FR-011 ; FR-012 ; FR-017

- Constat : Une opportunité archivée est rouverte.
- Proposition : À arbitrer : restaurer automatiquement à la réouverture.
- Conséquence sans clarification : Une opportunité ouverte reste archivée.

### E02 — FR-013

- Constat : Une action devient inutile sur une opportunité ouverte.
- Proposition : À arbitrer : annulation avec motif et nouvelle action possible.
- Conséquence sans clarification : Il faut déclarer réalisée une action abandonnée.

### E03 — FR-013

- Constat : Une action est terminée par erreur puis une suivante est créée.
- Proposition : À arbitrer : rétablissement seulement sans action active, sinon remplacement explicite.
- Conséquence sans clarification : Une correction peut casser l'unicité de prochaine action.

## Blocs d'arbitrage proposés

1. **Saisie et relations** : contact principal indépendant de l'entreprise ; échange avec au moins un contact ou une opportunité ; entreprise historique conservée à l'enregistrement de l'échange. Si un contact et une opportunité sont présents, l'entreprise de l'opportunité est proposée en priorité, celle du contact sinon ; le freelance peut corriger ou retirer l'entreprise. Changer ultérieurement un employeur ne déplace pas les échanges passés. Un échange créé sans entreprise reste sans entreprise tant qu'il n'est pas corrigé explicitement.
2. **Relances et clôture** : permettre un suivi après gain/perte sans changer l'étape ; à la clôture conserver ou annuler explicitement l'action, jamais prétendre qu'elle a été réalisée. Permettre annulation et correction sans deux actions actives ; la rubrique sans prochaine action reste limitée aux opportunités ouvertes. Si archivage retenu, aucune action active ne doit être masquée.
3. **Montants et périmètre** : afficher un total cumulé des opportunités gagnées et un nombre de montants manquants, sans assimilation à la facturation ; décider séparément si l'archivage apporte assez de valeur à la V1.
4. **Livraison et recette** : trancher démonstration locale ou outil interne hébergé ; adapter accès/sauvegarde ; préciser conservation des notes après expiration et bornes de l'objectif de temps.

Ces blocs restent proposés. Le bloc 1 est soumis en premier ; les suivants seront arbitrés dans l'ordre, sans validation implicite ni passage automatique à UX.

## Vérifications documentaires

18 identifiants FR et 6 identifiants NFR uniques. Les deux accords de Lilian (après appel, puis pipeline) sont enregistrés dans le PRD et le journal. Le statut reste draft. Les sources ont été rapprochées dans reconcile-cadrage.md.


## Suivi après arbitrage — Saisie et relations

Lilian a validé le bloc 1. Constats C01, C02 et C03 traités dans le PRD (glossaire, UJ-001, FR-008 à FR-010 et FR-015). Le contact obligatoire et le blocage d'entreprise ont été retirés ; le rattachement historique d'entreprise est désormais la règle. Les autres blocs restent en attente. Les constats d'origine ci-dessus sont conservés comme historique de revue.

## Suivi après arbitrage — Relances après clôture

Lilian valide le bloc relances : suivi sur opportunités gagnées/perdues sans réouverture ; choix conserver/annuler à la clôture ; annulation et correction d’achèvement sans deux actions actives ; visibilité toutes étapes et rubrique sans action limitée aux opportunités ouvertes. C05, C06, C07, E02 et E03 sont traités dans le PRD. E01 reste lié à l’arbitrage archivage ; une règle proposée empêche qu’il contredise désormais la visibilité validée.

## Suivi après arbitrage — Montant des opportunités gagnées

Lilian valide le libellé et le total HT cumulé toutes dates des opportunités actuellement gagnées, avec montant facultatif, compteur des montants manquants et recalcul après modification/réouverture/changement d’entreprise. C04 est traité dans FR-007, le glossaire et UJ-003. L’effet éventuel des archives reste proposé, sans validation implicite.

## Suivi après arbitrage — Archivage hors V1

Lilian reporte l’archivage et la restauration de fiches hors V1. C10 est résolu par réduction du périmètre ; E01 devient sans objet pour la V1. FR-017 est conservé comme identifiant retiré ; les vues, dépendances et critères de recette liés aux archives ont été supprimés du périmètre actif. La suppression définitive n’est pas décidée par ce report.

## Suivi après arbitrage — Version hébergée et accès

Lilian valide une version hébergée privée à compte propriétaire unique, avec connexion par identifiant et mot de passe. L’ambiguïté locale/hébergée de C11 est levée. La solution technique et la récupération du compte restent à préciser en architecture ; les objectifs de sauvegarde ne sont pas implicitement validés. C12 (saisie lors d’une expiration de session) reste ouvert.

## Suivi après arbitrage — Accès et protection de la saisie

Lilian valide l’adresse e-mail comme identifiant, le compte créé à l’installation, la réinitialisation par e-mail, la récupération du contenu après reconnexion lorsque la session expire et la conservation de saisie avec erreur visible après échec d’enregistrement. C12 est traité dans FR-018 et NFR-002 ; la recette inclut les parcours de reconnexion et de réinitialisation. Cela résout la contradiction documentaire ; le comportement n’est pas encore implémenté ni testé en runtime.

## Suivi après arbitrage — Mesure de moins d’une minute

Lilian valide le chronométrage de l’ouverture du formulaire à la confirmation, les contenus des parcours création/mise à jour, la mesure séparée des nouvelles relations sans seuil d’une minute et la vérification après rechargement. C08 est résolu par délimitation explicite de SM-001. Le nombre d’essais reste une proposition de recette. Aucun résultat de performance n’est revendiqué.

## État courant à la revue finale

C01–C08 et C10–C12 sont traités par les arbitrages documentés ; C09 est traité par séparation des accords et transfert explicite des détails résiduels avec responsables et moment de décision. E02/E03 sont traités ; E01 est sans objet après exclusion de l’archivage. Ces résolutions concernent le PRD, pas du code testé. Les constats initiaux restent conservés pour l’audit. La revue rubric ne relève aucun blocage produit pour débuter l’UX ; les propositions résiduelles restent non validées.
