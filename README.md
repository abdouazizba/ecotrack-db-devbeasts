# EcoTrack — Gestion des Déchets Urbains

Plateforme microservices event-driven pour la collecte de déchets, le suivi des conteneurs IoT et les signalements citoyens.

---

## Démarrage rapide

```bash
cd backend
docker-compose up -d
```

Attendre ~45 secondes, puis vérifier :

```bash
curl http://localhost:3001/health   # Auth service
curl http://localhost:3002/health   # Container service
curl http://localhost:3000/health   # API Gateway
```

Interfaces disponibles :
- **API Gateway** → http://localhost:3000
- **Frontend React** → http://localhost:80
- **Grafana (Monitoring)** → http://localhost:3100 (`admin` / `ecotrack123`)
- **Prometheus** → http://localhost:9090
- **RabbitMQ Admin** → http://localhost:15672 (`ecotrack` / `ecotrack123`)
- **pgAdmin** → http://localhost:5050 (`admin@ecotrack.com` / `admin123`)

---

## Architecture

```
                    API GATEWAY :3000
                         │
        ┌────────┬───────┼────────┬──────────┐
        │        │       │        │          │
    Auth      User  Container  Tour      Signal     IoT
    :3001    :3005   :3002    :3003      :3004     :3006
      │        │       │        │          │
    auth_db  user_db cont_db tour_db  signal_db
        │        │       │        │          │
        └────────┴───────┴────────┴──────────┘
                         │
                     RabbitMQ :5672
                         │
              ┌──────────┴──────────┐
          Prometheus :9090    Grafana :3100
              │
        pg-exporter :9187
```

**Stack :** Node.js / Express · PostgreSQL · RabbitMQ · Docker · Prometheus · Grafana  
**Pattern :** Event-Driven Microservices · Database-per-Service · JWT + RBAC

---

## Services

| Service | Port | Base de données | Rôle |
|---|---|---|---|
| ecotrack-gateway | 3000 | — | Reverse proxy + agrégation |
| auth-service | 3001 | auth_db | JWT, sessions, rate limiting |
| container-service | 3002 | container_db | Conteneurs, capteurs, mesures, zones |
| tour-service | 3003 | tour_db | Tournées de collecte, agents |
| signal-service | 3004 | signal_db | Signalements citoyens, photos |
| user-service | 3005 | user_db | Profils utilisateurs |
| iot-service | 3006 | — | Simulateur IoT |

### Monitoring

| Service | Port | Rôle |
|---|---|---|
| Prometheus | 9090 | Collecte des métriques (`/metrics` sur chaque service) |
| Grafana | 3100 | Dashboard "EcoTrack — Vue Globale" pré-configuré |
| postgres-exporter | 9187 | Métriques PostgreSQL pour Prometheus |
| RabbitMQ Prometheus | 15692 | Métriques RabbitMQ (plugin intégré) |

---

## Rôles & Permissions

| Rôle | Description |
|---|---|
| `super_admin` | Accès total, gestion des admins |
| `admin` | Gestion utilisateurs, conteneurs, signalements |
| `agent` | Tournées, mesures, consultation stats |
| `citoyen` | Créer signalements, voir ses propres données |

---

## Commandes utiles

```bash
# Login — récupérer un token JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aminata.ba@ecotrack.com","password":"password123"}'

# Lister les conteneurs (token requis)
curl http://localhost:3000/api/conteneurs \
  -H "Authorization: Bearer <TOKEN>"

# Conteneurs proches (GPS)
curl "http://localhost:3000/api/conteneurs/nearby?lat=48.85&lng=2.35&radius=5" \
  -H "Authorization: Bearer <TOKEN>"

# Logs d'un service
docker logs ecotrack_auth_service -f

# Relancer un service
docker-compose restart container-service

# Tests unitaires (dans un service)
cd backend/services/auth
npm test
```

---

## Comptes de test (seeds)

| Email | Mot de passe | Rôle |
|---|---|---|
| superadmin@ecotrack.com | ecotrack123 | super_admin |
| marie.legrand@ecotrack.com | adminpass123 | admin |
| jean.martin@ecotrack.com | password456 | agent |
| aminata.ba@ecotrack.com | password123 | citoyen |

---

## Documentation

| Document | Contenu |
|---|---|
| [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) | C4 Model, Event Storming, ADR, Use Cases |
| [documentation/API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md) | Référence complète des endpoints |
| [documentation/SCHEMAS.md](documentation/SCHEMAS.md) | Modèles de données et schémas DB |
| [documentation/QUICK_START.md](documentation/QUICK_START.md) | Guide installation détaillé |
| [documentation/RBAC_GUIDE.md](documentation/RBAC_GUIDE.md) | Matrice des permissions par rôle |
| [backend/swagger.yaml](backend/swagger.yaml) | Spec OpenAPI (Swagger) |

---

## Monitoring & Observabilité

Chaque service expose un endpoint `/metrics` (Prometheus format via `prom-client`).

**Métriques collectées :**
- `ecotrack_http_requests_total` — requêtes HTTP par service/route/statut
- `ecotrack_http_duration_seconds` — latence (histogram P50/P95/P99)
- `ecotrack_http_active_requests` — requêtes en vol
- `ecotrack_signalements_created_total` — signalements par type/priorité
- `ecotrack_tournees_active` — tournées EN_COURS (gauge)
- Métriques Node.js par défaut (CPU, RAM, event loop, GC)

**Dashboard Grafana** : "EcoTrack — Vue Globale" se charge automatiquement au démarrage avec 10 panels (req/sec, latence P95, taux erreur 5xx, signalements/min, tournées actives, mémoire, event loop lag, top routes, connexions PostgreSQL).

---

## Rate Limiting

| Environnement | Général | Auth (`/api/auth/*`) |
|---|---|---|
| **Development** | 2000 req / 15 min | 500 req / 15 min |
| **Production** | 200 req / 15 min | 20 req / 15 min |

---

*EcoTrack · Node.js · PostgreSQL · RabbitMQ · Prometheus · Grafana · Docker*

---

Développé par **Abdou Aziz BA** · [mameabdouaziz.02@gmail.com](mailto:mameabdouaziz.02@gmail.com)
