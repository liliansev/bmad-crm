# Contexte de réalisation — récupération d’accès

## État vérifié le 7 septembre 2026

- Projet Supabase dédié `bmad-crm`, ref `otadrkhrjxafutocstzo`, organisation Persos `ptbvnsccszcxeiahojdc`, actif eu-west-3. Plan gratuit vérifié en story 1.1.
- Propriétaire déjà créé et connexion confirmée par Lilian. Adresse propriétaire admissible au SMTP Supabase par appartenance à cette organisation, vérifiée via API des membres ; le connecteur Gmail correspond à ce même compte. Ne pas ajouter de SMTP ni abonnement.
- Auth : inscription et anonymat désactivés ; Site URL `http://localhost:3000` ; redirect allowlist actuelle `http://localhost:3000/auth/callback` ; template recovery actuel ConfirmationURL ; expiration lien 3600 secondes ; minimum mot de passe 6 caractères ; quota 2 e-mails/heure.
- `.env.local` contient déjà NEXT_PUBLIC_APP_URL mais `lib/env.ts` ne le valide pas encore. L’origine doit être stricte, sans credentials/query/hash/path, HTTP seulement sur localhost en développement et HTTPS ailleurs. Ne jamais prendre Host ou une valeur `next` du client.
- Dev actif `http://localhost:3000`, journal `.local/dev.log`. Node 24 : `/Users/a1207/.npm/_npx/460b723c8ad28bd7/node_modules/node/bin/node` ; mettre son répertoire au début de PATH. Ne pas lancer une deuxième instance ni build.

## Transport et confiance — correction après réponse distante

La tentative PATCH du template a été refusée : « Email template modification is not available for free tier projects using the default email provider. Please upgrade your plan or configure a custom SMTP provider. » Aucun achat ni SMTP. Garder le template ConfirmationURL natif ; seule l’allowlist doit inclure http://localhost:3000/reinitialiser. Le mail natif passe par /auth/v1/verify qui consomme le lien puis redirige vers le fragment implicit documenté access_token, refresh_token, type=recovery. Le formulaire ne doit jamais dépendre du token_hash personnalisé.

Le fragment n’est pas transmis au serveur HTTP. Le retirer avant toute autre navigation, conserver temporairement en mémoire et soumettre les deux tokens avec le mot de passe. Ne pas persister dans sessionStorage/localStorage/cookie. Lire et traiter aussi error/error_code du retour fournisseur, sans afficher leur contenu brut.

Client Supabase JS éphémère serveur (server-only, persistSession:false, autoRefreshToken:false, detectSessionInUrl:false, flowType:implicit, fetch borné). Avant mutation : getUser(access_token) authentique et UUID ; décoder uniquement ce JWT vérifié avec Zod pour vérifier session_id, exp et amr contenant otp/recovery, timestamp de moins d’une heure. Ne jamais croire type=recovery seul : une session password normale serait sinon suffisante. Supabase attribue réellement AMR otp à verifyOtp recovery, et non recovery ; constat live sur fixture temporaire, supprimée ensuite.

Forcer refreshSession avec refresh_token pour vérifier qu’elle n’est pas révoquée ; confirmer identité et même session_id pour empêcher le mélange de sessions. Puis updateUser, et signOut local pour révoquer cette session temporaire. Aucune persistance dans cookies SSR CRM. En live sur fixture : verifyOtp → AMR otp ; refresh → updateUser → signOut réussis ; les deux refresh tokens initial/renouvelé ont ensuite été refusés (refresh_token_not_found), getUser initial également refusé. Les autres moyens d’authentification par e-mail ont le même AMR otp : le contrôle prouve une authentification fraîche par e-mail, pas la sémantique d’un paramètre URL ; l’application n’expose aucun autre parcours e-mail. Refuser toute session password et toute identité non propriétaire.

Valider les champs avant les appels. Une erreur après rafraîchissement peut rendre le lien inutilisable : informer honnêtement et proposer un nouveau lien. Une réponse updateUser perdue ne prouve pas que le mot de passe n’a pas changé : conseiller essai de connexion ou nouveau lien, ne pas affirmer « inchangé ». Un échec de nettoyage ne doit pas masquer une mutation déjà confirmée.

L’agent principal réalise la configuration distante, demande d’e-mail réelle et réception Gmail. L’agent d’implémentation ne fait aucune configuration distante ni envoi. Scripts QA chargent les secrets en mémoire depuis `.local/bootstrap-secrets.json` mode 600 sans impression. Script réel parent : scripts/verify-recovery-real.mjs, lien natif reçu fourni dans fichier ignoré protégé, mot de passe temporaire restauré dans finally par admin puis reconnexion initiale. Préserver le mot de passe fourni à Lilian.

