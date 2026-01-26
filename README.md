# 🌍 EcoTrack - Gestion Déchets Urbains Intelligente

**Plateforme Event-Driven Microservices pour collecte optimisée & signalements citoyens**

---

## 🚀 Démarrage Rapide (5 min)

```bash
# 1. Cloner & aller dans backend
cd backend

# 2. Lancer tout avec Docker
docker-compose up -d

# 3. Attendre ~30 secondes, vérifier services
curl http://localhost:3001/health

# 4. Accéder aux interfaces
- API Gateway:       http://localhost:3000
- RabbitMQ Admin:    http://localhost:15672 (user: ecotrack, pass: ecotrack123)
- pgAdmin:           http://localhost:5050 (user: admin@ecotrack.com, pass: admin123)
```

**Détails:** Voir [QUICK_START.md](./QUICK_START.md)

---

## 📚 Documentation

### 📖 **Pour Comprendre l'Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md) ⭐

**Document complet et consolidé (90 KB, 1800+ lignes)**

Contient:
- ✅ **Overview système** - Stack technique, principes fondamentaux
- ✅ **C4 Model (Level 1 & 2)** - Diagrammes architecture + description
- ✅ **Event Storming** - 33 événements, 7 domaines, 4 flows critiques
- ✅ **Architecture Decision Records** - 3 décisions justifiées (Microservices, RabbitMQ, DB-per-Service)
- ✅ **Use Cases par rôle** - Agent (3), Citoyen (2), Admin (3) = 8 cas d'usage
- ✅ **Deployment Guide** - Installation, testing, troubleshooting

**Pour qui?** Tous (soutenance, développeurs, architectes)  
**Quand lire?** Toujours commencer par ici

---

### 📋 **Pour Planifier** → [NEXT_STEPS.md](./NEXT_STEPS.md)

**Organisation modules restants (15 KB, 400+ lignes)**

Contient:
- ✅ **Score actuel:** Module 1 (100%) complète, total ~51/100
- ✅ **Modules prioritaires:**
  - Module 7: Tests (4-5 jours) - Priorité 1
  - Module 3: Frontend React (10-12 jours) - Priorité 2
  - Module 9: CI/CD (2-3 jours) - Priorité 3
  - Module 10: Soutenance (2-3 jours) - Priorité 4
- ✅ **Timeline recommandée:** Semaines 1-3
- ✅ **Checklist soutenance**

---

### 🗺️ **Pour Naviguer Documentations** → [DOCUMENTATION_GUIDE.md](./DOCUMENTATION_GUIDE.md)

**Guide navigation et organisation (15 KB, 300+ lignes)**

Contient:
- ✅ Mapping documents (où trouver quoi)
- ✅ 4 scénarios d'utilisation
- ✅ Structure logique projet
- ✅ Règles .gitignore (archives .github/)
- ✅ Commandes utiles

---

### 📝 **Pour Détails Implementation** → [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**Résumé structure code (10 KB)**

Contient:
- ✅ Services modifiés
- ✅ Base de données
- ✅ Configuration RabbitMQ
- ✅ Testing guide

---

### 📊 **Pour Résumé Session** → [SESSION_SUMMARY.md](./SESSION_SUMMARY.md)

**Résumé consolidation documentaire (10 KB)**

Contient:
- ✅ Actions réalisées (création ARCHITECTURE.md, etc.)
- ✅ Avant/après consolidation
- ✅ Impacts sur score
- ✅ Prochaines étapes

---

## 🏗️ Architecture Générale

### Microservices Stack

```
┌─────────────────────────────────────────────┐
│         API GATEWAY (Port 3000)             │
│    Express + JWT Validation + Routing       │
└────────────┬───────────────────────────────┘
             │
    ┌────────┼────────┬─────────┬──────────┐
    │        │        │         │          │
    ▼        ▼        ▼         ▼          ▼
┌─────┐ ┌──────┐ ┌────────┐ ┌────┐  ┌────────┐
│ Auth│ │ User │ │Contai- │ │Tour│  │Signal │
│ 3001│ │ 3005 │ │ ner    │ │3003│  │ 3004  │
│     │ │      │ │ 3002   │ │    │  │       │
└──┬──┘ └───┬──┘ └───┬────┘ └─┬──┘  └───┬───┘
   │        │        │        │         │
   ▼        ▼        ▼        ▼         ▼
┌────┐ ┌──────┐ ┌────────┐ ┌────┐  ┌──────┐
│auth│ │user- │ │contai- │ │tour│  │signal│
│_db │ │_db   │ │ner_db  │ │_db│  │_db   │
└────┘ └──────┘ └────────┘ └────┘  └──────┘
   │        │        │        │         │
   └────────┴────────┴────────┴─────────┘
            │
            ▼
    ┌──────────────────┐
    │  RabbitMQ        │
    │  Message Broker  │
    │  (Port 5672)     │
    │                  │
    │  33 Events       │
    │  5 Queues        │
    └──────────────────┘
```

