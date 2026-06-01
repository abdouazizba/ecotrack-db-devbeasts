# 🔐 GUIDE RBAC ECOTRACK - Rôles & Permissions

**Version:** 2.0 (Février 2026)  
**Status:** ✅ Production-Ready  
**Rôles:** 4 (super_admin, admin, agent, citoyen)

---

## 📋 Architecture RBAC EcoTrack

### Rôles Définis

```
┌──────────────────────────────────────────────────────────────┐
│                    RÔLES UTILISATEURS (4)                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 🔴 SUPER_ADMIN                                               │
│    Description: Administrateur système (tous services)       │
│    Accès: DELETE, PATCH, POST, GET (tous endpoints)          │
│    Cas d'usage: Migrations DB, config système, backup        │
│                                                               │
│ 🟠 ADMIN                                                     │
│    Description: Superviseur (lire tous, modifier sien)       │
│    Accès: Lire tous users/conteneurs, modifier profil propre │
│    Cas d'usage: Gestion opérationnelle, supervision zone     │
│                                                               │
│ 🟡 AGENT                                                     │
│    Description: Collecteur (tournées, rapports)              │
│    Accès: Créer/modifier tournées, enregistrer mesures       │
│    Cas d'usage: Collecte poubelles, scan conteneurs          │
│                                                               │
│ 🟢 CITOYEN                                                   │
│    Description: Interface mobile (signale, visualise)        │
│    Accès: Créer signalements, voir conteneurs proches        │
│    Cas d'usage: Rapporter problèmes, consulter infos         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Matrice de Permissions par Service

### **Auth-Service (Port 3001)**

| Endpoint | super_admin | admin | agent | citoyen | Notes |
|----------|:-----------:|:-----:|:-----:|:-------:|-------|
| `POST /auth/register` | ✅ | ✅ | ✅ | ✅ | Public (auth NOT required) |
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ | Public |
| `GET /auth/verify` | ✅ | ✅ | ✅ | ✅ | Authenticated (any role) |
| `POST /auth/refresh-token` | ✅ | ✅ | ✅ | ✅ | Authenticated |

---

### **User-Service (Port 3005)**

| Endpoint | super_admin | admin | agent | citoyen | Notes |
|----------|:-----------:|:-----:|:-----:|:-------:|-------|
| `GET /users` | ✅ | ✅ | ❌ | ❌ | Lire tous users (admin supervision) |
| `GET /users/:id` | ✅ | ✅ | Own | Own | Voir son profil OU admin voit tous |
| `GET /users/agents` | ✅ | ✅ | ❌ | ❌ | Lister agents (pour assignation tours) |
| `PATCH /users/:id` | ✅ | Own | Own | Own | Modifier son propre profil |
| `DELETE /users/:id` | ✅ | ❌ | ❌ | ❌ | Supprimer user (super_admin only) |

**Règles Spéciales:**
- `Own` = Utilisateur peut modifier son profil OU admin/super_admin
- Super_admin = accès total
- Admin = voir tous, modifier sien
- Agent = modifier sien
- Citoyen = modifier sien

---

### **Container-Service (Port 3002)**

| Endpoint | super_admin | admin | agent | citoyen | Notes |
|----------|:-----------:|:-----:|:-----:|:-------:|-------|
| `GET /containers` | ✅ | ✅ | ✅ | ✅ | Voir tous conteneurs (admins/agents) |
| `GET /containers/nearby?lat=...&lng=...` | ✅ | ✅ | ✅ | ✅ | Conteneurs proches (500m rayon) |
| `GET /containers/:id` | ✅ | ✅ | ✅ | ✅ | Détails conteneur (localisation, état) |
| `POST /containers` | ✅ | ❌ | ❌ | ❌ | Créer conteneur (super_admin only) |
| `PATCH /containers/:id` | ✅ | ❌ | ❌ | ❌ | Modifier conteneur (super_admin only) |
| `DELETE /containers/:id` | ✅ | ❌ | ❌ | ❌ | Supprimer (super_admin only) |
| `POST /containers/:id/measure` | ✅ | ✅ | ✅ | ❌ | Enregistrer mesure (IoT/agent) |
| `GET /containers/:id/history` | ✅ | ✅ | ✅ | ❌ | Historique mesures (agent/admin) |

**Règles:**
- Tous voient conteneurs + positions (citoyen utilise /nearby pour position)
- Seul super_admin crée/modifie/supprime
- Agents peuvent enregistrer mesures (collecte)

---

### **Tour-Service (Port 3003)**

| Endpoint | super_admin | admin | agent | citoyen | Notes |
|----------|:-----------:|:-----:|:-----:|:-------:|-------|
| `GET /tours` | ✅ | ✅ | ❌ | ❌ | Voir tous tours (admin only) |
| `GET /tours/my-tours` | ✅ | ❌ | ✅ | ❌ | Voir ses tours assignés (agent) |
| `POST /tours` | ✅ | ❌ | ❌ | ❌ | Créer tour (super_admin only) |
| `POST /tours/:id/start` | ✅ | ❌ | ✅ | ❌ | Démarrer tournée (assigned agent) |
| `POST /tours/:id/container` | ✅ | ❌ | ✅ | ❌ | Enregistrer collecte (agent) |
| `PUT /tours/:id/end` | ✅ | ❌ | ✅ | ❌ | Terminer tour (agent) |
| `GET /tours/:id/report` | ✅ | ✅ | ✅ | ❌ | Rapport collecte (agent/admin) |
| `DELETE /tours/:id` | ✅ | ❌ | ❌ | ❌ | Supprimer (super_admin only) |

**Assignation:**
- Super_admin assigne agents aux tours
- Agents voient seulement leurs tours
- Admin voit tous tours (supervision)

---

### **Signal-Service (Port 3004)**

| Endpoint | super_admin | admin | agent | citoyen | Notes |
|----------|:-----------:|:-----:|:-----:|:-------:|-------|
| `GET /signals` | ✅ | ✅ | ✅ | Own | Voir signalements (citoyen voit siens) |
| `POST /signals` | ✅ | ✅ | ✅ | ✅ | Créer signalement (tous) |
| `POST /signals/:id/photo` | ✅ | ✅ | ✅ | Own | Ajouter photo (creator only) |
| `PATCH /signals/:id` | ✅ | ✅ | ✅ | Own | Modifier signalement (creator/admin) |
| `PUT /signals/:id/resolve` | ✅ | ✅ | ✅ | ❌ | Marquer résolu (admin/agent/super_admin) |
| `DELETE /signals/:id` | ✅ | ❌ | ❌ | ❌ | Supprimer (super_admin only) |

**Workflow:**
1. Citoyen crée signal (photo + description)
2. Admin vérifies le signal
3. Admin assigne agent
4. Agent va récupérer le problème
5. Admin marque résolu

---

## 🔧 Implementation par Service

### **Auth-Service: ROLES Constants**

```javascript
// src/config/roles.js
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  AGENT: 'agent',
  CITOYEN: 'citoyen'
};

