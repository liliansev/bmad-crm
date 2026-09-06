# Revue adversariale de l’architecture

Date : 2026-09-06. Revue documentaire de la spine, de ses quatre compagnons et des rapprochements PRD/UX. La version examinée possède les versions par champ d’AD-3 et la révision de workflow d’AD-4. Aucun code ni service n’a été exécuté.

**Verdict : socle cohérent, sans faille d’autorisation démontrée ; deux précisions de contrat client à intégrer avant des epics indépendants.** Elles ne demandent ni service supplémentaire, ni nouvelle décision métier, ni retour des sauvegardes retirées.

## Épreuve par deux epics indépendants

**Epic A — Pipeline et panneau opportunité.** Il utilise les mêmes RPC, les versions par champ et les révisions de workflow ; il protège toutes les lectures par la session du propriétaire, conserve les brouillons et invalide ses caches et projections après succès. Son cache de panneau est réutilisé tant qu’il n’a pas reçu d’invalidation. Il supprime le brouillon de l’entité lorsque l’enregistrement de l’un de ses champs est confirmé.

**Epic B — Relances et édition de la tâche.** Il applique le même verrouillage opportunité puis tâche, l’unicité de tâche active et l’idempotence. Après succès, il invalide toutes les vues affectées dans son contexte client. Son retour au premier plan recalcule les rubriques temporelles. Il ne diffuse aucune invalidation aux autres onglets et son panneau conserve les brouillons champ par champ.

Ces deux constructions respectent les règles SQL et les contrats métier explicites. Elles peuvent pourtant diverger sur la fraîcheur d’un panneau réutilisé dans un autre onglet et sur l’effacement d’un brouillon plus récent dans la même entité. L’intention générale d’AD-7 permet de rejeter ces comportements, mais son contrat opérationnel ne suffit pas encore à garantir que deux epics les évitent de la même manière.

## 1. P2 — Définir la fraîcheur du cache au retour dans un onglet

**Source :** AD-6/AD-7, lignes 77 et 83 de la spine.

**Contre-exemple :** le panneau de l’opportunité est en cache dans l’onglet Pipeline. Dans l’onglet Relances, Lilian termine sa tâche ; la transaction et toutes les invalidations locales sont correctes. Au retour sur Pipeline, un recalcul du jour Europe/Paris ne détecte pas la nouvelle révision de workflow. La clé propriétaire/entité/révision reste fondée sur la dernière révision connue et peut réafficher la tâche terminée comme active. Le contrôle de concurrence empêche un écrasement lors d’une écriture ultérieure, mais ne corrige pas cette lecture périmée.

**Correction minimale :** préciser une politique commune de revalidation serveur au retour au premier plan et de renouvellement des données après invalidation, avec un propriétaire commun du cache et des dépendances de projections. La revalidation doit conserver les brouillons et ne pas transformer une ancienne donnée en confirmation. Une notification locale entre onglets peut accélérer cela, mais Supabase Realtime n’est pas nécessaire et n’est pas demandé. La mécanique exacte reste au scaffold ; l’invariant de fraîcheur doit être commun aux epics.

**Recette utile :** tâche terminée dans l’onglet B, retour au premier plan de A : panneau, Accueil et Relances convergent vers le commit serveur sans effacer un champ en cours d’édition.

## 2. P2 — Supprimer uniquement la génération de brouillon confirmée

**Source :** AD-3/AD-7, lignes 59 et 83 de la spine.

**Contre-exemple :** Lilian modifie les notes, quitte le champ et commence immédiatement une nouvelle correction des notes pendant la requête. La confirmation de la première version arrive alors que la seconde est encore locale. « Brouillons par propriétaire/entité […] supprimés après confirmation » permet une suppression trop large. Le même problème existe si le montant est confirmé alors que les notes de la même entité sont encore en conflit. Ignorer les réponses réseau anciennes ne suffit pas : cette confirmation peut être la dernière réponse serveur tout en étant antérieure au nouveau brouillon local.

**Correction minimale :** identifier les brouillons par champ et génération locale, avec la commande qui les a soumis. Une confirmation n’efface que les champs et générations effectivement acquittés ; toute saisie plus récente ou tout autre champ non confirmé est conservé. Le succès doit toujours porter sur la valeur envoyée, sans marquer la nouvelle valeur locale comme enregistrée. Aucun système supplémentaire n’est requis.

**Recette utile :** une réponse volontairement retardée acquitte la saisie A après que B a été tapée ; B reste affichée et récupérable après reconnexion. Confirmer le montant ne supprime pas des notes en conflit.

## 3. P3 — Les rapprochements antérieurs décrivent encore l’ancien AD-3

`reviews/reconcile-prd.md` et `reviews/reconcile-ux.md` décrivent toujours un conflit à l’échelle de toute la fiche. La spine courante contrôle déjà les champs concernés et distingue la révision de workflow. Annoter ces constats comme résolus, afin qu’un lecteur ne fasse pas revalider à Lilian une friction supprimée. Il s’agit de traçabilité, pas d’un défaut du mécanisme actuel.

## Attaques qui ne produisent pas de trou réel

- Deux modifications indépendantes montant/notes : AD-3 autorise les deux sans écrasement ; deux modifications du même champ produisent un conflit atomique. L’ancien constat de granularité trop large est résolu.
- Clôture pendant création, report ou achèvement d’une tâche : verrouillage commun et révision de workflow d’AD-4 invalident une décision fondée sur un état dépassé. Une modification de notes seule n’invalide pas cette décision.
- Appel direct de la Data API ou d’une RPC par un autre compte : retraits de droits, contrôle explicite de `auth.uid()` et RLS sont cohérents. Le code devra les exercer réellement ; aucune incohérence documentaire d’autorisation n’est démontrée.
- Retry concurrent ou réponse perdue : le résultat et l’empreinte transactionnels d’AD-3 constituent déjà l’invariant requis. Les contraintes SQL exactes relèvent de l’implémentation, pas d’une nouvelle décision utilisateur.
- Ordre commercial, formulaires, suppression, photo et échanges : leurs points ouverts sont explicitement bloqués avant les stories dépendantes par Q1–Q7. Leur absence de décision actuelle ne justifie pas de les inventer pendant cette revue.
- Supabase + Vercel et absence de sauvegarde quotidienne/rétention sept jours : choix utilisateur conservés sans réserve supplémentaire.
