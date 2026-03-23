# 📡 Scripts de Simulation IoT

Guide complet pour simuler et tester les capteurs IoT dans EcoTrack.

## 🚀 Démarrage Rapide

### 1️⃣ Capteur Unique (Recommandé pour démarrer)

```bash
cd backend/services/iot-service

# Simulation simple: REMPLISSAGE à 5 secondes d'intervalle
node scripts/simulate-single-sensor.js

# Température avec intervalle de 2 secondes
node scripts/simulate-single-sensor.js --type=TEMPERATURE --interval=2000

# Via le Gateway
node scripts/simulate-single-sensor.js --gateway

# Types disponibles: REMPLISSAGE, TEMPERATURE, POIDS, HUMIDITE, GPS
```

**Résultat attendu:**
```
✅ [10:30:45.123] #1 REMPLISSAGE: 87.5 %
   Message ID: abc-123-def
✅ [10:30:50.456] #2 REMPLISSAGE: 92.3 %
   Message ID: def-456-ghi
```

---

### 2️⃣ Plusieurs Capteurs

```bash
# 10 capteurs parallèles (défaut)
node scripts/simulate-multiple-sensors.js

# 50 capteurs, intervalle 2 secondes, durée 5 minutes
node scripts/simulate-multiple-sensors.js --count=50 --interval=2000 --duration=300000

# 100 capteurs, durée 1 heure
node scripts/simulate-multiple-sensors.js --count=100 --duration=3600000
```

**Affichage:**
```
📊 STATISTIQUES (Temps écoulé: 30s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 600 | ✅ 595 | ❌ 5 | Rate: 1200 msg/min

Détails par capteur:
SENSOR_1        | REMPLISSAGE  | Total:   60 | ✅ 59  | ❌  1
SENSOR_2        | TEMPERATURE  | Total:   60 | ✅ 60  | ❌  0
SENSOR_3        | POIDS        | Total:   60 | ✅ 60  | ❌  0
...
```

---

### 3️⃣ Scénarios de Crise

Test d'alertes et conditions critiques:

```bash
# Débordement (remplissage progressive > 95%)
node scripts/simulate-crisis-scenarios.js --scenario=overflow

# Alerte température (montée progressive)
node scripts/simulate-crisis-scenarios.js --scenario=temperature_alert

# Batterie faible
node scripts/simulate-crisis-scenarios.js --scenario=low_battery

# Perte de signal
node scripts/simulate-crisis-scenarios.js --scenario=signal_loss

# Rafale 100 mesures (test de charge léger)
node scripts/simulate-crisis-scenarios.js --scenario=burst

# Combinaison: débordement + température + batterie
node scripts/simulate-crisis-scenarios.js --scenario=combined

# Conteneur spécifique
node scripts/simulate-crisis-scenarios.js --scenario=overflow --container=5
```

**Scénarios disponibles:**
- 🚨 **overflow**: Débordement (remplissage 85% → 100%)
- 🔥 **temperature_alert**: Température critique (35°C → 50°C)
- 🔋 **low_battery**: Batterie dégradée (15% → 0%)
- 📡 **signal_loss**: Signal dégradé (100% → 0%)
- 💥 **burst**: Rafale de 100 mesures
- 🌪️ **combined**: Tous les problèmes en séquence

---

### 4️⃣ Test de Charge

Évalue la performance sous stress:

```bash
# Test de base: 100 capteurs, 5 minutes
node scripts/load-test.js

# Test intensif: 500 capteurs, 1000 msg/sec, 10 minutes
node scripts/load-test.js --sensors=500 --rate=1000 --duration=600000

# Test légère: 50 capteurs, 500 msg/sec
node scripts/load-test.js --sensors=50 --rate=500
```

**Rapport généré:**
```
╔════════════════════════════════════════════════════════════════════╗
║                   📈 RAPPORT FINAL DU TEST
╠════════════════════════════════════════════════════════════════════╣
║ RÉSULTATS GLOBAUX
║  Total reqûetes: 45000
║  Succès: 44875
║  Erreurs: 125
║  Taux de succès: 99.72%
║  Durée: 300.5s
║  Débit: 149.58 req/sec
║
║ TEMPS DE RÉPONSE (ms)
║  Min: 12.34
║  Max: 5123.45
║  Avg: 156.78
║  P50: 89.50
║  P95: 450.23
║  P99: 892.15
║
║ VERDICT:
║  ✅ Excellent (>95%)
╚════════════════════════════════════════════════════════════════════╝
```

---

## 📊 Configuration par Script

### Single Sensor
```
--type=REMPLISSAGE|TEMPERATURE|POIDS|HUMIDITE|GPS
--interval=5000  (milliseconds)
--gateway        (use API Gateway instead of direct)
```

### Multiple Sensors
```
--count=10              (number of sensors)
--interval=5000         (milliseconds between batches)
--duration=3600000      (total test duration)
```

### Crisis Scenarios
```
--scenario=overflow|temperature_alert|low_battery|signal_loss|burst|combined
--container=1           (container ID to test)
--duration=60000        (milliseconds)
```

### Load Test
```
--sensors=100     (number of concurrent sensors)
--rate=1000       (messages per second)
--duration=300000 (milliseconds)
```

---

## 🔍 Vérification des Données

