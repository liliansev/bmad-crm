---
title: "PRD — CRM web pour consultants et freelances"
status: final
created: 2026-09-05
updated: 2026-09-06
mode: accelerated-guided
workflow_stage: complete
---

# CRM web pour consultants et freelances

## 1. Vision et usage du document

Les décisions postérieures UX/architecture du 6 septembre 2026 sont rapprochées dans [reconcile-inputs.md](../../architecture/architecture-bmad-crm-2026-09-06/reconcile-inputs.md). Le socle actuel est un POC Supabase + Vercel ; ce rapprochement distingue les corrections validées des propositions encore ouvertes.

**État :** PRD finalisé comme référence de cadrage pour l’UX ; revue finale sans blocage produit. La finalisation ne vaut pas acceptation des propositions résiduelles. Les décisions validées sont distinguées des propositions résiduelles, transférées avec leur responsable et leur étape de reprise en §8.

Le CRM aide un consultant indépendant à garder le fil de ses échanges commerciaux. Après un appel, il enregistre ses notes, actualise son opportunité et fixe la prochaine action au même endroit. Lorsqu'il revient, il voit immédiatement les relances à traiter.

Le produit est un outil interne à utilisateur unique, support d'une mini-formation suivant la méthode BMAD. Ce PRD définit les comportements attendus pour les étapes UX, architecture, epics et stories. Il ne constitue ni une implémentation ni une validation auprès d'utilisateurs réels. Le brief initial du 4 septembre est resté un brouillon sans contenu produit ; les échanges de cadrage avec Lilian constituent la source du présent document.

Lilian a confirmé le problème, la cible, les fonctions principales, la saisie manuelle et les exclusions. Le 5 septembre, Lilian a demandé au PM de proposer rapidement les éléments manquants, puis a précisé vouloir arbitrer chaque étape. Les marqueurs `[ASSUMPTION Axx]` identifient donc des propositions non validées. Le travail suit les étapes BMAD avec des arbitrages courts sur le PRD ; aucune finalisation ni transition vers une autre étape ne doit être déduite de la demande d’accélération. Aucune étude de marché n'est revendiquée.

## 2. Utilisateur, problème et périmètre

Le consultant travaille seul, gère 20 à 100 contacts actifs et assure ses appels et relances. Son chiffre d'affaires mensuel se situe autour de 3 000 à 5 000 € maximum. `[ASSUMPTION A01]` Ce montant décrit la cible pédagogique ; il ne conditionne pas l'accès au CRM.

Aujourd'hui, la prochaine action après un appel est notée ailleurs puis oubliée. La V1 doit permettre de créer ou mettre à jour une opportunité en moins d'une minute et de rendre visibles toutes les relances échues.

**Inclus :** contacts, entreprises, opportunités, pipeline, échanges manuels, notes, prochaine action et vue des relances. Les entreprises font partie de la V1, conformément aux usages détaillés par Lilian.

**Exclus par Lilian :** archivage et restauration de fiches, facturation, campagnes marketing, accès d’équipe, ouverture au public, intégrations d’appels et d’e-mail commercial. Les e-mails de réinitialisation du mot de passe sont inclus pour l’accès au compte. La présence d'une adresse e-mail ou d'un lien LinkedIn ne constitue pas une intégration.

`[ASSUMPTION A02]` Sont également exclus : IA, enrichissement, envoi de messages commerciaux, notifications de relance e-mail/push, synchronisation calendrier, fichiers joints, import en masse et autres automatismes. Le report du score et de la personnalisation des étapes est validé par Lilian. **Validé :** montants en euros et échéances selon Europe/Paris. `[ASSUMPTION A02 — détail restant]` L’interface est proposée en français.

## 3. Vocabulaire et relations

`[ASSUMPTION A03]` Les relations suivantes privilégient une saisie courte et un modèle compréhensible dans la formation.

