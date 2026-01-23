# User Service - EcoTrack

User Management Microservice for EcoTrack. Handles all user CRUD operations, user profiles, and user hierarchy (Agent, Citoyen, Admin).

## 📋 Overview

This service manages:
- User registration for all roles (Agent, Citoyen, Admin)
- User profile management
- User authentication (JWT validation via auth-service)
- Admin operations (list all users, update/deactivate users)
- Table Per Type (TPT) inheritance pattern for user roles

## 🏗️ Architecture

**Database:** PostgreSQL (ecotrack_user)

**Models (Table Per Type):**
- `Utilisateur` (Parent): id, email, nom, prenom, date_naissance, role, is_active, last_login
- `Agent` (Child): numero_badge, id_zone, date_assignment_zone
- `Citoyen` (Child): email_verified, nombre_signalements, score_reputation, telephone
- `Admin` (Child): niveau_acces, permissions

**Key Components:**
- Controllers: HTTP request handlers
- Services: Business logic
- Routes: API endpoints
- Middleware: JWT verification, admin authorization
- Config: Database connection

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 16 (or Docker)
- Auth Service running (for JWT verification)

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start service
npm start

# Development mode (with nodemon)
npm run dev
```

### Docker Setup

```bash
# Build image
docker build -t user-service .

# Run with docker-compose (from backend folder)
docker-compose up -d user-service
```

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

**Register User**
```
POST /api/users/users/:role
Content-Type: application/json

{
  "email": "user@example.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "date_naissance": "1990-01-15"
}
```
Roles: `agent`, `citoyen`, `admin`

### Authenticated Endpoints

**Get My Profile**
```
GET /api/users/users/me
Authorization: Bearer <JWT_TOKEN>
```

**Update My Profile**
```
PUT /api/users/users/me
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "nom": "NewLastName",
  "prenom": "NewFirstName"
}
```

**Deactivate My Account**
```
DELETE /api/users/users/me
Authorization: Bearer <JWT_TOKEN>
```

### Admin Endpoints (Admin Role Required)

**List All Users**
```
GET /api/users/users/admin/users
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Get User Details**
```
GET /api/users/users/admin/users/:userId
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Update User**
```
PUT /api/users/users/admin/users/:userId
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json

{
  "nom": "UpdatedName",
  "is_active": true
}
```

**Deactivate User**
```
DELETE /api/users/users/admin/users/:userId
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

## 🔐 Authentication

All endpoints (except registration) require JWT token passed in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT is verified by calling Auth Service `/api/auth/verify` endpoint.

## 📝 Environment Variables

```
NODE_ENV=development              # Environment
SERVER_PORT=3005                  # Service port
DB_HOST=user-db                   # Database host
DB_PORT=5432                      # Database port
DB_USER=postgres                  # Database user
DB_PASSWORD=postgres              # Database password
DB_NAME=ecotrack_user             # Database name
AUTH_SERVICE_URL=http://auth-service:3001  # Auth service URL
```

## 🧪 Testing

```bash
# Test registration
curl -X POST http://localhost:3005/api/users/users/citoyen \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","nom":"Test","prenom":"User","date_naissance":"1990-01-01"}'

# Test health check
curl http://localhost:3005/health
```

## 📂 Project Structure

```
src/
├── app.js                 # Express app setup
├── config/
│   └── database.js        # Sequelize config
├── models/
│   ├── Utilisateur.js     # Parent user model
│   ├── Agent.js           # Agent role model
│   ├── Citoyen.js         # Citizen role model
│   ├── Admin.js           # Admin role model
│   └── index.js           # Model exports
├── controllers/
│   ├── user.controller.js # HTTP handlers
│   └── index.js           # Controller exports
├── services/
│   ├── UserService.js     # Business logic
│   └── index.js           # Service exports
├── routes/
│   ├── user.routes.js     # API routes
│   └── index.js           # Route exports
└── middlewares/
    ├── auth.middleware.js # JWT verification
    ├── common.middleware.js # Error handling
    └── index.js           # Middleware exports
```

## 🔄 Inter-Service Communication

**User-Service → Auth-Service:**
- Calls `/api/auth/verify` to validate JWT tokens
- Ensures consistent JWT validation across services

**User-Service ← Other Services:**
- Other services can call user-service endpoints to fetch user data
- Requires proper JWT tokens for authenticated endpoints

## 🛠️ Troubleshooting

**Database connection failed:**
- Ensure PostgreSQL (user-db) is running
- Verify DB credentials in .env

**Port already in use:**
- Change SERVER_PORT in .env
- Or kill process using port 3005

**JWT verification failed:**
- Ensure Auth-Service is running
- Verify AUTH_SERVICE_URL in .env
- Check JWT token validity

**Tables not created:**
- Check database logs
- Verify Sequelize sync runs on startup
- Check models for validation errors

## 📚 Related Services

- **Auth Service:** Handles JWT issuance and verification
- **Container Service:** Manages waste containers
- **Tour Service:** Manages collection tours
- **Signal Service:** Manages signal reporting
- **API Gateway:** Routes external requests

## 📄 License

MIT

## 👥 Author

DevBeasts

---

**Last Updated:** 2024
