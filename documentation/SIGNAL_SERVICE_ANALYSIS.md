# 🔴 ANALYSE COMPLÈTE: Signal Service (Port 3004)

**Date**: 20 mai 2026  
**Status**: 🟡 **CRITIQUE - Mismatch architecture**  
**État d'avancement**: 40% (structurellement ok, mais non fonctionnel)

---

## 📊 SYNTHÈSE EXÉCUTIVE

| Élément | Status | Notes |
|---------|--------|-------|
| **Modèle Signalement** | ✅ Complet | Tous les champs définis |
| **Routes API** | ✅ Complètes | 12 endpoints implémentés |
| **Controllers** | ✅ Structurels | Tous les cas couverts |
| **Services Business** | ✅ OK | SignalementService + Stats |
| **Middlewares** | ⚠️ Basiques | Pas d'auth/validation forte |
| **Tests** | ❌ **INVALIDES** | Mismatch structure BD |
| **RabbitMQ** | ✅ Intégré | Events listeners actifs |
| **Swagger Doc** | ⚠️ Partiel | Basic endpoints documentés |
| **Coverage Tests** | ❌ 0% | Target: 70% |
| **Seed Data** | ❌ Cassé | Structure ne correspond pas |

---

## 🏗️ 1. ÉTAT D'IMPLÉMENTATION DÉTAILLÉ

### 1.1 Modèles (Signalement)

✅ **Créé et complet** - 14 champs

```javascript
Signalement (UUID Primary Key)
├── type: ENUM ['CONTENEUR_PLEIN', 'CONTENEUR_ENDOMMAGÉ', 'MAUVAISE_ODEUR', 'DÉBORDEMENT', 'AUTRE']
├── description: TEXT
├── statut: ENUM ['OUVERT', 'EN_COURS_DE_TRAITEMENT', 'FERMÉ', 'REJETÉ'] (DEFAULT: OUVERT)
├── priorite: ENUM ['BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE'] (DEFAULT: NORMALE)
├── id_conteneur: UUID (FK → container-service)
├── id_utilisateur: UUID (FK → user-service/auth-service)
├── latitude: FLOAT (nullable)
├── longitude: FLOAT (nullable)
├── photo_url: VARCHAR(500) (nullable)
├── date_resolution: DATE (nullable)
├── notes_resolution: TEXT (nullable)
└── timestamps: created_at, updated_at
```

**Champs manquants** ❌:
- Aucun! Tous les champs critiques présents

---

### 1.2 Routes API

✅ **Toutes implémentées** - 12 endpoints principaux

| Method | Endpoint | Controller | Validation | Auth |
|--------|----------|-----------|------------|------|
| POST | `/api/signalements` | createSignalement | ✅ Basique | ❌ **NONE** |
| GET | `/api/signalements` | getSignalements | ✅ Filters OK | ❌ |
| GET | `/api/signalements/:id` | getSignalementById | ✅ | ❌ |
| GET | `/api/signalements/open` | getOpenSignalements | N/A | ❌ |
| GET | `/api/signalements/citoyen/:citoyenId` | getSignalementsByCitoyen | ✅ UUID | ❌ |
| GET | `/api/signalements/container/:containerId` | getSignalementsByContainer | ✅ UUID | ❌ |
| PUT | `/api/signalements/:id` | updateSignalement | ✅ Basique | ❌ |
| DELETE | `/api/signalements/:id` | deleteSignalement | ✅ UUID | ❌ |
| POST | `/api/signalements/:id/in-progress` | markInProgress | ✅ UUID | ❌ **Admin/Agent only?** |
| POST | `/api/signalements/:id/close` | closeSignalement | ✅ Notes | ❌ |
| POST | `/api/signalements/:id/reject` | rejectSignalement | ✅ Notes | ❌ **Admin only?** |
| GET | `/api/stats/dashboard` | getDashboardStats | N/A | ❌ |
| GET | `/api/stats/breakdown/*` | getBreakdown | N/A | ❌ |

**Gaps identifiés**:
- ❌ **AUCUNE authentification** sur les endpoints
- ❌ **Pas de contrôle d'accès** (qui peut marquer "in-progress"? Admin? Agent?)
- ⚠️ Validation express-validator basique (type, UUID format)
- ❌ **Aucune pagination** sur les listes (pas de limit/offset)
- ❌ **Pas de soft-delete** (DELETE direct, pas de flag)

