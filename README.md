# EcoTrack — Gestion des Déchets Urbains

Plateforme microservices event-driven pour la collecte de déchets, le suivi des conteneurs IoT et les signalements citoyens.

---

## Démarrage rapide

```bash
cd backend
docker compose up -d
```

Attendre ~60 secondes que tous les services passent en `healthy`, puis vérifier :

```bash
curl http://localhost:3000/health   # Gateway (résumé de tous les services)
```

### Interfaces disponibles

| Interface | URL | Identifiants |
|---|---|---|
| **Frontend React** | http://localhost:80 | voir comptes ci-dessous |
| **Swagger UI** | http://localhost:3000/api-docs | — |
| **Grafana** | http://localhost:3100 | `admin` / `ecotrack123` |
| **Prometheus** | http://localhost:9090 | — |
| **RabbitMQ Admin** | http://localhost:15672 | `ecotrack` / `ecotrack123` |
| **pgAdmin** | http://localhost:5050 | `admin@ecotrack.com` / `admin123` |

---

## Comptes de test

### Admins

| Email | Mot de passe | Rôle |
|---|---|---|
| `superadmin@ecotrack.com` | `ecotrack123` | super_admin |
| `aziz@ecotrack.com` | `azizadmin123` | admin |
| `marie.legrand@ecotrack.com` | `adminpass123` | admin |
| `galdy@ecotrack.com` | `galdyadmin123` | admin |

### Agents

| Email | Mot de passe | Rôle |
|---|---|---|
| `jean.martin@ecotrack.com` | `Agent2025!` | agent |
| `christophe.tshisekedi@ecotrack.com` | `Agent2025!` | agent |
| `oumar.diallo@ecotrack.com` | `Agent2025!` | agent |
| `fatou.sow@ecotrack.com` | `Agent2025!` | agent |
| `mamadou.coulibaly@ecotrack.com` | `Agent2025!` | agent |
| `kadiatou.barry@ecotrack.com` | `Agent2025!` | agent |
| `ibrahim.keita@ecotrack.com` | `Agent2025!` | agent |
| `aissatou.balde@ecotrack.com` | `Agent2025!` | agent |
| `sekou.camara@ecotrack.com` | `Agent2025!` | agent |
| `mariama.sy@ecotrack.com` | `Agent2025!` | agent |
| *(+ 12 autres agents)* | `Agent2025!` | agent |

### Citoyens (seed)

| Email | Mot de passe | Rôle |
|---|---|---|
| `aminata.ba@ecotrack.com` | `password123` | citoyen |
| `fatoumata.diallo@ecotrack.com` | `citizen123` | citoyen |
| `pierre.dupont@ecotrack.com` | `citizen456` | citoyen |
| `mariam.traore@ecotrack.com` | `citizen789` | citoyen |
| `bernard.ndiaye@ecotrack.com` | `citizen000` | citoyen |

> **500 000 citoyens supplémentaires** peuvent être créés avec le script `node backend/scripts/seed-500k.js` (mot de passe : `password123`).

---

## Architecture

```
                    API GATEWAY :3000
                    (Swagger UI, Rate Limit, Photo Proxy)
                         │
        ┌────────┬───────┼────────┬──────────┬────────┐
        │        │       │        │          │        │
    Auth      User  Container  Tour      Signal     IoT
    :3001    :3005   :3002    :3003      :3004     :3006
      │        │       │        │          │
    auth_db  user_db cont_db tour_db  signal_db
        │        │       │        │          │
        └────────┴───────┴────────┴──────────┘
                         │
                     RabbitMQ :5672 (20+ événements)
                         │
              ┌──────────┴──────────┐
          Prometheus :9090    Grafana :3100
```

**Stack :** Node.js 22 / Express · PostgreSQL 16 · RabbitMQ 3.13 · Redis 7 · Docker  
**Patterns :** Event-Driven Microservices · Database-per-Service · JWT + RBAC 4 rôles · PgBouncer

---

## Services

