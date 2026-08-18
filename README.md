# Weeb — blog sur le web

Site vitrine + blog + espace d'authentification.
Frontend **React (Vite)** à la racine, API **Django REST** dans [backend/](backend/).

## Démarrage

Deux serveurs en parallèle.

```bash
# Backend — port 8000
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

```bash
# Frontend — port 5173
npm install
npm run dev
```

Site : http://localhost:5173 · API : http://127.0.0.1:8000/api · Admin : http://127.0.0.1:8000/admin

## Architecture

```
src/
├── components/   Composants partagés (Navbar, Footer, ProtectedRoute)
├── context/      État d'authentification
├── hooks/        Hooks personnalisés
├── pages/        Un dossier par page
├── services/     Appels à l'API
└── styles/       Une feuille CSS par zone
backend/          API Django (voir backend/README.md)
```

Trois choix structurants :

- **Découpage par page, pas par type de fichier.** Tout ce qui concerne l'accueil
  vit dans `pages/Home/`, plutôt que dispersé entre `components/`, `styles/` et
  `utils/`.
- **Aucun composant n'appelle `fetch` directement.** Tout passe par
  [services/api.js](src/services/api.js) : l'URL de l'API, le token et le
  traitement des erreurs sont définis à un seul endroit.
- **CSS écrit à la main**, sans Bootstrap ni Tailwind : la maquette impose une
  identité visuelle précise, autant ne pas lutter contre des styles par défaut.

## Bibliothèques

| Bibliothèque | Rôle |
|---|---|
| `react` | Imposée par le cahier des charges |
| `react-router-dom` | Navigation sans rechargement, paramètres d'URL (`/blog/:slug`), routes protégées |
| `vite` | Serveur de dev et build |
| `eslint` | Détecte les erreurs de hooks avant l'exécution |

Backend détaillé dans [backend/README.md](backend/README.md).

## Fonctionnement

```
React (5173) ──HTTP/JSON──> Django REST (8000) ──> SQLite
      │                            │
 tokens JWT en              admin Django
 localStorage         (validation des comptes)
```

Aucune donnée en dur côté front : articles et comptes viennent tous de l'API.

### Routes

| Route | Accès | Appel API |
|---|---|---|
| `/` | public | — |
| `/blog` | public | `GET /articles/` |
| `/blog/:slug` | public | `GET /articles/<slug>/` |
| `/blog/nouveau` | authentifié | `POST /articles/` |
| `/blog/:slug/modifier` | auteur | `PATCH /articles/<slug>/` |
| `/contact` | public | `POST /contact/` |
| `/login` · `/signup` | public | `POST /auth/login/` · `/auth/signup/` |
| `/mot-de-passe-oublie` · `/reset-password` | public | `POST /auth/password-reset/` |

### Authentification

La connexion retourne un token d'accès (30 min) et un token de rafraîchissement
(7 jours), stockés dans le `localStorage`. Sur une réponse `401`,
[api.js](src/services/api.js) renouvelle le token puis rejoue la requête une fois.
Au rechargement de la page, `AuthProvider` appelle `/auth/me/` pour restaurer la
session.

`ProtectedRoute` n'est **pas** une sécurité : elle évite d'afficher un écran
inutilisable. C'est le backend qui refuse réellement les requêtes.

### Rôles

| Profil | Lecture du blog | Écrire | Admin |
|---|:---:|:---:|:---:|
| Visiteur | oui | non | non |
| Inscrit non validé | oui | non (connexion refusée) | non |
| Utilisateur validé | oui | ses articles | non |
| Administrateur | oui | tous | oui |

Un compte créé via l'inscription a `is_active=False`. L'administrateur le valide
depuis l'admin Django ; jusque-là la connexion renvoie `401`.

## Prise en main

À lire dans cet ordre : [App.jsx](src/App.jsx) (les routes) →
[services/api.js](src/services/api.js) (le lien avec le back) →
[context/AuthContext.jsx](src/context/AuthContext.jsx) (l'état de connexion) →
[pages/Blog/Blog.jsx](src/pages/Blog/Blog.jsx) (le schéma type d'une page qui
charge des données).

Toutes les pages qui chargent des données suivent le même schéma :

```jsx
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  let isStale = false;              // ignore la réponse si on a quitté la page

  async function load() {
    try {
      const result = await articlesApi.list();
      if (!isStale) setData(result);
    } catch (apiError) {
      if (!isStale) setError(apiError.message);
    } finally {
      if (!isStale) setIsLoading(false);
    }
  }

  load();
  return () => { isStale = true; };
}, []);
```

`isStale` évite une erreur classique : l'utilisateur change de page pendant le
chargement, la réponse arrive après, React tente de mettre à jour un composant
démonté.

Les formulaires sont contrôlés. Les erreurs Django (`{"email": ["..."]}`) sont
converties en `fieldErrors` par `api.js`, ce qui permet d'afficher le message
sous le champ concerné plutôt qu'en haut de page.

### Conventions

| Élément | Convention |
|---|---|
| Composant | PascalCase, un fichier chacun |
| Hook | `use` + camelCase |
| Fonction, variable | camelCase |
| Classe CSS | kebab-case préfixée par le bloc (`.article-card-meta`) |
| Champ d'API | snake_case (imposé par Django) |
| Commentaire | français, explique le *pourquoi* |

## Responsive et interactions

Points de rupture : 1150 px (hero), 992 px (grille 2 colonnes), 768 px (menu
burger), 640 px (grille 1 colonne), 600 px (formulaires empilés).

- **Survol** : navigation, boutons, cartes d'articles (translation + zoom couverture)
- **Focus** : bordure violette et label flottant animé sur les champs
- **Transitions** : 0,3 s sur couleurs, bordures et transformations
- **Apparition au défilement** : sections Features et CTA, via `IntersectionObserver`
  encapsulé dans [useScrollReveal](src/hooks/useScrollReveal.js)
- **Chargement** : les boutons d'envoi se désactivent pendant la requête

Ajouts hors maquette : menu burger animé, page d'inscription, réinitialisation de
mot de passe, pagination du blog, page 404, newsletter, navbar reflétant l'état
de connexion.

## Tests

```bash
cd backend && python manage.py test apps   # 24 tests
npm run lint && npm run build
```

Les endpoints se testent aussi avec Postman, vers `http://127.0.0.1:8000/api`.

## Git

`main` (stable) ← `develop` (intégration) ← `feat/*` et `fix/*`.

Cycle : issue → branche → commits → Pull Request → validation → suppression.

Commits en *Conventional Commits* : `feat`, `fix`, `refactor`, `style`, `docs`,
`test`, `chore`.

```
feat: add article creation form
fix: use imported asset for hero image
```

## Configuration

Aucune configuration à faire : les réglages de développement (URL de l'API, clé
Django, CORS) sont définis directement dans le code. Il suffit de cloner,
installer les dépendances et lancer les deux serveurs.