---

### 1.3 Controllers

✅ **Structurellement complet** - 10 méthodes

**Fichier**: [src/controllers/signalement.controller.js](src/controllers/signalement.controller.js)

Couverture des cas:
- ✅ createSignalement - Création (validation + try/catch)
- ✅ getSignalements - Liste avec filtres (type, statut, priorite, id_conteneur, id_utilisateur)
- ✅ getSignalementById - Lecture par ID + 404 handling
- ✅ updateSignalement - Mise à jour avec validation
- ✅ deleteSignalement - Suppression + 404 handling
- ✅ getSignalementsByCitoyen - Filtrage par citoyen
- ✅ getSignalementsByContainer - Filtrage par conteneur
- ✅ getOpenSignalements - Statut=OUVERT filtre
- ✅ markInProgress - Transition de statut
- ✅ closeSignalement - Clôture + notes + date_resolution

**Problèmes**:
- ❌ **AUCUNE vérification d'authentification** dans les controllers
- ❌ **Aucune vérification d'autorisation** (qui peut fermer un signal? Qui peut rejeter?)
- ⚠️ Messages d'erreur génériques (pas de codes d'erreur)
- ❌ **Logs insuffisants** (pas de audit trail)

---

### 1.4 Services Business Logic

✅ **Complet** - 2 services

#### **SignalementService** (src/services/SignalementService.js)

| Méthode | Implémentée | Fonctionnelle | Notes |
|---------|------------|---------------|-------|
| createSignalement | ✅ | ⚠️ | Pas de validation métier |
| getSignalements | ✅ | ✅ | Filtres OK |
| getSignalementById | ✅ | ✅ | Basique findByPk |
| updateSignalement | ✅ | ✅ | OK |
| deleteSignalement | ✅ | ✅ | OK hard-delete |
| getSignalementsByCitoyen | ✅ | ✅ | OK |
| getSignalementsByContainer | ✅ | ✅ | OK |
| markInProgress | ✅ | ✅ | Transition OUVERT→EN_COURS |
| closeSignalement | ✅ | ✅ | Fermeture + notes + date |
| rejectSignalement | ✅ | ✅ | Rejet + notes |
| getOpenSignalements | ✅ | ✅ | Avec priorité DESC |
| getSignalementsByPriority | ✅ | ✅ | OK |
| getSignalementStatistics | ⚠️ | ❌ | **BUG**: `sequelize.fn()` pas importé |

**Bugs identifiés**:
```javascript
// ❌ BUG dans getSignalementStatistics (ligne ~85)
const byType = await Signalement.findAll({
  attributes: ['type', [sequelize.fn('COUNT', ...), 'count']], // ❌ sequelize undefined
  where,
  group: ['type'],
});
// FIX: Importer sequelize en début du fichier
```

#### **SignalStatsService** (src/services/SignalStatsService.js)

| Méthode | Status | Fonctionnelle |
|---------|--------|---------------|
| getTotalSignals | ✅ | ✅ |
| getOpenSignals | ✅ | ✅ |
| getInProgressSignals | ✅ | ✅ |
| getClosedSignals | ✅ | ✅ |
| getRejectedSignals | ✅ | ✅ |
| getSignalStatusBreakdown | ✅ | ✅ |
| getSignalByPriority | ✅ | ✅ |
| getDashboardStats | ✅ | ✅ |

---

### 1.5 Middlewares

⚠️ **BASIQUES SEULEMENT** - Pas de vraie sécurité

| Middleware | Fichier | Fonctionnalité | Status |
|-----------|---------|-----------------|--------|
| helmet() | common.middleware.js | HTTP Security Headers | ✅ |
| cors() | common.middleware.js | CORS Policy | ✅ |
| express.json() | common.middleware.js | JSON Parser | ✅ |
| errorMiddleware | error.middleware.js | Error Catching | ✅ Basique |
| **authMiddleware** | ❌ N'existe pas | JWT Verification | ❌ |
| **roleMiddleware** | ❌ N'existe pas | Role-Based Access Control | ❌ |
| **validationMiddleware** | ❌ N'existe pas | Request Validation | ⚠️ (exists in express-validator) |