// Hiérarchie (pour vérifications)
const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: ['super_admin', 'admin', 'agent', 'citoyen'],
  [ROLES.ADMIN]: ['admin', 'agent', 'citoyen'],
  [ROLES.AGENT]: ['agent', 'citoyen'],
  [ROLES.CITOYEN]: ['citoyen']
};

module.exports = { ROLES, ROLE_HIERARCHY };
```

---

### **Auth-Service: JWT Payload**

```javascript
// src/services/JwtService.js
const issueToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role, // 'super_admin' | 'admin' | 'agent' | 'citoyen'
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 // 1 hour
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

module.exports = { issueToken };
```

---

### **General: Authorization Middleware**

```javascript
// src/middlewares/authorization.middleware.js
const { ROLES } = require('../config/roles');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify JWT
    const user = await JwtService.verify(token);
    req.user = user; // { id, email, role }
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      ));
    }

    next();
  };
};

const isSuperAdmin = (req, res, next) => {
  if (req.user?.role !== ROLES.SUPER_ADMIN) {
    return next(new ForbiddenError('Super admin access required'));
  }
  next();
};

const isOwnerOrAdmin = (req, res, next) => {
  const targetId = req.params.id;

  if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) {
    return next();
  }

  if (req.user.id !== targetId) {
    return next(new ForbiddenError('You can only access your own data'));
  }

  next();
};