| Service | Port | Base de données | Rôle |
|---|---|---|---|
| ecotrack-gateway | 3000 | — | Proxy, Swagger UI, rate limiting Redis |
| auth-service | 3001 | ecotrack_auth | JWT, refresh tokens (2j), rate limiting auth |
| container-service | 3002 | ecotrack_container | Conteneurs, capteurs, mesures, zones |
| tour-service | 3003 | ecotrack_tour | Tournées, agents, véhicules |
| signal-service | 3004 | ecotrack_signal | Signalements citoyens, photos clôture |
| user-service | 3005 | ecotrack_user | Profils, gamification citoyens |
| iot-service | 3006 | — | Simulateur IoT (30s, auto-refresh capteurs) |

---

## Rôles & Permissions

| Rôle | Accès |
|---|---|
| `super_admin` | Accès total, gestion des admins |
| `admin` | Gestion utilisateurs, conteneurs, signalements, tournées |
| `agent` | Ses tournées, signalements, clôture avec photo obligatoire |
| `citoyen` | Créer signalements, voir ses données, gamification |

---

## Événements RabbitMQ (exchange `ecotrack_events`)

| Événement | Publie | Consomme | Action |
|---|---|---|---|
| `user.created` | auth | user | Crée profil utilisateur |
| `user.deleted` | user | auth, signal | RGPD : purge credentials, anonymise signalements |
| `signalement.created` | signal | container | Conteneur → maintenance |
| `signalement.closed` | signal | container | Conteneur → actif si tous résolus |
| `tournee.started` | tour | signal | Signalements OUVERT → EN_COURS |
| `tournee.completed` | tour | signal | Signalements restants → FERMÉ |
| `container.deleted` | container | signal | Signalements → REJETÉ |
| `measurement.created` | container | signal | Auto-signalement si remplissage > 85% |

---

## Tests & CI

```bash
# Lancer les tests d'un service (avec couverture)
cd backend/services/signal-service
npm test -- --coverage

# Seuils de couverture : 70% branches/functions/lines/statements
# (50% pour iot-service)
```

**CI GitHub Actions** : `.github/workflows/ci.yml`
- 5 jobs parallèles (auth, container, signal, tour, user)
- PostgreSQL en service container pour les tests d'intégration
- Déclenché sur push et PR vers `main`

---

## Monitoring

Chaque service expose `/metrics` (format Prometheus via `prom-client`).

**Métriques métier :**
- `ecotrack_signalements_created_total{type, priorite}` — signalements créés
- `ecotrack_tournees_active` — tournées EN_COURS (gauge)
- `ecotrack_http_requests_total{method, route, status}` — requêtes HTTP

**Dashboard Grafana** : "EcoTrack — Vue Globale" — 10 panels auto-configurés (req/sec, latence P95, mémoire RSS, event loop lag, top routes, connexions PostgreSQL).

---

## RGPD — Droit à l'oubli

La suppression d'un utilisateur (`DELETE /api/users/:id`) déclenche l'événement `user.deleted` qui :
1. **auth-service** : supprime les credentials (email + hash mot de passe)
2. **signal-service** : anonymise les signalements (met `id_utilisateur` à `null`)
3. Les profils (Citoyen/Agent/Admin) sont supprimés en cascade via FK

---

## Commandes utiles

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aziz@ecotrack.com","password":"azizadmin123"}'

# Seed 500K citoyens
node backend/scripts/seed-500k.js

# Logs d'un service
docker logs ecotrack_signal_service -f

# Rebuild un service
docker compose up -d --build signal-service

# Tests avec couverture
cd backend/services/auth && npm test -- --coverage
```

---

## Documentation

| Document | Contenu |
|---|---|
| [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) | C4 Model, Event Storming, ADR, Use Cases |
| [backend/swagger.yaml](backend/swagger.yaml) | Spec OpenAPI (70+ endpoints) |
| [backend/ecotrack-gateway/README.md](backend/ecotrack-gateway/README.md) | Guide Gateway |
| [documentation/ARCHITECTURE_SCALABLE.md](documentation/ARCHITECTURE_SCALABLE.md) | Architecture scalable v2 |

---

*EcoTrack · Node.js 22 · PostgreSQL 16 · RabbitMQ 3.13 · Redis 7 · Docker · Prometheus · Grafana*

Développé par **Abdou Aziz BA** · [mameabdouaziz.02@gmail.com](mailto:mameabdouaziz.02@gmail.com)
