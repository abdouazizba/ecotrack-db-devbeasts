# 🚀 Quick Start - Database Migrations

## 5-Minute Setup

### 1️⃣ Test Configuration (Vérifier que tout est OK)
```bash
# Windows PowerShell
cd backend
.\manage-migrations.ps1 -Action test

# Linux/macOS
cd backend
node test-migrations.js
```

### 2️⃣ Apply Migrations (Créer toutes les tables)
```bash
# All services
cd backend
.\manage-migrations.ps1 -Action up

# Single service
cd services/auth
npm run migrate
```

### 3️⃣ Verify Status
```bash
.\manage-migrations.ps1 -Action status
```

### 4️⃣ Test Rollback (Optionnel - pour tester)
```bash
.\manage-migrations.ps1 -Action down
.\manage-migrations.ps1 -Action up
```

---

## 📋 What Was Created?

✅ **6 Services** avec dossiers `migrations/`
✅ **sequelize.config.js** pour chaque service
✅ **5 migrations initiales** qui créent les schémas:
  - auth-service: users, agents, citoyens, admins
  - container-service: zones, containers, measurements  
  - tour-service: tours, collection_points
  - signal-service: signals, alerts
  - user-service: utilisateurs, agents, citoyens, admins

✅ **Scripts de gestion**:
  - `manage-migrations.ps1` (Windows)
  - `manage-migrations.sh` (Linux/Mac)
  - `test-migrations.js` (Validation)

---

## 📚 Full Documentation

See [DATABASE_VERSIONING_GUIDE.md](./DATABASE_VERSIONING_GUIDE.md) for:
- Detailed concepts & workflow
- Creating new migrations
- Rollback strategies
- Troubleshooting
- CI/CD integration

---

## 🔧 Troubleshooting

### Error: "Cannot find sequelize-cli"
```bash
npm install -g sequelize-cli
```

### Error: "SequelizeMigrationsFailed"
```bash
# Check database connection
docker-compose ps

# Check logs
docker logs ecotrack_<service>_db

# Verify migrations exist
ls src/migrations/
```

### Want to reset everything?
```bash
# Rollback all migrations
.\manage-migrations.ps1 -Action down

# Or reset database completely
docker-compose down -v
docker-compose up -d
.\manage-migrations.ps1 -Action up
```

---

## ✨ What's Next?

1. Run the test: `.\manage-migrations.ps1 -Action test`
2. Apply migrations: `.\manage-migrations.ps1 -Action up`
3. Check status: `.\manage-migrations.ps1 -Action status`
4. See pgAdmin: http://localhost:5050
5. Read the full guide when adding new tables!

**Happy Migrations! 🗄️**
