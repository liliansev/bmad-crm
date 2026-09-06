# Revue rubric walker — architecture du POC

Date : 6 septembre 2026. Lecture indépendante de `ARCHITECTURE-SPINE.md`, `arbitrages-restants.md`, `stack-evidence.md`, `reconcile-inputs.md` et du PRD. Grille : `.agents/skills/bmad-architecture/references/reviewer-gate.md`.

**Verdict : favorable après deux précisions locales ; aucun constat critique ou haut.** Le document couvre les divergences importantes du POC, protège les décisions validées et ne transforme pas les arbitrages résiduels en exigences acquises. Les deux précisions suivantes peuvent être appliquées par l’auteur sans nouvelle décision produit.

## Moyens

### R1 — Restaurer les versions originales avec le brouillon

**Cible : AD-3 et AD-7.** AD-3 exige les versions des champs lus ; AD-7 conserve la saisie dans `sessionStorage` et la restaure après reconnexion. Le contenu du brouillon ne précise pas la conservation de ces versions. Une implémentation pourrait restaurer le texte ancien mais lui attacher les versions fraîchement chargées, puis écraser sans avertissement un changement réalisé entre-temps. Cela contournerait la décision explicite de Lilian sur les onglets concurrents.

**Traitement : autofix.** Définir le brouillon comme le texte accompagné des versions de base des champs édités et, pour une commande composite, de la révision de workflow initiale. Une reconnexion ne remplace pas ces versions silencieusement. L’enregistrement reste soumis à AD-3 ; seules la résolution explicite du conflit ou l’abandon recréent la base d’édition.

### R2 — Définir l’ordre minimal des migrations et du déploiement

**Cible : AD-8.** Les environnements, secrets, migrations versionnées et fournisseurs sont couverts, mais aucun ordre de publication ne lie le schéma/RPC au code Vercel qui les consomme. Deux unités pourraient publier indépendamment une application nécessitant une RPC absente ou une migration incompatible avec le déploiement encore actif.

**Traitement : autofix.** Ajouter une règle proportionnée au POC : valider les migrations sur la base fictive, appliquer les ajouts compatibles avant le code qui les appelle et éviter de retirer ou renommer un contrat consommé par le déploiement actif. Une modification incompatible exige une bascule coordonnée explicitement documentée. Aucun système d’orchestration ou mécanisme de sauvegarde supplémentaire n’est demandé.

## Résultat de la grille

| Dimension | Résultat |
| --- | --- |
| Paradigme et frontières | Une application, une base et des modules clairement propriétaires ; projections Accueil/Relances distinctes des données sources. |
| Invariants applicables | Contrôles SQL, droits, RLS, transactions, versions et unicité conditionnelle rendent les règles vérifiables. R1 ferme une ambiguïté entre deux invariants. |
| Couverture métier | Relations indépendantes, historique d’entreprise, champ Notes unique, agrégats, clôture/réouverture, tâche active unique et rubriques sont couverts. Les propositions PRD/UX non arbitrées restent identifiées. |
| Accès et confidentialité | Compte propriétaire, absence d’inscription, isolation des lectures et écritures, séparation des secrets, récupération d’accès et contenu des journaux sont présents. |
| Exploitation et environnements | Couverture explicite et adaptée aux données fictives ; R2 précise la seule frontière de publication encore implicite. |
| Deferred | Les stories dépendantes sont bloquées jusqu’à une politique commune ; aucun epic n’est autorisé à inventer sa propre réponse. Les choix ouverts ont un moment de reprise. |
| Technologies | Versions exactes et sources éditeurs consignées dans `stack-evidence.md`, compatibilité documentaire distinguée du runtime. Pas de nouvelle vérification réseau indépendante dans cette revue ; l’assemblage reste à vérifier au scaffold comme annoncé. |
| Brownfield et héritage | Aucun code applicatif à ratifier. Supabase + Vercel remplace explicitement le socle général incompatible. NFR-005 est retirée sans réintroduction de sauvegarde ou de rétention. |
| Proportion au POC | Huit invariants et un germe structurel restent lisibles. Versions par champ et reçus d’idempotence ajoutent de la mécanique mais servent des garanties explicites ; les mutualiser à l’implémentation évitera une infrastructure distincte par module. Aucun ajout de service n’est recommandé. |

La revue ne vaut ni validation utilisateur de l’architecture ni test d’un logiciel ou d’un service déployé.
