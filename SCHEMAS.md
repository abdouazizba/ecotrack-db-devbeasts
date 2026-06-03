# EcoTrack — Schémas de Données & Architecture

---

## 1. SCHEMA ARCHITECTURE GLOBALE

```
                    ┌──────────────────────────────────────┐
                    │         FRONTEND  (Port 80)           │
                    └─────────────────┬────────────────────┘
                                      │ HTTP/REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY — ecotrack-gateway  (:3000)                           │
│          Auth Middleware · Rate Limiting · Route Proxy · Swagger (/api-docs)            │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────────────────┘
   │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ auth  │ │ user  │ │container │ │ tour  │ │signal │ │  iot  │
│service│ │service│ │ service  │ │service│ │service│ │service│
│ :3001 │ │ :3005 │ │  :3002   │ │ :3003 │ │ :3004 │ │ :3006 │
└───┬───┘ └───┬───┘ └────┬─────┘ └───┬───┘ └───┬───┘ └───┬───┘
    │          │          │           │          │          │
    ▼          ▼          ▼           ▼          ▼          │ HTTP ──►
┌───────┐ ┌───────┐ ┌──────────┐ ┌───────┐ ┌───────┐      │  container-service
│auth-db│ │user-db│ │contain-db│ │tour-db│ │signal │      │  (register capteur,
│PG:5432│ │PG:5436│ │ PG:5433  │ │PG:5434│ │  db   │      │   get conteneur info)
│ecotrk │ │ecotrk │ │  ecotrk  │ │ecotrk │ │PG:5435│      │
│ _auth │ │ _user │ │_container│ │ _tour │ │ecotrk │      │
└───────┘ └───────┘ └──────────┘ └───────┘ │_signal│      │
                                            └───────┘      │
                                                            ▼
             ┌──────────────────────────────────────────────────────────────────┐
             │                 RabbitMQ — Message Broker                         │
             │           AMQP :5672  │  Management UI :15672                    │
             │        Exchange : ecotrack_events  (topic, durable)              │
             │                                                                   │
             │  PUBLISHERS                          CONSUMERS                   │
             │  ──────────                          ─────────                   │
             │  auth-service ──── user.created ──►  user-service               │
             │                   (profil sync)       → crée utilisateur         │
             │                                        → crée agent/citoyen/admin│
             │                                                                   │
             │  iot-service ──── measurement ──────► container-service          │
             │                   .recorded            → crée mesure             │
             │                   (données IoT)        → met à jour capteur      │
             │                                                                   │
             │  iot-service ──── measurement ──────► [monitoring / logs]       │
             │                   .failed                                        │
             └──────────────────────────────────────────────────────────────────┘

INFRASTRUCTURE ANNEXE
─────────────────────
  pgAdmin  :5050   → interface admin PostgreSQL (multi-DB)
  RabbitMQ :15672  → dashboard de monitoring des queues
```

---

## 2. MCD — Modèle Conceptuel de Données (Merise)

> Notation des cardinalités : (min,max) — ex. (0,N) = zéro ou plusieurs, (1,1) = exactement un

