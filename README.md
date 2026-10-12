# Weeb — blog sur le web

Site vitrine + blog + espace d'authentification.
Frontend **React (Vite)** dans [frontend/](frontend/), API **Django REST** dans [backend/](backend/).

| | URL |
|---|---|
| Site | https://weeb-logan-donday.vercel.app |
| API | https://weeb-api-tjw9.onrender.com/api/ |
| État de l'API | https://weeb-api-tjw9.onrender.com/api/health/ |
| Admin Django | https://weeb-api-tjw9.onrender.com/admin/ |

> L'API est hébergée sur l'offre gratuite de Render : après 15 min sans trafic
> elle se met en veille, la première requête peut prendre ~1 min.

Le dossier de retour d'expérience DevOps (semaine 3) est dans [docs/REX.md](docs/REX.md).

## Démarrage en local

Deux serveurs en parallèle.

```bash
# Backend — port 8000
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # active le mode développement
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

```bash
# Frontend — port 5173
cd frontend
npm install
npm run dev
```

Site : http://localhost:5173 · API : http://127.0.0.1:8000/api · Admin : http://127.0.0.1:8000/admin

Variante avec Docker (API + PostgreSQL, comme en production) :

```bash
docker compose up --build    # API sur http://localhost:8000
```

### Configuration

Le backend est **sécurisé par défaut** : sans configuration, il démarre en mode
production et exige une vraie `SECRET_KEY`. En local, on copie
[backend/.env.example](backend/.env.example) en `backend/.env`, qui active le mode
développement (`DEBUG=True`, SQLite, CORS ouvert sur `localhost:5173`). Le
fichier `.env` n'est jamais versionné.

| Variable | Où | Rôle |
|---|---|---|
| `DEBUG` | back | `True` en local uniquement, `False` par défaut |
| `SECRET_KEY` | back | Obligatoire si `DEBUG=False`, générée par Render en prod |
| `ALLOWED_HOSTS` | back | Domaines acceptés par Django |
| `DATABASE_URL` | back | PostgreSQL (Neon) en prod, vide = SQLite |
| `CORS_ALLOWED_ORIGINS` | back | URL du front autorisée à appeler l'API |
| `FRONTEND_URL` | back | Sert à construire le lien de réinitialisation du mot de passe |
| `SENTRY_DSN` | back | Monitoring des erreurs, vide = désactivé |
| `BREVO_API_KEY` | back | Envoi réel des emails via Brevo, vide = emails affichés dans la console |
| `DEFAULT_FROM_EMAIL` | back | Expéditeur des emails, doit être vérifié dans Brevo |
| `VITE_API_URL` | front | URL de l'API, défaut `http://127.0.0.1:8000/api` |
| `VITE_SENTRY_DSN` | front | Monitoring des erreurs côté navigateur |

---

## Architecture du dépôt

```
weeb_Logan_donday/
├── frontend/              Application React (Vite)
│   ├── src/
│   │   ├── components/    Composants partagés (Navbar, Footer, ProtectedRoute)
│   │   ├── context/       État d'authentification (AuthProvider)
│   │   ├── hooks/         Hooks personnalisés (useAuth, useScrollReveal)
│   │   ├── pages/         Un dossier par page
│   │   ├── services/      Appels à l'API (api.js)
│   │   ├── styles/        Une feuille CSS par zone
│   │   └── monitoring.js  Initialisation de Sentry
│   └── vercel.json        Configuration du déploiement Vercel
├── backend/               API Django REST
│   ├── weeb_api/          Projet Django (settings, urls racine, health)
│   ├── apps/              Applications métier
│   │   ├── accounts/      Utilisateurs, inscription, connexion, mot de passe
│   │   ├── articles/      Articles du blog
│   │   └── contact/       Messages du formulaire de contact
│   └── Dockerfile         Image de production de l'API
├── docs/REX.md            Dossier de retour d'expérience (DevOps)
├── .github/workflows/     Pipeline CI/CD
├── docker-compose.yml     Environnement local API + PostgreSQL
└── render.yaml            Infrastructure du backend décrite en code
```