**Problème CRITIQUE**:
- ❌ **Aucun contrôle d'authentification** sur les endpoints
- ❌ **Aucun contrôle d'autorisation** (qui peut créer? qui peut modifier?)
- ❌ **Pas de audit logging**

---

### 1.6 Tests

❌ **INVALIDES** - Structure ne correspond pas à la BD

| Type | Fichier | Tests | Status |
|------|---------|-------|--------|
| **API** | `__tests__/api/signal.api.test.js` | 6 tests | ❌ Fail |
| **Unit** | `__tests__/unit/Signal.test.js` | 2 test suites | ❌ Fail |
| **Integration** | `__tests__/integration/Signal.integration.test.js` | 2 test suites | ❌ Fail |

**Problème MAJEUR - Mismatch Critique**:

```javascript
// ❌ TESTS UTILISENT:
const signal = await Signal.create({
  id: 1,
  citoyen_id: 1,
  titre: 'Conteneur endommagé',           // ❌ Pas dans modèle
  description: 'Le conteneur est cassé',
  type: 'PROBLEME',                       // ❌ Pas dans énums (doit être CONTENEUR_ENDOMMAGÉ)
  latitude: 48.8566,
  longitude: 2.3522,
  statut: 'OUVERTE'                       // ❌ Pas dans énums (doit être OUVERT)
});

// ✅ MODÈLE RÉEL UTILISE:
const signalement = await Signalement.create({
  type: 'CONTENEUR_ENDOMMAGÉ',            // ✅ Correct
  description: 'Le conteneur est cassé',
  statut: 'OUVERT',                       // ✅ Correct
  priorite: 'NORMALE',
  id_conteneur: 'uuid...',                // ✅ UUID, pas integer
  id_utilisateur: 'uuid...',              // ✅ UUID, pas integer
  latitude: 48.8566,
  longitude: 2.3522,
});
```

**Raison**: Les tests réfèrent au modèle "Signal" qui n'existe pas (défini comme "Signalement")

**Coverage**: 0% (target: 70%)

**Actions requises**:
- ❌ Réécrire tous les tests
- ❌ Utiliser les bonnes structures de données
- ❌ Ajouter 60+ tests pour atteindre 70% coverage

---

### 1.7 Seed Data

❌ **NE FONCTIONNE PAS** - Structure incompatible

**Fichier**: [src/seeds/seed.js](src/seeds/seed.js)

Le seed essaye de créer des signalements avec ces champs:
```javascript
{
  id: uuidv4(),
  code: 'SIG-2026-001',                    // ❌ Pas dans modèle
  type: 'surcharge',                       // ❌ Pas dans énums
  conteneur_id: 'CONT-A001',               // ❌ Pas colonne (doit être id_conteneur UUID)
  localisation: { lat, lon, adresse },     // ❌ Pas colonne (doit être latitude, longitude)
  description: '...',                      // ✅ OK
  statut: 'traite',                        // ❌ Pas dans énums (doit être FERMÉ)
  priorite: 'haute',                       // ❌ Pas dans énums (doit être HAUTE)
  citoyen_id: CITOYEN_IDS.citoyen1,        // ❌ Pas colonne (doit être id_utilisateur)
  date_signalement: new Date(...),         // ❌ Pas colonne (created_at existe)
  date_resolution: new Date(...),          // ✅ OK
  photos: [...],                           // ❌ Pas colonne (doit être photo_url)
  feedback_citoyen: {...},                 // ❌ Pas colonne
}
```

**Résultat**: Seed échouera avec erreur "column does not exist"

---

### 1.8 Configuration & Infrastructure

| Élément | Status | Notes |
|---------|--------|-------|
| Database | ✅ | PostgreSQL, Sequelize ORM |
| Port | ✅ | 3004 (defini dans .env) |
| Environment | ✅ | .env + .env.example (complet) |
| Docker | ✅ | Dockerfile défini |
| Jest | ✅ | Config défini (70% threshold) |
| RabbitMQ | ✅ | amqplib intégré, retry logic |
| Health Check | ✅ | GET /health endpoint |

