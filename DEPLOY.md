## Déploiement - RunCloud / Digital Ocean

**Serveur** : 159.89.118.112
**User** : cwsecretsdaddou
**URL** : secrets.collectifweb.ca
**Gestion serveur** : RunCloud
**App** : Docker (pglombardo/pwpush:stable)
**Upstream** : https://github.com/pglombardo/PasswordPusher.git

### Fichiers sur le serveur

```
~/pwpush/
  docker-compose.yml   # Container config
  .env                 # Secrets et variables (chmod 600)
  custom.css           # CSS Collectif (volume mount)
  cw-custom.js         # JS custom (servi par nginx)
```

### Configs nginx (RunCloud)

```
/etc/nginx-rc/extra.d/
  app-secrets.location.root.secrets.conf       # Reverse proxy vers Docker
  app-secrets.location.root.inject.conf        # Injection du script cw-custom.js
  app-secrets.location.main-before.assets.conf # Proxy des assets statiques
  app-secrets.location.main-before.cwjs.conf   # Sert le fichier cw-custom.js
```

### Personnalisations CW

Toutes les customisations sont externes au container Docker :
- **Branding** : variables d'env dans .env (PWP__BRAND__*)
- **CSS** : custom.css monté en volume (recompilé au boot via PWP_PRECOMPILE=true)
- **Labels/textes** : cw-custom.js injecté par nginx sub_filter
- **Footer** : liens cachés via CSS

Les mises à jour upstream (`docker compose pull`) n'écrasent rien.

---

## Procédure de mise à jour

L'app a deux axes de mise à jour indépendants :

### 1. Mise à jour de l'image Docker (app upstream)

L'image `pglombardo/pwpush:stable` est publiée sur DockerHub par l'auteur upstream.
Pour appliquer une nouvelle version :

```bash
ssh cwsecretsdaddou@159.89.118.112
cd ~/pwpush
docker compose pull        # Télécharge la nouvelle image
docker compose up -d       # Redémarre avec la nouvelle version
docker compose logs -f     # Vérifier le boot (attendre ~40s pour la precompilation CSS)
```

Vérification :
```bash
curl -sf -H 'Host: secrets.collectifweb.ca' http://127.0.0.1:5100/up && echo "OK"
```

Les personnalisations CW (CSS, JS, env vars) survivent car elles sont montées en volume ou injectées par nginx, pas dans l'image.

> **Attention** : si l'upstream modifie la structure HTML du formulaire, le CSS ou le JS custom pourrait ne plus cibler les bons éléments. Vérifier visuellement le site après chaque update.

### 2. Mise à jour du repo local (sync avec upstream)

Le repo local est un fork de `pglombardo/PasswordPusher`. Pour récupérer les changements upstream :

```bash
cd "/home/alexandre/Apps-coding/CW_Password Pusher"
git fetch upstream
git merge upstream/master
```

**Fichiers susceptibles de conflits lors du merge** :
- `config/environments/production.rb` — on a fixé le bug du `config.hosts`, upstream pourrait modifier ce fichier
- `config/settings.yml` — on a customisé le branding (titre, tagline), upstream pourrait ajouter de nouveaux paramètres
- `app/assets/stylesheets/custom.css` — notre fichier de customisations, upstream pourrait le modifier aussi
- `docker-compose.yml` — on n'a pas modifié celui du repo (le nôtre est dans `deploy/`), mais à surveiller

En cas de conflit, **toujours garder nos modifications CW** dans ces fichiers.

Après le merge :
```bash
git push origin master
```

### 3. Déploiement des fichiers custom modifiés localement

Si tu modifies `deploy/custom.css`, `deploy/cw-custom.js` ou les configs nginx en local :

```bash
# CSS ou JS custom
scp deploy/custom.css cwsecretsdaddou@159.89.118.112:~/pwpush/
scp deploy/cw-custom.js cwsecretsdaddou@159.89.118.112:~/pwpush/

# Redémarrer le container (nécessaire pour le CSS car PWP_PRECOMPILE recompile au boot)
ssh cwsecretsdaddou@159.89.118.112 "cd ~/pwpush && docker compose down && docker compose up -d"

# Configs nginx (si modifiées)
scp deploy/nginx/*.conf cwsecretsdaddou@159.89.118.112:/tmp/
ssh cwsecretsdaddou@159.89.118.112 "sudo cp /tmp/app-secrets.*.conf /etc/nginx-rc/extra.d/ && sudo nginx-rc -t && sudo systemctl reload nginx-rc"
```

---

## Commandes utiles

```bash
# Logs du container
ssh cwsecretsdaddou@159.89.118.112 "cd ~/pwpush && docker compose logs -f"

# Redémarrer
ssh cwsecretsdaddou@159.89.118.112 "cd ~/pwpush && docker compose restart"

# Voir la version en cours
ssh cwsecretsdaddou@159.89.118.112 "cd ~/pwpush && docker compose logs | grep 'Version:' | tail -1"

# Recharger nginx
ssh cwsecretsdaddou@159.89.118.112 "sudo nginx-rc -t && sudo systemctl reload nginx-rc"

# Health check
ssh cwsecretsdaddou@159.89.118.112 "curl -sf -H 'Host: secrets.collectifweb.ca' http://127.0.0.1:5100/up && echo OK"
```