### Via pgAdmin
1. Accédez à http://localhost:5050
2. Serveurs → container-db → Databases → ecotrack_container → Schemas → public → Tables
3. Double-clic sur `mesure` → Voir données

### Via SQL Direct
```bash
# Accédez au container postgres
docker exec -it ecotrack_container_db psql -U postgres -d ecotrack_container

# Requête des dernières mesures
SELECT id, capteur_id, conteneur_id, type_capteur, valeur, unite, created_at 
FROM mesure 
ORDER BY created_at DESC 
LIMIT 20;

# Compter les mesures par type
SELECT type_capteur, COUNT(*) as count 
FROM mesure 
GROUP BY type_capteur;

# Mesures du dernier conteneur
SELECT * FROM mesure WHERE conteneur_id = 1 ORDER BY created_at DESC LIMIT 10;
```

### Via API
```bash
# Vérifier le statut du service
curl http://localhost:3006/api/iot/status

# Health check
curl http://localhost:3006/health

# Via Gateway
curl http://localhost:3000/api/iot/status
```

---

## 📈 Stratégies de Test

### Test 1: Validation Basique (5 minutes)
```bash
# Vérifier que les mesures arrivent correctement
node scripts/simulate-single-sensor.js --type=REMPLISSAGE --interval=5000

# Vérifier dans pgAdmin que les données s'insèrent
# Vérifier dans RabbitMQ que les événements sont publiés
```

### Test 2: Charge Progressive (15 minutes)
```bash
# 1. Démarrer 10 capteurs
node scripts/simulate-multiple-sensors.js --count=10 --duration=300000

# 2. En parallèle, monitorer:
#    - Logs: docker logs ecotrack_iot_service
#    - CPU: docker stats ecotrack_iot_service
#    - DB: SELECT COUNT(*) FROM mesure;
```

### Test 3: Scénarios Critiques (10 minutes)
```bash
# Exécuter chaque scénario individuellement:
node scripts/simulate-crisis-scenarios.js --scenario=overflow
node scripts/simulate-crisis-scenarios.js --scenario=temperature_alert
node scripts/simulate-crisis-scenarios.js --scenario=low_battery

# Vérifier que les alertes sont créées dans alert_service
```

### Test 4: Charge Maximale (30 minutes)
```bash
# Test à 1000 msg/sec pendant 30 minutes
node scripts/load-test.js --sensors=500 --rate=1000 --duration=1800000

# Analyser le rapport de performance
# Vérifier la stabilité des services
```

---

## 🐛 Dépannage

### Erreur: ECONNREFUSED (Port 3006)
```bash
# Vérifier que le service IoT est running
docker ps | grep iot

# Sinon, démarrer le service
docker-compose up -d iot-service

# Vérifier les logs
docker logs ecotrack_iot_service
```

### Erreur: 202 Accepted (Container-Service pas disponible)
```bash
# Cela est NORMAL - le service IoT accepte les mesures quand même
# Les mesures seront retentées plus tard

# Vérifier que container-service démarre:
docker logs ecotrack_container_service
```

### Performance dégradée
```bash
# Augmenter les ressources Docker
# Dans docker-compose.yml, ajouter:
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G

# Redémarrer
docker-compose down
docker-compose up -d
```

### Aucune donnée dans pgAdmin
```bash
# 1. Vérifier que les mesures arrivent au IoT-Service
docker logs ecotrack_iot_service | grep "Measurement recorded"

# 2. Vérifier la connexion container-service → DB
docker logs ecotrack_container_service | grep "Connected"

# 3. Vérifier les mesures en DB
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container \
  -c "SELECT COUNT(*) FROM mesure;"
```

---

## 📚 Cas d'Usage

### Développement Local
```bash
# 1. Démarrer Docker Compose
cd backend
docker-compose up -d

# 2. Lancer un capteur simple
cd services/iot-service
node scripts/simulate-single-sensor.js

# 3. Vérifier les logs
docker logs ecotrack_iot_service
```

### Testing CI/CD
```bash
# En intégration continue (GitHub Actions)
# Exécuter un test de charge court et vérifier les résultats
npm run test:integration
npm run test:load-test
```

### Démonstration Client
```bash
# Montrer que le système fonctionne avec plusieurs capteurs
node scripts/simulate-multiple-sensors.js --count=20 --duration=300000

# Montrer les alertes avec scénarios critiques
node scripts/simulate-crisis-scenarios.js --scenario=combined
```

### Production Monitoring
```bash
# Dans une vrai situation, les capteurs physiques envoient les mesures
# Simuler le même comportement pour tests de charge
node scripts/load-test.js --sensors=100 --rate=500 --duration=3600000
```

---

## 🎯 Recommandations

1. **Avant chaque déploiement**: Exécuter le test de charge
2. **Pour les changes critiques**: Utiliser les scénarios de crise
3. **Pour le monitoring**: Laisser un capteur en simulation continue
4. **Pour les alertes**: Tester avec `temperature_alert` et `overflow`

---

## 📞 Support

Si un script ne fonctionne pas:
1. Vérifier que Docker Compose est en cours d'exécution
2. Vérifier les logs: `docker logs ecotrack_iot_service`
3. Vérifier la connexion réseau: `curl http://localhost:3006/health`
4. Relancer le service: `docker-compose restart iot-service`
