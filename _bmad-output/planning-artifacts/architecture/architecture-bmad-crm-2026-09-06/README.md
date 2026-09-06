# Architecture du POC CRM

**Architecture revue et validée par Lilian.** Une application Next.js sur Vercel ; Supabase pour PostgreSQL et Auth. Aucune sauvegarde quotidienne ni rétention sept jours à mettre en place.

Le [contrat d’architecture](ARCHITECTURE-SPINE.md) décrit huit règles communes : accès propriétaire, écritures centralisées, conflits entre onglets, cohérence opportunité/tâche, historique commercial, distinction Accueil/Relances, conservation des brouillons et environnements du POC.

- [Décisions rapprochées avec le PRD et l’UX](reconcile-inputs.md)
- [Socle Supabase + Vercel](hosting-options.md)
- [Versions vérifiées et adaptations du starter](stack-evidence.md)
- [Arbitrages conservés et moment de reprise](arbitrages-restants.md)
- [Résolution des revues indépendantes](reviews/review-resolution.md)

Les rapprochements PRD/UX et les trois revues techniques sont terminés ; leurs corrections documentaires ont été intégrées. Le contrôle mécanique du contrat et les liens locaux passent. Cette validation documentaire ne constitue pas un test de l’application : aucun code applicatif, compte cloud ou déploiement n’a été créé.

Étape validée ; suite : `bmad-spec` consolide le contrat de construction à partir du PRD, de l’UX et de l’architecture, puis `bmad-create-epics-and-stories` découpe le développement. Les décisions métier encore ouvertes restent visibles et seront tranchées avant les stories qui en dépendent.
