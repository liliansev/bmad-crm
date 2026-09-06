# Socle du POC : Supabase et Vercel

Orientation révisée le 6 septembre 2026 après la précision de Lilian : « c’est un POC donc juste supabase, vercel ? ». Cette orientation spécifique remplace la piste Neon avec authentification séparée issue des conventions générales. Aucun service n’a été configuré ou souscrit.

## Répartition

| Élément | Rôle dans le POC |
| --- | --- |
| Next.js sur Vercel | Interface CRM et opérations serveur partagées entre les vues. |
| Supabase PostgreSQL | Base commune aux contacts, sociétés, opportunités, échanges et tâches. |
| Supabase Auth | Compte propriétaire et connexion e-mail/mot de passe. Pas d’inscription publique. |

Utiliser les outils Supabase pour l’accès aux données et les migrations permet de limiter les couches du POC ; Prisma et Better Auth ne sont pas nécessaires dans cette proposition. Les décisions métier acquises restent identiques, notamment une seule tâche active par opportunité, protection contre les écrasements entre onglets et sauvegarde confirmée seulement après persistance.

Le [démarrage officiel Next.js + Supabase](https://supabase.com/docs/guides/auth/quickstarts/nextjs) fournit une base intégrée. Ses versions et fonctions par défaut doivent être confrontées aux conventions du projet avant installation : ne pas conserver automatiquement inscription publique, écrans de démonstration ou autres fonctionnalités du template.

## Limites du POC et passage aux données réelles

Lilian retire explicitement l’exigence de sauvegarde quotidienne conservée sept jours pour ce POC. Le bloc de sauvegarde de secours et ses objectifs associés ne conditionnent plus le POC ; aucune automatisation, export périodique ou offre payante ne sera ajouté pour y répondre. Supabase Free reste une candidate. Cette décision conserve la persistance normale des données enregistrées et la récupération de saisie en cas d’échec.

L’envoi e-mail intégré de Supabase Auth est destiné aux essais et limité aux adresses des membres de l’équipe du projet. Pour tester la récupération du mot de passe avec seulement ces deux services, le compte de test doit être admissible ; sinon prévoir un SMTP adapté. La récupération reste dans le périmètre fonctionnel. Aucun e-mail n’a été envoyé ou testé.

Le plan Vercel effectif reste à vérifier lors du déploiement. La qualification de POC ne détermine pas à elle seule son éligibilité à Hobby ; la documentation réserve Hobby à l’usage personnel non commercial. Aucun abonnement payant n’est déclenché par ce document.

Sources vérifiées le 6 septembre 2026 : [tarifs Supabase](https://supabase.com/pricing), [sauvegardes Supabase](https://supabase.com/docs/guides/platform/backups), [e-mails Supabase Auth](https://supabase.com/docs/guides/auth/auth-smtp), [plan Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Piste antérieure

L’étude Vercel Pro + Neon Launch est écartée comme direction du POC sur la demande de Lilian. Ses constats et la chronologie restent dans le journal ; ils ne constituent ni un choix actif ni une dépense engagée. Aucun chiffrage mensuel garanti sans connaître le plan effectif et la consommation.
