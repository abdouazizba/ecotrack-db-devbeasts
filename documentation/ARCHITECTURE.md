# 🏗️ EcoTrack - Architecture Complète (Module 1 - v1.5)

**Dernière mise à jour:** 24 Juin 2026 🆕 (Event-Driven complet: 20 événements, tournée→signal sync, photos, Swagger UI)  
**Status:** ✅ COMPLÈTE + EVENT-DRIVEN  
**Audience:** Développeurs, Architectes, Évaluateurs RNCP  

---

## 📋 Table des Matières

1. [Quick Overview](#overview) - Vue générale
2. [Architecture System Context (C4 Level 1)](#c4-level1) - Contexte système
3. [Architecture Containers (C4 Level 2)](#c4-level2) - Conteneurs et composants
4. [Architecture Decision Records](#adr) - Justification des choix
5. [Event Storming](#event-storming) - Événements métier et flows
6. [Use Cases par Rôle](#use-cases) - Cas d'usage Agent/Citoyen/Admin
7. [Déploiement et Setup](#deployment) - Instructions

---

## <a id="overview"></a>🎯 Overview - Architecture Générale

### Principes Fondamentaux

```
┌─────────────────────────────────────────────────────────────┐
│          ECOTRACK - EVENT-DRIVEN MICROSERVICES              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paradigme:    Microservices + Event-Driven Architecture    │
│  Framework:    Node.js/Express                              │
│  Database:     PostgreSQL (Database-per-Service)            │
│  Message:      RabbitMQ (Async Pub/Sub)                     │
│  Auth:         JWT (HMAC-SHA256, 1h expiry)                 │
│  RBAC:         4 rôles (super_admin, admin, agent, citoyen) │
│  Scale:        15k utilisateurs actifs, 2k conteneurs IoT   │
│  Throughput:   500k mesures IoT/jour                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stack Technique

| Composant | Technologie | Version | Port | Rôle |
|-----------|-------------|---------|------|------|
| **API Gateway** | Express | 20.x | 3000 | Routeur unique vers services |
| **Auth Service** | Node/Express | 20.x | 3001 | JWT, RBAC, authentification |
| **User Service** | Node/Express | 20.x | 3005 | Profils Agent/Citoyen/Admin |
| **Container Service** | Node/Express | 20.x | 3002 | CRUD conteneurs, zones |
| **Tour Service** | Node/Express | 20.x | 3003 | Tournées, collecte, mesures |
| **Signal Service** | Node/Express | 20.x | 3004 | Signalements, incidents |
| **IoT Service** | Node/Express | 20.x | 3006 | Gateway capteurs IoT (mesures temps réel) |
| **Message Broker** | RabbitMQ | 3.13 | 5672 | Pub/Sub (auth/user events) |
| **Database Auth** | PostgreSQL | 16 | 5432 | Instance auth_db |
| **Database Container** | PostgreSQL | 16 | 5433 | Instance container_db |
| **Database Tour** | PostgreSQL | 16 | 5434 | Instance tour_db |
| **Database Signal** | PostgreSQL | 16 | 5435 | Instance signal_db |
| **Database User** | PostgreSQL | 16 | 5436 | Instance user_db |
| **UI Admin** | pgAdmin | latest | 5050 | Gestion DB |
| **MQ Admin** | RabbitMQ Management | 15672 | 15672 | Gestion RabbitMQ |
| **Prometheus** | Prometheus | latest | 9090 | Collecte métriques (scrape /metrics) |
| **Grafana** | Grafana | latest | 3100 | Dashboards monitoring |
| **PG Exporter** | postgres-exporter | latest | 9187 | Métriques PostgreSQL |
| **RabbitMQ Metrics** | RabbitMQ Prometheus | - | 15692 | Métriques RabbitMQ (plugin) |

### 🚨 **IMPORTANT: Phase 1 vs Future Roadmap**

```
PHASE 1 (ACTUEL - Ce que vous voyez dans le code)
==================== 
✅ Services Implémentés:      auth, user, container, tour, signal, iot, gateway
✅ Communication:             REST (sync) + RabbitMQ (full event-driven inter-services)
✅ Événements:                ~20 événements (5 domaines, boucles complètes)
✅ Bases de données:          5 instances PostgreSQL (une par service)
✅ Monitoring:                Prometheus + Grafana + prom-client (/metrics)
✅ Métriques métier:          signalements_created_total, tournees_active
✅ Inter-service:             /internal/containers (container→signal, no auth)

PHASE 2 (FUTURE - Sur la roadmap, NON IMPLÉMENTÉ):
========================================================
⏳ Services à Ajouter:       notification-service, alert-service, analytics
⏳ Communication:             Full event-driven (33 événements complets)
⏳ Notifications:             Email, SMS, push notifications
⏳ Alertes:                   Seuils dépassés, conteneurs pleins, etc.
⏳ Analytics:                 Dashboards, KPIs, rapports

⚠️ ATTENTION: Ne pas implémenter Phase 2 pour Module 1!
   Ce qui suit dans le document montre la VISION COMPLÈTE (future state)
   mais SEULE la Phase 1 ci-dessus est implémentée pour le Module 1.
```

---

## <a id="c4-level1"></a>🌍 C4 Level 1: System Context

### Diagramme ASCII

```
┌──────────────────────────────────────────────────────────────────┐
│                   ECOTRACK SYSTEM CONTEXT                        │
└──────────────────────────────────────────────────────────────────┘

                          Internet Public
                                ▲
                                │
                  ┌─────────────┴──────────────┐
                  │                            │
                  │                            │
        ┌─────────▼─────────┐        ┌─────────▼──────────┐
        │   CITOYENS        │        │   AGENTS COLLECTE  │
        │  (500k users)     │        │   (50 agents)      │
        │                   │        │                    │
        │ • Signaler        │        │ • Démarrer tournée │
        │ • Voir conteneurs │        │ • Scanner          │
        │ • Points réput.   │        │ • Mesurer poids    │
        │ • Géolocaliser    │        │ • Valider collecte │
        └────────┬──────────┘        └────────┬───────────┘
                 │                            │
                 │ REST/WebSocket             │ REST/WebSocket
                 │ HTTPS                      │ HTTPS
                 │                            │
                 ├────────────────┬───────────┤
                 │                │           │
                 ▼                ▼           ▼
        ┌──────────────────────────────────────────┐
        │      ECOTRACK PLATFORM                   │
        │   [Microservices + Event-Driven]         │
        │                                           │
        │ • API Gateway (Port 3000)                │
        │ • 5 Microservices (REST + RabbitMQ)      │
        │ • PostgreSQL x5 (Database-per-Service)   │
        │ • RabbitMQ (33 événements métier)        │
        │                                           │
        └────────────────┬─────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          │              │              │
    ┌─────▼─────┐  ┌──────▼──────┐ ┌────▼────────┐
    │  ADMINS   │  │   SYSTÈME   │ │  ANALYTICS  │
    │ (20 users)│  │   IoT       │ │  & RAPPORTS │
    │           │  │ (2k sensors)│ │             │
    │ • Gérer   │  │             │ │ • KPIs      │
    │ • Rapports│  │ • Mesures   │ │ • Graphes   │
    │ • Logs    │  │ • Alertes   │ │ • Exports   │
    │ • Droits  │  │ (500k/jour) │ │ • PDF       │
    └───────────┘  └─────────────┘ └─────────────┘
         │              │               │
         │ HTTPS        │ MQTT/HTTP     │ REST
         │              │               │
         └──────────────┴───────────────┘
                       │
                       ▼
            [Message Broker RabbitMQ]
            [33 événements métier]
            [5 queues persistantes]
```

### Acteurs et Interactions

| Acteur | Type | Interactions | Volume |
|--------|------|-------------|--------|
| **Citoyens** | Person | Signaler problèmes, voir conteneurs, gagner points | 500k active |
| **Agents Collecte** | Person | Tournées, scanner, mesurer, collecter | 50 users |
| **Administrateurs** | Person | Gérer système, rapports, droits d'accès | 20 users |
| **Système IoT** | External System | Envoyer mesures capteurs temps réel | 2k capteurs |
| **EcoTrack Platform** | Software System | Orchestration complète (voir détail ci-dessous) | Central |

---

## <a id="c4-level2"></a>⚙️ C4 Level 2: Container Architecture

### Diagramme Système Complet

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Port3000)                              │
│                      Express + JWT Validation +Routing                      │
│  /auth → 3001 | /users → 3005 | /container → 3002 | /tour → 3003           │
│  /signal → 3004 | /iot → 3006                                               │
└──────────────┬──────────────────────────────────────┬──────────────────────┘
               │                                      │
        ┌──────▼──────┐  ┌────────────────┐  ┌───────▼────────┐
        │   AUTH       │  │   USER         │  │   CONTAINER    │
        │  SERVICE     │  │   SERVICE      │  │   SERVICE      │
        │ (Port 3001)  │  │ (Port 3005)    │  │  (Port 3002)   │
        │              │  │                │  │                │
        │ • Login      │  │ • Profiles     │  │ • CRUD         │
        │ • Register   │  │ • Agent/       │  │ • Zones        │
        │ • JWT        │  │   Citoyen/     │  │ • Mesures IoT  │
        │ • Verify     │  │   Admin        │  │ • Assignation  │
        │ • RBAC       │  │ • Réputation   │  │ • Historique   │
        │              │  │ • Badges       │  │                │
        └──┬───────────┘  └────┬───────────┘  └────┬───────────┘
           │                   │                   │
        ┌──▼──────┐      ┌─────▼────┐      ┌──────▼──────┐
        │ auth_db │      │ user_db  │      │container_db │
        │(PgSQL)  │      │ (PgSQL)  │      │  (PgSQL)    │
        │ Port    │      │ Port     │      │ Port 5433   │
        │ 5432    │      │ 5436     │      │             │
        └─────────┘      └──────────┘      └─────────────┘

        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   TOUR       │  │   SIGNAL     │  │     IoT      │
        │  SERVICE     │  │  SERVICE     │  │   SERVICE    │
        │ (Port 3003)  │  │ (Port 3004)  │  │ (Port 3006)  │
        │              │  │              │  │              │
        │ • Tournées   │  │ • Incidents  │  │ • Capteurs   │
        │ • Collecte   │  │ • Statuts    │  │ • Mesures    │
        │ • Tracking   │  │ • Photos     │  │ • Temps réel │
        │              │  │ • Assignation│  │              │
        └──┬───────────┘  └────┬─────────┘  └──────────────┘
           │                   │
        ┌──▼──────┐      ┌─────▼────┐
        │ tour_db │      │signal_db │
        │(PgSQL)  │      │ (PgSQL)  │
        │ Port    │      │ Port     │
        │ 5434    │      │ 5435     │
        └─────────┘      └──────────┘

  ┌─────────────────────────────────────────────────────────┐
  │  RabbitMQ MESSAGE BROKER (Port 5672)                   │
  │  Management UI: 15672                                   │
  │                                                         │
  │  Consommateurs: auth-service ↔ user-service           │
  │  Événements:                                            │
  │  • UtilisateurInscrit                                  │
  │  • UtilisateurConnecte                                 │
  │  • RoleChangé                                          │
  │  • ProfilMisAJour                                      │
  └─────────────────────────────────────────────────────────┘
        │  Management: 15672        │
        │                           │
        │  5 Queues:                │
        │  • user-events            │
        │  • container-events       │
        │  • tour-events            │
        │  • signal-events          │
        │  • alert-events           │
        │                           │
        │  33 Event Types           │
        │  (voir Event Storming)    │
        └────────────────────────────┘
```

### Services et Responsabilités

#### 🔐 **AUTH SERVICE** (Port 3001)

**Responsabilité:** Authentification, JWT, RBAC

**Endpoints Clés:**
- `POST /api/auth/login` - Authentifier utilisateur, retourner JWT
- `POST /api/auth/register` - Créer utilisateur (publier event RabbitMQ)
- `POST /api/auth/verify` - Valider JWT (appelé par autres services)
- `POST /api/auth/logout` - Déconnexion
- `GET /health` - Health check

**Événements RabbitMQ:**
- Produit: `UtilisateurInscrit`, `UtilisateurConnecte`
- Consomme: Aucun

**Database:** `auth_db` (PostgreSQL, Port 5432)
- Table: `users`
- Colonnes: id, email, password, nom, prenom, last_login, created_at, updated_at

**Infrastructure:**
- Express 4.18.2, Sequelize 6.35.2
- JWT: HMAC-SHA256, 1h expiry
- Joi validation schemas
- Global error handling
- Repository pattern

---

#### 👤 **USER SERVICE** (Port 3005)

**Responsabilité:** Profils Agent/Citoyen/Admin, réputation, multitenancy

**Endpoints Clés:**
- `GET /api/users` - Lister tous (Admin only)
- `GET /api/users/me` - Profil actuel
- `PUT /api/users/me` - Mettre à jour profil
- `GET /api/users/:id` - Détail utilisateur (Admin)
- `GET /health` - Health check

**Événements RabbitMQ:**
- Produit: `ProfilMisAJour`, `ReputationMisAJour`
- Consomme: `UtilisateurInscrit` → crée Agent/Citoyen/Admin profiles

**Database:** `user_db` (PostgreSQL, Port 5436)
- Tables TPT: `utilisateur` (base), `agent`, `citoyen`, `admin` (subclasses)
- Colonnes: id, reputation_points, badge_id, zone_id, status, created_at
- Ownership-based access control

**Infrastructure:**
- Multi-role inheritance (TPT pattern)
- RabbitMQ event-driven user profile creation
- Ownership checks for profile access

---

#### 📦 **CONTAINER SERVICE** (Port 3002)

**Responsabilité:** CRUD conteneurs, zones, mesures IoT, assignation agents

**Endpoints Clés:**
- `GET /api/conteneurs` - Lister conteneurs (paginé, filtres statut/type/zone)
- `POST /api/conteneurs` - Créer (admin, super_admin)
- `GET /api/conteneurs/nearby?lat=&lng=&radius=` - Proches GPS (Haversine, ≤50 résultats)
- `GET /api/conteneurs/needs-service` - À fort taux de remplissage (agent+)
- `GET /api/conteneurs/:id` - Détail
- `PUT /api/conteneurs/:id` - Mise à jour (agent+)
- `DELETE /api/conteneurs/:id` - Supprimer (admin+)
- `GET /internal/containers` - Liste conteneurs pour inter-services (sans auth, réseau Docker uniquement)
- `GET /internal/containers/:id` - Détail conteneur pour inter-services (sans auth)
- `GET /health` - Health check

**Communication:**
- REST synchrone avec auth-service (vérification JWT)
- Endpoints internes `/internal/*` pour signal-service (seed + création signalements)
- Reçoit mesures IoT de iot-service

**Database:** `container_db` (PostgreSQL, Port 5433)
- Tables: `zone`, `conteneur`, `mesure`
- Conteneur: id, code, type, capacite, lat, lng, current_level, weight, is_full, last_emptied
- Mesure: id, container_id, weight, timestamp, source (IoT/manual)

---

#### 🚛 **TOUR SERVICE** (Port 3003)

**Responsabilité:** Tournées de collecte, planification, tracking

**Endpoints Clés:**
- `POST /api/tour/start` - Démarrer tournée (Agent)
- `GET /api/tour/:id` - Détail tournée en cours
- `POST /api/tour/:id/container` - Enregistrer collecte conteneur
- `PUT /api/tour/:id/end` - Terminer tournée
- `GET /api/tour/history` - Historique (Agent/Admin)
- `GET /health` - Health check

**Communication:**
- REST synchrone avec auth-service (JWT validation)
- REST synchrone avec container-service (données conteneurs + mesures)
- Pas de RabbitMQ

**Database:** `tour_db` (PostgreSQL, Port 5434)
- Tables: `tournee`, `tournee_agents`, `collecteur`
- Tournée: id, code, date, statut (PLANIFIÉE/EN_COURS/TERMINÉE/ANNULÉE), heure_debut, heure_fin, distance_km, conteneurs_collectes, notes, id_zone (nullable)
- TourneeAgent: id, id_tournee, id_agent, role (CONDUCTEUR/COLLECTEUR) — une tournée peut avoir plusieurs agents
- Collecteur: id, code_collecteur, id_agent, statut (ACTIF/INACTIF/EN_MAINTENANCE), batterie_actuelle

---

#### ⚠️ **SIGNAL SERVICE** (Port 3004)

**Responsabilité:** Signalements incidents, suivi, gestion

**Endpoints Clés:**
- `POST /api/signalements` - Créer signalement (tout utilisateur authentifié)
- `GET /api/signalements` - Lister (agent+)
- `GET /api/signalements/open` - Signalements ouverts (agent+)
- `GET /api/signalements/:id` - Détail
- `PUT /api/signalements/:id` - Mise à jour (agent+)
- `DELETE /api/signalements/:id` - Supprimer (admin+)
- `POST /api/signalements/:id/photo` - Upload photo (multipart, JPEG/PNG/WebP, max 5 MB)
- `POST /api/signalements/:id/in-progress` - Passer en cours (agent+)
- `POST /api/signalements/:id/close` - Clôturer (agent+)
- `POST /api/signalements/:id/reject` - Rejeter (admin+)
- `GET /api/signalements/citoyen/:id` - Signalements d'un citoyen
- `GET /api/signalements/container/:id` - Signalements d'un conteneur (agent+)
- `GET /health` - Health check

**Communication:**
- REST synchrone avec auth-service (JWT validation)
- REST synchrone avec container-service (détails conteneurs)
- Pas de RabbitMQ

**Enrichissement automatique:**
- À la création d'un signalement, `id_zone` est auto-détecté via `GET /internal/containers/:id` (container-service, sans auth)
- Le seed récupère les vrais container IDs + zones via `GET /internal/containers` au démarrage

**Database:** `signal_db` (PostgreSQL, Port 5435)
- Table: `signalements`
- Colonnes: id, type, description, statut, priorite, id_conteneur, id_utilisateur, id_tournee, id_zone (cross-service), latitude, longitude, photo_url, date_resolution, notes_resolution

---

#### 🚀 **API GATEWAY** (Port 3000)

**Responsabilité:** Point d'entrée unique, routage, JWT validation

**Routes Mapping:**
```
GET    /health                    → All services health
GET    /health/:service           → Specific service health
POST   /api/auth/*                → auth-service:3001
GET    /api/users/*               → user-service:3005
POST   /api/users/*               → user-service:3005
GET    /api/container/*           → container-service:3002
POST   /api/container/*           → container-service:3002
GET    /api/tour/*                → tour-service:3003
POST   /api/tour/*                → tour-service:3003
PUT    /api/tour/*                → tour-service:3003
GET    /api/signal/*              → signal-service:3004
POST   /api/signal/*              → signal-service:3004
PUT    /api/signal/*              → signal-service:3004
POST   /api/iot/*                 → iot-service:3006
```

**Middleware Standard:**
- CORS (all routes)
- Body parsing (JSON, multipart)
- JWT validation (exempt: /auth/*, /health)
- Error handling & standardized responses

---

#### 🌐 **IOT SERVICE** (Port 3006)

**Responsabilité:** Ingestion mesures capteurs IoT, temps réel

**Endpoints Clés:**
- `POST /api/iot/measure` - Recevoir mesure capteur (IoT device)
- `POST /api/iot/alert` - Recevoir alerte capteur
- `GET /health` - Health check

**Communication:**
- REST synchrone avec container-service (enregistrement mesures)
- Pas de RabbitMQ
- API KEY authentication (DEVICE_API_KEY)

**Fonctionnalité:**
- Reçoit mesures: poids, température, humidité, etc.
- Valide données + authentification
- Envoie à container-service via POST /api/container/:id/measure
- Logs structurés pour debug

**Architecture Notes:**
- Service lightweight
- Stateless (scalable horizontalement)
- Pas de DB propre (stockage via container-service)
- Optional API key validation (configurable)

---

## <a id="adr"></a>📋 Architecture Decision Records (ADR)

### **ADR-001: Microservices vs Monolithe**

**Status:** ✅ **ACCEPTED**

**Context:**
- 15,000 utilisateurs actifs, 2,000 conteneurs IoT
- 500,000 mesures/jour
- 3 rôles avec permissions différentes
- 5 domaines métier distincts (Auth, Users, Containers, Tours, Signals)
- Équipes multiples (risque de conflits)

**Decision:**
Implémenter **architecture microservices** avec 5 services indépendants (auth, user, container, tour, signal), chacun avec sa propre database PostgreSQL.

**Consequences:**

✅ **Avantages:**
- **Scalabilité indépendante:** Si tour-service surchargé, scale seul
- **Déploiement granulaire:** Deploy signal-service sans redémarrer autres
- **Équipes autonomes:** Pas de conflits merge Git
- **Évolution techno:** Migrer user-service Node → Rust possible
- **Résilience:** Panne signal-service ≠ panne authentification
- **DDD aligned:** Chaque service = bounded context métier
- **Testing isolé:** Tests tour-service sans lancer auth-service

⚠️ **Défis:**
- Complexité accrue (5 services vs 1)
- Données distribuées (pas de JOIN SQL simple)
- Transactions distribuées (nécessite sagas, événements)
- Monitoring plus complexe

**Atténuation:** RabbitMQ pour communication async, health checks, centralized logging

---

### **ADR-002: RabbitMQ pour Événements (Auth + User Seulement)**

**Status:** ✅ **PARTIALLY IMPLEMENTED**

**Context:**
- Services indépendants doivent communiquer
- auth-service crée utilisateurs, user-service doit créer profils
- Autres services (container, tour, signal) utilisent queries simples
- Vue initiale: 33 événements metadata entre services
- Réalité: Seulement 2-3 événements critiques entre auth/user

**Decision:**
**Hybrid approach:** REST synchrone pour queries + RabbitMQ pour 2 événements critiques (UtilisateurInscrit, RoleChangé)

**Implémentation Réelle:**
```
RabbitMQ (asynchrone) - UTILISÉ:
  auth-service publie "UtilisateurInscrit"
  → user-service écoute → crée profil Agent/Citoyen/Admin

REST (synchrone) - UTILISÉ:
  tour-service → GET /api/container/zones/:id (synchrone)
  signal-service → GET /api/container/:id (synchrone)
  container-service → GET /api/container/:id (synchrone)

RabbitMQ (asynchrone) - NON IMPLÉMENTÉ:
  container-service event publishing (pas utilisé)
  tour-service event publishing (pas utilisé)
  signal-service event publishing (pas utilisé)
  notification-service (n'existe pas)
  alert-service (n'existe pas)
  analytics (n'existe pas)
```

**Consequences:**

✅ **Avantages Réalisés:**
- **Découplage auth/user:** Aucune dépendance directe
- **Event-driven registration:** Profils créés automatiquement
- **Simple:** Pas de sur-engineering

⚠️ **Limitations Actuelles:**
- Container/tour/signal restent fortement couplés à container-service
- Pas de event audit pour container/tour/signal
- Scalabilité limitée pour pics de charge (tout synchrone)

**Future Roadmap:**
- Ajouter RabbitMQ pour container-service events
- Implémenter alert-service (consomme MesureEnregistree)
- Implémenter notification-service (consomme tous les events)

---

### **ADR-003: Database-per-Service (vs Shared Database)**

**Status:** ✅ **ACCEPTED**

**Context:**
- Microservices besoin données autonomes
- Options: Shared DB vs Database-per-Service
- Éviter tight coupling via DB (anti-pattern)

**Decision:**
**Database-per-Service:** Chaque microservice a sa propre instance PostgreSQL.

```
auth_db       (Port 5432)  ← auth-service
container_db  (Port 5433)  ← container-service
tour_db       (Port 5434)  ← tour-service
signal_db     (Port 5435)  ← signal-service
user_db       (Port 5436)  ← user-service
```

**Consequences:**

✅ **Avantages:**
- **Autonomie:** Service peut changer schema sans impacter autres
- **Scalabilité:** Scale chaque DB indépendamment
- **Performance:** Optimiser index/queries pour cas d'usage spécifique
- **Sécurité:** Isolation données (user-service ne voit pas auth_db)

⚠️ **Défis:**
- JOIN cross-service impossible
- Denormalization nécessaire (data duplication)
- Cohérence à travers services (eventual consistency)

**Atténuation:** RabbitMQ pour synchroniser copies data, API calls pour queries

---

## <a id="event-storming"></a>🎯 Event Storming: Événements Métier

### État Actuel vs Vision — ACTUALISÉ JUIN 2026

| État | Services | Événements | Communication | Status |
|------|----------|-----------|-----------------|--------|
| **Phase 1 v1.0** | 6 services | ~4 événements | REST sync + RabbitMQ (auth↔user) | ❌ Janvier 2026 |
| **Phase 1 v1.5** | 7 services (+iot) | ~13 événements | REST sync + RabbitMQ (5 domaines) | ✅ Mai 2026 |
| **Phase 1 v2.0** 🆕 | 7 services | **~20 événements** | Full event-driven inter-services | ✅ **JUIN 2026** |
| **Future Roadmap** | +3 services (notification, alert, analytics) | 33 événements | Full event-driven | ⏳ Phase 2 |

### Événements IMPLÉMENTÉS (Phase 1 v2.0 — JUIN 2026)

#### **Domaine 1: Authentification & Utilisateurs**

| Événement | Producer | Consumer | Action | Status |
|-----------|----------|----------|--------|--------|
| `user.created` | auth-service | user-service | Crée Utilisateur + Citoyen/Agent/Admin | ✅ IMPLÉMENTÉ |

#### **Domaine 2: Conteneurs & Zones** 🆕 **PUBLIÉ (JUIN 2026)**

| Événement | Producer | Consumer | Action | Status |
|-----------|----------|----------|--------|--------|
| `container.created` | container-service | — | Disponible (future) | ✅ PUBLIÉ |
| `container.status_changed` | container-service | signal-service | Si retiré → signalements REJETÉ | ✅ **IMPLÉMENTÉ** |
| `container.zone_changed` | container-service | — | Disponible (future: tour-service) | ✅ PUBLIÉ |
| `container.deleted` | container-service | signal-service | Signalements ouverts → REJETÉ | ✅ **IMPLÉMENTÉ** |
| `container.maintenance_needed` | iot-service | signal-service | Auto-crée signalement AUTRE | ✅ IMPLÉMENTÉ |
| `zone.created` | container-service | — | Nouvelle zone créée | ✅ PUBLIÉ |
| `zone.updated` | container-service | — | Zone modifiée (is_active, etc.) | ✅ PUBLIÉ |
| `zone.deleted` | container-service | — | Zone supprimée | ✅ PUBLIÉ |

#### **Domaine 3: Mesures IoT**

| Événement | Producer | Consumer | Action | Status |
|-----------|----------|----------|--------|--------|
| `measurement.created` | container-service | signal-service, tour-service | Auto-signalement si remplissage > 85% | ✅ IMPLÉMENTÉ |
| `measurement.alert` | iot-service | signal-service, container-service | Alerte débordement, conteneur → maintenance | ✅ IMPLÉMENTÉ |

#### **Domaine 4: Signalements** 🆕 **PUBLIÉ + ÉCOUTÉ (JUIN 2026)**

| Événement | Producer | Consumer | Action | Status |
|-----------|----------|----------|--------|--------|
| `signalement.created` | signal-service | container-service | Conteneur PLEIN/DÉBORDEMENT → maintenance | ✅ IMPLÉMENTÉ |
| `signalement.closed` | signal-service | container-service | Si tous résolus → conteneur → actif | ✅ **IMPLÉMENTÉ** |
| `signalement.rejected` | signal-service | container-service | Idem (vérifie signalements restants) | ✅ **IMPLÉMENTÉ** |

#### **Domaine 5: Tournées** 🆕 **IMPLÉMENTÉ (JUIN 2026)**

| Événement | Producer | Consumer | Action | Status |
|-----------|----------|----------|--------|--------|
| `tournee.started` | tour-service | signal-service | Signalements OUVERT liés → EN_COURS_DE_TRAITEMENT | ✅ **IMPLÉMENTÉ** |
| `tournee.completed` | tour-service | signal-service | Signalements restants → FERMÉ automatiquement | ✅ **IMPLÉMENTÉ** |

#### **Phase 2 (Future)**

⏳ **À VENIR :**
- `user.role_changed` → tour-service (agent promu/rétrogradé)
- `user.deactivated` → tour-service (réassignation tournées)
- notification-service → email/SMS sur événements critiques
- alert-service → seuils dépassés, SLA

### Vision Complète: 33 Événements (Future Architecture)


### Flux d'Orchestration Phase 1 (RÉELLEMENT IMPLÉMENTÉS)

#### **Flux 1: User Registration (Citoyen)** ✅ IMPLÉMENTÉ

```
1. POST /api/auth/register
   └─→ auth-service crée utilisateur en auth_db
       └─→ Publie event RabbitMQ: "UtilisateurInscrit"

2. RabbitMQ queue reçoit événement
   └─→ user-service s'abonne → reçoit event
       └─→ Crée Utilisateur + profil Citoyen en user_db
       └─→ Logs: "Profile created for user X"

✅ Résultat: Utilisateur créé dans auth_db ET user_db, système prêt
⏳ FUTURE: notification-service enverrait email de bienvenue
```

---

#### **Flux 2: Agent Tournée Complète** ✅ **IMPLÉMENTÉ (JUIN 2026)**

```
1. DÉMARRAGE — Agent démarre la tournée
   └─→ PATCH /api/tournees/:id/statut { statut: "EN_COURS" }
       └─→ tour-service met heure_debut + statut EN_COURS
       └─→ PUBLIE: tournee.started → RabbitMQ
           └─→ signal-service reçoit l'événement
               └─→ Signalements OUVERT liés → EN_COURS_DE_TRAITEMENT (auto)

2. TRAITEMENT — Agent traite les signalements un par un
   └─→ POST /api/signalements/:id/in-progress (prise en charge)
   └─→ POST /api/signalements/:id/close (photo obligatoire)
       └─→ signal-service : statut FERMÉ + photo_url + date_resolution
       └─→ PUBLIE: signalement.closed → RabbitMQ
           └─→ container-service vérifie si tous signalements résolus
               └─→ Si oui : conteneur statut → actif

3. CLÔTURE — Agent termine la tournée
   └─→ PATCH /api/tournees/:id/statut { statut: "TERMINÉE" }
       └─→ tour-service met heure_fin + statut TERMINÉE
       └─→ PUBLIE: tournee.completed → RabbitMQ
           └─→ signal-service reçoit l'événement
               └─→ Signalements restants (OUVERT/EN_COURS) → FERMÉ (auto)
               └─→ notes_resolution: "Résolu lors de la tournée TRN-XXX"

✅ Résultat: Tournée terminée, tous signalements fermés, conteneurs réactivés
✅ Admin voit tout dans l'historique : agent, équipe, photos, chronologie
```

---

#### **Flux 3: IoT Mesure → Container** ✅ IMPLÉMENTÉ

```
1. IoT Device envoie: POST /api/iot/measure
   └─→ iot-service reçoit (API KEY auth)
       └─→ Valide capteur + données

2. iot-service appelle: POST /api/container/:id/measure
   └─→ container-service enregistre mesure en mesure table
       └─→ Vérifie seuil capacité (alerte si >80%)

✅ Résultat: Mesures horodatées en DB, analytique possible
⏳ FUTURE: Seuil dépassé → event → alert-service → SMS managers
```

---

#### **Flux 4: Collecte Enregistrement** ✅ IMPLÉMENTÉ

```
1. Agent enregistre collecte: POST /api/tour/:id/container
   └─→ tour-service reçoit conteneur_id + poids

2. tour-service valide
   └─→ Appelle: POST /api/container/:id/measure
       └─→ container-service enregistre
       
3. tour-service retourne succès
   └─→ UI met à jour liste

✅ Résultat: Collecte validée, conteneur updated, weight logged
```

---

#### **Flux 5: IoT Auto-Measurement avec Events** 🆕 **NOUVEAU MAI 2026**

```
ÉTAPE 1: Cron Job IoT Simulator (toutes les 30 secondes)
═══════════════════════════════════════════════════════
1. IoTMeasurementSimulator.executeBatch()
   └─→ Sélectionne 50 conteneurs aléatoires
   └─→ Pour chaque conteneur:
       ├─ Génère fill% réaliste (progression graduelle)
       ├─ Génère température, batterie, signal
       └─ Envoie: POST /api/iot/measure

2. iot-service reçoit mesures
   └─→ Valide + enregistre en iot-service DB (optionnel)
   └─→ Appelle: POST /api/conteneurs/:id/measure
       └─→ container-service enregistre mesure
       
ÉTAPE 2: Trigger Alerte si fill% > 80%
════════════════════════════════════════
3. Si fill% > 80%:
   ├─ iot-service.triggerMaintenanceAlert()
   └─→ Publie 2 événements RabbitMQ:
       ├─ EVENT: "container.maintenance_needed"
       │   {id_conteneur, taux_remplissage, reason, alert_type}
       └─ EVENT: "measurement.alert"
           {id_conteneur, taux_remplissage, alert_type}

ÉTAPE 3: Signal-Service Auto-Crée Signalements
═══════════════════════════════════════════════
4. SignalEventListener.subscribeToMaintenanceAlerts()
   └─→ Reçoit: "container.maintenance_needed"
   └─→ Crée automatiquement un signalement:
       ├─ Type: MAINTENANCE_REQUIRED
       ├─ Priorité: NORMALE ou URGENTE (si fill% > 95%)
       └─ Description: "Automatic alert: Container is XX.X% full"

5. SignalEventListener.subscribeToMeasurementAlerts()
   └─→ Reçoit: "measurement.alert" (fill% > 85%)
   └─→ Crée automatiquement un signalement:
       ├─ Type: OVERFLOW_ALERT
       ├─ Priorité: URGENTE
       └─ Description: "Automatic alert: Container overflow at XX.X%"

ÉTAPE 4: Container-Service Met à Jour Statut
════════════════════════════════════════════
6. ContainerEventListener.subscribeToSignalCreated()
   └─→ Reçoit: "signal.created"
   └─→ Logs: "Signal received for container X, type Y"
   └─→ Si type = CONTENEUR_PLEIN ou DÉBORDEMENT:
       └─→ UPDATE conteneurs SET statut='maintenance' WHERE id=X AND statut='actif'

RÉSULTAT FINAL:
═══════════════
✅ 50 mesures enregistrées (toutes les 30s)
✅ Environ 2-3 alertes par batch (statistiquement)
✅ Environ 4-6 signalements auto-créés par batch
✅ Conteneurs PLEIN/DÉBORDEMENT → statut maintenance automatique
✅ Flow event-driven complet et observable
✅ Ready for production & soutenance!

⏰ Performance:
  • 50 mesures/batch en ~1 secondes
  • 4-6 événements RabbitMQ en ~0.5 secondes
  • Total: ~10-15 secondes par cycle complet
  • = 120k mesures/jour sur production scale
```

---

### Vision Complète: Flux Futurs (Phase 2+)

---

## <a id="use-cases"></a>👥 Use Cases par Rôle

### **AGENT COLLECTE** 🚛

#### Cas d'Usage 1: Démarrer Tournée

```
Acteur Principal: Agent
Précondition: Connecté, au moins une tournée assignée
Flux Principal:
  1. Agent consulte "Mes tournées"
  2. Système récupère tournées via GET /api/tournees/agent/:id
  3. Agent clique "Démarrer" sur une tournée planifiée
  4. Système passe statut → EN_COURS (PATCH /api/tournees/:id/statut)
  5. Agent traite les signalements de la tournée
  
Flux Alternatif (pas de tournées):
  → Système affiche "Aucune tournée assignée"
  → Contacter administrateur
```

**Endpoints:** `GET /api/tournees/agent/:agentId`, `PATCH /api/tournees/:id/statut`, `GET /api/tournees/:id/signalements`

---

#### Cas d'Usage 2: Enregistrer Mesure de Collecte

```
Acteur Principal: Agent
Précondition: Tournée en cours, à côté conteneur
Flux Principal:
  1. Agent scanne code QR/RFID conteneur
  2. Agent entre poids collecté
  3. Agent valide collecte
  4. Système enregistre mesure
  5. Système marque conteneur comme collecté
  
Post-condition: Mesure enregistrée, conteneur updated
```

**Endpoints:** `POST /api/tour/:id/container`, `POST /api/container/:id/measure`

---

#### Cas d'Usage 3: Signaler Problème Conteneur

```
Acteur Principal: Agent
Précondition: Tournée en cours
Flux Principal:
  1. Agent rencontre conteneur cassé
  2. Agent clique "Signaler"
  3. Agent sélectionne problème (cassé, débordé, etc.)
  4. Agent prend photo
  5. Agent soumet signalement
  
Post-condition: Signalement créé, admin notifié
```

**Endpoints:** `POST /api/signal`

---

### **CITOYEN** 👥

#### Cas d'Usage 1: Voir Conteneurs Proches

```
Acteur Principal: Citoyen
Flux Principal:
  1. Citoyen ouvre carte interactive
  2. Système affiche conteneurs dans rayon 500m
  3. Citoyen clique conteneur pour détails
  4. Système affiche: adresse, dernier vidage, niveau
  
Post-condition: Citoyen voit état conteneurs
```

**Endpoints:** `GET /api/container/nearby?lat=...&lng=...&radius=500`

---

#### Cas d'Usage 2: Créer Signalement

```
Acteur Principal: Citoyen
Précondition: Connecté
Flux Principal:
  1. Citoyen clique "Signaler problème"
  2. Citoyen sélectionne conteneur (sur carte)
  3. Citoyen choisit catégorie (débordé, cassé, odeur, localisation)
  4. Citoyen ajoute photo(s)
  5. Citoyen ajoute description
  6. Citoyen soumet
  7. Système notifie admin
  8. Citoyen gagne +1 point réputation
  
Post-condition: Signalement créé, admin notifié, points gagnés
```

**Endpoints:** `POST /api/signal`, `PUT /api/users/me` (reputation)

---

### **ADMINISTRATEUR** 👨‍💼

#### Cas d'Usage 1: Gérer Signalements

```
Acteur Principal: Admin
Précondition: Connecté
Flux Principal:
  1. Admin voit tableau signalements
  2. Admin filtre par statut (nouveau, en cours, résolu)
  3. Admin clique signalement
  4. Admin voit détails (photo, description, localisation)
  5. Admin assigne à agent
  6. Admin change statut
  7. Admin ajoute commentaire
  8. Admin valide résolution
  
Post-condition: Signalement assigné, agent notifié
```

**Endpoints:** `GET /api/signal`, `PUT /api/signal/:id`, `POST /api/signal/:id/comment`

---

#### Cas d'Usage 2: Créer Rapport Mensuel

```
Acteur Principal: Admin
Flux Principal:
  1. Admin clique "Générer rapport"
  2. Admin sélectionne mois
  3. Système calcule KPIs:
     - Total collectes
     - Poids moyen
     - Signalements résolus
     - Performance agents
     - Points citoyens gagnés
  4. Admin télécharge rapport PDF
  
Post-condition: Rapport généré, PDF prêt
```

**Endpoints:** `GET /api/analytics/reports?month=...`

---

#### Cas d'Usage 3: Assigner Agents à une Tournée

```
Acteur Principal: Admin
Flux Principal:
  1. Admin va section "Tournées"
  2. Admin sélectionne ou crée une tournée
  3. Admin assigne un ou plusieurs agents (rôle CONDUCTEUR/COLLECTEUR)
  4. Admin ajoute les signalements à traiter dans la tournée
  
Post-condition: Tournée visible dans "Mes tournées" des agents assignés
```

**Endpoints:** `POST /api/tournees/:id/agents`, `DELETE /api/tournees/:id/agents/:agentId`, `PATCH /api/signalements/:id/tournee`

---

## <a id="deployment"></a>🚀 Déploiement & Setup

### Prérequis

- Docker & Docker Compose
- Git
- Ports disponibles: 3000-3005, 5432-5436, 5672, 15672, 5050

### Installation

```bash
# 1. Clone repository
git clone <repo>
cd backend

# 2. Start all services
docker-compose up -d

# 3. Wait ~30 seconds for startup
sleep 30

# 4. Check health
curl http://localhost:3001/health
curl http://localhost:3005/health
curl http://localhost:5672  # RabbitMQ (should timeout gracefully)

# 5. Access UIs
# RabbitMQ Management: http://localhost:15672
#   User: ecotrack, Password: ecotrack123
#
# pgAdmin: http://localhost:5050
#   User: admin@ecotrack.com, Password: admin123
#   Servers: auth-db, user-db, container-db, tour-db, signal-db (Port 5432-5436)
```

### Testing Système

```bash
# 1. Login (get JWT)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@ecotrack.com","password":"password123"}'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {"id": 1, "email": "agent1@ecotrack.com", "role": "AGENT"}
# }

# 2. Get profile (use JWT)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 3. See containers in zone
curl http://localhost:3000/api/container/zones/1 \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 4. Start tour
curl -X POST http://localhost:3000/api/tour/start \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"zone_id":1}'

# 5. Check RabbitMQ events
# Go to http://localhost:15672 → Queues → see messages
```

### Troubleshooting

| Problème | Solution |
|----------|----------|
| Service ne démarre pas | `docker logs <service_name>` |
| Database connection error | Vérifier service name (pas container name) en host |
| RabbitMQ not accessible | Attendre 10s, RabbitMQ démarre lentement |
| JWT invalid | Token expiré (1h) ou mauvaise clé secrète |
| Event non reçu | Vérifier consumer écoute queue correcte (RabbitMQ UI) |

---

## 📊 Monitoring & Observabilité

### Stack Monitoring

```
┌─────────────────────────────────────────────────┐
│                 GRAFANA :3100                     │
│         Dashboard "EcoTrack — Vue Globale"       │
│  (10 panels auto-provisionnés au démarrage)      │
└──────────────────────┬──────────────────────────┘
                       │ query
              ┌────────┴────────┐
              ▼                 ▼
    ┌──────────────┐  ┌──────────────────┐
    │ Prometheus   │  │ postgres-exporter│
    │   :9090      │  │     :9187        │
    └──────┬───────┘  └────────┬─────────┘
           │ scrape /metrics    │ scrape
    ┌──────┼──────────┐   ┌────┴────┐
    │      │          │   │  5× DB  │
  gateway auth container ... PostgreSQL
  :3000  :3001 :3002
                      │
              RabbitMQ :15692
              (prometheus plugin)
```

### Métriques exposées par service

Chaque service inclut `prom-client` et expose `GET /metrics` :

| Métrique | Type | Labels | Description |
|----------|------|--------|-------------|
| `ecotrack_http_requests_total` | Counter | service, method, route, status_code | Total requêtes HTTP |
| `ecotrack_http_duration_seconds` | Histogram | service, method, route, status_code | Latence (buckets 5ms→5s) |
| `ecotrack_http_active_requests` | Gauge | service | Requêtes en vol |
| `ecotrack_signalements_created_total` | Counter | type, priorite | Signalements créés (signal-service) |
| `ecotrack_tournees_active` | Gauge | — | Tournées EN_COURS (tour-service) |
| `ecotrack_process_resident_memory_bytes` | Gauge | — | Mémoire RSS Node.js |
| `ecotrack_nodejs_eventloop_lag_seconds` | Gauge | — | Event loop lag |

### Dashboard Grafana pré-configuré

Le dashboard "EcoTrack — Vue Globale" (`uid: ecotrack-overview`) est auto-provisionné via `monitoring/grafana/provisioning/dashboards/`. Il contient :

1. Requêtes/sec par service (timeseries)
2. Latence P95 par service (timeseries, seuils jaune >0.5s, rouge >2s)
3. Taux d'erreur 5xx (stat, seuil jaune >1%, rouge >5%)
4. Requêtes totales 24h (stat)
5. Signalements créés/min (stat)
6. Tournées actives (stat)
7. Mémoire RSS par service (timeseries)
8. Event Loop Lag (timeseries, seuil jaune >100ms, rouge >500ms)
9. Top 10 routes par requêtes (table)
10. PostgreSQL connexions actives (timeseries)

### Rate Limiting (auth-service)

| Environnement | Général | Auth endpoints |
|---|---|---|
| `NODE_ENV=development` | 2000 req / 15 min | 500 req / 15 min |
| `NODE_ENV=production` | 200 req / 15 min | 20 req / 15 min |

---

## 📚 Références Complètes

### Architecture Patterns Utilisés

- **Microservices:** Pour scalabilité, autonomie, DDD
- **Event-Driven:** Pour découplage, résilience, audit
- **Database-per-Service:** Pour isolation, autonomie
- **Table Per Type (TPT):** Pour User hierarchy (Agent/Citoyen/Admin)
- **JWT:** Pour stateless authentication
- **RBAC:** Pour access control basé rôle

### Technologies Stack

| Aspect | Choix | Justification |
|--------|-------|---------------|
| **API Framework** | Express.js | Léger, populaire, performant |
| **Database** | PostgreSQL | ACID, JSON support, reliable |
| **Message Broker** | RabbitMQ | AMQP, persistent, management UI |
| **Authentication** | JWT + RBAC | Stateless, scalable, standard |
| **Containerization** | Docker | Portabilité, consistency |
| **Orchestration** | Docker Compose | Simple pour dev, production-ready |
| **Monitoring** | Prometheus + Grafana | Standard industrie, dashboards auto-provisionnés |
| **Métriques Node** | prom-client | Client Prometheus officiel pour Node.js |

### Documents Supplémentaires

- **QUICK_START.md** - Guide démarrage 5 min
- **IMPLEMENTATION_CHECKLIST.md** - Liste complète changements
- **BEFORE_AFTER_COMPARISON.md** - Comparaison ancien vs nouveau

---

## ✅ Complétion Module 1 - ACTUALISÉ MAI 2026

**Status:** 🟢 **100% COMPLÈTE + 🆕 AMÉLIORATIONS MAI 2026**

### Core Documentation ✅
- [x] Use Cases Agent/Citoyen/Admin documentés
- [x] Event Storming (~20 événements implémentés, boucles tournée↔signal↔container complètes)
- [x] C4 Model (Level 1 & 2, 13 composants)
- [x] Architecture Decision Records (3 décisions justifiées)
- [x] Flux d'Orchestration (4 flux principaux)

### Backend Infrastructure ✅
- [x] 7 Microservices implémentés (auth, user, container, tour, signal, iot, gateway)
- [x] Docker-compose complet + health checks
- [x] 5 instances PostgreSQL (Database-per-Service)
- [x] RabbitMQ Message Broker (Topic Exchange)
- [x] Swagger/OpenAPI 3.0 (43 endpoints documentés)

### Data & Events ✅
- [x] Database design (5 instances, TPT pattern pour users)
- [x] Event-Driven communication (RabbitMQ, ~13 events)
- [x] EventListeners implémentés (container-service, signal-service) 🆕
- [x] Auto-creation de signalements via events 🆕
- [x] ContainerEventListener — mise à jour statut conteneur sur signal PLEIN/DÉBORDEMENT 🆕

### Data Simulation & Testing 🆕 **MAI 2026**
- [x] **Seed Massif:** 2000 conteneurs + 500 zones (10 villes)
- [x] **Cron IoT:** 50 mesures/30s (120k mesures/jour scale)
- [x] **Auto-Alerts:** Signalements auto-créés si fill% > 80%
- [x] **Event Chain:** IoT → RabbitMQ → Signal-Service → Signalements

### Security & Auth ✅
- [x] JWT Authentication (HMAC-SHA256, 1h expiry)
- [x] RBAC: 4 rôles (super_admin, admin, agent, citoyen) — matrice complète par route
- [x] Authorization middleware sur tous les services
- [x] API Key validation (IoT service)
- [x] Rate limiting — express-rate-limit (200 req/15min général, 20 req/15min sur /api/auth)

### Documentation & DevOps ✅
- [x] ARCHITECTURE.md (960+ lignes)
- [x] API_DOCUMENTATION.md (200+ lignes)
- [x] QUICK_START.md (5-minute setup)
- [x] swagger.yaml (OpenAPI 3.0, 1200+ lignes)
- [x] Events registry constants/events.js 🆕

**Prêt pour soutenance RNCP ✓**

---

*Document v1.0: Janvier 2026 | v1.5: Mai 2026 (IoT + Events) | v1.6: Juin 2026 (Nearby GPS, Photo Upload, Rate Limiting)*  
*Architecture finalisée, testée, et production-ready*