---

## 🎯 2. POINTS CLÉS FONCTIONNELS

### 2.1 Qui peut créer signalements?

❌ **PAS DE CONTRÔLE** - N'importe qui peut!

**État actuel**:
```javascript
// ❌ PROBLÈME: Pas de vérification
app.post('/api/signalements', validateSignalementCreate, createSignalement);
// → N'importe quel user (même Admin) peut créer
```

**Requis par spec**:
- Citoyens SEULEMENT
- Agents ne peuvent pas créer
- Admins ne peuvent pas créer

**À faire**:
- Ajouter middleware authMiddleware + roleMiddleware
- Vérifier JWT token
- Vérifier role = 'Citoyen'

---

### 2.2 Workflow de statuts

✅ **OK** - Transitions cohérentes

```mermaid
OUVERT
  └─→ EN_COURS_DE_TRAITEMENT  (via POST /:id/in-progress)
      └─→ FERMÉ               (via POST /:id/close)
  └─→ REJETÉ                   (via POST /:id/reject)
```

**Implémentation OK**:
- ✅ Transition OUVERT → EN_COURS (markInProgress)
- ✅ Transition EN_COURS/OUVERT → FERMÉ (closeSignalement + date_resolution + notes)
- ✅ Transition OUVERT → REJETÉ (rejectSignalement + notes)
- ✅ Validation: Seuls les statuts énumérés acceptés

**Gaps**:
- ❌ Aucune vérification d'autorisation sur les transitions
- ❌ Pas de logs d'audit (qui a changé? quand? pourquoi?)

---

### 2.3 Priorités

✅ **OK** - 4 niveaux définis

| Niveau | Enum | Utilisation | Notes |
|--------|------|-------------|-------|
| Basse | BASSE | Maintenance planifiée | ✅ |
| Normale | NORMALE | Issues courantes (DEFAULT) | ✅ |
| Haute | HAUTE | Urgent (débordement imminent) | ✅ |
| Critique | CRITIQUE | Auto-generé par IoT (>95% remplissage) | ✅ |

**Implémentation**:
- ✅ Default: NORMALE
- ✅ Filtrables via query params
- ✅ SignalEventListener auto-set CRITIQUE si taux_remplissage > 95%

---

### 2.4 Types de signalements

✅ **OK** - 5 types définis

| Type | Enum | Description | Création |
|------|------|-------------|----------|
| Plein | CONTENEUR_PLEIN | Container complètement plein | Citoyen |
| Endommagé | CONTENEUR_ENDOMMAGÉ | Porte cassée, couverture issue | Citoyen |
| Mauvaise odeur | MAUVAISE_ODEUR | Odeur pestilentielle | Citoyen |
| Débordement | DÉBORDEMENT | Déchets éparpillés autour | Citoyen |
| Autre | AUTRE | Issues non catégorisées | Citoyen |

**Implémentation**:
- ✅ Tous les types acceptés par validateur
- ✅ Filtrables via query params
- ✅ Stockés correctement en BD

---

### 2.5 RabbitMQ Events

✅ **INTÉGRÉ** - Listeners actifs

**Fichier**: [src/services/SignalEventListener.js](src/services/SignalEventListener.js)

| Event | Source | Action | Status |
|-------|--------|--------|--------|
| **container.maintenance_needed** | Container Service | Auto-crée signal MAINTENANCE | ✅ Implémenté |
| **measurement.alert** | IoT Service | Auto-crée signal HIGH_FILL | ✅ Implémenté |

**Implémentation RabbitMQ**:
- ✅ Topic Exchange: `ecotrack_events`
- ✅ Durable queues avec TTL 24h
- ✅ Retry logic (NACK sur erreur)
- ✅ Prefetch = 1 (process 1 msg at a time)
- ✅ Graceful shutdown (SIGINT)

**Problèmes identifiés**:
```javascript
// ❌ BUG: Champs inexistants
const signal = await Signalement.create({
  type_signalement: 'MAINTENANCE_REQUIRED', // ❌ Pas dans modèle (doit être type)
  localisation: 'AUTO_GENERATED',           // ❌ Pas colonne
  statut: 'ouvert',                         // ❌ Case mismatch (doit être OUVERT)
  priorite: 'URGENTE',                      // ❌ Pas dans énums (doit être CRITIQUE)
});
```

