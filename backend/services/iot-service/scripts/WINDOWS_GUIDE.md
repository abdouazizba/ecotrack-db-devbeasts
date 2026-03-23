# 📡 IoT Simulation Scripts - Windows PowerShell Guide

## 🚀 Quick Start (Windows PowerShell)

### Installation Préalable
```powershell
# Aller au répertoire IoT-Service
cd backend\services\iot-service

# Installer les dépendances
npm install

# Vérifier que Docker est lancé
docker ps
```

---

## 📊 Utilisation des Scripts

### 1️⃣ Capteur Unique (Démarrage Recommandé)

```powershell
# Capteur REMPLISSAGE simple
npm run simulate:sensor

# Capteur TEMPÉRATURE toutes les 2 secondes
npm run simulate:sensor -- --type=TEMPERATURE --interval=2000

# Capteur POIDS via le Gateway
npm run simulate:sensor -- --gateway

# Capteur GPS
npm run simulate:sensor -- --type=GPS
```

**Output attendu:**
```
✅ [10:30:45.123] #1 REMPLISSAGE: 87.5 %
   Message ID: abc-123-def
✅ [10:30:50.456] #2 REMPLISSAGE: 92.3 %
```

---

### 2️⃣ Plusieurs Capteurs

```powershell
# 10 capteurs par défaut
npm run simulate:multi

# 50 capteurs pendant 5 minutes
npm run simulate:multi -- --count=50 --interval=2000 --duration=300000

# 100 capteurs pendant 1 heure
npm run simulate:multi -- --count=100 --duration=3600000

# Version longue avec node directement
node scripts/simulate-multiple-sensors.js --count=20 --interval=3000
```

**Dashboard en temps réel:**
```
📊 STATISTIQUES (Temps écoulé: 30s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 600 | ✅ 595 | ❌ 5 | Rate: 1200 msg/min

SENSOR_1 | REMPLISSAGE | Total: 60 | ✅ 59 | ❌ 1
SENSOR_2 | TEMPERATURE | Total: 60 | ✅ 60 | ❌ 0
```

---

### 3️⃣ Scénarios de Crise

```powershell
# Débordement (remplissage progressive)
npm run simulate:crisis -- --scenario=overflow

# Alerte température
npm run simulate:crisis -- --scenario=temperature_alert

# Batterie faible
npm run simulate:crisis -- --scenario=low_battery

# Perte de signal
npm run simulate:crisis -- --scenario=signal_loss

# Rafale 100 mesures (test charge)
npm run simulate:crisis -- --scenario=burst

# Combiné: tous les problèmes
npm run simulate:crisis -- --scenario=combined

# Sur conteneur spécifique
npm run simulate:crisis -- --scenario=overflow --container=5
```

**Scénarios disponibles:**
| Scénario | Description |
|----------|-------------|
| overflow | Remplissage: 85% → 100% |
| temperature_alert | Température: 35°C → 50°C |
| low_battery | Batterie: 15% → 0% |
| signal_loss | Signal: 100% → 0% |
| burst | Rafale 100 mesures rapides |
| combined | Tous les problèmes en sequence |

---

### 4️⃣ Test de Charge

```powershell
# Test par défaut: 100 capteurs, 5 minutes
npm run simulate:load-test

# 500 capteurs à 1000 msg/sec pendant 10 minutes
npm run simulate:load-test -- --sensors=500 --rate=1000 --duration=600000

# Test léger: 50 capteurs à 500 msg/sec
npm run simulate:load-test -- --sensors=50 --rate=500

# Version longue
node scripts/load-test.js --sensors=100 --rate=500 --duration=300000
```

**Rapport final généré:**
```
╔════════════════════════════════════════════════════╗
║              📈 RAPPORT FINAL DU TEST
╠════════════════════════════════════════════════════╣
║ Total reqûetes: 45000
║ Succès: 44875 (99.72%)
║ Erreurs: 125
║ Débit: 149.58 req/sec
║
║ Temps réponse (ms):
║   Min: 12.34
║   Max: 5123.45
║   Avg: 156.78
║   P95: 450.23
║   P99: 892.15
║
║ ✅ Excellent (>95%)
╚════════════════════════════════════════════════════╝
```

---

## 📋 Paramètres Disponibles

### simulate-single-sensor.js
```powershell
npm run simulate:sensor -- [OPTIONS]

--type=REMPLISSAGE|TEMPERATURE|POIDS|HUMIDITE|GPS
    Type de capteur (défaut: REMPLISSAGE)

--interval=5000
    Intervalle en ms entre mesures (défaut: 5000)

--gateway
    Utiliser API Gateway (3000) au lieu de IoT-Service direct (3006)
```

### simulate-multiple-sensors.js
```powershell
npm run simulate:multi -- [OPTIONS]

--count=10
    Nombre de capteurs (défaut: 10)

--interval=5000
    Intervalle en ms entre batches (défaut: 5000)

--duration=3600000
    Durée totale en ms (défaut: 1 heure)
```