module.exports = {
  auth,
  authorize,
  isSuperAdmin,
  isOwnerOrAdmin
};
```

---

## 📝 Routes par Service

### **Auth-Service Routes**

```javascript
// src/routes/auth.routes.js
const router = express.Router();

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Authenticated (any role)
router.post('/refresh-token', auth, authController.refreshToken);
router.get('/verify', auth, authController.verify);
```

---

### **User-Service Routes**

```javascript
// src/routes/user.routes.js
const { ROLES } = require('../config/roles');

const router = express.Router();

// Super_admin + admin → voir tous
router.get(
  '/',
  auth,
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  userController.getAll
);

// Owner OR admin/super_admin
router.get(
  '/:id',
  auth,
  isOwnerOrAdmin,
  userController.getById
);

// Owner OR admin/super_admin (modifier)
router.patch(
  '/:id',
  auth,
  isOwnerOrAdmin,
  userController.update
);

// Super_admin only
router.delete(
  '/:id',
  auth,
  isSuperAdmin,
  userController.delete
);
```

---

### **Container-Service Routes**

```javascript
// src/routes/container.routes.js
const { ROLES } = require('../config/roles');

const router = express.Router();

// Tous voient les conteneurs
router.get(
  '/',
  auth,
  containerController.getAll
);

// Citoyen: nearby (500m)
router.get(
  '/nearby',
  auth,
  authorize([ROLES.CITOYEN, ROLES.AGENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  containerController.getNearby
);

// Tous voient détails
router.get(
  '/:id',
  auth,
  containerController.getById
);

// Super_admin: créer
router.post(
  '/',
  auth,
  isSuperAdmin,
  containerController.create
);

// Super_admin: modifier
router.patch(
  '/:id',
  auth,
  isSuperAdmin,
  containerController.update
);

// Super_admin: supprimer
router.delete(
  '/:id',
  auth,
  isSuperAdmin,
  containerController.delete
);

// Agent + admin: enregistrer mesure
router.post(
  '/:id/measure',
  auth,
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]),
  containerController.recordMeasure
);

// Agent + admin: historique
router.get(
  '/:id/history',
  auth,
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]),
  containerController.getHistory
);
```

---

### **Tour-Service Routes**

```javascript
// src/routes/tour.routes.js
const { ROLES } = require('../config/roles');

const router = express.Router();

// Admin only: tous les tours
router.get(
  '/',
  auth,
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  tourController.getAll
);

// Agent: ses tours
router.get(
  '/my-tours',
  auth,
  authorize([ROLES.AGENT]),
  tourController.getMyTours
);

// Super_admin: créer
router.post(
  '/',
  auth,
  isSuperAdmin,
  tourController.create
);

// Agent: démarrer son tour
router.post(
  '/:id/start',
  auth,
  authorize([ROLES.AGENT]),
  tourController.start
);

// Agent: enregistrer collecte
router.post(
  '/:id/container',
  auth,
  authorize([ROLES.AGENT]),
  tourController.recordCollection
);

// Agent: terminer tour
router.put(
  '/:id/end',
  auth,
  authorize([ROLES.AGENT]),
  tourController.end
);

