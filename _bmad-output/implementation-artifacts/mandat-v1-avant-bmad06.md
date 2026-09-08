# Mandat de réalisation V1 avant le tournage BMAD 06

Le 8 septembre 2026, Lilian demande de finir les epics et user stories, tests compris, pour reprendre la vidéo 06 avant l’inventaire de dette, la refactorisation finale et le déploiement. Cette consigne remplace le précédent arrêt avant la story 2.3. Elle autorise les choix routiniers dans le périmètre PRD/UX/décisions déléguées, les migrations additives nécessaires sur le Supabase dédié vérifié et les recettes sur fixtures exactes. Aucun achat, intégration externe, effacement de données existantes ou déploiement frontend implicite.

Branche : `codex/crm-v1-avant-bmad06`, départ `d2be276`. Exécuter bmad-build par story avec specs, vérifications et revues indépendantes ; le mandat remplace les confirmations rituelles déjà déléguées. Ne pas confondre le développement/corrections nécessaires aux nouvelles stories avec le lot de refactorisation pédagogique conservé pour BMAD 06.

Ordre : 2.3 Sociétés → 2.4 ajout d’échanges → 2.5 correction ; 3.1 Opportunités → 3.2 Kanban → 3.3 action/clôture → 3.4 cycle de tâche → 3.5 Relances → 3.6 Accueil ; 3.7 liens échanges/opportunités → 3.8 société complète. Réutiliser et vérifier les acquis Auth/Contacts. N’introduire un schéma que dans sa story. Revues, tests ciblés et intégration constituent les conditions de clôture, pas la seule existence des écrans.

Les trois remarques d’outillage laissées ouvertes à BMAD 05 restent des actions explicitement conservées, sauf si un défaut empêche directement l’exécution d’une nouvelle story : expliquer alors la nécessité avant de traiter le blocage. Les autres limites historiques restent visibles dans deferred-work.md.

État externe vérifié pour cette reprise : projet Supabase `bmad-crm`, organisation Persos, plan free, ACTIVE_HEALTHY, propriétaire membre vérifié, référence `otadrkhrjxafutocstzo`. Les recettes préservent toutes données/reçus préexistants. Aucun seed massif sans manifeste, contrôles et nettoyage exact. Dev server existant conservé sur localhost:3000. Un seul agent exécute les mutations/recettes distantes à la fois.

Arrêt final : fonctionnalités restantes vérifiées localement et bilan honnête des AC/mesures. La préparation et validation de la livraison frontend/production restent pour BMAD 06 ; ne pas marquer ces étapes exécutées ni proclamer les epics intégralement livrés en production.