- **Contact — validé en architecture** : personne physique ; appartient à zéro ou une entreprise actuelle et peut être contact principal de plusieurs opportunités.
- **Entreprise** : organisation à laquelle plusieurs contacts et opportunités peuvent être liés.
- **Opportunité** : prestation commerciale potentielle ; possède zéro ou une entreprise, zéro ou un contact principal, une étape et un montant estimé HT en euros.
- **Pipeline** : ensemble ordonné des étapes d'une opportunité.
- **Échange** : interaction réelle, saisie manuellement, rattachée à un contact, une opportunité ou les deux (au moins un obligatoire) ; contient date et heure, canal, notes et une entreprise historique facultative, conservée indépendamment des changements ultérieurs de relations.
- **Note de contact** : texte libre sur la fiche, distinct d'un échange ; la modifier ne change pas la date du dernier échange.
- **Prochaine action** : tâche commerciale liée à une opportunité, avec libellé, date d'échéance et état à faire, terminée ou annulée. Une opportunité possède au plus une prochaine action à faire ; les actions terminées ou annulées sont conservées.
- **Relance échue** : prochaine action à faire dont la date précède la date du jour à Paris. Les actions du jour sont « À faire aujourd'hui », pas « En retard ».
- **Montant des opportunités gagnées** : somme des montants HT renseignés des opportunités actuellement gagnées d’une entreprise, toutes dates confondues ; le nombre de montants absents est indiqué séparément. Ce total ne représente ni un montant facturé ni un encaissement.

## 4. Parcours de référence

La saisie des notes après appel vient du récit de Lilian. `[ASSUMPTION A04]` Les séquences complémentaires ci-dessous sont des exemples pédagogiques proposés par le PM, pas des observations terrain.

**UJ-001 — Après l'appel.** Lilian, connecté, recherche son prospect et ouvre son opportunité. Il ajoute un échange « Téléphone » avec une note courte, actualise l'étape, puis crée « Relancer sur la proposition » avec une échéance. Il reçoit la confirmation d'enregistrement. Après rechargement, notes, étape et prochaine action sont toujours présentes. Si le contact n'existe pas, il peut enregistrer l'échange directement sur l'opportunité sans créer de contact.

**UJ-002 — La reprise du matin.** Lilian ouvre le CRM sur la vue des relances. Il voit d'abord les actions en retard, puis celles du jour, puis les opportunités ouvertes sans prochaine action. Il ouvre une opportunité, lit le dernier échange et réalise la relance hors du CRM. Il marque l'action terminée et peut en définir une autre ; l'ancienne reste dans l'historique.

**UJ-003 — La lecture d'une entreprise.** Lilian ouvre une entreprise et retrouve ses contacts, ses opportunités, son montant des opportunités gagnées et son dernier échange. Il crée une opportunité préliée à cette entreprise, choisit un contact principal puis revient à la fiche entreprise, où l'opportunité apparaît.

## 5. Exigences fonctionnelles

Les identifiants FR-001 à FR-015 sont conservés depuis le cadrage. Les précisions ci-dessous relèvent des hypothèses référencées dans chaque groupe.

### 5.1 Contacts

**Validé en UX puis architecture :** un contact requiert au moins un prénom ou un nom ; le nom affiché est dérivé, sans troisième champ obligatoire. Les autres informations restent facultatives. La liste UX retient prénom, nom, e-mail, titre professionnel, dernière interaction, LinkedIn et relations société/opportunités. `[ASSUMPTION A05 — résiduel]` Les validations détaillées restent proposées ; téléphone, e-mails multiples et photo ne sont pas à ajouter implicitement.

- **FR-001 — Ajouter et modifier un contact.** Les valeurs enregistrées sont retrouvées après rechargement. Un e-mail mal formé empêche la sauvegarde et affiche une erreur près du champ sans effacer la saisie. Une adresse déjà utilisée sur un autre contact déclenche un avertissement non bloquant.
- **FR-002 — Accéder à LinkedIn.** Une URL HTTP(S) renseignée ouvre le profil dans un nouvel onglet. Une URL invalide est refusée ; sans URL, aucune action de profil n'est affichée.
- **FR-003 — Notes de contact.** Le freelance peut ajouter, modifier ou vider une note libre ; cette opération n'ajoute aucun échange.
- **FR-004 — Dernier échange du contact.** La fiche affiche le canal et la date/heure de l'échange le plus récent associé à ce contact, ainsi que l'accès à ses notes. Sans échange, elle affiche « Aucun échange enregistré ».

