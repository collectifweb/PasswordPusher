## Déploiement - RunCloud / Digital Ocean

**Serveur** : 159.89.118.112
**User** : cwsecretsdaddou
**URL** : secrets.collectifweb.ca
**Gestion serveur** : RunCloud
**App** : Docker (pglombardo/pwpush:stable)

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

### Commandes utiles

```bash
# Mise à jour de l'app (upstream)
cd ~/pwpush && docker compose pull && docker compose up -d

# Logs
docker compose logs -f

# Redémarrer
docker compose restart

# Recharger nginx après modif des configs
sudo nginx-rc -t && sudo systemctl reload nginx-rc
```

### Personnalisations CW

Toutes les customisations sont externes au container Docker :
- **Branding** : variables d'env dans .env (PWP__BRAND__*)
- **CSS** : custom.css monté en volume (recompilé au boot via PWP_PRECOMPILE=true)
- **Labels/textes** : cw-custom.js injecté par nginx sub_filter
- **Footer** : liens cachés via CSS

Les mises à jour upstream (`docker compose pull`) n'écrasent rien.
