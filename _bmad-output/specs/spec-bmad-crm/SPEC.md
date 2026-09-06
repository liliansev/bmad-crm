---
id: SPEC-bmad-crm
companions:
  - coverage.md
  - ../../planning-artifacts/prds/prd-bmad-crm-2026-09-05/prd.md
  - ../../planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/EXPERIENCE.md
  - ../../planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/DESIGN.md
  - ../../planning-artifacts/architecture/architecture-bmad-crm-2026-09-06/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/architecture/architecture-bmad-crm-2026-09-06/reconcile-inputs.md
  - ../../planning-artifacts/architecture/architecture-bmad-crm-2026-09-06/arbitrages-restants.md
  - ../../planning-artifacts/architecture/architecture-bmad-crm-2026-09-06/stack-evidence.md
  - ../../planning-artifacts/architecture/architecture-bmad-crm-2026-09-06/hosting-options.md
  - ../../planning-artifacts/epics-support/decisions-deleguees.md
sources: []
---

# POC CRM de Lilian

Cette spécification et ses compagnons constituent le contrat de construction. Les décisions explicites reprises dans `reconcile-inputs.md` priment sur les propositions antérieures des sources. Les décisions déléguées résolvent Q1–Q6 et sont adoptées en compagnon. Q7 reste à identifier avant les opérations qui utilisent ces paramètres externes.

## Why

Lilian veut retrouver son contexte commercial et savoir quoi faire après un appel, sans oublier une relance. Ce CRM privé, utilisé seul principalement sur ordinateur, est aussi le support d’une formation BMAD. Le POC doit démontrer les parcours avec des données fictives et une interface compacte inspirée de Folk.

## Capabilities

- **CAP-1 — Accès privé**
  - **intent:** Le propriétaire peut se connecter et récupérer son accès au CRM.
  - **success:** Le compte est créé à l’installation, sans inscription publique ; toute lecture ou écriture non autorisée est refusée. La récupération par e-mail aboutit à une nouvelle connexion et une saisie interrompue par expiration reste récupérable.
- **CAP-2 — Contacts**
  - **intent:** Lilian peut créer un contact, retrouver ses informations et le relier à son contexte commercial.
  - **success:** Un prénom ou un nom suffit ; les informations enregistrées se retrouvent après rechargement. La liste reprend les colonnes validées. Un contact possède au plus une société actuelle et peut être contact principal de plusieurs opportunités ; changer de société ne déplace pas ses anciens échanges.
- **CAP-3 — Sociétés**
  - **intent:** Lilian peut consulter une société, ses relations et le montant de ses opportunités gagnées.
  - **success:** L’accès Sociétés est direct ; le nom suffit pour créer une fiche. Les contacts et opportunités liés sont accessibles. Le total des gains est recalculé après changement de montant, d’étape ou de société, avec compteur séparé des montants absents.
- **CAP-4 — Opportunités**
  - **intent:** Lilian peut faire avancer une opportunité et mettre à jour son contexte commercial.
  - **success:** Le kanban affiche les cinq étapes fixes ; titre obligatoire, étape initiale À qualifier, montant facultatif non négatif, Notes unique. Le montant et les notes s’éditent sur la carte et s’enregistrent à la sortie du champ ; la fiche s’ouvre à droite. Une clôture avec tâche active demande de la conserver ou l’annuler ; abandon sans modification, réouverture sans réactiver une ancienne tâche.
- **CAP-5 — Prochaines actions**
  - **intent:** Lilian peut définir, terminer, reporter ou corriger la prochaine action d’une opportunité.
  - **success:** Une tâche possède un intitulé et une échéance ; jamais deux tâches à faire sur la même opportunité. Terminer ou changer la date est possible directement dans Relances. Une opportunité gagnée ou perdue peut garder une tâche ; rétablir une tâche ne remplace pas silencieusement une autre tâche active.
- **CAP-6 — Reprise du travail**
  - **intent:** Lilian peut voir ses priorités à l’ouverture et retrouver l’ensemble des relances.
  - **success:** Accueil montre au plus cinq tâches d’opportunités ouvertes, d’abord échues/du jour par proximité de signature, puis prochaines échéances s’il reste des places. Relances reste une vue séparée couvrant toutes les étapes ; sa rubrique sans action ne contient que les opportunités ouvertes. Les échéances suivent le jour à Paris ; les rendez-vous restent dans l’agenda externe.
- **CAP-7 — Échanges et dernière interaction**
  - **intent:** Lilian peut conserver les interactions réelles et retrouver la dernière dans son contexte historique.
  - **success:** Chaque échange est lié à un contact, une opportunité ou les deux, avec sa société historique indépendante. Les dernières interactions reflètent les échanges concernés ; modifier Notes ne crée pas d’échange. Les détails de saisie et correction suivent Q3 des décisions déléguées, sans suppression d’échange.
- **CAP-8 — Saisie fiable**
  - **intent:** Lilian peut modifier ses fiches sans perdre sa saisie ni écraser involontairement une modification récente.
  - **success:** L’enregistrement n’est confirmé qu’après persistance. Un refus ou conflit conserve le brouillon ; la modification concurrente du même champ est signalée avant remplacement. Une commande répétée n’ajoute pas de doublon et une réponse ancienne n’efface pas une nouvelle saisie.

## Constraints

- Application privée mono-utilisateur ; les données des démonstrations sont fictives. Saisie manuelle et usage ordinateur prioritaire.
- Architecture Supabase + Vercel adoptée, AD-1 à AD-8 stables ; aucune variation de modèle ou de mutation décidée indépendamment par un epic.
- Navigation validée : Accueil, Contacts, Sociétés, Pipeline, Relances. Les quatre maquettes A compactes et les règles UX priment sur les défauts des images générées.
- Les relations société/contact principal d’une opportunité restent facultatives et indépendantes ; le montant absent reste distinct de zéro. Montants HT en euros, échéances à la journée Europe/Paris.
- Les détails, états d’erreur, protections d’accès et conventions d’accessibilité des compagnons s’appliquent à chaque parcours ; les données privées ne sont pas consignées dans les logs.
- Les points proposés dans les sources ne deviennent pas des exigences acquises par leur présence dans cette spécification. Les contraintes de plans et d’e-mail de test sont à vérifier au provisionnement.

## Non-goals

- Facturation, génération de devis, marketing, scoring, personnalisation du pipeline, date de clôture prévisionnelle, archivage/restauration de fiches et accès d’équipe.
- Intégrations commerciales, calendrier dans le CRM, API publique, enrichissement automatique et synchronisation collaborative en temps réel.
- Sauvegarde quotidienne avec conservation sept jours, explicitement retirée du POC ; aucun service ou abonnement à ajouter pour cette exigence.
- Fonctionnalités supplémentaires de Folk ou du starter ; recherche et suppressions non validées ne sont pas à implémenter par défaut.

## Success signal

Après un appel fictif, Lilian crée ou met à jour une opportunité avec son contexte et sa prochaine action en moins d’une minute, selon les bornes de mesure validées du PRD, puis retrouve les données après rechargement. À la reprise, il identifie ses priorités et peut accéder à toutes les relances échues ; les parcours d’échec et de concurrence préservent la saisie.

## Open Questions

Q7 : comptes/projets et paramètres effectifs de l’environnement Supabase/Vercel, origines Auth et destinataire de récupération admissible, à vérifier avant leur utilisation. Q1–Q6 sont résolus dans decisions-deleguees.md, adopté en compagnon ; les décisions de l’agent y sont distinguées des validations directes de Lilian.