### 5.2 Entreprises, rattachements et montants

**Validé en architecture :** une entreprise requiert un nom ; les autres informations sont facultatives. `[ASSUMPTION A06 — résiduel]` Site web, notes et présentation détaillée restent proposés. **Validé :** une opportunité peut rester sans entreprise ou sans contact principal. Ces deux relations sont indépendantes : un contact externe à l'entreprise peut être contact principal, sans blocage ni modification automatique de ses relations.

- **FR-005 — Gérer une entreprise.** Le freelance crée et modifie une entreprise, consulte les contacts et opportunités liés et ouvre leurs fiches. Un nom vide empêche l'enregistrement.
- **FR-006 — Relier les opportunités.** Une opportunité créée depuis l'entreprise est préliée ; depuis une opportunité, le freelance peut choisir une entreprise existante ou retirer ce lien. La relation apparaît de façon identique sur les deux fiches après sauvegarde. Réalise UJ-003.
- **FR-007 — Montant des opportunités gagnées.** **Validé :** afficher la somme des montants HT renseignés des opportunités actuellement gagnées liées à l’entreprise, toutes dates confondues, et le nombre d’opportunités gagnées sans montant. Un montant absent est exclu de la somme et signalé, jamais présenté comme un montant zéro renseigné. Un zéro explicitement saisi reste un montant renseigné. Le total et le compteur sont recalculés après modification d’un montant, changement d’étape ou changement d’entreprise. En l’absence de montant renseigné, afficher 0 € avec le compteur de montants manquants s’il est non nul. Libellé : « Montant des opportunités gagnées ».
- **FR-008 — Contact principal.** Choisir, remplacer ou retirer le contact principal d'une opportunité. Le choix est indépendant de l'entreprise de l'opportunité ; changer l'employeur d'un contact ne force pas à modifier les opportunités dont il est contact principal.
- **FR-009 — Modifier les liaisons.** Modifier une relation ne supprime ni la fiche liée ni les échanges historiques. Les différences d'entreprise entre contact principal et opportunité ne bloquent pas la modification. Le rattachement historique d'entreprise des échanges est conservé ; sa correction est explicite sur l'échange.
- **FR-010 — Dernier échange sur chaque fiche.** **Validé :** le contact affiche ses échanges ; l'opportunité affiche ceux explicitement liés à elle ; l'entreprise affiche les échanges dont elle est l'entreprise historique enregistrée. Un changement d'employeur ou d'entreprise de l'opportunité ne déplace pas les anciens échanges. L'entreprise de l'échange est préremplie depuis l'opportunité, sinon depuis le contact, et reste modifiable. `[ASSUMPTION A07 — détails résiduels]` La date la plus récente détermine le dernier échange ; à date identique, le dernier créé est retenu. Sans entreprise préremplissable, le lien reste vide jusqu'à modification explicite.

### 5.3 Opportunités et pipeline

**Validé par Lilian (A08, partiel).** Champs : titre obligatoire, entreprise et contact principal facultatifs, montant HT estimé, date de clôture prévisionnelle facultative, Notes et étape. **Correction validée en architecture :** Notes est un champ unique, partagé par carte et panneau, sans Description distincte ; le modifier ne crée pas un échange. Étapes fixes : « À qualifier », « Échange en cours », « Proposition envoyée », « Gagnée », « Perdue ». **Validé :** le montant est facultatif. **Validé en architecture :** un montant renseigné doit être positif ou nul ; une nouvelle opportunité commence « À qualifier ». Les trois premières étapes sont ouvertes.

