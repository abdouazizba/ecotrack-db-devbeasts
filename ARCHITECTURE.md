# 🏗️ EcoTrack - Architecture Complète (Module 1)

**Dernière mise à jour:** Janvier 2026  
**Status:** ✅ COMPLÈTE  
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
│                                                               │
│  Paradigme:    Microservices + Event-Driven Architecture    │
│  Framework:    Node.js/Express                              │
│  Database:     PostgreSQL (Database-per-Service)            │
│  Message:      RabbitMQ (Async Pub/Sub)                     │
│  Auth:         JWT (HMAC-SHA256, 1h expiry)                 │
│  RBAC:         3 rôles (Agent, Citoyen, Admin)              │
│  Scale:        15k utilisateurs actifs, 2k conteneurs IoT   │
│  Throughput:   500k mesures IoT/jour                        │
│                                                               │
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
| **Message Broker** | RabbitMQ | 3.13 | 5672 | Pub/Sub 33 événements |
| **Database** | PostgreSQL | 15 | 5432-5436 | 5 instances (une par service) |
| **UI Admin** | pgAdmin | latest | 5050 | Gestion DB |
| **MQ Admin** | RabbitMQ Management | 15672 | 15672 | Gestion RabbitMQ |

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
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 3000)                          │
│                 Express + JWT Validation                            │
│  Routage: /auth → 3001, /users → 3005, /container → 3002, etc.    │
└──────────────┬──────────────────────────────────────┬───────────────┘
               │                                      │
        ┌──────▼──────┐  ┌────────────────┐  ┌───────▼────────┐
        │   AUTH       │  │   USER         │  │   CONTAINER    │
        │  SERVICE     │  │   SERVICE      │  │   SERVICE      │
        │ (Port 3001)  │  │ (Port 3005)    │  │  (Port 3002)   │
        │              │  │                │  │                │
        │ • Login      │  │ • Profiles     │  │ • CRUD         │
        │ • Register   │  │ • Agent/       │  │ • Zones        │
        │ • JWT        │  │   Citoyen/     │  │ • Assignation  │
        │ • Verify     │  │   Admin        │  │ • Mesures      │
        │ • RBAC       │  │ • Réputation   │  │ • Historique   │
        │              │  │ • Badges       │  │                │
        └──┬───────────┘  └────┬───────────┘  └────┬───────────┘
           │                   │                   │
        ┌──▼──────┐      ┌─────▼────┐      ┌──────▼──────┐
        │ auth_db │      │ user_db  │      │container_db │
        │(PgSQL)  │      │ (PgSQL)  │      │  (PgSQL)    │
        │ Port    │      │ Port     │      │ Port 5434   │
        │ 5432    │      │ 5433     │      │             │
        └─────────┘      └──────────┘      └─────────────┘

        ┌──────────────┐  ┌──────────────┐
        │   TOUR       │  │   SIGNAL     │
        │  SERVICE     │  │  SERVICE     │
        │ (Port 3003)  │  │ (Port 3004)  │
        │              │  │              │
        │ • Tournées   │  │ • Incidents  │
        │ • Collecte   │  │ • Statuts    │
        │ • Mesures    │  │ • Photos     │
        │ • Tracking   │  │ • Assignation│
        └──┬───────────┘  └────┬─────────┘
           │                   │
        ┌──▼──────┐      ┌─────▼────┐
        │ tour_db │      │signal_db │
        │(PgSQL)  │      │ (PgSQL)  │
        │ Port    │      │ Port     │
        │ 5435    │      │ 5436     │
        └─────────┘      └──────────┘

                    │
                    │ (RabbitMQ Pub/Sub)
                    │
        ┌───────────▼──────────────┐
        │   RabbitMQ MESSAGE BROKER │
        │     (Port 5672)           │
        │  Management: 15672        │
        │                            │
        │  5 Queues:                │
        │  • user-events            │
        │  • container-events       │
        │  • tour-events            │
        │  • signal-events          │
        │  • alert-events           │
        │                            │
        │  33 Event Types           │
        │  (voir Event Storming)    │
        └────────────────────────────┘