---

## 🔴 3. GAPS IDENTIFIÉS

### 3.1 CRUD Complet?

| Opération | Endpoint | Status | Problème |
|-----------|----------|--------|----------|
| **CREATE** | POST /signalements | ⚠️ Partial | ✅ Fonctionne mais pas d'auth |
| **READ (one)** | GET /signalements/:id | ✅ OK | Aucun |
| **READ (list)** | GET /signalements | ⚠️ Partial | ❌ Pas de pagination |
| **UPDATE** | PUT /signalements/:id | ⚠️ Partial | ✅ Fonctionne mais pas d'auth |
| **DELETE** | DELETE /signalements/:id | ⚠️ Partial | ✅ Hard-delete, pas d'auth |
| **PATCH** | N/A | ❌ Missing | Transitions via POST endpoints |

**Gaps CRUD**:
- ❌ Aucune authentification
- ❌ Aucune autorisation
- ❌ Pas de pagination (nécessaire!)
- ❌ Pas de soft-delete (audit trail)
- ❌ Pas de optimistic locking (race conditions possibles)

---

### 3.2 Validation

| Type | Status | Détail |
|------|--------|--------|
| **Format** | ✅ Express-validator | UUID, enum, string |
| **Business** | ❌ MANQUANT | Ex: vérifier que container existe avant? |
| **Access** | ❌ MANQUANT | Qui peut appeler cette API? |
| **Rate Limiting** | ❌ MANQUANT | Pas de protection DOS |
| **Input Sanitization** | ⚠️ Basique | JSON parser seulement |

**À implémenter**:
- Middleware de validation métier
- Middleware d'authentification
- Rate limiter
- Input sanitization avancée

---

### 3.3 Authentification & Autorisation

❌ **CRITIQUE** - 100% MANQUANT

| Fonctionnalité | Status |
|---|---|
| JWT Verification | ❌ |
| Role-Based Access Control | ❌ |
| Citizen-only creation | ❌ |
| Admin-only rejection | ❌ |
| Agent-only status changes | ❌ |
| Audit logging | ❌ |

---

### 3.4 Tests Coverage

| Type | Couvert | % Coverage | Notes |
|------|---------|-----------|-------|
| Unit Tests | 0/10 méthodes | 0% | Tests invalides (structure BD) |
| Integration Tests | 0 | 0% | Tests invalides |
| API Tests | 0 | 0% | Tests invalides |
| **Total** | **0** | **0%** | **Target: 70%** |

**À créer**:
- 70+ test cases
- Couvrir tous les chemins (happy path + error cases)
- Mocker RabbitMQ
- Mocker BD

---

### 3.5 API Documentation

⚠️ **PARTIELLE**

- ✅ README_SIGNAL.md existe
- ✅ Swagger.yaml dans [backend/swagger.yaml](../swagger.yaml)
- ❌ Endpoints signal pas documentés en détail
- ❌ Exemples de payload incomplets
- ❌ Erreurs HTTP non documentées

---

### 3.6 Seed Data

❌ **NE FONCTIONNE PAS**

Structure du seed ne correspond pas au modèle. Voir section 1.7.

---

## 📈 4. RÉSUMÉ VISUEL

### 4.1 État par composant

```
Modèles              ████████░░ 80% (complet structurellement)
Routes API           ████████░░ 80% (endpoints définis, pas d'auth)
Controllers          ████████░░ 80% (logic ok, pas d'auth)
Services             ████████░░ 80% (business logic ok + 1 bug)
Middlewares          ██░░░░░░░░ 20% (basique seulement)
Tests                ░░░░░░░░░░  0% (invalides)
RabbitMQ             ██████░░░░ 60% (intégré mais bugs)
Auth & Authz         ░░░░░░░░░░  0% (AUCUN)
Documentation        ████░░░░░░ 40% (README ok, API partial)
Data Integrity       ░░░░░░░░░░  0% (validation métier nulle)
─────────────────────────────────────────────────────
AVERAGE              ██████░░░░ 44% (structurellement ok, non fonctionnel)
```