```
  ╔══════════════════╗
  ║   UTILISATEUR    ║◄─────────────── Héritage (ISA) ─────────────────────────────┐
  ╠══════════════════╣                                                               │
  ║ #id              ║               ┌─────────────┐  ┌─────────────┐  ┌──────────┴──┐
  ║ email            ║               │    AGENT    │  │   CITOYEN   │  │    ADMIN    │
  ║ nom              ║               ├─────────────┤  ├─────────────┤  ├─────────────┤
  ║ prenom           ║               │ #id (FK)    │  │ #id (FK)    │  │ #id (FK)    │
  ║ date_naissance   ║               │ numero_badge│  │ email_verif │  │ niveau_acces│
  ║ role             ║               │ id_zone*    │  │ nb_signal.  │  │ permissions │
  ║ is_active        ║               │ date_assign │  │ score_reput.│  └─────────────┘
  ║ last_login       ║               │             │  │ telephone   │
  ╚══════════════════╝               └──────┬──────┘  └──────┬──────┘
                                            │                 │
                           ┌────────────────┘                 └──────────────────────┐
                           │                                                          │
         (1,N)    ╔════════╧══════╗ (1,N)                                  (0,N)    │
  ╔═════════╗  ──►║  PARTICIPATION║◄── (1,N)  ╔══════════════╗          ╔══════════╧═╗
  ║COLLECTEUR║     ╚═══════════════╝           ║   TOURNEE    ║          ║ SIGNALEMENT║
  ╠══════════╣  (assoc. TOURNEE_AGENT)         ╠══════════════╣          ╠════════════╣
  ║ #id      ║          contient:              ║ #id          ║          ║ #id        ║
  ║ code_col.║    - role (CONDUCTEUR/COLLECT.) ║ code         ║          ║ type       ║
  ║ id_agent*║    - heure_debut_reel           ║ date         ║          ║ description║
  ║ statut   ║    - heure_fin_reelle           ║ statut       ║          ║ statut     ║
  ║ model    ║                                 ║ heure_debut  ║          ║ priorite   ║
  ║ batterie ║     (1,1)  GERE  (0,N)         ║ heure_fin    ║          ║ id_cont.*  ║
  ║ date_maint║◄──────────────────────────────►║ distance_km  ║          ║ id_util.*  ║
  ╚══════════╝      AGENT ──── COLLECTEUR      ║ cont_collect.║          ║ latitude   ║
                                               ╚══════════════╝          ║ longitude  ║
                                                                          ║ photo_url  ║
                                                                          ╚════════════╝
                                                                               │ (1,1)
                    ╔══════════════╗          ╔══════════════╗         CONCERNE │
                    ║     ZONE     ║          ║   CONTENEUR  ║◄────────────────┘
                    ╠══════════════╣          ╠══════════════╣    (cross-service)
                    ║ #id          ║ (1,1)    ║ #id          ║
                    ║ nom          ║◄─CONTIENT─║ code_cont.   ║
                    ║ code_zone    ║  (0,N)   ║ type         ║
                    ║ geometrie    ║          ║ capacite     ║
                    ║ latitude     ║          ║ latitude     ║
                    ║ longitude    ║          ║ longitude    ║
                    ║ pop_estimee  ║          ║ statut       ║
                    ║ description  ║          ║ date_install.║
                    ║ is_active    ║          ╚══════╤═══════╝
                    ╚══════════════╝                 │
                                          ┌──────────┴─────────────┐
                               (1,N)      │                         │ (1,N)
                              POSSEDE     │                     EST_MESURÉ
                                          │                         │
                                          ▼ (1,1)                   ▼ (1,1)
                              ╔═══════════════════╗     ╔═══════════════════╗
                              ║      CAPTEUR      ║     ║      MESURE       ║
                              ╠═══════════════════╣     ╠═══════════════════╣
                              ║ #id               ║     ║ #id               ║
                              ║ code_capteur      ║     ║ date_mesure       ║
                              ║ type              ║     ║ taux_remplissage  ║
                              ║ id_conteneur (FK) ║     ║ temperature       ║
                              ║ statut            ║     ║ batterie          ║
                              ║ batterie          ║     ║ signal_force      ║
                              ║ derniere_mes_at   ║     ║ id_conteneur (FK) ║
                              ╚═══════════════════╝     ║ id_capteur (FK)   ║
                                          │              ╚═══════════════════╝
                               (0,N) EMET │ (0,1)
                                (optionnel, nullable)


LÉGENDE
───────
  *         = référence cross-service (pas de FK physique, liaison logique)
  #id       = clé primaire (UUID)
  (FK)      = clé étrangère dans la même base
  ──────►   = héritage ISA (table-per-type)
  (a,b)─X─  = cardinalités Merise : a=minimum, b=maximum
```

---

## 3. MLD — Modèle Logique de Données

### BASE: ecotrack_auth  (PostgreSQL :5432)

```
users
─────────────────────────────────────────────────────────────────────────
  id          UUID            PK  DEFAULT gen_random_uuid()
  email       VARCHAR(255)    UNIQUE  NOT NULL
  password    VARCHAR(255)    NOT NULL
  role        ENUM            NOT NULL  DEFAULT 'citoyen'
              ('super_admin','admin','agent','citoyen')
  nom         VARCHAR(255)    NULL
  prenom      VARCHAR(255)    NULL
  last_login  TIMESTAMP       NULL
  created_at  TIMESTAMP       NOT NULL
  updated_at  TIMESTAMP       NOT NULL
```

---

### BASE: ecotrack_container  (PostgreSQL :5433)

