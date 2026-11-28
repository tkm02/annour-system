# Changelog — An-Nour Frontend (back-office)

Toutes les évolutions notables de ce dépôt sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]
### Ajouté — comptes du back-office (TAF lot 3, 2026-11-27)
- Rôle `super_admin` : seul à voir « Gérer les accès » ; l'administration (`admin`) consulte les finances sans
  pouvoir les modifier (boutons d'écriture et décision de paiement masqués) et garde la santé.
- Pages publiques `/activer`, `/mot-de-passe-oublie`, `/reinitialiser` : choix du mot de passe par lien reçu par
  email (règles cochées en direct, 10 caractères minimum), écrans lien expiré / déjà utilisé, jeton retiré de
  l'adresse et des mesures d'audience.
- Connexion par nom d'utilisateur ou email, lien « Mot de passe oublié ? ».
- `/acces` : statut « En attente d'activation », (r)envoi des liens, génération en lot des comptes des membres du
  CO (aperçu, sélection, rapport), journal des connexions ; création d'un accès avec lien d'activation par défaut.
- Nécessite le backend `feature/lot3-comptes-co` (contrat : `docs/features/comptes-co.md` du dépôt Backend) ;
  déployer **après** l'API.

### Sécurité — revue du lot 3 (2026-11-28)
- Export CSV de `/acces` protégé contre l'injection de formules ; appels publics des liens sans le jeton de session
  locale ; rôle `super_admin` absent des listes de rôles (attribué uniquement par script, décision du 2026-11-28) ;
  séminariste créé par l'administration signalé « paiement à valider par la commission Finance » ;
  `console.error` retiré de la modification d'un accès ; F-40, F-41 au TECH_DEBT.

### Modifié — domaine de production (2026-11-24)
- Badges : l'adresse du site public imprimée devient `annour.ci` (constante `SITE_PUBLIC` de `lib/edition.ts` au lieu
  de 12 copies de `https://an-nour25.vercel.app`, F-13). Back-office servi sur `https://backoffice.annour.ci`
  (`docs/ENVIRONMENTS.md`).

### Modifié — recensement CO, qualités selon la commission (2026-11-24)
- Qualités Manager Général / Manager Général Adjoint (Comité Managérial) ajoutées aux libellés et au filtre ;
  qualité vide (« — ») pour les commissions sans qualité. Formulaire de correction : qualités proposées selon la
  commission (`qualites_par_commission` de `/co/configuration`), champ remplacé par une mention pour une commission
  sans qualité, qualité envoyée avec un changement de commission. Nécessite le backend
  `feature/co-qualites-par-commission`.

### Modifié — refonte UI, socle (TAF lot 5, ADR 0002)
- Design system : bleu `#004576` en couleur principale (boutons lisibles : 9,94:1 au lieu de 2,16:1, F-02), vert
  An-Nour réservé à la marque, couleurs sémantiques succès / alerte / erreur / info, anneau de focus visible
  (4,42:1 au lieu de 1,11:1, F-17), police Plus Jakarta Sans (`next/font`, sans dépendance ajoutée).
