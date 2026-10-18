# CLAUDE.md

## Action en attente

- **À partir du 25/10/2026, en début de session** : rappeler à Alexandre d'effacer, sur le serveur, la
  sauvegarde d'avant le passage en 2.14.3 (`~/sauvegardes/pwpush-1.69.3-20261017/`) et le dossier
  d'attente `~/pwpush-bascule/`. Accord donné le 18/10, si la 2.14.3 tourne sans souci : vérifier
  d'abord (version, conteneur sain, page d'accueil), puis lui redemander le feu vert. Marche à suivre :
  `tasks/todo.md` (hors git). Retirer cette section une fois l'effacement fait.

## Project Context

- **Stack**: Ruby on Rails / Puma / SolidQueue. Prod (image 2.14.3 depuis le 18/10/2026) : Rails 8.1.4, Ruby 4.0.7.
  Dépôt : aligné sur l'étiquette officielle `v2.14.3` (même code que l'image en prod), plus les
  fichiers CW (`deploy/`, docs). Il suit la version épinglée, pas `master` (voir `DEPLOY.md`).
- **CSS loading**: Sass compilé via cssbundling-rails + Bootstrap 5, custom.css Collectif chargé en dernier
- **Templates**: ERB avec layout application.html.erb
- **Base de données**: SQLite3 (production, fichier dans storage/db/)
- **Storage/fichiers**: Volume Docker `/opt/PasswordPusher/storage`
- **Déploiement**: Docker (pglombardo/pwpush:2.14.3, version épinglée) sur DO/RunCloud. Voir `deploy/` et `DEPLOY.md`
- **Variables d'env**: `.env` sur le serveur (voir `deploy/.env.example`), pas de .env local
- **Personnalisations CW**: CSS via volume mount, JS via nginx sub_filter (avec le nonce de la CSP,
  sans quoi la 2.x bloque le script), labels via cw-custom.js. Thème clair forcé (`PWP__THEME_MODE=light`).
- **Le dépôt n'est pas la prod** : le serveur tourne l'image upstream, pas ce code. Ce qui concerne le
  code en service se vérifie dans le conteneur (`docker compose exec -T pwpush ...`, code dans
  `/opt/PasswordPusher`).
- **Dépôt GitHub public** (fork de pglombardo/PasswordPusher) : aucun secret ni détail de faille non
  corrigée dans un fichier commité ; un blocage se pousse après son déploiement. `tasks/` est exclu
  localement (`.git/info/exclude`).
- **Secrets** : ne jamais afficher le `.env` de prod ni écrire une valeur de secret dans une commande.
  Elle finit dans le journal de session et, si la commande est autorisée, dans
  `.claude/settings.local.json`.

### Architecture de déploiement

L'app utilise l'image Docker upstream (pas de build custom). Les personnalisations sont externes :
- `deploy/custom.css` -> monté en volume dans le container
- `deploy/cw-custom.js` -> servi par nginx, injecté via sub_filter
- `deploy/nginx/` -> configs RunCloud/nginx pour reverse proxy + injection (avec nonce) + blocage de `/cable`
- Variables d'env dans `.env` pour branding, features, expiration

**Mise à jour upstream** : la version est épinglée dans `deploy/docker-compose.yml` (2.14.3). Changer
de version = changer cette étiquette, après un essai local : la structure HTML et la CSP de l'image
peuvent casser `custom.css` et `cw-custom.js` (voir `DEPLOY.md`). Ne jamais revenir à `stable`.
Fusionner ensuite la même étiquette dans le dépôt, pour que ses alertes Dependabot restent celles de la prod.

### Serveur

- IP : 159.89.118.112
- User : cwsecretsdaddou
- URL : secrets.collectifweb.ca
- Panel : RunCloud

---

## Workflow Fondamental

### 1. Diagnostic d'abord — TOUJOURS
- **Ne jamais proposer un fix sans avoir tracé le chemin d'exécution réel.**
- Quand on te signale un bug : reformuler le symptôme, lire le code concerné, vérifier les logs.
- Identifier la cause racine et la présenter AVANT d'écrire du code.
- Ne pas traiter les symptômes (ex: ajouter `!important` quand le CSS ne se charge pas du tout).
- Si tu n'es pas sûr de la cause, poser des questions de clarification plutôt que deviner.

### 2. Plan Mode par défaut
- Entrer en mode plan pour toute tâche non triviale (3+ étapes ou décisions d'architecture).
- **Faire valider le plan AVANT de commencer l'implémentation.**
- Si quelque chose dérape, STOP et re-planifier immédiatement — ne pas continuer à pousser.

### 3. Vérification anti-régression
- Ne jamais marquer une tâche complète sans prouver qu'elle fonctionne.
- Chercher les effets de bord dans les fichiers liés (même scope, mêmes imports).
- Run tests, check logs, démontrer que ça marche.

---

## Debugging

- Quand on te donne un bug : le fixer de manière autonome.
- **Tracer le chemin d'exécution complet** avant de toucher au code.
- Ne pas assumer la cause racine — la prouver.

---

## Déploiement

1. Modifier les fichiers dans `deploy/`. C'est `deploy/custom.css` qui part en prod ;
   `app/assets/stylesheets/custom.css` est le fichier officiel, remplacé en prod par ce montage.
2. Copier sur le serveur : `scp deploy/custom.css cwsecretsdaddou@159.89.118.112:~/pwpush/`
3. Redémarrer si nécessaire : `ssh ... "cd ~/pwpush && docker compose down && docker compose up -d"`
4. Pour les configs nginx : copier dans `/etc/nginx-rc/extra.d/` puis `sudo nginx-rc -t && sudo systemctl reload nginx-rc`

---

## Principes

- **Simplicité d'abord** : Chaque changement doit être aussi simple que possible.
- **Pas de paresse** : Trouver les causes racines. Pas de fixes temporaires.
- **Élégance (équilibrée)** : Ne pas sur-ingénierer les fixes simples et évidents.

---

## Subagents

- Utiliser les subagents pour garder la fenêtre de contexte principale propre.
- Déléguer la recherche, l'exploration et l'analyse parallèle aux subagents.