- **FR-011 — Créer et modifier toute opportunité.** Le freelance peut modifier chaque champ de toute opportunité, y compris gagnée ou perdue. Titre vide et montant négatif sont refusés sans perte des autres champs. Réalise UJ-001.
- **FR-012 — Parcourir le pipeline.** Voir les opportunités par étape et changer leur étape depuis leur fiche ; le déplacement par glisser-déposer est validé par l’UX, avec commande équivalente depuis la fiche. Tous les passages entre étapes sont autorisés. Passer à Gagnée ou Perdue demande, si une prochaine action est à faire, de choisir explicitement entre la conserver et l’annuler ; abandonner ce changement conserve l’étape et l’action. Une action annulée par ce choix ne compte pas comme réalisée. Rouvrir ne réactive pas les actions terminées ou annulées et place l'opportunité dans « Opportunités sans prochaine action » si nécessaire.

### 5.4 Prochaines actions et échanges

**Validé :** la prochaine action comporte une échéance à la journée, sans heure, selon Europe/Paris. **Validé en architecture :** le libellé et l’échéance sont obligatoires. Une date passée est autorisée et rend l'action immédiatement visible en retard. Il est possible d'enregistrer une opportunité ouverte sans action, mais elle reste signalée dans une rubrique dédiée.

- **FR-013 — Piloter la prochaine action.** Créer ou modifier la prochaine action, y compris reporter sa date, puis la marquer terminée. Il ne peut pas exister deux actions à faire sur la même opportunité. Après achèvement, proposer une nouvelle action sans la rendre obligatoire ; l'action terminée reste consultable avec sa date d'achèvement. **Validé :** les opportunités gagnées ou perdues acceptent une prochaine action sans réouverture. Le freelance peut annuler une action inutile ou rétablir une action terminée par erreur ; si une autre action est déjà à faire, le rétablissement n’est pas effectué tant que cette action n’a pas été explicitement terminée ou annulée. Aucune seconde action à faire n’est créée silencieusement. Réalise UJ-001 et UJ-002.
- **FR-014 — Voir les relances.** L’Accueil après connexion présente au plus cinq tâches d’opportunités ouvertes : échues/du jour par proximité de signature, puis prochaines échéances s’il reste des places. La vue Relances séparée présente, sans filtre actif par défaut, « En retard », « À faire aujourd’hui » et « Opportunités sans prochaine action ». Les tâches Gagnée/Perdue sont exclues des cinq priorités mais restent dans Relances. Toutes les actions des deux premières rubriques sont accessibles, triées par date croissante puis titre, avec compteurs et accès direct à l'opportunité. Les actions futures sont accessibles dans « À venir ». **Validé :** les actions à faire restent visibles quelle que soit l’étape de leur opportunité ; les actions terminées ou annulées sont exclues des relances. La rubrique « Opportunités sans prochaine action » ne contient que les opportunités ouvertes. Un filtre utilisateur éventuel est visible et réinitialisable ; il ne change pas les compteurs globaux. Terminer, annuler, rétablir ou reporter une action actualise la bonne rubrique. Un onglet laissé ouvert recalcule le jour à minuit Paris et lors du retour au premier plan. Réalise UJ-002.
- **FR-015 — Journaliser un échange.** `[ASSUMPTION A10]` Créer, modifier ou supprimer après confirmation un échange daté, avec canal Téléphone/E-mail/Visio/Autre et notes facultatives. Date/heure courante et contact sont préremplis quand connus ; une date future est refusée. **Validé :** un contact ou une opportunité doit être lié, les deux sont possibles. L'opportunité est préremplie depuis sa fiche. Le contact de l'échange peut différer du contact principal ; cela ne modifie pas ce dernier. L'entreprise historique suit FR-010. Sauvegarder actualise FR-004 et FR-010. Supprimer ou antidater l'échange le plus récent fait réapparaître le précédent, ou l'état vide. Réalise UJ-001.

### 5.5 Recherche et accès

`[ASSUMPTION A11]` La recherche reste proposée. La version hébergée privée, le compte unique créé à l’installation, la connexion e-mail/mot de passe et la récupération par e-mail sont validés. L’archivage et la restauration de fiches sont explicitement hors V1.

