# GUIDE DE TEST - AUTH-SERVICE

## Prérequis
- Node.js 16+ 
- Docker Desktop (pour docker-compose)
- PostgreSQL accessible
- RabbitMQ accessible

## Option 1: Test via Docker Compose (RECOMMANDÉ)

### Étape 1: Démarrer tous les services
```bash
cd backend
docker-compose up -d
```

Vérifiez que tous les services sont en cours d'exécution:
```bash
docker-compose ps
```

Attendez 30 secondes pour que les bases de données se créent. Vérifiez les logs:
```bash
docker-compose logs auth-service
docker-compose logs user-db
```

### Étape 2: Exécuter les tests
#### Windows (PowerShell):
```powershell
cd backend\services\auth
.\test-auth-service.ps1
```

#### macOS/Linux (Bash):
```bash
cd backend/services/auth
chmod +x test-auth-service.sh
./test-auth-service.sh
```

### Résultats attendus (tous les tests PASS):
```
=== ECOTRACK AUTH-SERVICE TEST SUITE ===
[TEST 1] Health Check
✓ PASS - Service is healthy

[TEST 2] Register - Valid Data
✓ PASS - User registered successfully

[TEST 3] Register - Invalid Email
✓ PASS - Invalid email rejected (HTTP 400)

[TEST 4] Register - Duplicate Email
✓ PASS - Duplicate email rejected (HTTP 409)

[TEST 5] Login - Valid Credentials
✓ PASS - Login successful

[TEST 6] Login - Wrong Password
✓ PASS - Wrong password rejected (HTTP 401)

[TEST 7] Verify Token - Valid Token
✓ PASS - Token verified successfully

[TEST 8] Verify Token - Missing Token
✓ PASS - Missing token rejected (HTTP 401)

[TEST 9] Logout
✓ PASS - Logout successful

=== TEST SUMMARY ===
PASSED: 9
FAILED: 0

✓ All tests passed! Auth-service is working correctly.
```

---

## Option 2: Test local sans Docker Compose

### Étape 1: Configurer la base de données PostgreSQL localement

Assurez-vous que PostgreSQL fonctionne. Créez une base de données pour auth-service:

```sql
CREATE DATABASE auth_db;
```

### Étape 2: Configurer les variables d'environnement

Créez/modifiez `backend/services/auth/.env`:
```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_db
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=user.created
```

### Étape 3: Installer les dépendances
```bash
cd backend/services/auth
npm install
```

### Étape 4: Démarrer le service
```bash
npm run dev
```

Output attendu:
```
Database connected successfully
Auth service running on port 3001
```

### Étape 5: Exécuter les tests (dans un autre terminal)
Windows:
```powershell
.\test-auth-service.ps1
```

macOS/Linux:
```bash
./test-auth-service.sh
```

---

## Dépannage

### Erreur: "Cannot find module 'joi'"
```bash
cd backend/services/auth
npm install joi
```

### Erreur: "connect ECONNREFUSED 127.0.0.1:5432" (PostgreSQL)
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez les variables d'environnement .env
- Vérifiez que la base de données existe

### Erreur: "connect ECONNREFUSED 127.0.0.1:5672" (RabbitMQ)
- C'est normal si RabbitMQ n'est pas disponible
- Le service continuera à fonctionner, mais sans events pub/sub
- Pour le fixer: `docker-compose up -d` démarre RabbitMQ automatiquement

### Erreur: "EADDRINUSE: address already in use :::3001"
- Arrêtez les services en arrière-plan: `docker-compose down`
- Ou changez le PORT dans .env

### Les tests échouent avec "Service not responding"
1. Vérifiez que le service est en cours d'exécution: `curl http://localhost:3001/health`
2. Vérifiez les logs du service pour les erreurs
3. Vérifiez que la base de données est disponible
4. Attendez 10-15 secondes après démarrage (migrations en cours)

---

## Validation Complète

Après un résultat PASS au complet, validez:

✅ **Validation** = Code fonctionne correctement  
✅ **Architecture** = Pattern implémenté proprement  
✅ **Erreurs** = Standardisées et centralisées  
✅ **RBAC** = Contrôle d'accès en place  

Prêt pour appliquer le même pattern à **user-service** (plus complexe - multitenancy + TPT).

---

## Prochaines Étapes

1. ✅ **auth-service complet** (code + tests)
2. 🔄 **Tests en cours** ← VOUS ÊTES ICI
3. 📋 **user-service** (même pattern + TPT)
4. 📋 **signal-service, tour-service, container-service** (même pattern)
5. 📋 **Tests d'intégration** (services entr'eux via RabbitMQ)