### 4.2 Roadmap Dépendances

```
┌─────────────────────┐
│ 🔴 FIX MISMATCH     │  ← BLOCKER - Migration/Modèle/Tests/Seeds
│ (2-3 jours)         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 🟡 ADD AUTH         │  ← Middleware + JWT
│ (1-2 jours)         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 🟡 TESTS            │  ← Unit + Integration + API
│ (2-3 jours)         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ ✅ PRODUCTION READY │
│ (4-8 jours total)   │
└─────────────────────┘
```

---

## ⚡ 5. TODO PRIORITAIRE (5-10 tâches)

### **BLOQUEURS (CRITIQUES)**

#### ✋ T1: Corriger mismatch Migration/Modèle/Seed/Tests
**Priority**: 🔴 BLOCKER  
**Effort**: 2-3 jours  
**Détail**:
- Aligner la migration avec le modèle Sequelize
- Ou inverser: modèle conforme à migration
- Réécrire le seed avec structure correcte
- Réécrire tous les tests
- Vérifier BD après migration

**Checklist**:
- [ ] Décider: Migration vers modèle français OU modèle vers migration anglais
- [ ] Mettre à jour migration si nécessaire
- [ ] Mettre à jour modèle
- [ ] Réécrire seed.js
- [ ] Réécrire tous les tests
- [ ] Tester localement (npm test)

---

#### ✋ T2: Implémenter Authentification & Autorisation
**Priority**: 🔴 BLOCKER  
**Effort**: 1-2 jours  
**Détail**:
- Créer middleware authMiddleware (JWT verification via auth-service)
- Créer middleware roleMiddleware (citizen/agent/admin)
- Appliquer aux endpoints appropriés
- Tester avec postman

**Checklist**:
- [ ] authMiddleware.js (JWT verify)
- [ ] roleMiddleware.js (role check)
- [ ] Appliquer sur POST /signalements (Citoyen only)
- [ ] Appliquer sur PUT /:id (Admin/Agent)
- [ ] Appliquer sur DELETE /:id (Admin only)
- [ ] Tests postman avec JWT

---

### **IMPORTANTS (HAUTE PRIORITÉ)**

#### 🔧 T3: Corriger Bugs Code
**Priority**: 🟠 HAUTE  
**Effort**: 0.5 jour  
**Détail**:
- Importer sequelize dans SignalementService
- Corriger SignalEventListener (champs inexistants)
- Ajouter try/catch manquants

**Checklist**:
- [ ] Import sequelize dans SignalementService.js
- [ ] Corriger getSignalementStatistics
- [ ] Corriger SignalEventListener (type→type_signalement, etc.)
- [ ] Ajouter logs d'erreur plus détaillés

---

#### 🧪 T4: Écrire Tests (Unit + Integration + API)
**Priority**: 🟠 HAUTE  
**Effort**: 2-3 jours  
**Détail**:
- Créer 70+ test cases
- Unit tests pour SignalementService
- Integration tests pour workflow (OUVERT→EN_COURS→FERMÉ)
- API tests pour tous les endpoints
- Target: 70% coverage

**Checklist**:
- [ ] Réécrire Signal.test.js (unit)
- [ ] Réécrire Signal.integration.test.js
- [ ] Réécrire signal.api.test.js
- [ ] Mock RabbitMQ dans tests
- [ ] Run `npm test` et voir 70%+

---

#### 📝 T5: Implémenter Audit Logging
**Priority**: 🟠 MOYENNE  
**Effort**: 1-2 jours  
**Détail**:
- Logger qui a créé/modifié/fermé signalement
- Logger timestamps précis
- Logger raison des rejets
- Créer table d'audit si besoin

**Checklist**:
- [ ] Créer migration pour audit_logs table
- [ ] Ajouter logging dans services
- [ ] Endpoint GET /signalements/:id/audit-trail
- [ ] Tests pour audit logs

---

### **IMPORTANTS (MOYENNE PRIORITÉ)**

#### 🔄 T6: Implémenter Pagination
**Priority**: 🟡 MOYENNE  
**Effort**: 1 jour  
**Détail**:
- Ajouter limit/offset ou cursor-based pagination
- Documenter query params
- Tests pagination

