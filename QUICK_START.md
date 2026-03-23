# 🚀 QUICK START - Event-Driven Architecture

## ✅ Prérequis

- Docker & Docker Compose
- Node.js 18+

## 🎯 Mise en Place (Première Fois)

### 1️⃣ Installer les dépendances

```bash
# Auth Service
cd backend/services/auth
npm install

# User Service
cd ../user-service
npm install
```

### 2️⃣ Démarrer l'infrastructure

```bash
cd backend
docker-compose up -d
```

### 3️⃣ Vérifier les services

```bash
# Voir les containers
docker-compose ps

# Voir les logs
docker-compose logs -f auth-service
docker-compose logs -f user-service
docker-compose logs -f rabbitmq
```

## 🔍 Vérifier que tout fonctionne

### RabbitMQ Management UI
- URL: `http://localhost:15672`
- User: `ecotrack`
- Password: `ecotrack123`

### Health Checks
```bash
# Auth Service
curl http://localhost:3001/health

# User Service
curl http://localhost:3005/health

# RabbitMQ
curl http://localhost:5672  # AMQP port (will fail but means RabbitMQ is up)
```

## 📊 Tester le Flux Événementiel

### 1. Voir les users créés dans auth_db
```bash
# Via pgAdmin: http://localhost:5050
# User: admin@ecotrack.com
# Password: admin123

# Serveur: auth-db
# Port: 5432
# User: postgres
# Password: postgres
```

### 2. Voir les profiles créés dans user_db
```bash
# Même pgAdmin
# Serveur: user-db
# Tables: utilisateurs, agent, citoyen, admin
```

### 3. Tester login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@ecotrack.com",
    "password": "password123"
  }'

# Retourne: {token: "jwt_token", user: {id, email, role}}
```

### 4. Tester récupération profil
```bash
# Remplacer JWT_TOKEN par le token obtenu
curl -X GET http://localhost:3005/api/users/me \
  -H "Authorization: Bearer JWT_TOKEN"

# Retourne le profil complet (Utilisateur + Agent/Citoyen/Admin)
```

### 5. Tester modification profil
```bash
curl -X PUT http://localhost:3005/api/users/me \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Martin",
    "prenom": "Jean"
  }'
```

## 🔄 Voir les Events en Temps Réel

### Logs des Events
```bash
# Terminal 1: Voir les events publiés
docker-compose logs -f auth-service | grep "Event published"

# Terminal 2: Voir les events reçus
docker-compose logs -f user-service | grep "Event received"
```

### RabbitMQ Management
1. Aller à `http://localhost:15672`
2. Cliquer sur "Queues"
3. Voir la queue "user.created"
4. Voir le nombre de messages reçus/traités

## 🧹 Nettoyer

```bash
# Arrêter les services
docker-compose down

# Arrêter et supprimer volumes (ATTENTION: supprime les données)
docker-compose down -v

# Voir les volumes
docker volume ls

# Supprimer un volume spécifique
docker volume rm ecotrack_auth_db_data
```


