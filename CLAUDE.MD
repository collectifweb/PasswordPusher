# CLAUDE.md

## Project Context

- **Stack**: Ruby on Rails 8.1 / Ruby 4.0 / Puma / SolidQueue
- **CSS loading**: Sass compilé via cssbundling-rails + Bootstrap 5, custom.css Collectif chargé en dernier
- **Templates**: ERB avec layout application.html.erb
- **Base de données**: SQLite3 (production, fichier dans storage/db/)
- **Storage/fichiers**: Volume Docker `/opt/PasswordPusher/storage`
- **Déploiement**: Docker (pglombardo/pwpush:stable) sur DO/RunCloud. Voir `deploy/` et `new_deploy.md`
- **Variables d'env**: `.env` sur le serveur (voir `deploy/.env.example`), pas de .env local
- **Personnalisations CW**: CSS via volume mount, JS via nginx sub_filter, labels via cw-custom.js

### Architecture de déploiement

L'app utilise l'image Docker upstream (pas de build custom). Les personnalisations sont externes :
- `deploy/custom.css` -> monté en volume dans le container
- `deploy/cw-custom.js` -> servi par nginx, injecté via sub_filter
- `deploy/nginx/` -> configs RunCloud/nginx pour reverse proxy + injection
- Variables d'env dans `.env` pour branding, features, expiration

**Mise à jour upstream** : `docker compose pull && docker compose up -d` (rien à rebuild)

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

1. Modifier les fichiers dans `deploy/` ou `app/assets/stylesheets/custom.css`
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
