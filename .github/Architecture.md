# 🏗️ Architecture EcoTrack v2 - Microservices avec IoT

## 📑 Table des Matières
1. [Vue Globale](#vue-globale)
2. [Architecture Microservices](#architecture-microservices)
3. [Flux de Données](#flux-de-données)
4. [Service IoT](#service-iot)
5. [Communication & Événements](#communication--événements)
6. [Déploiement](#déploiement)
7. [Sécurité](#sécurité)

---

## Vue Globale

### Topologie Système

```
                        ┌──────────────────────────────────────┐
                        │     CLIENT WEB / MOBILE              │
                        │   (React/Vue Frontend)               │
                        └──────────────┬───────────────────────┘
                                       │
                                       │ HTTP/HTTPS
                                       ▼
        ┌──────────────────────────────────────────────────────┐
        │         API GATEWAY (Port 3000)                      │
        │  Single entry point - Routes à tous les services    │
        └──────┬──────────┬──────────┬──────────┬──────────┬───┘
               │          │          │          │          │
        ┌──────▼─┐  ┌────▼───┐ ┌───▼───┐ ┌───▼───┐ ┌──▼────┐ ┌───▼────┐
        │  Auth  │  │ Users  │ │Contai-│ │ Tour  │ │Signal │ │  IoT   │
        │Service │  │Service │ │ner    │ │Service│ │Service│ │Service │
        │ 3001   │  │ 3005   │ │Service│ │ 3003  │ │ 3004  │ │ 3006   │
        │        │  │        │ │ 3002  │ │       │ │       │ │        │
        └───┬────┘  └───┬────┘ └───┬───┘ └───┬───┘ └───┬────┘ └────┬───┘
            │           │          │          │         │           │
        ┌───▼───┐   ┌───▼──┐  ┌───▼───┐ ┌───▼───┐ ┌───▼────┐  HTTP-CLIENT
        │Auth-DB│   │User- │  │Conta- │ │Tour-DB│ │Signal- │   (No DB)
        │5432   │   │ DB   │  │iner-DB│ │5435   │ │DB 5436 │   Valide +
        │       │   │5433  │  │5434   │ │       │ │        │   Forward
        └───────┘   └──────┘  └───────┘ └───────┘ └────────┘   to Cont.
                                                                    
                        ┌─────────────────────────────────────┐
                        │     RABBITMQ (Port 5672)            │
                        │  Event-Driven Pub/Sub                │
                        │  Management: 15672                  │
                        └─────────────────────────────────────┘
                                       
                        ┌─────────────────────────────────────┐
                        │    PGADMIN (Port 5050)              │
                        │  Database Management UI              │
                        └─────────────────────────────────────┘

        🌐 IoT Capteurs (2000+)
           └─► IoT-Service ─► Container-Service ─► DB mesure
```

### Architecture par Service

| Service | Port | Database | Rôle |
|---------|------|----------|------|
| **Gateway** | 3000 | - | Routage central, proxy |
| **Auth** | 3001 | 5432 (auth-db) | Authentification JWT |
| **Container** | 3002 | 5433 (container-db) | Conteneurs, mesures, zones |
| **Tour** | 3003 | 5434 (tour-db) | Tournées, collecte |
| **Signal** | 3004 | 5435 (signal-db) | Alertes, signalements |
| **User** | 3005 | 5436 (user-db) | Profils utilisateurs (Agent, Citoyen) |
| **IoT** | 3006 | - | Gateway capteurs, validation |

---

## Architecture Microservices

### Pattern: Database Per Service

Chaque service a sa **propre base de données PostgreSQL** pour assurer:
- ✅ Isolation des données
- ✅ Autonomie du service
- ✅ Scalabilité indépendante
- ✅ Pas d'accès DB direct entre services

```
Services               Databases
─────────────         ─────────────
auth-service    ──► ecotrack_auth (5432)
container-service ──► ecotrack_container (5433)
tour-service    ──► ecotrack_tour (5434)
signal-service  ──► ecotrack_signal (5435)
user-service    ──► ecotrack_user (5436)
```

### Pattern: Event-Driven Communication

Les services ne se parlent **PAS directement**. Ils communiquent via **RabbitMQ**:

```
Service A               RabbitMQ              Service B
┌─────────────┐        ┌───────┐        ┌─────────────┐
│ auth-service│        │Exchange│      │signal-service│
└──────┬──────┘        └───┬───┘        └────▲────────┘
       │                   │                  │
       │ publish("        │                  │
       │  user.created")  │                  │
       ├──────────────────►queue: signals    │
       │                   │                  │
       │                   │ subscribe(      │
       │                   │  "user.created")│
       │                   └──────────────────┤
       │                                      │
       │                   ┌──────────────────┘
       │                   │ Traiter événement
```

### 33 Événements Définis

```javascript
// Utilisateurs
- user.created
- user.updated
- user.deleted
- auth.login
- auth.logout
- auth.password_reset

// Conteneurs
- container.created
- container.updated
- container.deleted
- zone.created
- zone.updated
- zone.deleted

// Mesures
- measurement.recorded
- measurement.validation_failed

// Tours
- tour.created
- tour.started
- tour.completed
- tour.collection_point_reached

// Signalements
- signal.created
- signal.updated
- signal.resolved

// Alertes
- alert.generated
- alert.threshold_exceeded
- alert.overflow_detected
- alert.temperature_alert
- alert.low_battery_alert
```

---

## Flux de Données

### 1. Flux Utilisateur (Authentication)

```
┌──────────────┐
│ Client Login │
└──────┬───────┘
       │ POST /api/auth/login
       ▼
┌──────────────────────┐
│ API Gateway :3000    │
└──────┬───────────────┘
       │ proxy
       ▼
┌──────────────────────────────┐
│ Auth-Service :3001           │
│ 1. Valider credentials       │
│ 2. Créer JWT token          │
│ 3. Publier "user.login"     │
└──────┬───────────────────────┘
       │
       ├─► RabbitMQ: event "auth.login"
       │       │
       │       ├─► Signal-Service: Log connection
       │       └─► User-Service: Update last_login
       │
       ▼
┌──────────────────────┐
│ Client: JWT Token    │
└──────────────────────┘
```

### 2. Flux Mesure Capteur IoT (Nouveau)

```
IoT Capteur (MQTT/HTTP)
         │
         │ Capteur mesure: 87.5% remplissage
         │
         ▼
┌────────────────────────┐
│ IoT-Service :3006      │
│ 1. Réception mesure    │
│ 2. Validation format   │
│ 3. Enrichissement      │
│ 4. Audit logging       │
└────────┬───────────────┘
         │
         │ HTTP POST: /api/container/1/measure
         │
         ▼
┌────────────────────────────────────┐
│ Container-Service :3002            │
│ 1. Insertion dans container_db     │
│ 2. Calcul des stats                │
│ 3. Publier "measurement.recorded"  │
└────────┬─────────────────────────────┘
         │
         │ RabbitMQ: event "MesureEnregistree"
         │       │
         │       ├─► Signal-Service: Check thresholds
         │       │     └─ Si > 95% → alert overflow
         │       │     └─ Si temp > 40° → alert temp
         │       │
         │       ├─► Analytics-Service: Update stats
         │       │
         │       └─► Dashboard-WebSocket: Real-time update
         │
         ▼
┌──────────────────────┐
│ Database: mesure     │
│ table enregistrée    │
└──────────────────────┘
```

### 3. Flux Signalement (Signal)

```
┌──────────────┐
│ Citoyen App  │
└──────┬───────┘
       │ POST /api/signal/report
       ▼
┌──────────────────────┐
│ API Gateway :3000    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│ Signal-Service :3004     │
│ 1. Créer signal          │
│ 2. Notifier Admin        │
│ 3. Publier event         │
└──────┬───────────────────┘
       │ RabbitMQ: "signal.created"
       ▼
┌──────────────────────┐
│ Admin reçoit SMS     │
│ Dashboard updated    │
└──────────────────────┘
```

---

## Service IoT

### Architecture IoT

```
🌍 2000+ Capteurs Physiques
    │
    ├─ Ultrasonic (remplissage %)
    ├─ DS18B20 (température)
    ├─ Load Cell (poids)
    ├─ DHT22 (humidité)
    └─ GPS (localisation)
    
           │
           │ HTTP POST /api/iot/measure
           │ {capteur_id, conteneur_id, type, valeur, unite, ...}
           │
           ▼
    ┌──────────────────────────┐
    │  IoT-Service :3006       │
    │                          │
    │  ✓ Valide schema         │
    │  ✓ Check plages (0-100%) │
    │  ✓ Vérifie type capteur  │
    │  ✓ Enrichit (timestamp)  │
    │  ✓ Assigne message_id    │
    │  ✓ Forward à container   │
    └────────┬─────────────────┘
             │
             │ HTTP POST: /api/container/{id}/measure
             │
             ▼
    ┌──────────────────────────┐
    │ Container-Service :3002  │
    │                          │
    │ INSERT mesure            │
    │ PUBLISH "MesureRecordee" │
    └────────┬─────────────────┘
             │
             │ RabbitMQ
             │
             ├─► Alert-Service: Check seuils
             ├─► Analytics: Accumule stats
             └─► Dashboard: Affiche temps-réel
```

### Endpoints IoT

```http
# Enregistrer mesure (Capteur → IoT-Service → Container-Service)
POST /api/iot/measure
{
  "capteur_id": "CAPTEUR_ZONE_A_001",
  "conteneur_id": 1,
  "type_capteur": "REMPLISSAGE|TEMPERATURE|POIDS|HUMIDITE|GPS",
  "valeur": 87.5,
  "unite": "%|°C|kg|%RH|lat,lng",
  "timestamp_capteur": "2026-01-29T10:30:00Z",
  "qualite_signal": 85,
  "batterie": 95
}

# Enregistrer nouveau capteur
POST /api/iot/device/register
{
  "capteur_id": "CAPTEUR_ZONE_A_001",
  "type_capteur": "REMPLISSAGE",
  "conteneur_id": 1,
  "api_key": "..."
}

# Récupérer info capteur
GET /api/iot/device/:capteur_id

# État du service IoT
GET /api/iot/status

# Health check
GET /health
```

### Validation Données IoT

```javascript
// Champs requis
- capteur_id: string (non-vide)
- conteneur_id: integer (> 0)
- type_capteur: enum [REMPLISSAGE, TEMPERATURE, POIDS, HUMIDITE, GPS]
- valeur: number (float)
- unite: string (%, °C, kg, %RH)

// Champs optionnels
- timestamp_capteur: ISO8601 datetime
- qualite_signal: integer (0-100)
- batterie: integer (0-100)

// Erreurs possibles
400: Validation échouée
401: API key invalide
202: Acceptée (container-service temporairement indisponible)
503: Service IoT indisponible
```

---

## Communication & Événements

### RabbitMQ Pub/Sub Pattern

```
Service 1                          RabbitMQ                       Service 2
┌─────────────────┐               ┌─────────────┐              ┌──────────────┐
│ EventService:   │               │  Exchange:  │              │ EventListener:
│ publishEvent()  │               │ ecotrack_   │              │ subscribeEvent()
└────────┬────────┘               │ events      │              └─────▲────────┘
         │                        └──────┬──────┘                    │
         │                               │                          │
         │ event.publish(                │ event.queue               │
         │  'user.created',              │ (user.created)           │
         │  {id, email, role}            │                          │
         │)                              │                          │
         ├──────────────────────────────►│                          │
         │                               ├─────────────────────────►│
         │                               │                          │
         │                               │                          │
         ▼                               ▼                          ▼
Acknowledge              Persistence              Acknowledge
Logué                    (durée param)            Traiter l'événement
```

### Exemple: Flow User Creation

```
1. Auth-Service CRÉATION utilisateur
   ├─ Valide email unique
   ├─ Hash password
   ├─ INSERT dans auth_db.users
   └─ PUBLISH "user.created" event
          │
          ├─ {id: 123, email: "john@ecotrack.com", role: "agent"}
          │
          ▼
2. RabbitMQ queuing
   └─ Event persiste: ~1h TTL
          │
          ▼
3. User-Service SUBSCRIBE
   ├─ Reçoit "user.created" event
   ├─ Crée Utilisateur
   ├─ Crée Agent/Citoyen/Admin profil
   ├─ INSERT dans user_db
   └─ PUBLISH "user.profile.created"
          │
          ▼
4. Autres services réagissent
   ├─ Signal-Service: Log l'événement
   ├─ Notification-Service: Envoie welcome email
   └─ Dashboard: Affiche nouvel utilisateur
```

### EventService Utility

```javascript
// src/services/EventService.js
const amqp = require('amqplib');

class EventService {
  // Publish event vers RabbitMQ
  static async publishEvent(eventName, payload) {
    const channel = await connection.createChannel();
    channel.publish(
      'ecotrack_events',
      eventName,
      Buffer.from(JSON.stringify(payload))
    );
  }

  // Subscribe à un événement
  static async subscribeEvent(eventName, callback) {
    const channel = await connection.createChannel();
    const queue = await channel.assertQueue(eventName, { durable: true });
    channel.consume(queue.queue, (msg) => {
      callback(JSON.parse(msg.content.toString()));
    });
  }
}
```

---

## Déploiement

### Docker Compose Orchestration

```yaml
services:
  # Infrastruture
  rabbitmq:3.13-management
    - Port AMQP: 5672
    - Management UI: 15672
  
  # Databases
  auth-db (postgres:16) → port 5432
  user-db (postgres:16) → port 5433
  container-db (postgres:16) → port 5434
  tour-db (postgres:16) → port 5435
  signal-db (postgres:16) → port 5436
  
  # Services
  auth-service → port 3001
  user-service → port 3005
  container-service → port 3002
  tour-service → port 3003
  signal-service → port 3004
  iot-service → port 3006 (NEW!)
  
  # Gateway
  ecotrack-gateway → port 3000
  
  # UI
  pgAdmin → port 5050
```

### Startup Sequence

```
1. RabbitMQ starts (services dépendent dessus)
2. All databases start (PostgreSQL instances)
3. Services start en parallèle (once DB healthy):
   - auth-service (runs migrations, seeds users, publishes events)
   - user-service (subscribes "user.created", creates profiles)
   - container-service (ready for measurements)
   - tour-service
   - signal-service
   - iot-service (ready for sensors)
4. Gateway starts (routes to all services)

Healthchecks assurent dépendances respectées
```

### Commands Déploiement

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f iot-service

# Health status
docker-compose ps

# Rebuild + start
docker-compose up -d --build

# Stop all
docker-compose down

# Remove volumes (reset data)
docker-compose down -v
```

---

## Sécurité

### Authentication & Authorization

```
┌────────────────┐
│ Client Login   │
└────────┬───────┘
         │
         ▼
┌────────────────────────────────────┐
│ Auth-Service verifies credentials  │
│ - Email format valid               │
│ - Password hash match              │
│ - User not disabled                │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ JWT Token issued                   │
│ - Payload: {user_id, role, email}  │
│ - Signed with SECRET_KEY           │
│ - TTL: 24 hours                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Client: Include JWT in all requests│
│ Authorization: Bearer <JWT>        │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Gateway/Service: Verify JWT        │
│ - Check signature                  │
│ - Check expiration                 │
│ - Extract user_id                  │
└────────┬─────────────────────────────┘
         │
         ├─► Valid: Proceed to endpoint
         └─► Invalid: Return 401 Unauthorized
```

### IoT Device Security

```
IoT Device                      IoT-Service
    │                               │
    │ POST /measure                 │
    │ X-API-Key: device_key_123     │
    │ {data}                        │
    ├──────────────────────────────►│
    │                               │
    │                          Check API Key
    │                          Against stored keys
    │                               │
    │                               ├─► Valid
    │                               │   ├─ Validate schema
    │                               │   ├─ Forward to container
    │                               │   └─ Return 202
    │                               │
    │                               └─► Invalid
    │◄──────────────────────────────┤
    │        401 Unauthorized        │
```

### Data Encryption

```
┌──────────────────────────┐
│ In Transit (TLS/HTTPS)   │
│                          │
│ All API calls encrypted  │
│ Gateway → Services: SSL  │
│ Services → DB: SSL       │
└──────────────────────────┘

┌──────────────────────────┐
│ At Rest (Database)       │
│                          │
│ Passwords: Bcrypt hash   │
│ JWT Secret: Strong key   │
│ Sensitive data: Encrypted│
└──────────────────────────┘
```

---

## Monitoring & Observability

### Health Checks

```bash
# All services expose /health endpoint
curl http://localhost:3000/health      # Gateway
curl http://localhost:3001/health      # Auth-Service
curl http://localhost:3002/health      # Container-Service
curl http://localhost:3006/health      # IoT-Service

# Response
{
  "status": "OK",
  "service": "iot-service",
  "timestamp": "2026-01-29T10:30:00Z",
  "database": "connected",
  "rabbitmq": "connected"
}
```

### Logs

```bash
# Docker logs
docker logs ecotrack_iot_service
docker logs ecotrack_container_service

# Real-time
docker-compose logs -f iot-service

# Last N lines
docker logs --tail 100 ecotrack_iot_service
```

### Database Monitoring

```bash
# pgAdmin: http://localhost:5050
# SQL queries
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container
  SELECT COUNT(*) FROM mesure;
  SELECT * FROM mesure ORDER BY created_at DESC LIMIT 10;

# Event monitoring
# RabbitMQ Management: http://localhost:15672 (ecotrack/ecotrack123)
```

---

## Performance & Scalability

### Current Capacity

```
Single Instance (Current Setup):
- IoT-Service: ~500 msg/sec
- Container-Service: ~300 measurements/sec
- RabbitMQ: ~1000 events/sec
- Database: ~500 inserts/sec

Target Capacity:
- IoT-Service: ~2000 msg/sec (multiple instances)
- 2000+ sensors sending data simultaneously
- Real-time dashboard updates
- Alert processing < 1 second
```

### Optimization Tips

```
1. Database Indexing
   CREATE INDEX idx_mesure_container ON mesure(conteneur_id);
   CREATE INDEX idx_mesure_timestamp ON mesure(created_at);

2. Connection Pooling
   Max connections: 20 per service
   Pool size: 5-10

3. Caching
   Redis for frequently accessed data
   Cache user profiles for 1 hour
   Cache container metadata

4. Batching
   Aggregate measurements every 5 seconds
   Bulk insert into database
```

---

## Documentation Files

```
backend/
├── README.md                      # Main overview
├── QUICK_START.md                 # Setup instructions
├── EVENT_DRIVEN_ARCHITECTURE.md  # Complete event docs
├── Architecture.md                # THIS FILE
└── services/
    └── iot-service/
        ├── README.md              # IoT-Service API docs
        ├── SIMULATION_GUIDE.md    # Sensor simulation scripts
        └── scripts/
            ├── simulate-single-sensor.js
            ├── simulate-multiple-sensors.js
            ├── simulate-crisis-scenarios.js
            └── load-test.js
```

---

## Prochaines Étapes

- [ ] Implémenter Redis pour caching
- [ ] Ajouter métriques Prometheus
- [ ] Setup Grafana dashboard
- [ ] Configurer alerting (PagerDuty)
- [ ] CI/CD pipeline
- [ ] Load testing automatisé
- [ ] Kubernetes deployment

---

*Last Updated: January 29, 2026*
*Architecture Version: 2.0 (Microservices + IoT)*
