# 🧑‍💻 EcoTrack AI Coding Agent Instructions

## 🏗️ Big Picture Architecture
- **Microservices**: Each domain (auth, user, container, tour, signal) is a separate Node.js service with its own database and Dockerfile.
- **API Gateway**: [backend/ecotrack-gateway/src/app.js] routes all external requests to the correct service. Gateway is the only public entry point.
- **Service Boundaries**:
  - `auth-service`: Handles authentication (login/logout/JWT), no user CRUD.
  - `user-service`: Handles user CRUD (Agent, Citoyen, Admin), communicates with other services.
  - `container-service`, `tour-service`, `signal-service`: Domain logic for containers, tours, signals.
- **Data Flow**: Gateway → Service (via HTTP). Services communicate via REST, not direct DB access.

## ⚡ Developer Workflows
- **Build/Run**: Use `docker-compose up -d` from [backend/] to start all services and databases. Each service can be run standalone with `npm start`.
- **Database**: Each service uses its own PostgreSQL DB, defined in [backend/docker-compose.yml]. Tables are auto-created by Sequelize migrations on service startup.
- **pgAdmin**: For DB inspection, connect to service name (e.g. `auth-db`) as host in pgAdmin.
- **Health Checks**: All services expose `/health` endpoints for Docker healthcheck and manual status.

## 🧩 Project Conventions & Patterns
- **Table Per Type (TPT)**: User hierarchy in `auth-service` and `user-service` uses TPT (parent table + child tables for Agent/Citoyen/Admin).
- **JWT Auth**: Only `auth-service` issues/verifies JWT. Other services validate JWT via middleware or by calling `auth-service`.
- **No direct DB cross-service access**: All inter-service communication is via HTTP REST, not via shared DB tables.
- **Environment Variables**: Each service uses a `.env` file for DB and secret config. See `.env.example` in each service.
- **Docker Volumes**: Data is persisted in Docker volumes (see [backend/docker-compose.yml]). pgAdmin config is now persisted in `pgadmin_data` volume.

## 🔗 Integration Points
- **API Gateway**: [backend/ecotrack-gateway/src/app.js] is the main entry, routes to `/auth`, `/users`, `/container`, `/tour`, `/signal`.
- **pgAdmin**: Connect to DB using service name (e.g. `auth-db`, `container-db`) as host, port 5432, user `postgres`, password `postgres`.
- **External Dependencies**: Each service uses Express, Sequelize, and PostgreSQL. Gateway uses Axios for proxying.

## 📂 Key Files & Directories
- [backend/docker-compose.yml]: Defines all services, DBs, volumes, and pgAdmin.
- [backend/ecotrack-gateway/src/app.js]: Gateway routing logic.
- [backend/services/auth/src/app.js]: Auth service entrypoint.
- [backend/services/user-service/src/app.js]: User service entrypoint.
- [backend/services/*/src/models/]: Sequelize models for each domain.
- [backend/services/*/src/routes/]: REST API routes for each service.

## 🛠️ Example Patterns
- **User login**: POST `/api/auth/login` → JWT issued by auth-service.
- **User CRUD**: All user creation/updates via user-service, not auth-service.
- **JWT validation**: Middleware in user-service calls auth-service `/api/auth/verify` or validates JWT locally.
- **Health check**: GET `/health` on any service returns `{ status: 'OK', service: '...' }`.

## 🚦 Special Notes
- Do NOT mix user CRUD and authentication logic: keep them in their respective services.
- Always use service names (not container names) for DB host in pgAdmin and inter-service calls.
- All migrations are auto-run on service startup (no manual DB creation needed).
- If updating this file, preserve architecture and workflow details, update only conventions/patterns as needed.

---

*For questions or missing patterns, ask the user for clarification and update this file accordingly.*
