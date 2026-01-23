# Auth Service - Documentation

Service d'authentification pour le projet EcoTrack utilisant Express.js, Sequelize et PostgreSQL.

## Architecture

Ce service utilise la stratégie **Table Per Type (TPT)** pour gérer une vraie hiérarchie d'utilisateurs:

```
UTILISATEUR (Parent)
  ├─ AGENT (Zone assignée, Badge)
  ├─ CITOYEN (Score réputation, Signalements)
  └─ ADMIN (Niveaux d'accès, Permissions)
```

Chaque utilisateur a:
- Un profil commun dans `UTILISATEUR`
- Un profil spécifique dans sa table d'enfant (AGENT, CITOYEN, ADMIN)
- Un `role` qui détermine son type

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer la base de données

#### Créer la base de données PostgreSQL

```sql
CREATE DATABASE ecotrack_auth;
```

#### Mettre à jour le fichier `.env`

Copiez `.env.example` vers `.env` et mettez à jour vos paramètres:

```bash
cp .env.example .env
```

Paramètres importants:
- `DB_HOST`: Hôte PostgreSQL (par défaut: localhost)
- `DB_USER`: Utilisateur PostgreSQL (par défaut: postgres)
- `DB_PASSWORD`: Mot de passe PostgreSQL
- `DB_NAME`: Nom de la base (par défaut: ecotrack_auth)
- `JWT_SECRET`: Clé secrète pour les tokens JWT (CHANGEZ EN PRODUCTION!)
- `REFRESH_TOKEN_SECRET`: Clé secrète pour les refresh tokens (CHANGEZ EN PRODUCTION!)

### 3. Exécuter les migrations

```bash
npm run migrate
```

## Structure des répertoires

```
src/
├── config/              # Configuration (DB, Sequelize)
├── models/              # Modèles Sequelize (Agent, Citoyen, Admin)
├── controllers/         # Contrôleurs pour les routes
├── services/            # Logique métier (Auth, User, JWT, Hash)
├── routes/              # Définition des routes
├── middlewares/         # Middlewares (Auth, Erreurs, Sécurité)
├── migrations/          # Migrations Sequelize
├── seeders/             # Seeders pour les données de test
└── app.js               # Application principale
```

## Endpoints API

### Authentification

#### Enregistrement Agent
```http
POST /api/auth/agent/register
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "SecurePass123!",
  "nom": "Dupont",
  "prenom": "Jean",
  "date_naissance": "1990-01-15"
}
```

**Réponse (201)**:
```json
{
  "message": "Agent enregistré avec succès",
  "user": {
    "id": "uuid",
    "email": "agent@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "agent",
    "is_active": true
  }
}
```

#### Connexion Agent
```http
POST /api/auth/agent/login
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "SecurePass123!"
}
```

**Réponse (200)**:
```json
{
  "message": "Connexion réussie",
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Le refresh token est stocké en cookie HTTP-only.

#### Enregistrement Citoyen
```http
POST /api/auth/citoyen/register
```

#### Connexion Citoyen
```http
POST /api/auth/citoyen/login
```

#### Enregistrement Admin
```http
POST /api/auth/admin/register
```

#### Connexion Admin
```http
POST /api/auth/admin/login
```

#### Rafraîchir le token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Ou avec le cookie:**
```http
POST /api/auth/refresh
```

#### Déconnexion
```http
POST /api/auth/logout
```

### Utilisateur (requiert authentification)

Tous les endpoints utilisateur nécessitent un header `Authorization`:
```http
Authorization: Bearer {accessToken}
```

#### Récupérer le profil
```http
GET /api/users/profile
Authorization: Bearer {accessToken}
```

**Réponse (200)**:
```json
{
  "message": "Profil récupéré",
  "user": { ... }
}
```

#### Mettre à jour le profil
```http
PUT /api/users/profile
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prenom",
  "date_naissance": "1990-01-15"
}
```

#### Désactiver le compte
```http
DELETE /api/users/profile
Authorization: Bearer {accessToken}
```

## Exigences du mot de passe

- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial (!@#$%^&*)

Exemple: `SecurePass123!`

## Sécurité

- ✓ Mots de passe hachés avec bcryptjs
- ✓ JWT pour l'authentification stateless
- ✓ Refresh tokens stockés en cookies HTTP-only
- ✓ CORS configuré
- ✓ Helmet pour les headers de sécurité
- ✓ Validation des données avec express-validator

## Lancer le serveur

### Développement
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Production
```bash
npm start
```

## Commandes utiles

```bash
# Lancer les migrations
npm run migrate

# Annuler la dernière migration
npm run migrate:undo

# Voir l'état de la base de données
npm run migrate:status

# Démarrer en mode développement
npm run dev
```

## Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|------------------|-------------|
| `NODE_ENV` | `development` | Environnement (development, production, test) |
| `PORT` | `3001` | Port du serveur |
| `DB_HOST` | `localhost` | Hôte PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USER` | `postgres` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | - | Mot de passe PostgreSQL |
| `DB_NAME` | `ecotrack_auth` | Nom de la base de données |
| `JWT_SECRET` | `your-secret-key` | Clé secrète JWT (CHANGEZ EN PROD!) |
| `JWT_EXPIRY` | `15m` | Expiration du token d'accès |
| `REFRESH_TOKEN_SECRET` | `your-refresh-secret` | Clé secrète refresh token (CHANGEZ EN PROD!) |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Expiration du refresh token |
| `ALLOWED_ORIGINS` | `*` | CORS origins autorisés |

## Déploiement

### Production Checklist

1. ✓ Mettre à jour `JWT_SECRET` et `REFRESH_TOKEN_SECRET` avec des valeurs fortes
2. ✓ Mettre `NODE_ENV=production`
3. ✓ Configurer les variables d'environnement sur votre serveur
4. ✓ Mettre en place HTTPS
5. ✓ Configurer les CORS origins appropriés
6. ✓ Configurer les backups de base de données

## Troubleshooting

### Erreur de connexion à PostgreSQL
Vérifiez que:
- PostgreSQL est en cours d'exécution
- Les paramètres de connexion dans `.env` sont corrects
- La base de données existe

### Erreur lors des migrations
```bash
# Annuler la migration
npm run migrate:undo

# Recommencer
npm run migrate
```

## Prochaines étapes

Pour intégrer ce service avec les autres microservices:
1. Exporter les tokens JWT entre les services
2. Configurer la validation des tokens dans les autres services
3. Mettre en place la communication inter-services
4. Ajouter les relations avec les autres entités

---

**Version**: 1.0.0  
**Licence**: ISC