```
zones
─────────────────────────────────────────────────────────────────────────
  id                UUID            PK
  nom               VARCHAR(255)    NOT NULL
  code_zone         VARCHAR(255)    UNIQUE  NOT NULL
  geometrie         JSONB           NULL
  latitude          DECIMAL(10,8)   NULL
  longitude         DECIMAL(11,8)   NULL
  population_estimee INTEGER        NULL
  description       TEXT            NULL
  is_active         BOOLEAN         DEFAULT true
  created_at        TIMESTAMP
  updated_at        TIMESTAMP

conteneurs
─────────────────────────────────────────────────────────────────────────
  id               UUID            PK
  code_conteneur   VARCHAR(255)    UNIQUE  NOT NULL
  type_conteneur   ENUM            NOT NULL
                   ('standard','selective','organic','hazardous')
  capacite         FLOAT           NOT NULL          -- en litres
  latitude         FLOAT           NOT NULL
  longitude        FLOAT           NOT NULL
  statut           ENUM            DEFAULT 'actif'
                   ('actif','maintenance','retire')
  date_installation DATE           NOT NULL
  id_zone          UUID            FK → zones.id  NOT NULL
  notes            TEXT            NULL
  created_at       TIMESTAMP
  updated_at       TIMESTAMP

capteurs
─────────────────────────────────────────────────────────────────────────
  id                  UUID            PK
  code_capteur        VARCHAR(50)     UNIQUE  NOT NULL
  type                ENUM            NOT NULL
                      ('REMPLISSAGE','TEMPERATURE','SIGNAL')
  id_conteneur        UUID            FK → conteneurs.id  NOT NULL
                                      ON DELETE CASCADE
  statut              ENUM            DEFAULT 'ACTIF'  NOT NULL
                      ('ACTIF','INACTIF','EN_MAINTENANCE')
  batterie            INTEGER         NULL              -- 0-100 %
  derniere_mesure_at  TIMESTAMP       NULL
  created_at          TIMESTAMP
  updated_at          TIMESTAMP

mesures
─────────────────────────────────────────────────────────────────────────
  id                UUID            PK
  date_mesure       TIMESTAMP       NOT NULL  DEFAULT NOW()
  taux_remplissage  FLOAT           NOT NULL  -- 0-100 %
  temperature       FLOAT           NULL      -- °C
  batterie          INTEGER         NULL      -- %
  signal_force      INTEGER         NULL
  id_conteneur      UUID            FK → conteneurs.id  NOT NULL
  id_capteur        UUID            FK → capteurs.id    NULL
                                    ON DELETE SET NULL
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```

---

### BASE: ecotrack_tour  (PostgreSQL :5434)

```
tournees
─────────────────────────────────────────────────────────────────────────
  id                  UUID            PK
  code                VARCHAR(50)     UNIQUE  NOT NULL
  date                DATE            NOT NULL
  statut              ENUM            DEFAULT 'PLANIFIÉE'  NOT NULL
                      ('PLANIFIÉE','EN_COURS','TERMINÉE','ANNULÉE')
  heure_debut         TIME            NULL
  heure_fin           TIME            NULL
  distance_km         FLOAT           NULL
  conteneurs_collectes INTEGER        DEFAULT 0
  notes               TEXT            NULL
  created_at          TIMESTAMP
  updated_at          TIMESTAMP

collecteurs
─────────────────────────────────────────────────────────────────────────
  id                        UUID            PK
  code_collecteur           VARCHAR(50)     UNIQUE  NOT NULL
  id_agent                  UUID            NOT NULL  -- réf. logique → user-service
  statut                    ENUM            DEFAULT 'ACTIF'  NOT NULL
                            ('ACTIF','INACTIF','EN_MAINTENANCE')
  model                     VARCHAR(100)    NULL
  batterie_actuelle         FLOAT           NULL
  date_derniere_maintenance DATE            NULL
  notes                     TEXT            NULL
  created_at                TIMESTAMP
  updated_at                TIMESTAMP

tournee_agents                        -- table d'association TOURNEE ↔ AGENT
─────────────────────────────────────────────────────────────────────────
  id                UUID            PK
  id_tournee        UUID            FK → tournees.id  NOT NULL
                                    ON DELETE CASCADE  ON UPDATE CASCADE
  id_agent          UUID            NOT NULL  -- réf. logique → user-service
  role              ENUM            DEFAULT 'COLLECTEUR'  NOT NULL
                    ('CONDUCTEUR','COLLECTEUR')
  heure_debut_reel  TIME            NULL
  heure_fin_reelle  TIME            NULL
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```

---

### BASE: ecotrack_signal  (PostgreSQL :5435)