**Checklist**:
- [ ] Ajouter ?limit=20&offset=0 support
- [ ] Documenter dans API doc
- [ ] Tester GET /signalements?limit=10

---

#### 🚀 T7: Implémenter Soft-Delete
**Priority**: 🟡 MOYENNE  
**Effort**: 1-2 jours  
**Détail**:
- Ajouter `deleted_at` colonne
- Soft-delete au lieu de hard-delete
- Filter out deleted par défaut
- Admin peut undelete

**Checklist**:
- [ ] Migration: ADD deleted_at
- [ ] Service: UPDATE delete() pour soft-delete
- [ ] Scope: where deleted_at IS NULL
- [ ] Endpoint: DELETE + permission check

---

#### 📊 T8: API Documentation Swagger
**Priority**: 🟡 MOYENNE  
**Effort**: 1 jour  
**Détail**:
- Documenter tous les endpoints signal
- Exemples de payload
- Codes d'erreur (400, 404, 403, 500)
- Générer swagger UI

**Checklist**:
- [ ] Compléter swagger.yaml pour /api/signalements
- [ ] Documenter modèles (Signalement)
- [ ] Documenter erreurs
- [ ] Test swagger UI

---

#### ✅ T9: Fix Seed Data
**Priority**: 🟡 MOYENNE  
**Effort**: 0.5 jour  
**Détail**:
- Réécrire seed avec structure correcte
- Créer 10-15 signalements de test
- Vérifier seed marche sans erreur

**Checklist**:
- [ ] Réécrire seed.js avec bons champs
- [ ] Vérifier types/enums corrects
- [ ] Run `npm run seed` sans erreurs
- [ ] Vérifier data dans pgAdmin

---

#### 📈 T10: Améliorer Error Handling
**Priority**: 🟡 MOYENNE  
**Effort**: 1 jour  
**Détail**:
- Ajouter codes d'erreur structurés
- Meilleurs messages d'erreur (FR/EN)
- Status codes HTTP corrects
- Error logging

**Checklist**:
- [ ] Créer ErrorService avec codes
- [ ] Ajouter 400/403/404/500 gestion
- [ ] Tester erreurs API
- [ ] Documenter codes

---

## 📋 ESTIMATIONS GLOBALES

| Catégorie | Jours | Détail |
|-----------|-------|--------|
| **🔴 Bloqueurs** | **3-5** | Mismatch (2-3j) + Auth (1-2j) |
| **🟠 Haute Priorité** | **3-4** | Bugs (0.5j) + Tests (2-3j) + Logs (1-2j) |
| **🟡 Moyenne Priorité** | **4-6** | Pagination (1j) + Soft-Delete (1-2j) + Swagger (1j) + Seed (0.5j) + Errors (1j) |
| **───────────────** | **───** | **──────** |
| **TOTAL EFFORT** | **10-15 jours** | **~2-3 semaines** |

### Équipe estimée:
- **1 backend dev**: 3 semaines (séquentiel)
- **2 backend devs**: 1.5 semaine (parallèle: T1+T2+T3, puis T4+T6+T7+T8, puis T5+T9+T10)

---

## ✅ CHECKLIST VALIDATION

- [ ] Migration OK (structure conforme)
- [ ] Modèle OK (tous champs)
- [ ] Seed OK (pas d'erreurs)
- [ ] Tests OK (70%+ coverage)
- [ ] Auth OK (JWT + roles)
- [ ] API endpoints OK (testés)
- [ ] RabbitMQ OK (events publiés/reçus)
- [ ] Logs OK (audit trail)
- [ ] Swagger OK (documenté)
- [ ] Production checklist OK

---

## 📚 RÉFÉRENCES

- [README_SIGNAL.md](../services/signal-service/README_SIGNAL.md) - Service description
- [EcoTrack Architecture](../documentation/ARCHITECTURE.md) - Global architecture
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Dev patterns

---

**Rapport généré**: 20 mai 2026  
**Statut global**: 🟡 **CRITIQUE** - Service structuré mais non opérationnel (mismatch + manque auth)  
**Recommandation**: Fixer blockers T1-T2 en priorité (3-4 jours) avant avancer

