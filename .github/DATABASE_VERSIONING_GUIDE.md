# 🗄️ Database Versioning & Migrations Guide

## 📚 Table des Matières
1. [Concepts](#concepts-clés)
2. [Structure](#structure-des-migrations)
3. [Utilisation](#utilisation-quotidienne)
4. [Bonnes Pratiques](#bonnes-pratiques)
5. [Troubleshooting](#troubleshooting)

---

## Concepts Clés

### Qu'est-ce qu'une Migration?

Une **migration** est un fichier qui décrit les changements de schéma de base de données de manière versionnée:

```
┌─────────────────────────────────────────────────────────┐
│ Migration = "Snapshot" versionnée du schéma BD          │
│                                                         │
│ Migration #1 (2026-01-15):                              │
│ ✓ CREATE TABLE users                                    │
│ ✓ CREATE TABLE agents (child of users)                  │
│ ✓ CREATE INDEX users(email)                             │
│                                                         │
│ Migration #2 (2026-02-10):                              │
│ ✓ ALTER TABLE users ADD COLUMN last_login               │
│ ✓ CREATE TABLE audit_logs                               │
│                                                         │
│ → Votre BD est toujours à jour avec le code!            │
└─────────────────────────────────────────────────────────┘
```

### Avantages

| Avantage | Explication |
|----------|-------------|
| **Traçabilité** | Git + Logs = Histoire complète des changements |
| **Reproductibilité** | Même schéma sur dev, test, production |
| **Collaboration** | Changements versionnés comme le code |
| **Rollback** | Annuler facilement les changements |
| **Automatisation** | CI/CD can apply migrations automatically |
| **Audit** | Qui a changé quoi et quand? |

---

## Structure des Migrations

### Nommage des fichiers

```
YYYYMMdd_NNN_description.js 
│        │   │   │
│        │   │   └─ Description claire (snake_case)
│        │   └───── Numéro séquentiel (001, 002, 003...)
│        └───────── Date de création (pour trier)
└────────────────── Jour d'aujourd'hui

Exemples:
✓ 20260219_001_create_auth_tables.js
✓ 20260219_002_create_zones_table.js
✓ 20260220_003_add_index_measurements.js
```

### Structure d'une Migration

```javascript
'use strict';

module.exports = {
  // ✢ Version UP: Appliquer les changements
  up: async (queryInterface, Sequelize) => {
    // Code pour CRÉER / MODIFIER tables et indexes
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true },
      email: { type: Sequelize.STRING, unique: true },
      // ...
    });
  },

  // ✢ Version DOWN: Annuler les changements (Rollback)
  down: async (queryInterface, Sequelize) => {
    // Code pour DÉTRUIRE / RESTAURER les changements
    await queryInterface.dropTable('users');
  },
};
```

---

## Utilisation Quotidienne

### 1️⃣ Créer une nouvelle migration

```bash
# Dans le dossier du service
cd backend/services/auth

# Générer une migration vide (Sequelize CLI genère le fichier)
npx sequelize-cli migration:generate --name add_email_verified_to_users

# → Fichier créé: src/migrations/YYYYMMDD_XXXXXX_add_email_verified_to_users.js
# → Éditez le fichier avec votre logique up/down
```

### 2️⃣ Appliquer les migrations

```bash
# Appliquer TOUTES les migrations non-appliquées
npm run migrate

# Ou manuellement:
npx sequelize-cli db:migrate

# Pour un service spécifique:
cd backend/services/container-service
npm run migrate
```

**Résultat:**
```
Sequelize CLI [Node: 18.14.2, CLI: 6.6.2, ORM: 6.35.2]

Executing migration: src/migrations/20260219_001_create_auth_tables.js
✅ Migration [Up]: Creating users, agents, citoyens, and admins tables...
✅ Tables créées avec succès pour auth-service
Executed successful.
```

### 3️⃣ Vérifier le statut des migrations

```bash
# Voir quelles migrations sont appliquées
npx sequelize-cli db:migrate:status

# Output:
# up  20260219_001_create_auth_tables.js
# up  20260219_002_add_indexes.js
# down  20260220_001_add_new_feature.js  ← Pas encore appliquée
```

### 4️⃣ Annuler une migration (Rollback)

```bash
# Annuler la DERNIÈRE migration appliquée
npm run migrate:undo

# Annuler UNE SPÉCIFIQUE
npx sequelize-cli db:migrate:undo --name 20260219_001_create_auth_tables.js

# Annuler TOUTES les migrations
npx sequelize-cli db:migrate:undo:all
```

**Attention:** ⚠️ C'est destructif en production!

---

## Bonnes Pratiques

### ✅ DO - Faire

```javascript
// ✓ BIEN: Migration simple, une responsabilité
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer UNE table ou faire UN changement logique
    await queryInterface.createTable('users', { ... });
  },
  down: async (queryInterface, Sequelize) => {
    // Reverser exactement
    await queryInterface.dropTable('users');
  },
};

// ✓ BIEN: Nommage clair
// 20260219_001_create_auth_tables.js
// 20260219_002_add_email_index_to_users.js
// 20260220_003_alter_containers_add_gps.js

// ✓ BIEN: Écrite immédiatement après un changement de schéma
// if (schema changes) → write migration first

// ✓ BIEN: Tester avant de committer
npm run migrate:undo
npm run migrate
```

### ❌ DON'T - Ne pas faire

```javascript
// ✗ BAD: Fait trop de choses
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', { ... });
    await queryInterface.createTable('agents', { ... });
    await queryInterface.createTable('citoyens', { ... });
    // Et aussi ajouter des indexes
    // Et aussi seeder des données
    // Trop! Trop! Trop!
  },
};

// ✗ BAD: Nommage vague
// 20260219_update_database.js ← Quoi exactement?

// ✗ BAD: Seeding en migration
// Les migrations = changements STRUCTURE
// Les seeders = données de test

// ✗ BAD: Test data en production
// Migrations for schema, seeders for test data
```

### 📋 Workflow Recommandé

```
1. Développez le modèle Sequelize (src/models)
   
   const User = sequelize.define('User', {
     email: Sequelize.STRING,
   });

2. Créez une migration correspondante
   
   npm run migrate:generate --name add_email_field

3. Implémentez les changements (up/down)

4. Testez localement
   
   npm run migrate         # Apply
   npm run migrate:undo    # Rollback
   npm run migrate         # Apply again

5. Committez les deux fichiers ensemble
   
   git add models/User.js
   git add migrations/20260219_001_add_email_field.js
   git commit -m "feat: add email field to users"

6. En production:
   
   npm run migrate         # CD/CI applique auto
```

---

## Exemples Pratiques

### Exemple 1: Ajouter une colonne

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'users',              // Table name
      'email_verified',     // New column
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'email_verified');
  },
};
```

### Exemple 2: Créer un index

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex(
      'measurements',
      { fields: ['container_id', 'created_at'] }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('measurements', ['container_id', 'created_at']);
  },
};
```

### Exemple 3: Ajouter une contrainte

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('users', {
      fields: ['email'],
      type: 'unique',
      name: 'unique_email',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('users', 'unique_email');
  },
};
```

### Exemple 4: Renommer une colonne

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'phone_number', 'phone');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'phone', 'phone_number');
  },
};
```

---

## Gestion Multi-Service

### Appliquer migrations dans tous les services

```bash
# Script pour appliquer toutes les migrations
#!/bin/bash

SERVICES=(
  "auth"
  "user-service"
  "container-service"
  "tour-service"
  "signal-service"
  "iot-service"
)

for service in "${SERVICES[@]}"; do
  echo "🔄 Applying migrations in $service..."
  cd backend/services/$service
  npm run migrate
  cd ../../..
done

echo "✅ All migrations applied!"
```

### Vérifier migrations globales

```bash
#!/bin/bash

SERVICES=(
  "auth"
  "user-service"
  "container-service"
  "tour-service"
  "signal-service"
)

for service in "${SERVICES[@]}"; do
  echo "━━━━━━ $service ━━━━━━"
  cd backend/services/$service
  npx sequelize-cli db:migrate:status
  cd ../../..
done
```

---

## Troubleshooting

### ❌ Erreur: "SequelizeMigrationsFailed"

**Problème:** Migration échoue

**Solutions:**
```bash
# 1. Vérifier les logs
docker logs ecotrack_auth_db

# 2. Vérifier la syntaxe SQL
npx sequelize-cli db:migrate --verbose

# 3. Vérifier le fichier de config
cat src/config/sequelize.config.js

# 4. Rollback dernière migration
npm run migrate:undo
```

### ❌ Erreur: "No migrations were executed"

**Problème:** Migrations ne trouvent pas les fichiers

**Solutions:**
```bash
# 1. Vérifier structure
ls src/migrations/

# 2. Vérifier .sequelizerc
cat .sequelizerc

# 3. Vérifier que le dossier existe
mkdir -p src/migrations

# 4. Vérifier permissions
chmod -R 755 src/migrations/
```

### ❌ Erreur: "Foreign key constraint failed"

**Problème:** Problème de clés étrangères

**Solutions:**
```javascript
// Utiliser CASCADE pour supprimer
references: {
  model: 'users',
  key: 'id',
},
onDelete: 'CASCADE',  // ← Important!
```

### ❌ Erreur: "Cannot find module 'sequelize-cli'"

**Solution:**
```bash
npm install -g sequelize-cli
# Ou localement
npm install --save-dev sequelize-cli
```

---

## Intégration CI/CD

### GitHub Actions (Exemple)

```yaml
name: Database Migrations

on: [push]

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run migrations
        run: |
          for service in auth user-service container-service tour-service signal-service; do
            cd backend/services/$service
            npm run migrate
            cd ../../..
          done
      
      - name: Verify migrations
        run: |
          for service in auth user-service container-service tour-service signal-service; do
            cd backend/services/$service
            npx sequelize-cli db:migrate:status
            cd ../../..
          done
```

---

## 📖 Références

- [Sequelize Migrations Documentation](https://sequelize.org/master/manual/migrations.html)
- [Sequelize CLI Documentation](https://sequelize.org/master/manual/using-sequelize-cli.html)
- [Your Project Architecture](./Architecture.md)

---

## 🎯 Prochaines Étapes

- [ ] Appliquer les migrations initiales
- [ ] Tester rollback sur chaque service
- [ ] Documenter les changements futurs
- [ ] Automatiser avec CI/CD
- [ ] Configurer alertes pour migrations échouées

---

*Last Update: February 19, 2026*
*Version 1.0*