- **FR-016 — Retrouver une fiche.** Rechercher les contacts par nom ou e-mail, les entreprises par nom et les opportunités par titre, sans distinction de casse. Aucune correspondance affiche un état vide avec possibilité de créer.
- **FR-017 — Hors V1 : archivage et restauration de fiches.** Exigence retirée du périmètre sur décision de Lilian ; identifiant conservé pour la traçabilité, sans comportement à implémenter.
- **FR-018 — Accès privé avec e-mail et mot de passe.** **Validé :** la version hébergée est réservée à un compte propriétaire unique créé à l’installation, sans inscription publique ni invitation. Le propriétaire se connecte avec son adresse e-mail et son mot de passe ; il peut réinitialiser son mot de passe par e-mail en cas d’oubli. Sans session authentifiée, les données et leurs opérations sont inaccessibles. Si la session expire pendant une saisie, le contenu est récupéré après reconnexion au compte propriétaire sans ressaisie et sans prétendre qu’il a déjà été enregistré. Une sauvegarde en échec conserve la saisie et affiche une erreur claire. `[ASSUMPTION A11 — détail restant]` La déconnexion explicite reste proposée ; les modalités techniques de session et de réinitialisation appartiennent à l’architecture.

## 6. Qualité, données et évolutivité

`[ASSUMPTION A12]` Ces cibles bornent la recette d'un outil interne ; elles ne sont pas des performances déjà mesurées.

- **NFR-001 — Réactivité.** Sur un jeu fictif de 100 contacts, 50 entreprises, 200 opportunités et 1 000 échanges, les vues principales deviennent utilisables en moins de 2 s et une sauvegarde reçoit confirmation en moins de 1 s dans au moins 19 essais sur 20, sur la configuration de recette documentée. L'ouverture d'une fiche et la soumission affichent une réaction visuelle en moins de 100 ms.
- **NFR-002 — Persistance et échecs.** Une sauvegarde confirmée résiste au rechargement et à la reconnexion. **Validé :** une erreur conserve la saisie, signale l’échec et permet de réessayer ; aucun succès trompeur. Après expiration de session, la saisie est récupérable après reconnexion conformément à FR-018 ; cela ne vaut pas confirmation d’enregistrement. Une soumission répétée pendant l'attente ne crée pas de doublon. **Validé en architecture :** avertir avant de remplacer un même champ modifié entre-temps dans un autre onglet, conserver la saisie et permettre un choix explicite. Aucun écrasement silencieux ; pas de collaboration temps réel attendue.
- **NFR-003 — Usage web.** Recette à 1440 × 900 et 402 × 874, sans défilement horizontal de la page ; un pipeline peut défiler dans sa propre zone. Champs nommés, erreurs associées, parcours clavier, focus perceptible et fermeture des dialogues par Échap. Une action essentielle ne dépend jamais du glisser-déposer ou du survol.
- **NFR-004 — Confidentialité.** Vérifier l'accès propriétaire pour toute lecture/écriture de données, y compris accès direct. Connexion chiffrée dès qu'hébergée hors de la machine locale, secrets absents du client, aucune note ni coordonnée complète dans les journaux techniques. Utiliser exclusivement des données fictives pour les démonstrations enregistrées.
- **NFR-005 — Retirée du POC : sauvegarde de secours planifiée.** Le 6 septembre 2026, Lilian retire la sauvegarde quotidienne conservée sept jours pour le POC Supabase + Vercel. Le bloc associé de perte maximale de 24 heures et de restauration en moins d’une journée n’est plus un critère de recette du POC. Aucun mécanisme de sauvegarde de secours ni abonnement correspondant à prévoir. La persistance des enregistrements et la conservation de saisie de NFR-002 restent applicables.
- **NFR-006 — Évolution.** La V1 fonctionne sans intégration commerciale externe ; l’envoi d’e-mails de récupération d’accès est inclus. L'architecture doit expliquer comment une future importation d'échanges réutilisera les mêmes règles de rattachement et de dernier échange, sans imposer de ressaisie des contacts et opportunités existants. Aucun connecteur ni API publique à construire maintenant.

## 7. Critères de réussite et recette

`[ASSUMPTION A13]` Les modalités suivantes rendent testables les deux objectifs exprimés par Lilian ; les résultats seront produits pendant le développement.