// Agent + admin: rapport
router.get(
  '/:id/report',
  auth,
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]),
  tourController.getReport
);
```

---

### **Signal-Service Routes**

```javascript
// src/routes/signal.routes.js
const { ROLES } = require('../config/roles');

const router = express.Router();

// Super_admin + admin: todos, Citoyen: siens
router.get(
  '/',
  auth,
  (req, res, next) => {
    // Custom logic: admin sees all, citoyen sees only his
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT].includes(req.user.role)) {
      return next();
    }
    if (req.user.role === ROLES.CITOYEN) {
      req.filter = { citoyen_id: req.user.id };
      return next();
    }
    res.status(403).json({ error: 'Access denied' });
  },
  signalController.getAll
);

// Tous peuvent créer signal
router.post(
  '/',
  auth,
  signalController.create
);

// Creator OR admin: modifier
router.patch(
  '/:id',
  auth,
  (req, res, next) => {
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(req.user.role)) {
      return next();
    }
    // Citoyen ne peut modifier que son propre signal
    const isOwner = req.signal?.citoyen_id === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ error: 'You can only modify your own signals' });
    }
    next();
  },
  signalController.update
);

// Creator: ajouter photo
router.post(
  '/:id/photo',
  auth,
  (req, res, next) => {
    const isOwner = req.signal?.citoyen_id === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ error: 'Only creator can add photos' });
    }
    next();
  },
  signalController.addPhoto
);

// Admin + agent: marquer résolu
router.put(
  '/:id/resolve',
  auth,
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]),
  signalController.resolve
);

// Super_admin: supprimer
router.delete(
  '/:id',
  auth,
  isSuperAdmin,
  signalController.delete
);
```

---

## 🧪 Tests RBAC

### Test 1: Citoyen crée signal
```bash
# 1. Register & login as citoyen
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citoyen@test.com","password":"123456"}' | jq .token)

# 2. Create signal (should work)
curl -X POST http://localhost:3000/api/signals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"container_id":"123","description":"Débordé"}'

# EXPECTED: 201 Created
```

---

### Test 2: Agent starts tour
```bash
# Login as agent
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@test.com","password":"123456"}' | jq .token)

# Get my tours (should work)
curl -X GET http://localhost:3000/api/tours/my-tours \
  -H "Authorization: Bearer $TOKEN"

# EXPECTED: 200 OK with agent's tours
```

---

### Test 3: Citoyen tries to see admin panel
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"citoyen@test.com","password":"123456"}' | jq .token)

curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"

# EXPECTED: 403 Forbidden
```

---

### Test 4: Super_admin creates container
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super_admin@test.com","password":"123456"}' | jq .token)

curl -X POST http://localhost:3000/api/containers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"BIN001","capacity":100,"lat":48.8566,"lng":2.3522}'

# EXPECTED: 201 Created
```

---

## 📚 Résumé Permissions par Rôle

### 🔴 **SUPER_ADMIN**
- ✅ Accès total (DELETE, PATCH, POST, GET)
- ✅ Crée/modifie/supprime tous les ressources
- ✅ Gère l'infrastructure

### 🟠 **ADMIN**
- ✅ Voir tous les users/conteneurs/tours
- ✅ Modifier son propre profil
- ✅ Superviser opérations
- ❌ Pas de création/suppression ressources

### 🟡 **AGENT**
- ✅ Voir ses tours assignés
- ✅ Enregistrer collectes
- ✅ Créer signalements
- ✅ Voir conteneurs + historique mesures
- ❌ Pas de modifications systèmes

### 🟢 **CITOYEN**
- ✅ Voir conteneurs proches (500m)
- ✅ Créer signalements
- ✅ Voir ses signalements
- ✅ Ajouter photos
- ❌ Pas d'accès admin/agent

---

*Document RBAC v2.0 | Février 2026*  
*Rôles: super_admin, admin, agent, citoyen*  
*Production-Ready ✓*