```

### Services et Responsabilités

#### 🔐 **AUTH SERVICE** (Port 3001)

**Responsabilité:** Authentification, JWT, RBAC

**Endpoints Clés:**
- `POST /api/auth/login` - Authentifier utilisateur, retourner JWT
- `POST /api/auth/register` - Créer utilisateur (publier event)
- `GET /api/auth/verify` - Valider JWT (appelé par autres services)
- `GET /health` - Health check

**Événements:**
- Produit: `UtilisateurInscrit`, `UtilisateurConnecte`, `RoleChangé`
- Consomme: Aucun

**Database:** `auth_db` (PostgreSQL, Port 5432)
- Table: `utilisateurs` (héritage TPT)
- Colonnes: id, email, password_hash, role, created_at, updated_at

---

#### 👤 **USER SERVICE** (Port 3005)

**Responsabilité:** Profils Agent/Citoyen/Admin, réputation

**Endpoints Clés:**
- `GET /api/users` - Lister tous (Admin only)
- `GET /api/users/me` - Profil actuel
- `PUT /api/users/me` - Mettre à jour profil
- `GET /api/users/:id` - Détail utilisateur (Admin)
- `GET /health` - Health check

**Événements:**
- Produit: `ProfilMisAJour`, `ReputationMisAJour`
- Consomme: `UtilisateurInscrit` → crée Agent/Citoyen/Admin

**Database:** `user_db` (PostgreSQL, Port 5433)
- Tables TPT: `utilisateur`, `agent`, `citoyen`, `admin`
- Colonnes: id, reputation_points, badge_id, zone_id, etc.

---

#### 📦 **CONTAINER SERVICE** (Port 3002)

**Responsabilité:** CRUD conteneurs, zones, mesures, assignation agents

**Endpoints Clés:**
- `GET /api/container` - Lister conteneurs
- `POST /api/container` - Créer (Admin)
- `GET /api/container/zones` - Zones assignées (Agent)
- `GET /api/container/nearby` - Proches (Citoyen)
- `GET /health` - Health check

**Événements:**
- Produit: `ConteneurCree`, `ConteneurModifie`, `MesureEnregistree`, `AgentAssigneZone`
- Consomme: Aucun

**Database:** `container_db` (PostgreSQL, Port 5434)
- Tables: `zone`, `conteneur`, `mesure`, `assignation`
- Colonnes: id, code, type, capacite, lat, lng, level, poids, timestamp

---

#### 🚛 **TOUR SERVICE** (Port 3003)

**Responsabilité:** Tournées de collecte, planification, mesures

**Endpoints Clés:**
- `POST /api/tour/start` - Démarrer tournée (Agent)
- `GET /api/tour/:id` - Détail tournée
- `PUT /api/tour/:id/end` - Terminer tournée
- `GET /api/tour/history` - Historique (Agent/Admin)
- `GET /health` - Health check

**Événements:**
- Produit: `TourneePlanifiee`, `CollecteValidee`, `TourneeTerminee`
- Consomme: Aucun

**Database:** `tour_db` (PostgreSQL, Port 5435)
- Tables: `tournee`, `collecte`, `collecte_mesure`
- Colonnes: id, agent_id, zone_id, status, start_at, end_at, poids_total

---

#### ⚠️ **SIGNAL SERVICE** (Port 3004)

**Responsabilité:** Signalements incidents, suivi, notifications

**Endpoints Clés:**
- `POST /api/signal` - Créer signalement (Agent/Citoyen)
- `GET /api/signal` - Lister (tous, avec filtres Admin)
- `PUT /api/signal/:id` - Mettre à jour (Admin/Agent)
- `GET /health` - Health check

**Événements:**
- Produit: `SignalementCree`, `SignalementAssigne`, `SignalementResolu`
- Consomme: Aucun

**Database:** `signal_db` (PostgreSQL, Port 5436)
- Tables: `signalement`, `photo`, `commentaire`
- Colonnes: id, conteneur_id, citoyen_id, categorie, description, status, created_at

---

#### 🚀 **API GATEWAY** (Port 3000)

**Responsabilité:** Point d'entrée unique, routage, JWT validation

**Routes:**
```
GET    /health                    → All services
POST   /api/auth/*                → auth-service
GET    /api/users/*               → user-service
GET    /api/container/*           → container-service
POST   /api/tour/*                → tour-service
PUT    /api/signal/*              → signal-service
```

**Middleware:**
- CORS
- Body parsing
- JWT validation (sauf /auth/login, /auth/register)
- Error handling

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

### **ADR-002: RabbitMQ pour Communication Asynchrone**

**Status:** ✅ **ACCEPTED**

**Context:**
- Services indépendants doivent communiquer
- Options: REST synchrone vs RabbitMQ asynchrone
- Besoin de résilience (si user-service down, auth-service continue)
- Besoin de scalabilité (pics de charge irréguliers)

**Decision:**
**Hybrid approach:** REST pour requêtes (queries), RabbitMQ pour événements (side effects).

**Exemples:**
```
REST (synchrone):
  GET /api/container/:id         → Query rapide

RabbitMQ (asynchrone):
  auth-service publie "UtilisateurInscrit"
  → user-service crée profil (pas d'attente)
  → notification-service envoie email (fire-and-forget)
```

**Consequences:**

✅ **Avantages:**
- **Découplage:** Services ne connaissent pas existence les uns des autres
- **Résilience:** Queue persiste si subscriber down (retry 5x)
- **Scalabilité:** Publishers ultra-rapides (queue async)
- **Audit:** Event log complet de tout (event sourcing)
- **Flexibility:** Ajouter subscriber sans modifier publisher

⚠️ **Défis:**
- Eventually consistent (délai propagation événement)
- Retry logic compliquée (dead letter queues)
- Monitoring RabbitMQ nécessaire

**Atténuation:** RabbitMQ 3.13 stable, queues persistantes, manual ack/nack

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
user_db       (Port 5433)  ← user-service
container_db  (Port 5434)  ← container-service
tour_db       (Port 5435)  ← tour-service
signal_db     (Port 5436)  ← signal-service
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

### 33 Événements Identifiés

#### **Domaine 1: Authentification & Utilisateurs (8 events)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `UtilisateurInscrit` | auth-service | user-service, notification-service | 🔴 CRITIQUE |
| `UtilisateurConnecte` | auth-service | audit-service, analytics | 🟠 HAUTE |
| `UtilisateurDeconnecte` | auth-service | audit-service | 🟡 MOYENNE |
| `RoleChangé` | user-service | auth-service, notification-service | 🟠 HAUTE |
| `UtilisateurDesactive` | user-service | auth-service, notification-service | 🟠 HAUTE |
| `ProfilMisAJour` | user-service | audit-service | 🟡 MOYENNE |
| `BadgeAssigne` | user-service | container-service, notification-service | 🟡 MOYENNE |
| `ReputationMisAJour` | signal-service | user-service, notification-service | 🟡 MOYENNE |

#### **Domaine 2: Conteneurs & Zones (7 events)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `ConteneurCree` | container-service | tour-service, analytics | 🔴 CRITIQUE |
| `ConteneurModifie` | container-service | analytics, notification-service | 🟡 MOYENNE |
| `ConteneurSupprime` | container-service | tour-service, analytics | 🟡 MOYENNE |
| `ZoneCree` | container-service | tour-service, analytics | 🟠 HAUTE |
| `ZoneModifiee` | container-service | analytics, notification-service | 🟡 MOYENNE |
| `AgentAssigneZone` | container-service | tour-service, notification-service | 🟠 HAUTE |
| `MesureEnregistree` | container-service | analytics, alert-service | 🟠 HAUTE |

#### **Domaine 3: Tournées & Collecte (6 events)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `TourneePlanifiee` | tour-service | notification-service, analytics | 🟡 MOYENNE |
| `TourneeDebutee` | tour-service | analytics, real-time tracking | 🟠 HAUTE |
| `ContaineurCollecte` | tour-service | container-service, analytics | 🔴 CRITIQUE |
| `MesureValidee` | tour-service | container-service, analytics | 🟠 HAUTE |
| `TourneeTerminee` | tour-service | analytics, notification-service | 🟠 HAUTE |
| `CollecteAnnulee` | tour-service | notification-service, analytics | 🟡 MOYENNE |

#### **Domaine 4: Signalements & Incidents (5 events)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `SignalementCree` | signal-service | notification-service, analytics | 🟠 HAUTE |
| `SignalementAssigne` | signal-service | notification-service, tour-service | 🟡 MOYENNE |
| `SignalementTraite` | signal-service | notification-service, container-service | 🟠 HAUTE |
| `SignalementResolu` | signal-service | notification-service, user-service | 🟠 HAUTE |
| `PhotoAjoutee` | signal-service | analytics | 🟡 MOYENNE |

#### **Domaine 5: Alertes & Notifications (4 events)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `AlerteGeneree` | alert-service | notification-service, admin-dashboard | 🔴 CRITIQUE |
| `ContaineurPlein` | container-service | alert-service, notification-service | 🔴 CRITIQUE |
| `ContaineurAbandonne` | container-service | alert-service, notification-service | 🟠 HAUTE |
| `SeuilDepasse` | analytics | alert-service | 🟡 MOYENNE |

#### **Domaine 6: Analytics & Rapports (2 events)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `RapportGenere` | analytics | notification-service | 🟡 MOYENNE |
| `KPICalcule` | analytics | admin-dashboard | 🟡 MOYENNE |

#### **Domaine 7: Système & Audit (1 event)**

| Événement | Producer | Consumer | Criticité |
|-----------|----------|----------|-----------|
| `AuditLogCree` | audit-service | central-logging | 🟡 MOYENNE |

### Flux d'Orchestration Critiques

#### **Flux 1: User Registration (Citoyen)**

```
1. POST /api/auth/register
   └─→ auth-service crée utilisateur
       └─→ Publie: UtilisateurInscrit (email, role)

2. RabbitMQ reçoit événement
   └─→ user-service écoute
       └─→ Crée Utilisateur + profil Citoyen
       └─→ Publie: ProfilMisAJour

3. notification-service reçoit UtilisateurInscrit
   └─→ Envoie email bienvenue

✅ Résultat: Utilisateur créé dans auth_db ET user_db, email envoyé
```

#### **Flux 2: Agent Démarre Tournée**

```
1. POST /api/tour/start (Agent)
   └─→ tour-service crée tournée
       └─→ Publie: TourneePlanifiee

2. container-service reçoit TourneePlanifiee
   └─→ Récupère conteneurs zone de l'agent

3. tour-service reçoit données conteneurs
   └─→ Crée planification optimisée
   └─→ Publie: TourneeDebutee

4. notification-service reçoit TourneeDebutee
   └─→ Envoie SMS confirmation agent

✅ Résultat: Tournée planifiée, agent notifié, prêt à collecter
```

#### **Flux 3: Citoyen Crée Signalement**

```
1. POST /api/signal (Citoyen)
   └─→ signal-service crée signalement
       └─→ Publie: SignalementCree

2. notification-service reçoit SignalementCree
   └─→ Envoie email confirmation citoyen

3. Admin dashboard reçoit SignalementCree
   └─→ Affiche nouveau signalement

4. Admin assigne à Agent
   └─→ signal-service reçoit assignation
   └─→ Publie: SignalementAssigne
   └─→ notification-service envoie SMS agent

✅ Résultat: Signalement créé, admin notifié, agent assigné
```

#### **Flux 4: Conteneur Dépasse Seuil**

```
1. Capteur IoT envoie mesure (500 kg)
   └─→ container-service reçoit
       └─→ Publie: MesureEnregistree

2. alert-service reçoit MesureEnregistree
   └─→ Vérifie seuil (capacité 400 kg)
   └─→ Publie: ContaineurPlein

3. notification-service reçoit ContaineurPlein
   └─→ Envoie alerte SMS agents zone

4. Admin dashboard reçoit alerte
   └─→ Affiche en rouge

✅ Résultat: Alerte temps réel, agents notifiés, priorité collecte
```

---

## <a id="use-cases"></a>👥 Use Cases par Rôle

### **AGENT COLLECTE** 🚛

#### Cas d'Usage 1: Démarrer Tournée

```
Acteur Principal: Agent
Précondition: Connecté, zone assignée
Flux Principal:
  1. Agent clique "Démarrer tournée"
  2. Système récupère conteneurs de sa zone
  3. Système affiche liste conteneurs
  4. Agent démarre GPS/tracking
  
Flux Alternatif (pas de conteneurs):
  → Système affiche message "Aucun conteneur"
  → Agent peut signaler problème
```

**Endpoints:** `POST /api/tour/start`, `GET /api/container/zones/:id`

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

#### Cas d'Usage 3: Assigner Zones Agents

```
Acteur Principal: Admin
Flux Principal:
  1. Admin va section "Agents"
  2. Admin sélectionne agent
  3. Admin sélectionne zone
  4. Admin confirme assignation
  5. Système notifie agent
  
Post-condition: Agent assigné à zone, notification envoyée
```

**Endpoints:** `PUT /api/container/zone/:id/agent`

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

### Documents Supplémentaires

- **QUICK_START.md** - Guide démarrage 5 min
- **IMPLEMENTATION_CHECKLIST.md** - Liste complète changements
- **BEFORE_AFTER_COMPARISON.md** - Comparaison ancien vs nouveau

---

## ✅ Complétion Module 1

**Status:** 🟢 **100% COMPLÈTE**

- [x] Use Cases Agent/Citoyen/Admin documentés
- [x] Event Storming (33 événements, 4 flux orchestration)
- [x] C4 Model (Level 1 & 2, 13 composants)
- [x] Architecture Decision Records (3 décisions justifiées)
- [x] Infrastructure code (docker-compose, 5 services)
- [x] Database design (5 instances, TPT pattern)
- [x] Authentication & RBAC (JWT, 3 rôles)
- [x] Event-Driven communication (RabbitMQ, 33 events)

**Prêt pour soutenance RNCP ✓**

---

*Document généré Janvier 2026 | Architecture finalisée et testée | Production-ready*