- **SM-001 — Moins d’une minute.** **Validé :** chronométrer depuis l’ouverture du formulaire jusqu’à la confirmation du dernier enregistrement. Une création comprend titre, relations existantes et prochaine action ; une mise à jour après appel comprend note courte, étape et prochaine action. Chacun de ces parcours doit durer moins de 60 s. La recherche préalable, la connexion et la rédaction d’un long compte rendu ne sont pas incluses dans ce parcours. Mesurer séparément la création d’un nouveau contact ou d’une entreprise, sans lui imposer ce seuil. Vérifier toutes les données après rechargement. `[ASSUMPTION A13 — protocole complémentaire]` Effectuer cinq créations et cinq mises à jour avec des données fictives préparées ; une note courte de deux phrases sert de cas de recette. Vérifie FR-011, FR-013 et FR-015.
- **SM-002 — Aucune relance échue invisible.** Sur un jeu mêlant actions passées, du jour, futures, terminées et opportunités sans action, 100 % des actions échues à faire apparaissent dans « En retard » avec un compteur exact après connexion. Vérifier aussi changement de jour, report, achèvement et clôture. Vérifie FR-012 à FR-014.
- **SM-C01 — Vitesse sans perte.** Zéro note, relation ou prochaine action perdue après rechargement dans les dix parcours SM-001 ; toute erreur simulée est visible. Une saisie rapide mais non persistée échoue à la recette.
- **SM-C02 — Visibilité sans faux retard.** Zéro action terminée, annulée, future ou du jour dans « En retard ». Une action reportée apparaît dans la rubrique correspondant à sa nouvelle échéance ; elle quitte « En retard » si cette échéance est aujourd’hui ou ultérieure.

La recette fonctionnelle couvre également : une liste vide, un doublon d'e-mail, un contact principal externe à l’entreprise, un échange sans contact lié à une opportunité, un changement d’employeur préservant l’historique, un montant nul, une opportunité sans entreprise, une modification d'échange le plus récent, une sauvegarde en échec, un accès sans session, une expiration de session pendant la saisie suivie d’une reconnexion avec récupération du contenu, et une réinitialisation du mot de passe par e-mail suivie d’une connexion avec le nouveau mot de passe. Les notes longues restent possibles ; elles ne sont pas soumises à l'objectif de temps de saisie.

## 8. Arbitrages et éléments différés

Lilian a validé une prochaine action unique, des étapes fixes et une saisie manuelle pour réduire le nombre de décisions et d'écrans pendant la formation. Cela reporte la planification de plusieurs tâches, les pipelines sur mesure et la capture automatique des échanges. Le montant des opportunités gagnées donne une lecture commerciale distincte de la facturation, conformément à l’arbitrage de Lilian.

Le cadrage détaillé est terminé à la demande de Lilian ; le skill est passé à Finalize. Les acquis sont conservés et les propositions résiduelles ne sont pas transformées en accords implicites. La revue finale ne relève aucun blocage produit pour commencer l’UX. Les détails ouverts ci-dessous restent non validés et ne doivent pas être implémentés sans arbitrage à l’étape concernée. Les choix ci-dessous sont à traiter au moment indiqué, avant toute implémentation qui en dépend :

- **Architecture BMAD, avant les stories techniques :** choisir stockage, solution d’authentification par e-mail/mot de passe, fournisseur d’hébergement et récupération d’accès ; respecter les exigences plutôt que présupposer une stack.
- **Lilian/PM, avant toute évolution V2 :** réexaminer score, intégrations et tâches multiples sur la base d'usages réels ; aucune livraison V2 n'est promise.
- **Lilian, avant utilisation de vraies données :** préciser les besoins de suppression définitive et de conservation. Le périmètre pédagogique ne vaut pas validation d'une exploitation avec des données personnelles réelles.

### Points ouverts transférés aux étapes suivantes

Ces propositions ne bloquent pas le début de l’UX ; leur report ne vaut pas acceptation de leur contenu.

