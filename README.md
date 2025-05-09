# devtav

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### Arborescence du projet (Architecture MVC )

- client
  - public
  - src
    - assets/ # Contient les fichiers statique(ex: images, icônes)
      - logo.png
    - components/ # Composants Vue.js réutilisables
      - ConsulterProfil.vue
      - CreatePass.vue
      - ForgotPassword.vue
    - router/ # Configuration des routes
      - routes.js
    - store/ # Gestion de l'état global (Vuex ou Pinia)
    - views/ # Pages principales de l'application
      - App.vue
    - main.js # Fichier principal Vue.js
- dist # Version compilée du projet (production)
- node_modules # Dépendances Node.js (installées avec npm/yarn)

- server
  - config/ # Configuration du serveur
  - controllers/ # Gestion des requêtes et réponses
  - models/ # Définition des modèles de données
  - routes/ # Définition des routes de l'API
  - services/ # Logique métier et services externes
  - uploads/ # Stockage des fichiers téléchargés

Files:

- .env # Variables d'environnement
- app.js # Point d'entrée du serveur Node.js
- .gitignore # Fichiers ignorés par Git
- babel.config.js # Configuration de Babel
- jsconfig.json # Configuration JavaScript
- package-lock.json # Gestion des dépendances
- package.json # Fichier de configuration du projet
- README.md # Documentation du projet
- vue.config.js # Configuration spécifique à Vue.js
