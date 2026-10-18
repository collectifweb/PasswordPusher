## Déploiement - RunCloud / Digital Ocean

**Serveur** : 159.89.118.112
**User** : cwsecretsdaddou
**URL** : secrets.collectifweb.ca
**Gestion serveur** : RunCloud
**App** : Docker (pglombardo/pwpush:2.14.3, version épinglée depuis le 18/10/2026)
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
  app-secrets.location.http.cwnonce.conf        # Relit le nonce de la CSP (niveau http, directive map)
  app-secrets.location.main-before.secrets.conf # Reverse proxy vers Docker + injection de cw-custom.js avec le nonce
  app-secrets.location.main-before.assets.conf  # Proxy des assets statiques
  app-secrets.location.main-before.cwjs.conf    # Sert le fichier cw-custom.js
  app-secrets.location.main-before.cable.conf   # Ferme /cable (websocket ActionCable, inutilisé)
```

Les fichiers de `deploy/nginx/` portent les mêmes noms que sur le serveur.

La CSP de la 2.x (`strict-dynamic`) n'exécute que les scripts qui portent son nonce. nginx le relit
dans l'en-tête de la réponse et le recopie sur la balise de `cw-custom.js`. Si cette recopie se perd,
le script est bloqué sans bruit : plus de menus d'expiration ni de bouton « Copier le lien ».

### Personnalisations CW

Toutes les customisations sont externes au container Docker :
- **Branding** : variables d'env dans .env (PWP__BRAND__*)
- **CSS** : custom.css monté en volume (recompilé au boot via PWP_PRECOMPILE=true)
- **Labels/textes** : cw-custom.js injecté par nginx sub_filter
- **Footer** : liens cachés via CSS
- **Thème** : clair seulement, sans bascule (`PWP__THEME_MODE=light`)
- **Comptes** : fermés (`PWP__DISABLE_LOGINS=true`, `PWP__DISABLE_SIGNUPS=true` ; sans eux, la 2.x
  renvoie vers `/first_run` tant que la base n'a aucun compte)

Les mises à jour upstream (`docker compose pull`) n'écrasent rien.

---

## Procédure de mise à jour

L'app a deux axes de mise à jour indépendants :

### 1. Mise à jour de l'image Docker (app upstream)

L'image `pglombardo/pwpush` est publiée sur DockerHub par l'auteur upstream. La version est épinglée
dans `deploy/docker-compose.yml` : ne jamais revenir à `stable`, qui change de version sans prévenir.

Pour appliquer une nouvelle version :

1. Essayer d'abord la nouvelle image en local, avec les réglages de prod et des clés de test : le CSS
   et le JS custom visent la structure HTML de l'image, et la CSP peut changer.
2. Changer l'étiquette dans `deploy/docker-compose.yml`, copier le fichier sur le serveur.
3. Sauvegarder la base (volume `pwpush_pwpush-storage`, conteneur arrêté) et le `.env`.
4. Appliquer :

```bash
ssh cwsecretsdaddou@159.89.118.112
cd ~/pwpush
docker compose pull                 # Télécharge l'image épinglée
docker compose up -d --wait         # Redémarre (≈ 1 min avec la précompilation CSS, mesuré le 18/10/2026)
docker compose logs pwpush | grep -E "Version|migrat"
```

Vérification :
```bash
curl -sf -H 'Host: secrets.collectifweb.ca' http://127.0.0.1:5100/up && echo "OK"
```

Les personnalisations CW (CSS, JS, env vars) survivent car elles sont montées en volume ou injectées par nginx, pas dans l'image.

> **Attention** : si l'upstream modifie la structure HTML du formulaire, le CSS ou le JS custom pourrait ne plus cibler les bons éléments. Vérifier visuellement le site après chaque update.

> **Attention** : `/cable` est fermé par nginx (`app-secrets.location.main-before.cable.conf`). Si une nouvelle version de l'image se sert du websocket, ce blocage la cassera : vérifier dans le navigateur qu'aucune page ne tente d'ouvrir `/cable`.

### 2. Mise à jour du repo local (sync avec upstream)

Le repo local est un fork de `pglombardo/PasswordPusher`. Pour récupérer les changements upstream :

```bash
cd /home/alexandre/Apps-coding/CW_secrets
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
curl -s https://secrets.collectifweb.ca/api/v1/version.json

# Recharger nginx
ssh cwsecretsdaddou@159.89.118.112 "sudo nginx-rc -t && sudo systemctl reload nginx-rc"

# Health check
ssh cwsecretsdaddou@159.89.118.112 "curl -sf -H 'Host: secrets.collectifweb.ca' http://127.0.0.1:5100/up && echo OK"

# Vérifier que /cable reste fermé (attendu : 404). Toujours en HTTP/1.1 : en HTTP/2, la réponse trompe.
curl -s -o /dev/null -w '%{http_code}\n' --http1.1 --max-time 4 -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' https://secrets.collectifweb.ca/cable
```
