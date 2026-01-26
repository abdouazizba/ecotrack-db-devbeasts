# 🧑‍💻 EcoTrack AI Coding Agent Instructions

## 🏗️ Big Picture Architecture
- **Microservices**: Each domain (auth, user, container, tour, signal) is a separate Node.js service with its own database and Dockerfile.
- **API Gateway**: [backend/ecotrack-gateway/src/app.js] routes all external requests to the correct service. Gateway is the only public entry point.
- **Message Broker**: **RabbitMQ** enables event-driven communication between services (async pub/sub pattern).
- **Service Boundaries**:
  - `auth-service`: Handles authentication (login/logout/JWT), publishes "user.created" events.
  - `user-service`: Handles user CRUD (Agent, Citoyen, Admin), subscribes to "user.created" events, creates user profiles.
  - `container-service`, `tour-service`, `signal-service`: Domain logic for containers, tours, signals.
- **Data Flow**: Gateway → Service (via HTTP). Services communicate via RabbitMQ events (async), not direct DB access.

## ⚡ Developer Workflows
- **Build/Run**: Use `docker-compose up -d` from [backend/] to start all services, databases, and RabbitMQ. Each service can be run standalone with `npm start`.
- **Database**: Each service uses its own PostgreSQL DB, defined in [backend/docker-compose.yml]. Tables are auto-created by Sequelize migrations on service startup.
- **RabbitMQ**: Message broker for event-driven architecture. Access Management UI at http://localhost:15672 (user: ecotrack, pass: ecotrack123).
- **pgAdmin**: For DB inspection, connect to service name (e.g. `auth-db`) as host in pgAdmin.
- **Health Checks**: All services expose `/health` endpoints for Docker healthcheck and manual status.
- **Events**: User creation flow uses Pub/Sub pattern:
  1. auth-service SEED users → publishes "user.created" event
  2. user-service SUBSCRIBE → receives event → creates user profile

## 🧩 Project Conventions & Patterns
- **Table Per Type (TPT)**: User hierarchy in `auth-service` and `user-service` uses TPT (parent table + child tables for Agent/Citoyen/Admin).
- **Event-Driven Communication**: Services use RabbitMQ for async pub/sub (NOT direct DB access). Example: user.created event triggers profile creation.
- **JWT Auth**: Only `auth-service` issues/verifies JWT. Other services validate JWT via middleware or by calling `auth-service`.
- **Environment Variables**: Each service uses a `.env` file for DB and secret config. See `.env.example` in each service.
- **Docker Volumes**: Data is persisted in Docker volumes (see [backend/docker-compose.yml]). pgAdmin config persisted in `pgadmin_data`. RabbitMQ data persisted in `rabbitmq_data`.
- **EventService Utility**: Reusable class for RabbitMQ pub/sub (exists in both auth-service and user-service).

## 🔗 Integration Points
- **API Gateway**: [backend/ecotrack-gateway/src/app.js] is the main entry, routes to `/auth`, `/users`, `/container`, `/tour`, `/signal`.
- **RabbitMQ**: Runs in Docker, accessible at `amqp://ecotrack:ecotrack123@rabbitmq:5672`. Management UI: http://localhost:15672.
- **pgAdmin**: Connect to DB using service name (e.g. `auth-db`, `container-db`) as host, port 5432, user `postgres`, password `postgres`.
- **EventService**: Utility class for publishing/subscribing to events. Located in `src/services/EventService.js` in auth-service and user-service.
- **UserEventListener**: Handles "user.created" events in user-service. Creates Utilisateur + Agent/Citoyen/Admin profiles. Located in [backend/services/user-service/src/services/UserEventListener.js].
- **External Dependencies**: Each service uses Express, Sequelize, PostgreSQL. Gateway uses Axios for proxying. Services use amqplib for RabbitMQ.

## 📂 Key Files & Directories
- [backend/docker-compose.yml]: Defines all services, DBs, volumes, RabbitMQ, and pgAdmin.
- [backend/QUICK_START.md]: Quick start guide for event-driven architecture.
- [backend/ecotrack-gateway/src/app.js]: Gateway routing logic.
- [backend/services/auth/src/app.js]: Auth service entrypoint. Initializes EventService, seeds users, publishes events.
- [backend/services/auth/src/services/EventService.js]: RabbitMQ publisher/subscriber utility.
- [backend/services/auth/src/seeds/seed.js]: Seeds 9 test users, publishes user.created events.
- [backend/services/user-service/src/app.js]: User service entrypoint. Initializes EventService and UserEventListener.
- [backend/services/user-service/src/services/EventService.js]: RabbitMQ subscriber utility (same as auth-service).
- [backend/services/user-service/src/services/UserEventListener.js]: Handles user.created events, creates profiles.
- [backend/services/user-service/src/seeds/seed.js]: Simplified to wait for events (event-driven).
- [backend/services/*/src/models/]: Sequelize models for each domain.
- [backend/services/*/src/routes/]: REST API routes for each service.
- [.github/README.md]: Documentation index and quick navigation.
- [.github/EVENT_DRIVEN_ARCHITECTURE.md]: Complete architecture documentation with diagrams.
- [.github/QUICK_START.md]: Setup and testing guide.

## 🛠️ Example Patterns
- **User creation flow**: 
  1. POST `/api/auth/register` → auth-service creates user + publishes event
  2. RabbitMQ queues "user.created" event
  3. user-service receives event → creates Utilisateur + Agent/Citoyen/Admin
- **User login**: POST `/api/auth/login` → JWT issued by auth-service.
- **User CRUD**: All user creation/updates via user-service, profile updates in user_db.
- **JWT validation**: Middleware in user-service validates JWT or calls auth-service `/api/auth/verify`.
- **Event publishing**: `await EventService.publishEvent('user.created', {id, email, role})`.
- **Event subscribing**: `await EventService.subscribeEvent('user.created', handleUserCreated)`.
- **Health check**: GET `/health` on any service returns `{ status: 'OK', service: '...' }`.

## 🚦 Special Notes
- Do NOT mix user CRUD and authentication logic: keep them in their respective services.
- Always use service names (not container names) for DB host in pgAdmin and inter-service calls.
- All migrations are auto-run on service startup (no manual DB creation needed).
- RabbitMQ is essential for the event-driven architecture. Services depend on it starting first.
- EventService must initialize before database sync to ensure event publishing/subscribing works.
- UserEventListener MUST initialize after database sync to handle incoming events properly.
- Never hardcode TEST_USERS in user-service: rely on events from auth-service instead.
- If adding a new event, implement corresponding EventListener in subscribing service.
- Always use proper error handling in event handlers (throw for NACK/retry).
- Update .env.example files when adding new environment variables.

## 📚 Documentation
- See [.github/README.md] for documentation index and quick navigation.
- See [.github/QUICK_START.md] for setup and testing.
- See [.github/EVENT_DRIVEN_ARCHITECTURE.md] for complete architecture with diagrams.
- See [.github/BEFORE_AFTER_COMPARISON.md] for understanding changes.
- See [.github/IMPLEMENTATION_CHECKLIST.md] for all changes made.

---

*For questions or missing patterns, ask the user for clarification and update this file accordingly.*