- **UX avec Lilian, avant validation des écrans et formulaires :** A01/A02 (présentation de la cible, langue et exclusions complémentaires), A03/A05/A06 (champs et cardinalités résiduelles), A04 (détails des parcours), A08/A09/A10 (valeurs initiales, validation de saisie, historique et correction d’échanges), A11 (recherche et déconnexion). Traiter également le besoin de suppression définitive des fiches, distinct de l’archivage exclu. Les fonctionnalités déjà validées restent acquises.
- **Architecture avec Lilian, avant les stories techniques :** A07 (départage de dates identiques), A12 (cibles de performance, multi-onglets, confidentialité). Les garanties de persistance et de récupération de saisie déjà validées restent obligatoires.
- **Recette, préparée avec Lilian avant le développement :** A13 (nombre d’essais et jeu de données). Les objectifs et bornes de mesure validés restent inchangés.

## 9. Registre des propositions à arbitrer

Les hypothèses ci-dessous restent à arbitrer sauf les éléments explicitement marqués validés dans le tableau et dans la section 10 « Arbitrages validés ». Aucune validation terrain n’est revendiquée. Elles ne sont pas des exigences acquises pour l’implémentation. A12 sera également à vérifier en architecture et recette après arbitrage.

| ID | Proposition non validée | Emplacement |
| --- | --- | --- |
| A01 | CA indicatif, pas de seuil d'accès | §2 |
| A02 | Euro et Europe/Paris validés ; français et exclusions complémentaires proposés | §2 |
| A03 | Action unique validée ; autres définitions et cardinalités à arbitrer | §3 |
| A04 | Parcours après appel et rubriques des relances validés ; détails et parcours entreprise à arbitrer | §4 |
| A05 | Minimum prénom ou nom validé en architecture ; autres champs et validations résiduels | §5.1 |
| A06 | Indépendance des liens et nom entreprise obligatoire validés ; autres champs proposés | §5.2 |
| A07 | Entreprise historique et préremplissage validés ; règles de départage proposées | §5.2 |
| A08 | Champs, Notes unique, étapes fixes, réouverture, montant facultatif non négatif et étape initiale À qualifier validés | §5.3 |
| A09 | Action datée, suivi après clôture, conservation/annulation, correction et visibilité validés ; dates à la journée Europe/Paris, tri ancienneté et À venir validés ; intitulé et échéance obligatoires validés en architecture ; historique et formulaire à arbitrer | §5.4 |
| A10 | Lien contact ou opportunité validé ; autres modalités des échanges proposées | §5.4 |
| A11 | Archivage hors V1, accès hébergé e-mail/mot de passe, compte à l’installation, récupération par e-mail et saisie après reconnexion validés ; recherche et déconnexion explicite proposées | §5.5 |
| A12 | Conservation de saisie, erreur visible et protection contre les conflits entre onglets validées ; autres cibles qualité et sécurité proposées ; sauvegarde de secours NFR-005 retirée du POC | §6 |
| A13 | Bornes et contenu du parcours sous une minute, mesure séparée des nouvelles relations et vérification après rechargement validés ; taille du jeu de recette proposée | §7 |

## 10. Arbitrages validés

### Arbitrage validé — Après appel et relances

Lilian valide le fonctionnement suivant : enregistrer les notes après appel et actualiser l’étape de l’opportunité ; définir une prochaine action datée par opportunité ; retrouver à l’ouverture du CRM les rubriques « En retard », « À faire aujourd’hui » et « Opportunités sans prochaine action » ; marquer l’action terminée puis pouvoir programmer la suivante.

Cette validation porte sur le parcours et ces capacités. Les arbitrages suivants précisent les dates, le tri et la clôture. Les modalités résiduelles proposées, notamment les détails de saisie et d’historique, restent identifiées dans le registre. Elle ne valide pas l’ensemble des hypothèses A01 à A13. Le pipeline a fait l’objet de l’arbitrage suivant.

### Arbitrage validé — Pipeline et fiche opportunité

Lilian valide cinq étapes fixes : À qualifier, Échange en cours, Proposition envoyée, Gagnée et Perdue. Il valide un titre obligatoire, des liens entreprise et contact principal facultatifs, un montant estimé HT en euros, une date de clôture prévisionnelle facultative, une description, les échanges et la prochaine action datée. Les informations et l’étape sont modifiables, y compris la réouverture d’une opportunité gagnée ou perdue. Score et personnalisation du pipeline sont reportés hors V1.

