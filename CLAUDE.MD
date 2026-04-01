# CLAUDE.md

## Project Context
<!-- PERSONNALISER PAR PROJET — Remplis cette section pour chaque repo -->

- **Stack**: [ex: Node.js/Express + EJS, WordPress/PHP, Python/FastAPI...]
- **CSS loading**: [ex: Elementor, Tailwind build, fichier statique enqueued via wp_enqueue_style...]
- **Templates**: [ex: EJS avec layout base.ejs, Blade, Twig...]
- **Base de données**: [ex: PostgreSQL via Sequelize, MySQL direct, MongoDB...]
- **Storage/fichiers**: [ex: disque local /storage, S3 bucket X, wp-content/uploads...]
- **Déploiement**: [ex: SSH vers VPS + pm2 restart, git push heroku, rsync...]
- **Variables d'env**: [ex: .env local, wp-config.php, Secrets Manager...]
- **Intégrations clés**: [ex: PandaDoc API, Stripe, PayPal IPN, OpenAI...]

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
- Écrire le plan dans `tasks/todo.md` avec des items cochables.
- **Faire valider le plan AVANT de commencer l'implémentation.**
- Si quelque chose dérape, STOP et re-planifier immédiatement — ne pas continuer à pousser.

### 3. Vérification anti-régression
- Ne jamais marquer une tâche complète sans prouver qu'elle fonctionne.
- Après modification de templates (EJS, Blade, etc.) : vérifier la compilation/le rendu.
- Chercher les effets de bord dans les fichiers liés (même scope, mêmes imports).
- Vérifier qu'il n'y a pas de conflits de variables (ex: `const` dupliqué dans le même scope).
- Se demander : "Est-ce qu'un dev senior approuverait ce changement ?"
- Run tests, check logs, démontrer que ça marche.

### 4. Documentation systématique
- Après TOUTE tâche complétée, mettre à jour la documentation associée :
  - Roadmap / changelog
  - Architecture docs
  - CLAUDE.md si le contexte projet a changé
- Ne jamais déployer sans avoir mis à jour la doc.
- La documentation fait partie du livrable, pas un bonus.

---

## Debugging

- Quand on te donne un bug : le fixer de manière autonome. Pas de hand-holding.
- Pointer les logs, erreurs, tests qui échouent — puis résoudre.
- **Tracer le chemin d'exécution complet** avant de toucher au code.
- Ne pas assumer la cause racine — la prouver.
- Pour les environnements complexes (WordPress, CRM multi-fichiers), vérifier :
  - Comment le fichier est chargé (enqueue, import, include)
  - Quel est le template/layout parent
  - Comment les IDs/références sont traduits entre les systèmes

---

## Déploiement

1. Vérifier que tous les tests passent
2. Commit avec message descriptif
3. Push vers le remote
4. Déployer en production (selon la méthode du projet)
5. Vérifier que le déploiement fonctionne sur l'environnement live
6. Mettre à jour la documentation

---

## Task Management

1. **Plan d'abord** : Écrire le plan dans `tasks/todo.md` avec items cochables
2. **Valider le plan** : Check-in avant de commencer l'implémentation
3. **Tracker le progrès** : Cocher les items au fur et à mesure
4. **Expliquer les changements** : Résumé haut niveau à chaque étape
5. **Documenter les résultats** : Ajouter une section review dans `tasks/todo.md`
6. **Capturer les leçons** : Mettre à jour `tasks/lessons.md` après toute correction

---

## Subagents

- Utiliser les subagents pour garder la fenêtre de contexte principale propre.
- Déléguer la recherche, l'exploration et l'analyse parallèle aux subagents.
- Pour les problèmes complexes, utiliser plus de compute via subagents.
- Une tâche par subagent pour une exécution focalisée.

---

## Principes

- **Simplicité d'abord** : Chaque changement doit être aussi simple que possible. Impact minimal sur le code.
- **Pas de paresse** : Trouver les causes racines. Pas de fixes temporaires. Standards de développeur senior.
- **Élégance (équilibrée)** : Pour les changements non triviaux, se demander "y a-t-il une manière plus élégante ?". Ne pas sur-ingénierer les fixes simples et évidents.

---

## Self-Improvement Loop

- Après TOUTE correction de l'utilisateur : mettre à jour `tasks/lessons.md` avec le pattern.
- Écrire des règles pour soi-même qui empêchent la même erreur.
- Itérer sans pitié sur ces leçons jusqu'à ce que le taux d'erreur baisse.
- Relire les leçons au début de chaque session pour le projet concerné.
