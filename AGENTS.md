# CRM BMAD — règles du projet

## Sources et périmètre

Seuls les skills BMAD sont autorisés, sur instruction de Lilian. Les outils de documentation, CLI et navigateur restent utilisables. Lire le contexte de l’epic, la story et les décisions déléguées avant de coder. Ne pas relancer les validations documentaires déjà déléguées.

- Plan canonique : `_bmad-output/planning-artifacts/epics.md`.
- Décisions actuelles : `_bmad-output/planning-artifacts/epics-support/decisions-deleguees.md`.
- UX : paire DESIGN/EXPERIENCE sous `_bmad-output/planning-artifacts/ux-designs/ux-bmad-crm-2026-09-06/` ; composition A compacte.
- Architecture : `_bmad-output/planning-artifacts/architecture/architecture-bmad-crm-2026-09-06/ARCHITECTURE-SPINE.md`.

## Stack adoptée

Node 24 LTS, pnpm, Next.js 15 App Router, TypeScript strict, Supabase Auth/PostgreSQL, Zod, React Hook Form, shadcn/ui, Tailwind 4, Lucide, Vercel. Cette décision spécifique remplace Neon/Prisma/Better Auth. Ne pas ajouter de bibliothèque sans usage réel. Context7 avant usage ; lister components/ui avant ajout shadcn CLI. Pas de composants standards réinventés.

Propriétaire unique vérifié côté serveur par UUID privé et identité Supabase authentique, aucune inscription publique. Secrets dans .env.local ou .local ignorés, jamais dans code/logs. Supabase/Vercel : projet dédié, vérifier identité/cible/plan avant mutation et aucun achat implicite. Aucun schéma métier créé avant sa story. Données de démonstration fictives uniquement.

## Implémentation et contrôle

Utiliser les patterns de fluidité décrits dans l’architecture au moment où leurs surfaces apparaissent ; routes avec loading, états honnêtes, éditeurs montés, shell client et cache isolé pour listes/panneaux. Ne pas construire les futures entités dans la story Auth.

Dev server pnpm dev, garder actif ; npx tsc --noEmit. Vérification fonctionnelle réelle par agent-browser CLI, jamais Playwright ni installation de ses dépendances. Tests ciblés si nécessaires pour les frontières de sécurité ; pas de tests miroirs d’implémentation. Ne pas exécuter pnpm build pendant le développement ; build seulement avant livraison/push selon les règles globales.

Travailler sur une branche codex/. Agents avec fichiers disjoints ; revue indépendante des modifications avant clôture BMAD. Ne pas pousser/déployer une story locale implicitement : l’hébergement est story 1.3. Les confirmations de succès exigent une preuve runtime.