Front et back sont séparés dans deux dossiers parce qu'ils sont déployés sur deux
plateformes différentes (Vercel et Render) et n'ont pas les mêmes outils.

## Frontend

### Choix structurants

- **Découpage par page, pas par type de fichier.** Tout ce qui concerne l'accueil
  vit dans `pages/Home/`, plutôt que dispersé entre `components/`, `styles/` et
  `utils/`.
- **Aucun composant n'appelle `fetch` directement.** Tout passe par
  [services/api.js](frontend/src/services/api.js) : l'URL de l'API, le token et le
  traitement des erreurs sont définis à un seul endroit.
- **CSS écrit à la main**, sans Bootstrap ni Tailwind : la maquette impose une
  identité visuelle précise, autant ne pas lutter contre des styles par défaut.

### Bibliothèques

| Bibliothèque | Rôle |
|---|---|
| `react` | Imposée par le cahier des charges |
| `react-router-dom` | Navigation sans rechargement, paramètres d'URL (`/blog/:slug`), routes protégées |
| `@sentry/react` | Remonte les erreurs JavaScript des visiteurs |
| `vite` | Serveur de dev et build |
| `eslint` | Détecte les erreurs de hooks avant l'exécution |
| `vitest` + `@testing-library/react` + `jsdom` | Tests unitaires et de composants |

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
| `/mot-de-passe-oublie` · `/reset-password` | public | `POST /auth/password-reset/` · `/confirm/` |

### Responsive et interactions

Points de rupture : 1150 px (hero), 1024 px (formulaires en tablette), 992 px
(grille 2 colonnes), 768 px (menu burger), 640 px (grille 1 colonne), 600 px
(formulaires empilés).

- **Survol** : navigation, boutons, cartes d'articles (translation + zoom couverture)
- **Focus** : bordure violette, halo et label flottant animé sur les champs ;
  contour violet `:focus-visible` sur les liens et boutons pour la navigation
  au clavier
- **Page active** : le lien de la page en cours est souligné dans la navbar
- **Transitions** : 0,3 s sur couleurs, bordures et transformations
- **Apparition au défilement** : sections Features et CTA, via `IntersectionObserver`
  encapsulé dans [useScrollReveal](frontend/src/hooks/useScrollReveal.js)
- **Chargement** : les boutons d'envoi se désactivent pendant la requête

Ajouts hors maquette : **bande défilante des partenaires** (en pause au survol,
fixe si l'utilisateur a demandé moins d'animations), menu burger animé, page
d'inscription, réinitialisation de mot de passe, pagination du blog, badge
brouillon, page 404, navbar reflétant l'état de connexion, confirmation de
l'inscription à la newsletter.

## Backend

### Structure du projet Django

