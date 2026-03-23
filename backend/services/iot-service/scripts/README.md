# 📡 IoT Simulation Scripts - Index

Bienvenue dans le dossier des scripts de simulation IoT! Ce répertoire contient tous les outils pour tester et simuler le comportement des capteurs IoT.

## 📂 Fichiers

### Scripts de Simulation

| Script | Description | Usage |
|--------|-------------|-------|
| [simulate-single-sensor.js](./simulate-single-sensor.js) | Simule un capteur unique qui envoie des mesures continues | `npm run simulate:sensor` |
| [simulate-multiple-sensors.js](./simulate-multiple-sensors.js) | Simule N capteurs en parallèle avec types variés | `npm run simulate:multi -- --count=10` |
| [simulate-crisis-scenarios.js](./simulate-crisis-scenarios.js) | Simule des situations d'urgence (overflow, alerte temp, batterie) | `npm run simulate:crisis -- --scenario=overflow` |
| [load-test.js](./load-test.js) | Test de charge: mesure performance sous stress | `npm run simulate:load-test` |

### Guides & Documentation

| Fichier | Contenu |
|---------|---------|
| [README.md](./README.md) | Index des scripts (ce fichier) |
| [SIMULATION_GUIDE.md](../SIMULATION_GUIDE.md) | Guide complet avec tous les paramètres |
| [WINDOWS_GUIDE.md](./WINDOWS_GUIDE.md) | Guide spécifique pour PowerShell Windows |

---

## 🚀 Démarrage Rapide

### Pour les utilisateurs **Linux/Mac**:
```bash
npm run simulate:sensor
npm run simulate:multi -- --count=10
npm run simulate:crisis -- --scenario=overflow
npm run simulate:load-test
```

### Pour les utilisateurs **Windows PowerShell**:
```powershell
npm run simulate:sensor
npm run simulate:multi -- --count=10
npm run simulate:crisis -- --scenario=overflow
npm run simulate:load-test
```

---

## 📋 Scripts npm Disponibles

```json
{
  "scripts": {
    "simulate:sensor": "node scripts/simulate-single-sensor.js",
    "simulate:multi": "node scripts/simulate-multiple-sensors.js",
    "simulate:crisis": "node scripts/simulate-crisis-scenarios.js",
    "simulate:load-test": "node scripts/load-test.js"
  }
}
```

---

## 🎯 Cas d'Usage Recommandés

### 1. Développement Local
```bash
npm run simulate:sensor
```
**Utilisé pour**: Développer/déboguer les endpoints IoT en local

### 2. Test d'Intégration
```bash
npm run simulate:multi -- --count=5 --duration=60000
```
**Utilisé pour**: Vérifier que les mesures s'insèrent correctement dans la DB

### 3. Test d'Alertes
```bash
npm run simulate:crisis -- --scenario=temperature_alert
npm run simulate:crisis -- --scenario=overflow
```
**Utilisé pour**: Tester que les alertes sont créées correctement

### 4. Test de Performance
```bash
npm run simulate:load-test -- --sensors=100 --rate=1000
```
**Utilisé pour**: Évaluer la performance et stabilité sous charge

---

## 📊 Types de Capteurs Supportés

| Type | Valeur | Unité | Exemple |
|------|--------|-------|---------|
| REMPLISSAGE | 0-100 | % | 87.5 |
| TEMPERATURE | -10 à 50 | °C | 25.3 |
| POIDS | 0-1000 | kg | 250.75 |
| HUMIDITE | 0-100 | %RH | 65.2 |
| GPS | lat,lng | - | 43.6,7.2 |

---

## 🔍 Vérification des Résultats

### Vérifier que ça marche
```bash
# 1. Les logs du service
docker logs ecotrack_iot_service | grep "Measurement recorded"

# 2. Les mesures dans la DB
docker exec ecotrack_container_db psql -U postgres -d ecotrack_container \
  -c "SELECT COUNT(*) FROM mesure;"

# 3. Les événements RabbitMQ
# Accédez à http://localhost:15672 (user: ecotrack, pass: ecotrack123)
```

---

## ⚙️ Configuration Système

### Prérequis
- Node.js 18+
- npm 9+
- Docker Desktop running
- Docker Compose services up (`docker-compose up -d`)

### Installation
```bash
cd backend/services/iot-service
npm install
```

### Vérifier la configuration
```bash
npm run simulate:sensor -- --help
# Affiche les options disponibles
```

---

## 📈 Performance Attendue

| Scénario | Débit | Latence | CPU | Mémoire |
|----------|-------|---------|-----|---------|
| Single Sensor | 0.2 msg/s | 150ms | 5% | 50MB |
| 10 Capteurs | 2 msg/s | 200ms | 15% | 75MB |
| 100 Capteurs | 20 msg/s | 300ms | 40% | 150MB |
| Load Test | 1000+ msg/s | 500ms | 80% | 300MB |

---

## 🛠️ Troubleshooting

| Problème | Solution |
|----------|----------|
| Port 3006 connexion refusée | `docker-compose restart iot-service` |
| npm: command not found | Installer Node.js depuis https://nodejs.org |
| Erreur "Cannot find module 'axios'" | `npm install` dans le répertoire iot-service |
| Les données ne s'insèrent pas | Vérifier que container-service est en running |
| 202 Accepted responses | Normal - container-service temporairement indisponible |

---

## 📚 Documentation Complète

- [SIMULATION_GUIDE.md](../SIMULATION_GUIDE.md) - Guide détaillé avec tous les paramètres
- [WINDOWS_GUIDE.md](./WINDOWS_GUIDE.md) - Guide spécifique Windows PowerShell
- [../README.md](../README.md) - Documentation API IoT-Service
- [../../.github/Architecture.md](../../.github/Architecture.md) - Architecture complète du système

---

## 💡 Conseils

1. **Avant chaque déploiement**: Exécuter au minimum un test de charge
2. **Pour débuger**: Utiliser `simulate-single-sensor.js` avec des logs du service
3. **Pour CI/CD**: Intégrer les tests de charge dans la pipeline
4. **Pour production**: Utiliser les scripts pour load-testing pré-déploiement

---

## 🎓 Exemples de Commandes

```bash
# Capteur unique simple
npm run simulate:sensor

# Capteur TEMPÉRATURE
npm run simulate:sensor -- --type=TEMPERATURE

# 20 capteurs pendant 10 minutes
npm run simulate:multi -- --count=20 --duration=600000

# Scénario débordement
npm run simulate:crisis -- --scenario=overflow

# Test de charge: 500 capteurs à 1000 msg/sec
npm run simulate:load-test -- --sensors=500 --rate=1000

# Via le Gateway (port 3000) au lieu de direct (3006)
npm run simulate:sensor -- --gateway
```

---

## 📞 Support

Si un script ne fonctionne pas:
1. Vérifier que `docker-compose up -d` est lancé
2. Vérifier que `npm install` a été exécuté
3. Lire les logs: `docker logs ecotrack_iot_service`
4. Consulter [WINDOWS_GUIDE.md](./WINDOWS_GUIDE.md) si sur Windows

---

**Version**: 1.0
**Dernière mise à jour**: January 29, 2026
**Plateforme**: Linux, macOS, Windows PowerShell
