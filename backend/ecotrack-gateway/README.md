# EcoTrack API Gateway

Point d'entree unique pour la plateforme EcoTrack. Route les requetes vers 6 microservices, gere le rate limiting, sert la documentation Swagger UI et proxifie les fichiers uploades.

## Demarrage

```bash
npm install
npm start
```

Gateway disponible sur `http://localhost:3000`

## Avec Docker Compose (tous les services)

```bash
cd ..
docker compose up -d
```

## Fonctionnalites

| Fonctionnalite | Details |
|----------------|---------|
| **Routage** | 70+ endpoints vers 6 microservices |
| **Rate Limiting** | Redis distribue (fallback memoire), 3 niveaux |
| **Swagger UI** | `http://localhost:3000/api-docs` |
| **Monitoring** | Prometheus `/metrics`, health check `/health` |
| **Upload proxy** | Photos signalements via `multipart/form-data` |
| **Securite** | Helmet, CORS, body size limit 10MB |

## Services routes

| Service | Port | Prefixe | Description |
|---------|------|---------|-------------|
| **Auth** | 3001 | `/api/auth/*` | JWT, login, register, refresh token |
| **Container** | 3002 | `/api/conteneurs/*`, `/api/zones/*`, `/api/capteurs/*`, `/api/mesures/*` | Conteneurs, zones, capteurs IoT |
| **Tour** | 3003 | `/api/tournees/*`, `/api/vehicules/*` | Tournees, agents, vehicules |
| **Signal** | 3004 | `/api/signalements/*` | Signalements citoyens + auto IoT |
| **User** | 3005 | `/api/users/*`, `/api/agents/*` | Profils utilisateurs, roles |
| **IoT** | 3006 | `/api/iot/*` | Ingestion mesures capteurs |

## Rate Limiting

| Niveau | Fenetre | Max (dev) | Max (prod) | Applique a |
|--------|---------|-----------|------------|------------|
| Global | 1 min | 5000 | 200 | Toutes les routes |
| Auth | 5 min | 100 | 20 | `/api/auth/login`, `/api/auth/register` |
| Strict | 1 min | 200 | 30 | Ecritures (POST/PUT/DELETE) |

Skip automatique : `/health`, `/api-docs`

Backend : Redis (`:6379`). Fallback in-memory si Redis indisponible.

## Endpoints speciaux

| Route | Description |
|-------|-------------|
| `GET /health` | Status de tous les services |
| `GET /api-docs` | Swagger UI interactif |
| `GET /swagger-spec` | Spec OpenAPI (JSON) |
| `GET /metrics` | Metriques Prometheus |
| `GET /uploads/signals/:filename` | Photos de cloture (proxy signal-service) |

## Photo upload (multipart)

Deux endpoints utilisent `pipeMultipartRequest` pour streamer le body multipart directement vers signal-service :

- `POST /api/signalements/:id/close` — cloture avec photo obligatoire (JPEG/PNG/WebP, max 5MB)
- `POST /api/signalements/:id/photo` — upload photo independant

## Configuration

```env
NODE_ENV=development
GATEWAY_PORT=3000

# Services
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3005
CONTAINER_SERVICE_URL=http://container-service:3002
TOUR_SERVICE_URL=http://tour-service:3003
SIGNAL_SERVICE_URL=http://signal-service:3004
IOT_SERVICE_URL=http://iot-service:3006

# Rate Limiting
REDIS_URL=redis://redis:6379

# CORS
CORS_ORIGIN=*
```

## Structure

```
ecotrack-gateway/
  src/
    app.js           # Routage, Swagger, rate limiting, proxy
    rateLimiter.js   # Rate limiter Redis/memoire
    metrics.js       # Prometheus prom-client
  swagger.yaml       # Monte via volume docker-compose (../swagger.yaml)
  Dockerfile
  package.json
```

## Health Check

```bash
curl http://localhost:3000/health | jq
```

```json
{
  "status": "healthy",
  "services": {
    "auth": "healthy",
    "container": "healthy",
    "tour": "healthy",
    "signal": "healthy",
    "user": "healthy",
    "iot": "healthy"
  }
}
```