## Documentation consultée avec Context7

- Supabase `/supabase/supabase` : passwords.mdx, endpoint Next verifyOtp(token_hash,type), template recovery personnalisé TokenHash.
- Supabase `/supabase/auth` : POST verify renvoie une session temporaire ; UpdatePassword efface les tokens à usage unique et révoque les autres sessions. Ne pas supposer qu’un JWT existant cesse immédiatement d’être cryptographiquement valide.
- Sources : https://supabase.com/docs/guides/auth/passwords et https://supabase.com/docs/guides/auth/auth-email-templates ; SMTP de test https://supabase.com/docs/guides/auth/auth-smtp.

## Vérification à compléter

Consigner ici les preuves, limites et configuration finale sans mot de passe, token, clé ou lien secret. Les contrôles invalid/expired peuvent utiliser un token refusé réellement par Supabase, mais ne pas présenter un token aléatoire comme preuve d’expiration temporelle. La consommation doit être testée avec un vrai lien déjà utilisé. Maintenir les fixtures temporaires nettoyées même en échec de test.

## Preuves réelles — 7 septembre 2026

- Configuration relue après mutation : allowlist ajoute `http://localhost:3000/reinitialiser`, garde callback existant ; template natif, SMTP et inscription désactivée conservés. Aucun service ou abonnement ajouté. Sauvegarde privée de configuration conservée sous `.local/`.
- Demande par formulaire réel agent-browser à 16:22:27 UTC ; réception Gmail INBOX à 16:22:30 UTC, sujet natif « Reset your password », message `1a07cadade48fffb`. Aucun lien secret consigné ici.
- `scripts/verify-recovery-real.mjs` exécuté sous Node 24 : 13 assertions passent. Lien natif exact reçu ouvert, secrets retirés de l’URL ; changement confirmé dans le formulaire ; ancien mot de passe refusé par Auth, nouveau accepté ; reconnexion navigateur réussie ; lien natif consommé refusé même navigateur propriétaire connecté ; mot de passe initial restauré par administration puis reconnexion navigateur avec les identifiants initiaux réussie. Le fichier local de connexion reste exact.
- Résultats détaillés ignorés : `verification/1-2/real-mail-results.json` ; capture `verification/1-2/lien-consomme.png`. Fichier temporaire contenant le lien supprimé par finally.
- Limite du plan gratuit constatée : e-mail natif anglais, quota d’envoi 2/heure ; interface applicative française. Réception effective prouvée pour ce compte ; pas de garantie de délivrabilité générale.

- Contrôles parent complémentaires : 63 vérifications ciblées, 52 contrôles Auth 1.1, TypeScript propre ; scan du journal Next sans valeur de token de récupération. Résultats relus depuis les fichiers de preuve.

## Clôture après revue

- Les 14 constats de trois revues ont été triés dans la spec. Correctifs de révocation, messages, assertions de destination/scope et nettoyage appliqués. Limite préexistante de l’API Supabase documentée dans deferred-work.md ; deux améliorations exceptionnelles rejetées avec motif.
- Seconde réception réelle : Gmail INBOX, 7 septembre 16:41:21 UTC, message `1a07cbeeaa65e37c`. Changement et révocation du refresh token réussis. Une course de navigation dans le script a interrompu ensuite la vérification du navigateur ; le mot de passe initial a été restauré et confirmé par Auth. Cette exécution partielle n’est pas présentée comme entièrement réussie.
- La recette complémentaire emploie un lien généré par l’API administrateur dédiée, sans troisième envoi d’e-mail. Après correction de l’attente de navigation dans le script, elle passe intégralement : changement, refus ancien, connexion nouveau, URL consommée refusée, refresh token révoqué refusé, même paire de tokens rejouée refusée, restauration et reconnexion avec le mot de passe initial. Source explicitement `admin-generated` dans `verification/1-2/generated-link-results.json` ; elle ne remplace pas les preuves Gmail précédentes.
- État final : TypeScript propre, 68 contrôles ciblés passent ; 52 contrôles Auth 1.1 passés avant correctifs confinés à récupération et recette. Aucune dépendance ni table ajoutée. Aucun push/déploiement. Dev localhost:3000 maintenu.
- Adresse inconnue valide réellement soumise à 16:39:39 UTC : même réponse neutre nominale que propriétaire, sans prétendre prouver l’indistinguabilité des erreurs du fournisseur.