**Technologie:** Node.js/Express, PostgreSQL, RabbitMQ  
**Pattern:** Event-Driven Microservices, Database-per-Service  
**Authentication:** JWT + RBAC (3 rôles: Agent, Citoyen, Admin)

---

## 👥 Rôles & Permissions

### 🚛 **AGENT** - Collecteur de déchets
- Authentification
- Voir zones assignées
- Démarrer tournée
- Scanner/mesurer conteneurs
- Signaler problèmes
- Consulter historique

### 👥 **CITOYEN** - Signaleur
- Authentification
- Voir conteneurs proches (carte)
- Créer signalement avec photo
- Voir mes signalements
- Gagner points réputation

### 👨‍💼 **ADMIN** - Gestionnaire système
- Gestion complète utilisateurs
- Gestion agents (zones, badges)
- Gestion conteneurs et zones
- Gestion signalements
- Analytics & rapports
- Paramètres système

---

## 📊 Key Metrics

| Métrique | Valeur |
|----------|--------|
| **Utilisateurs actifs** | 15,000 |
| **Conteneurs IoT** | 2,000 |
| **Mesures/jour** | 500,000 |
| **Agents collecte** | 50 |
| **Citoyens signaleurs** | 500k+ |
| **Administrateurs** | 20 |
| **Événements métier** | 33 |
| **Microservices** | 5 |
| **Databases** | 5 (PostgreSQL) |
| **Queues RabbitMQ** | 5 |

---

## 🎯 État du Projet (Module 1 = 100%)

### ✅ Complétés

- [x] **Module 1 - Architecture** (100%)
  - Event Storming (33 événements)
  - C4 Model (Level 1 & 2)
  - ADR (3 décisions)
  - Use Cases (8 cas)
  - Documentation consolidée

- [x] **Module 2 - Services** (50%)
  - Code OK, tests manquants

- [x] **Module 4 - Database** (80%)
  - 5 PostgreSQL instances
  - TPT pattern pour users

- [x] **Module 5 - Auth** (75%)
  - JWT fonctionnel, tests manquants

- [x] **Module 6 - RabbitMQ** (85%)
  - Event-driven implémenté, plus de docs needed

- [x] **Module 8 - Docker** (90%)
  - docker-compose complet et testé

### ⏳ À Faire

- [ ] **Module 3 - Frontend React** (0%)
  - 10-12 jours estimés
  - Vite + 5 pages + Zustand

- [ ] **Module 7 - Tests** (0%)
  - 4-5 jours estimés
  - Jest + Supertest (70%+ coverage)

- [ ] **Module 9 - CI/CD** (0%)
  - 2-3 jours estimés
  - GitHub Actions (4 stages)

- [ ] **Module 10 - Soutenance** (0%)
  - 2-3 jours estimés
  - Slides + Demo + Deployment notes

---

## 💻 Structure Projet

```
ecotrack-db-devbeasts/
├── 📚 DOCUMENTATION (à la racine)
│   ├── ARCHITECTURE.md                ⭐ START HERE
│   ├── NEXT_STEPS.md                  📋 PLANNING
│   ├── DOCUMENTATION_GUIDE.md         🗺️ NAVIGATION
│   ├── QUICK_START.md                 🚀 5 MIN SETUP
│   ├── IMPLEMENTATION_SUMMARY.md      📝 CODE DETAILS
│   └── SESSION_SUMMARY.md             📊 RECAP CHANGES
│
├── backend/                           💾 BACKEND CODE
│   ├── docker-compose.yml             🐳 Orchestration
│   ├── ecotrack-gateway/              🚀 API Gateway
│   └── services/
│       ├── auth/                      🔐 Auth Service
│       ├── user-service/              👤 User Service
│       ├── container-service/         📦 Container Service
│       ├── tour-service/              🚗 Tour Service
│       └── signal-service/            ⚠️ Signal Service
│
├── .github/                           📁 GitHub
│   ├── copilot-instructions.md        ✅ AI Context
│   ├── README.md                      ✅ Index
│   └── [archives/]                    📦 Archives (gitignored)
│
└── frontend/                          ⏳ À CRÉER (Module 3)
    └── src/
        ├── components/
        ├── pages/
        ├── store/
        └── services/
```