```
signalements
─────────────────────────────────────────────────────────────────────────
  id                  UUID            PK
  type                ENUM            NOT NULL
                      ('CONTENEUR_PLEIN','CONTENEUR_ENDOMMAGÉ',
                       'MAUVAISE_ODEUR','DÉBORDEMENT','AUTRE')
  description         TEXT            NULL
  statut              ENUM            DEFAULT 'OUVERT'  NOT NULL
                      ('OUVERT','EN_COURS_DE_TRAITEMENT','FERMÉ','REJETÉ')
  priorite            ENUM            DEFAULT 'NORMALE'  NOT NULL
                      ('BASSE','NORMALE','HAUTE','CRITIQUE')
  id_conteneur        UUID            NOT NULL  -- réf. logique → container-service
  id_utilisateur      UUID            NULL      -- réf. logique → user-service
  latitude            FLOAT           NULL
  longitude           FLOAT           NULL
  photo_url           VARCHAR(500)    NULL
  date_resolution     TIMESTAMP       NULL
  notes_resolution    TEXT            NULL
  created_at          TIMESTAMP
  updated_at          TIMESTAMP
```

---

### BASE: ecotrack_user  (PostgreSQL :5436)

```
utilisateurs                          -- table de base (héritage table-per-type)
─────────────────────────────────────────────────────────────────────────
  id              UUID            PK
  email           VARCHAR(255)    UNIQUE  NOT NULL
  nom             VARCHAR(255)    NULL
  prenom          VARCHAR(255)    NULL
  date_naissance  DATE            NULL
  role            ENUM            DEFAULT 'citoyen'  NOT NULL
                  ('super_admin','admin','agent','citoyen')
  is_active       BOOLEAN         DEFAULT true
  last_login      TIMESTAMP       NULL
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

agents                                -- spécialisation d'UTILISATEUR (rôle = 'agent')
─────────────────────────────────────────────────────────────────────────
  id                    UUID    PK  FK → utilisateurs.id  ON DELETE CASCADE
  numero_badge          VARCHAR UNIQUE  NULL
  id_zone               UUID    NULL   -- réf. logique → container-service (zones)
  date_assignment_zone  DATE    NULL
  created_at            TIMESTAMP
  updated_at            TIMESTAMP

citoyens                              -- spécialisation d'UTILISATEUR (rôle = 'citoyen')
─────────────────────────────────────────────────────────────────────────
  id                  UUID      PK  FK → utilisateurs.id  ON DELETE CASCADE
  email_verified      BOOLEAN   DEFAULT false
  nombre_signalements INTEGER   DEFAULT 0
  score_reputation    INTEGER   DEFAULT 100   -- 0-100+
  telephone           VARCHAR   NULL
  created_at          TIMESTAMP
  updated_at          TIMESTAMP

admins                                -- spécialisation d'UTILISATEUR (rôle = 'admin')
─────────────────────────────────────────────────────────────────────────
  id            UUID    PK  FK → utilisateurs.id  ON DELETE CASCADE
  niveau_acces  VARCHAR DEFAULT 'admin'          -- 'admin' | 'super_admin'
  permissions   JSONB   DEFAULT {
                  manage_users: true,
                  manage_resources: true,
                  manage_zones: true,
                  view_statistics: true,
                  manage_admins: false
                }
  created_at    TIMESTAMP
  updated_at    TIMESTAMP
```

---

## 4. RÉSUMÉ DES LIAISONS INTER-SERVICES

```
  SERVICE            CHAMP                  RÉFÉRENCE LOGIQUE VERS
  ─────────────────────────────────────────────────────────────────────────
  signal-service     signalements.id_conteneur   → container-service / conteneurs.id
  signal-service     signalements.id_utilisateur → user-service     / utilisateurs.id
  tour-service       collecteurs.id_agent         → user-service     / agents.id
  tour-service       tournee_agents.id_agent      → user-service     / agents.id
  user-service       agents.id_zone               → container-service / zones.id

  NOTE : ces liaisons sont logiques (pas de FK cross-base).
         Elles sont résolues par appels HTTP inter-services ou via RabbitMQ.
```

---

## 5. FLUX RABBITMQ — DÉTAIL DES ÉVÉNEMENTS

```
  EXCHANGE : ecotrack_events  (type: topic, durable: true)
  TTL MSG  : 86 400 000 ms (24 h)
  PREFETCH : 1 message à la fois
  ─────────────────────────────────────────────────────────────────────────

  ROUTING KEY             PUBLISHER          CONSUMER
  ──────────────────────────────────────────────────────────────────────────
  user.created            auth-service       user-service
  Payload: { id, email, nom, prenom, role, created_at }
  Effet  : crée utilisateur + entrée spécialisée (agent/citoyen/admin)

  measurement.recorded    iot-service        container-service
  Payload: { timestamp, capteur_id, conteneur_id, taux_remplissage,
             temperature, batterie, signal_force }
  Effet  : crée mesure, met à jour derniere_mesure_at du capteur

  measurement.failed      iot-service        [monitoring / logs]
  Payload: { timestamp, error, data }
  Effet  : log d'erreur de mesure IoT
```