### simulate-crisis-scenarios.js
```powershell
npm run simulate:crisis -- [OPTIONS]

--scenario=overflow|temperature_alert|low_battery|signal_loss|burst|combined
    Scénario à simuler (défaut: overflow)

--container=1
    ID du conteneur à tester (défaut: 1)

--duration=60000
    Durée en ms (défaut: varie par scénario)
```

### load-test.js
```powershell
npm run simulate:load-test -- [OPTIONS]

--sensors=100
    Nombre de capteurs (défaut: 100)

--rate=1000
    Mesures par seconde (défaut: 1000)

--duration=300000
    Durée en ms (défaut: 5 minutes)
```

---

## 🔍 Vérification des Données

### Via API Gateway
```powershell
# Vérifier santé
curl http://localhost:3000/api/iot/status

# Ou directement IoT-Service
curl http://localhost:3006/health
```

### Via pgAdmin (Interface Web)
```
URL: http://localhost:5050
Username: admin@pgadmin.org
Password: admin

1. Serveurs → container-db
2. Databases → ecotrack_container
3. Schemas → public → Tables
4. Double-click mesure pour voir les données
```

### Via PowerShell
```powershell
# Compter les mesures enregistrées
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT COUNT(*) as total_measurements FROM mesure;"

# Voir les 20 dernières mesures
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT capteur_id, type_capteur, valeur, unite, created_at FROM mesure ORDER BY created_at DESC LIMIT 20;"

# Mesures par type
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT type_capteur, COUNT(*) FROM mesure GROUP BY type_capteur;"
```

---

## 🎯 Stratégies de Test (Recommandées)

### Test 1: Validation Basique (5 min)
```powershell
# Terminal 1: Lancer capteur
npm run simulate:sensor

# Terminal 2: Vérifier les données
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT COUNT(*) FROM mesure;"

# Terminal 3: Voir les logs
docker logs -f ecotrack_iot_service
```

### Test 2: Charge Progressive (15 min)
```powershell
# Terminal 1: Lancer 20 capteurs
npm run simulate:multi -- --count=20 --duration=900000

# Terminal 2: Monitorer la performance
docker stats ecotrack_iot_service

# Terminal 3: Vérifier la base
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT COUNT(*) FROM mesure;"
```

### Test 3: Alertes (10 min)
```powershell
# Tester débordement
npm run simulate:crisis -- --scenario=overflow

# Vérifier les alertes créées
docker logs ecotrack_signal_service | Select-String "overflow"

# Compter les mesures
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT COUNT(*) FROM mesure WHERE valeur > 95;"
```

### Test 4: Charge Intensive (30 min)
```powershell
# Test intensif
npm run simulate:load-test -- --sensors=500 --rate=1000 --duration=1800000

# Analyser le rapport de performance
# (Affichage en temps réel avec mise à jour toutes les 2 secondes)
```

---

## 🐛 Dépannage

### Erreur: Port 3006 refused
```powershell
# Vérifier que Docker est running
docker ps

# Vérifier le service IoT
docker ps | Select-String "iot-service"

# Redémarrer le service
docker-compose restart iot-service

# Voir les logs d'erreur
docker logs ecotrack_iot_service
```

### Erreur: npm command not found
```powershell
# Installer Node.js
# Télécharger depuis https://nodejs.org (v18+)

# Vérifier l'installation
node --version
npm --version

# Installer les dépendances
npm install
```

### Pas de données dans pgAdmin
```powershell
# 1. Vérifier que les mesures arrivent au IoT-Service
docker logs ecotrack_iot_service | Select-String "Measurement recorded"

# 2. Vérifier la connexion container-service
docker logs ecotrack_container_service | Select-String "Connected"

# 3. Vérifier les mesures en DB
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container `
  -c "SELECT * FROM mesure LIMIT 5;"
```

### Service indisponible (202 Accepted)
```powershell
# C'est normal si container-service n'est pas ready
# Les mesures sont acceptées quand même et retentées plus tard

# Vérifier la santé du container-service
curl http://localhost:3002/health

# Redémarrer si nécessaire
docker-compose restart container-service
```

---

## 📊 Bonnes Pratiques

1. **Avant déploiement**: Exécuter test de charge
2. **Changements critiques**: Tester avec scénarios de crise
3. **Monitoring continu**: Laisser un capteur en simulation continue
4. **Alertes**: Tester avec `temperature_alert` et `overflow`

---

## 📞 Quick Reference

```powershell
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f iot-service

# Redémarrer un service
docker-compose restart iot-service

# Nettoyer (supprimer tout y compris data)
docker-compose down -v
```

---

**Créé pour: Windows PowerShell**
**Version: 1.0**
**Date: January 29, 2026**