Le projet `weeb_api/` ne contient que la configuration transverse :
[settings.py](backend/weeb_api/settings.py) (tout ce qui change entre dev et prod
est lu dans les variables d'environnement), [urls.py](backend/weeb_api/urls.py)
(routage racine) et [views.py](backend/weeb_api/views.py) (route de santé).

Le métier est découpé en trois applications dans `apps/`, une par domaine.
Chacune suit le même schéma :

| Fichier | Rôle |
|---|---|
| `models.py` | Tables de la base |
| `serializers.py` | Validation des entrées et format JSON des sorties |
| `views.py` | Endpoints de l'API |
| `urls.py` | Routes de l'application |
| `admin.py` | Écrans de l'admin Django |
| `permissions.py` | Règles d'accès spécifiques (articles) |
| `tests/` | Tests de l'application (package, un fichier `test_*.py` par thème) |

| Application | Contenu |
|---|---|
| `accounts` | Modèle `User` personnalisé (connexion par email), inscription, connexion JWT, profil, mot de passe oublié |
| `articles` | Modèle `Article` (titre, slug unique, résumé, contenu, image de couverture, statut publié), CRUD, permission « auteur seulement » |
| `contact` | Modèle `ContactMessage`, enregistrement des messages, suivi « traité » dans l'admin |

### Endpoints

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/api/auth/signup/` | public | Inscription (prénom, nom, email, mot de passe) |
| POST | `/api/auth/login/` | public | Connexion, renvoie les tokens JWT + profil |
| POST | `/api/auth/refresh/` · `/verify/` | public | Renouvellement / vérification du token |
| GET | `/api/auth/me/` | connecté | Profil de l'utilisateur courant |
| POST | `/api/auth/password-reset/` | public | Envoie le lien de réinitialisation |
| POST | `/api/auth/password-reset/confirm/` | public | Enregistre le nouveau mot de passe |
| GET | `/api/articles/` · `/<slug>/` | public | Liste paginée / détail |
| POST | `/api/articles/` | connecté | Création (l'auteur est fixé par le serveur) |
| PATCH · DELETE | `/api/articles/<slug>/` | auteur | Modification / suppression |
| POST | `/api/contact/` | public | Enregistre un message de contact |
| GET | `/api/health/` | public | État de l'API et de la base (monitoring) |

### Dépendances

| Bibliothèque | Pourquoi |
|---|---|
| `Django` | Imposé, fournit l'ORM, l'admin et la gestion des mots de passe |
| `djangorestframework` | Transforme les modèles en API REST (serializers, permissions, pagination) |
| `djangorestframework-simplejwt` | Authentification par token : le front et l'API sont sur deux domaines, les cookies de session seraient plus compliqués |
| `django-cors-headers` | Autorise uniquement le front à appeler l'API depuis le navigateur |
| `python-dotenv` | Lit `backend/.env` en local |
| `dj-database-url` | Une seule variable `DATABASE_URL` pour passer de SQLite à PostgreSQL |
| `psycopg` | Pilote PostgreSQL |
| `whitenoise` | Sert les fichiers statiques de l'admin sans serveur web supplémentaire |
| `gunicorn` | Serveur de production (le `runserver` de Django n'est pas fait pour ça) |
| `sentry-sdk` | Monitoring des erreurs en production |
| `django-anymail` | Envoi des emails par l'API HTTP de Brevo (Render gratuit bloque le SMTP) |

## Authentification et sécurité

### Procédure

1. **Inscription** : le compte est créé avec `is_active=False`. Le mot de passe
   passe les 4 validateurs Django (longueur, mot de passe courant, numérique,
   ressemblance avec l'email) et n'est stocké que haché.
2. **Validation** : un administrateur active le compte depuis l'admin Django
   (action « Valider les comptes sélectionnés »). Tant que ce n'est pas fait, la connexion
   renvoie `401`.
3. **Connexion** : l'API renvoie un token d'accès (30 min) et un token de
   rafraîchissement (7 jours, renouvelé à chaque usage), stockés dans le
   `localStorage`. Sur une réponse `401`, [api.js](frontend/src/services/api.js)
   renouvelle le token puis rejoue la requête une fois. Au rechargement de la
   page, `AuthProvider` appelle `/auth/me/` pour restaurer la session.
4. **Mot de passe oublié** : l'API génère un lien signé (identifiant + token
   Django à usage unique) vers `/reset-password`. Elle répond la même chose que
   l'email existe ou non, pour ne pas révéler quels comptes existent.

### Rôles

| Profil | Lecture du blog | Écrire | Admin |
|---|:---:|:---:|:---:|
| Visiteur | oui | non | non |
| Inscrit non validé | oui | non (connexion refusée) | non |
| Utilisateur validé | oui | ses articles | non |
| Administrateur | oui | tous | oui |

### Sécurité des routes

- **Fermé par défaut** : la permission par défaut de l'API est `IsAuthenticated`.
  Chaque route publique est ouverte explicitement (`AllowAny` ou lecture seule).
- **Articles** : `IsAuthorOrReadOnly` vérifie à chaque modification que
  l'utilisateur est l'auteur (ou un administrateur). L'auteur est fixé par le
  serveur, le client ne peut pas l'envoyer. Les brouillons ne sont visibles que
  par leur auteur.
- **Front** : `ProtectedRoute` n'est **pas** une sécurité, elle évite d'afficher
  un écran inutilisable. C'est le backend qui refuse réellement les requêtes.
- **Limitation du nombre de requêtes** : au-delà de 5 connexions par minute,
  10 inscriptions, 5 demandes de réinitialisation ou 10 messages de contact par
  heure et par IP, l'API répond `429`. Cela freine la force brute et le spam.
- **Production** : `DEBUG=False` par défaut (une variable oubliée ne peut pas
  ouvrir le mode debug), clé secrète générée par Render, redirection HTTP vers
  HTTPS, HSTS d'un an, cookies sécurisés, CORS limité au domaine Vercel, aucun
  secret dans Git. La CI vérifie cette configuration avec `check --deploy`.

### RGPD

- Seules les données nécessaires sont demandées (prénom, nom, email).
- Mots de passe hachés, jamais lisibles, même par l'administrateur.
- Base de données et API hébergées dans l'Union européenne (Francfort).
- Sentry configuré sans données personnelles (`send_default_pii=False`, pas d'IP).
- La réinitialisation de mot de passe ne révèle pas si un email est inscrit.

## Prise en main du code

**Front**, à lire dans cet ordre : [App.jsx](frontend/src/App.jsx) (les routes) →
[services/api.js](frontend/src/services/api.js) (le lien avec le back) →
[context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) (l'état de
connexion) → [pages/Blog/Blog.jsx](frontend/src/pages/Blog/Blog.jsx) (le schéma
type d'une page qui charge des données).

**Back** : [weeb_api/urls.py](backend/weeb_api/urls.py) (toutes les routes) →
[apps/articles/views.py](backend/apps/articles/views.py) puis
[permissions.py](backend/apps/articles/permissions.py) (le CRUD et ses droits) →
[apps/accounts/serializers.py](backend/apps/accounts/serializers.py)
(inscription, connexion, reset).

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
| Composant React | PascalCase, un fichier chacun |
| Hook | `use` + camelCase |
| Fonction, variable JS | camelCase |
| Classe, fonction Python | PascalCase, snake_case |
| Classe CSS | kebab-case préfixée par le bloc (`.article-card-meta`) |
| Champ d'API | snake_case (imposé par Django) |
| Commentaire, docstring | français, explique le *pourquoi* |

## Tests

```bash
cd backend && python manage.py test        # 33 tests
cd frontend && npm run lint && npm test    # 14 tests
```

Les endpoints se testent aussi avec Postman, vers `http://127.0.0.1:8000/api`.

## DevOps

Détails et justifications dans [docs/REX.md](docs/REX.md).

```
push ──> GitHub Actions ──┬─ backend : check, migrations, tests (PostgreSQL)
                          ├─ frontend : lint, tests, build
                          └─ docker : build de l'image + /api/health/
                                   │ tout vert + branche main
                                   ▼
                     déploiement Render (API) + Vercel (front)
                                   ▼
                    smoke test : l'API répond avec le bon commit
```

| Brique | Outil |
|---|---|
| CI/CD | GitHub Actions ([ci.yml](.github/workflows/ci.yml)) |
| Conteneur | Docker, backend uniquement ([Dockerfile](backend/Dockerfile)) |
| Hébergement API | Render (offre gratuite, conteneur Docker) |
| Base de données | Neon (PostgreSQL managé) |
| Hébergement front | Vercel (fichiers statiques sur CDN) |
| Monitoring | Sentry (erreurs back + front), route `/api/health/` |

Le déploiement automatique de Render et de Vercel est désactivé : seul le
pipeline déploie, et seulement si tous les tests passent.

## Git

`main` (production) ← `develop` (intégration) ← `feat/*`, `fix/*`, `docs/*`.

Cycle : issue → branche → commits → Pull Request → CI verte → merge → suppression
de la branche.

Commits en *Conventional Commits* : `feat`, `fix`, `refactor`, `style`, `docs`,
`test`, `ci`, `chore`.

```
feat: monitoring des erreurs avec sentry (back + front)
fix: tunnel sentry contre les bloqueurs + route de test admin
```