Restent proposés : étape initiale, validation numérique du montant. Son caractère facultatif est validé dans le bloc montant ci-dessous. Les conséquences de la clôture sur les actions sont validées dans le bloc dédié ci-dessous. Les détails restants n’étaient pas exposés dans le bloc soumis à arbitrage.

### Arbitrage validé — Saisie et relations

À la suite de la critique, Lilian valide : contact principal indépendant de l’entreprise de l’opportunité ; échange rattaché à un contact ou à une opportunité, avec au moins un des deux ; entreprise historique de l’échange préremplie depuis l’opportunité, sinon le contact, et modifiable. Un changement ultérieur d’entreprise ne réattribue pas les anciens échanges.

### Arbitrage validé — Relances après clôture

Lilian valide les prochaines actions sur une opportunité gagnée ou perdue, sans réouverture. Lors du passage à Gagnée/Perdue, une action à faire est explicitement conservée ou annulée, jamais déclarée réalisée automatiquement. Une action inutile peut être annulée et une action terminée par erreur peut être rétablie, sans deux actions à faire simultanées. Les relances sont visibles quelle que soit l’étape ; seules les opportunités ouvertes figurent dans « Opportunités sans prochaine action ».

### Arbitrage validé — Montant des opportunités gagnées

Lilian valide le libellé « Montant des opportunités gagnées » sur la fiche entreprise : somme des montants HT renseignés des opportunités actuellement gagnées, toutes dates confondues. Le montant est facultatif sur une opportunité ; le nombre d’opportunités gagnées sans montant est affiché séparément, par exemple « 8 000 € · 2 opportunités sans montant ». Le total est recalculé après modification du montant, réouverture ou changement d’entreprise d’une opportunité. Il ne représente pas un chiffre d’affaires facturé.

### Arbitrage validé — Archivage hors V1

Lilian reporte l’archivage et la restauration de fiches hors V1. Aucun état archivé, vue d’archives ou règle associée aux relances et montants n’est à implémenter. Ce report ne décide pas de la suppression définitive des fiches, qui reste un sujet distinct.

### Arbitrage validé — Hébergement et connexion

Lilian valide une version web hébergée, privée, réservée à un compte propriétaire unique, avec connexion par identifiant et mot de passe, sans inscription publique. Le fournisseur d’hébergement, la solution d’authentification et les modalités de création/récupération du compte seront précisés à l’étape architecture BMAD. L’arbitrage suivant fixe l’adresse e-mail comme identifiant.

### Arbitrage validé — Accès et protection de la saisie

Lilian valide l’adresse e-mail comme identifiant, un compte propriétaire créé à l’installation et la réinitialisation du mot de passe par e-mail. Si la session expire pendant la saisie, le propriétaire retrouve son contenu après reconnexion sans devoir le ressaisir. Une erreur d’enregistrement conserve la saisie et affiche clairement l’échec. Les e-mails de récupération d’accès sont inclus ; les intégrations d’e-mail commercial restent hors V1.

### Arbitrage validé — Mesure de moins d’une minute

Lilian valide un chronométrage depuis l’ouverture du formulaire jusqu’à la confirmation d’enregistrement. Une création comprend le titre, les relations existantes et la prochaine action ; une mise à jour après appel comprend une note courte, l’étape et la prochaine action. La création d’un contact ou d’une entreprise est mesurée séparément, sans seuil d’une minute. Les informations sont vérifiées après rechargement. La rédaction d’un long compte rendu n’est pas soumise à ce seuil.

### Arbitrage validé — Dates des relances

Lilian valide des échéances à la journée sans heure, selon Europe/Paris : avant aujourd’hui signifie En retard, aujourd’hui signifie À faire aujourd’hui et les actions futures sont accessibles dans À venir. Les plus anciennes échéances apparaissent en premier. Les actions terminées ou annulées sortent des relances ; une action reportée apparaît à sa nouvelle échéance.