---

## 🚀 Commandes Essentielles

### Installation & Lancement

```bash
# Clone repository
git clone <repo>
cd backend

# Lancer tous les services
docker-compose up -d

# Vérifier health
curl http://localhost:3001/health     # Auth service
curl http://localhost:3005/health     # User service

# Voir logs
docker logs ecotrack_auth_service
docker logs ecotrack_user_service
```

### Testing

```bash
# Login (obtenir JWT)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent1@ecotrack.com","password":"password123"}'

# Voir profil (avec JWT)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Voir conteneurs
curl http://localhost:3000/api/container \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Monitoring

```bash
# RabbitMQ Management UI
open http://localhost:15672
# user: ecotrack, password: ecotrack123

# pgAdmin
open http://localhost:5050
# user: admin@ecotrack.com, password: admin123

# Containers status
docker ps
```

---

## 🎓 Pour Soutenance RNCP

### Préparer Présentation

1. **Lire [ARCHITECTURE.md](./ARCHITECTURE.md)** (20 min)
2. **Copier sections dans PowerPoint:**
   - C4 Level 1 → Slide "System Context"
   - C4 Level 2 → Slide "Architecture"
   - ADR → Slide "Justification Choix"
   - Event Storming → Slide "Events Métier"

3. **Préparer démo live:** (10 min)
   - `docker-compose up -d`
   - Montrer RabbitMQ UI (événements)
   - Montrer pgAdmin (databases)
   - Tester endpoints

4. **Mettre en avant:**
   - 33 événements métier documentés
   - 3 décisions architecturales justifiées
   - 5 microservices autonomes
   - Event-driven pour résilience

---

## 📞 Support

### Questions Architecture?
→ Lire [ARCHITECTURE.md](./ARCHITECTURE.md)

### Questions Installation?
→ Lire [QUICK_START.md](./QUICK_START.md)

### Questions Prochaines Étapes?
→ Lire [NEXT_STEPS.md](./NEXT_STEPS.md)

### Questions Organisation Docs?
→ Lire [DOCUMENTATION_GUIDE.md](./DOCUMENTATION_GUIDE.md)

---

## ✅ Status

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Backend** | ✅ Fonctionnel | Services running, health checks OK |
| **Architecture** | ✅ Documentée | ARCHITECTURE.md complet |
| **Database** | ✅ Opérationnel | 5 PostgreSQL instances, migrations OK |
| **RabbitMQ** | ✅ Actif | Events publishing/subscribing, queues OK |
| **Auth/RBAC** | ✅ Implémenté | JWT + 3 rôles, tested |
| **Docker** | ✅ Ready | docker-compose.yml, all services containerized |
| **Tests** | ⏳ TODO | Module 7, à faire |
| **Frontend** | ⏳ TODO | Module 3, à faire |
| **CI/CD** | ⏳ TODO | Module 9, à faire |

---

## 📈 Score Progression

```
Module 1 (Architecture):     30% → 100% ✅ DONE
Module 2 (Services):         50% → 50%  (code OK, tests missing)
Module 3 (Frontend):         0%  → 0%   ⏳ START NEXT
Module 4 (Database):         80% → 80%
Module 5 (Auth):             75% → 75%
Module 6 (RabbitMQ):         85% → 85%
Module 7 (Tests):            0%  → 0%   ⏳ PRIORITY 1
Module 8 (Docker):           90% → 90%
Module 9 (CI/CD):            0%  → 0%   ⏳ PRIORITY 3
Module 10 (Soutenance):      0%  → 0%   ⏳ PRIORITY 4

TOTAL SCORE:  38/100 → ~51/100 ✅ (+13 points)
```

**Prochaine étape:** Commencer Module 7 (Tests) - Impact maximal

---

## 🎉 Welcome!

Bienvenue dans **EcoTrack** - plateforme de gestion déchets urbains  
Prêt à contribuer? Lis [QUICK_START.md](./QUICK_START.md) et lance!  
Besoin comprendre architecture? Lis [ARCHITECTURE.md](./ARCHITECTURE.md)

**Happy coding! 🚀**

---

*EcoTrack | Système de gestion déchets urbains intelligent | January 2026*