- Coque : barre latérale groupée par domaine et repliable (préférence mémorisée), tiroir mobile accessible (focus
  piégé, Échap), fil d'Ariane, badge de l'édition, menu utilisateur, palette « Aller à… » (Ctrl+K, navigation
  seule), lien « Aller au contenu », pages d'erreur et 404. Le logo renvoie à l'accueil du rôle (finances et
  santé n'aboutissent plus sur une page refusée).
- Menu admin : pages Scientifique, Attributions, Notes, Bulletins et Formateurs ajoutées (droits inchangés).
- Notifications unifiées sur sonner, messages sans emoji (F-11).
- Composants communs : en-tête de page, indicateurs, badges de statut, états vides et squelettes, tableau de
  données (tri, pagination, vue cartes sous 768 px) et barre de filtres (recherche insensible aux accents).
- Écrans migrés : tableau de bord (4 indicateurs, répartition par niveau, état d'erreur au lieu de « 000 »),
  Scientifique, Visiteurs, Formateurs, Membres CO (archives), Recensement CO, Avis (confirmation accessible au lieu
  de `confirm()`), Attributions. `Field` déplacé dans `components/common/` (F-22).
- Aucun appel d'API ajouté, retiré ou modifié.

### Sécurité
- `next` et `eslint-config-next` 16.4.3 → 16.4.5 (avis GHSA-mfr8-8qww-v76h et GHSA-vc7v-qv4w-wrv8) : le build ne
  s'interrompt plus sur `SecurityFatalError` (F-01).
- Plus de repli silencieux sur l'API de production : sans `NEXT_PUBLIC_API_URL`, un build de production refuse les
  appels avec un message explicite ; hors production, repli sur `http://localhost:8000/api/v1` (F-17). La variable
  doit être définie dans Vercel (Production et Preview).

### Corrigé
- Fiche médicale : les consultations du patient précédent ne sont plus affichées ni cliquables après un changement
  de patient ; les réponses périmées (patient ou page précédents) sont ignorées (F-18).
- Dialogues de détail (paiement, entrée, rapport, historique d'une sortie, consultation) : une réponse arrivée après
  l'ouverture d'un autre élément est ignorée ; la décision de paiement cible toujours le matricule affiché (F-20).
- Compte désactivé pendant la session (403 « Compte désactivé ») : jeton et utilisateur effacés, retour à la
  connexion (F-21).
- `lib/api.ts` : paramètres de chemin encodés (séminaristes, notes, bulletins, utilisateurs, avis) (F-23).
- Garde de route : la redirection vers la connexion attend la lecture de la session (`isLoading`) au lieu de
  dépendre de l'ordre des effets (F-24).
- Recensement CO, cas à vérifier : libellés des motifs `complete` (fiche envoyée sans identification préalable qui
  correspond à une fiche existante, API `fix/recensement-co-securite`) et `tentatives` (identité verrouillée) ;
  le libellé `partielle` ne cite plus la date de naissance (retirée du recensement le 2026-11-22).

### Ajouté
- Séminaristes (TAF lot 2) : repère « Ancien (confirmé) » / « Ancien déclaré — à vérifier », filtre
  « Réinscriptions à vérifier » et, pour l'administration, actions « Lier à l'inscription de l'an dernier » / « Délier »
  (`PATCH /admin/seminaristes/{matricule}/reinscription`).
- Recensement CO (`/recensement-co`, rôle admin) : synthèse de l'édition en cours, fiches paginées avec recherche,
  filtres et export CSV/Excel, détail (santé signalée confidentielle, historique des éditions), correction,
  validation, rejet motivé et traitement des cas à vérifier (fusion ou personne différente) — routes `/admin/co/*`.
  Silhouette de photo d'identité réutilisable (`components/common/id-photo-placeholder.tsx`). La page
  `/membres-co` (fiches 2025) est inchangée ; son entrée de menu devient « Membres CO 2025 (archives) ».
- Sécurité du cadre (revues du 2026-11-19) : hook `PreToolUse` de protection des secrets, permissions de l'assistant
  resserrées (`git branch`, `git diff --no-index`, exports, réécritures), CI durcie (SHA-256 de gitleaks épinglé,
  `persist-credentials: false`, expressions via `env:`, repli si le commit précédent est introuvable).
- Script `prepare` tolérant (`.husky/install.mjs`) : ignoré en CI, en production et sans devDependencies.
- CI : contrôles sur `mdev` et ses PR, couverture de `lib/` mesurée (rapport), jeton en lecture seule.
- Règles de collaboration : `.claude/settings.json` (permissions partagées de l'assistant), modèles de PR et
  d'issues, `CODEOWNERS`, hook pré-commit Husky + lint-staged (ESLint sur les fichiers indexés, gitleaks si installé).
- Agents spécialisés (`.claude/agents/`) et commandes partagées du workflow (`.claude/commands/`).
- Documentation de référence du projet existant : `CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md` et `docs/`
  (architecture, conventions, fonctionnalités, sécurité, tests, environnements, déploiement, exploitation,
  design system, lignes directrices UX, dette technique, audit initial, ADR, modèles).
- `.env.example` : toutes les variables `NEXT_PUBLIC_EDITION_*` lues par `lib/edition.ts` sont listées.
### Modifié
- `docs/LOCAL_SETUP.md` signalé comme historique (projet Django abandonné).

## [0.1.0] — état au 2026-11-19
Version de `package.json` au moment de la mise en place du cadre de travail (aucun tag Git n'existait).
Écrans existants : voir `docs/FEATURES.md`.
