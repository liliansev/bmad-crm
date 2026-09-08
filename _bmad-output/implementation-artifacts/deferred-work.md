
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-recuperation-acces.md`
  summary: L’API publique Supabase peut distinguer indirectement une adresse existante par certaines erreurs d’envoi, malgré les messages applicatifs neutres.
  evidence: Préexistant à la story : Recover Supabase retourne 200 pour compte absent avant sendPasswordRecovery, qui peut échouer pour compte existant (https://github.com/supabase/auth/blob/master/internal/api/recover.go). API déjà accessible avec clé publiable de 1.1. Les messages de succès nominaux restent identiques ; aucune garantie d’indistinguabilité des erreurs fournisseur n’est revendiquée.

- source_spec: `spec-contact-noms-sans-chiffres.md`
  summary: Limite préexistante de rejeu inter-canaux RPC brut vers HTTP v1 pour des noms avec espaces périphériques (low).
  evidence: saveContactAction transmet historiquement parsed.data normalisé en v1 ; un reçu RPC direct contenant des espaces a une empreinte différente après normalisation HTTP. Les commandes v1 de l’application et leurs brouillons exigent de conserver cette normalisation. Évaluer un éventuel besoin inter-canaux avant évolution du protocole ; ce cas n’est pas introduit par la règle des chiffres.
