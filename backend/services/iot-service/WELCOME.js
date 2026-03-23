#!/usr/bin/env node

/**
 * Bienvenue aux Scripts de Simulation IoT EcoTrack
 * 
 * Ce fichier affiche un guide interactif pour l'utilisation des scripts
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function print(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function printSection(title) {
  console.log();
  print('═'.repeat(70), 'cyan');
  print(`  ${title}`, 'bright');
  print('═'.repeat(70), 'cyan');
}

// Header
console.clear();
print(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║          📡 EcoTrack IoT Sensor Simulation Scripts v1.0              ║
║                                                                      ║
║              Simulate, Test & Monitor IoT Measurements              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`, 'green');

// Quick Start
printSection('🚀 QUICK START');
print(`
npm run simulate:sensor              # Capteur unique (REMPLISSAGE)
npm run simulate:multi -- --count=10 # 10 capteurs parallèles
npm run simulate:crisis -- --scenario=overflow
npm run simulate:load-test           # Test de charge
`, 'yellow');

// Available Scripts
printSection('📡 SCRIPTS DISPONIBLES');
print(`
  1. simulate-single-sensor.js
     Simule UN capteur envoyant des mesures continues
     Types: REMPLISSAGE, TEMPERATURE, POIDS, HUMIDITE, GPS
     
     Exemple:
     npm run simulate:sensor
     npm run simulate:sensor -- --type=TEMPERATURE --interval=2000
     npm run simulate:sensor -- --gateway

  2. simulate-multiple-sensors.js
     Simule N capteurs en parallèle avec types variés
     
     Exemple:
     npm run simulate:multi -- --count=50 --duration=300000
     
  3. simulate-crisis-scenarios.js
     Simule 6 situations d'urgence différentes
     
     Scénarios:
     - overflow: Remplissage 85% → 100%
     - temperature_alert: Température 35°C → 50°C
     - low_battery: Batterie 15% → 0%
     - signal_loss: Signal 100% → 0%
     - burst: Rafale 100 mesures rapides
     - combined: Tous les problèmes en séquence
     
     Exemple:
     npm run simulate:crisis -- --scenario=overflow

  4. load-test.js
     Test de performance: mesure latency, throughput, success rate
     
     Exemple:
     npm run simulate:load-test
     npm run simulate:load-test -- --sensors=500 --rate=1000

`, 'blue');

// Commands by Use Case
printSection('🎯 PAR CAS D\'USAGE');
print(`
  💻 Développement Local:
     npm run simulate:sensor
     
  🔧 Test d'Intégration:
     npm run simulate:multi -- --count=5 --duration=60000
     
  🚨 Test d'Alertes:
     npm run simulate:crisis -- --scenario=overflow
     npm run simulate:crisis -- --scenario=temperature_alert
     
  ⚡ Performance:
     npm run simulate:load-test -- --sensors=100 --rate=500
     
  🔥 Stress Test:
     npm run simulate:load-test -- --sensors=500 --rate=1000 --duration=600000

`, 'green');

// Verification
printSection('🔍 VÉRIFICATION DES RÉSULTATS');
print(`
  ✓ Logs du service:
    docker logs ecotrack_iot_service | grep "Measurement"
    
  ✓ Données en base:
    docker exec ecotrack_container_db psql -U postgres \\
      -d ecotrack_container -c "SELECT COUNT(*) FROM mesure;"
      
  ✓ API Status:
    curl http://localhost:3006/health
    curl http://localhost:3000/api/iot/status
    
  ✓ pgAdmin (Web UI):
    http://localhost:5050
    
  ✓ RabbitMQ (Events):
    http://localhost:15672 (ecotrack/ecotrack123)

`, 'yellow');

// Documentation
printSection('📚 DOCUMENTATION');
print(`
  • SIMULATION_GUIDE.md     - Guide complet avec paramètres
  • WINDOWS_GUIDE.md        - Guide spécifique PowerShell
  • scripts/README.md       - Index et exemples
  • ../../Architecture.md   - Architecture complète du système

`, 'cyan');

// Parameters Reference
printSection('⚙️ PARAMÈTRES DE RÉFÉRENCE');
print(`
  simulate-single-sensor.js:
    --type=REMPLISSAGE|TEMPERATURE|POIDS|HUMIDITE|GPS
    --interval=5000 (milliseconds)
    --gateway (use API Gateway instead of direct)
    
  simulate-multiple-sensors.js:
    --count=10 (number of sensors)
    --interval=5000 (milliseconds between batches)
    --duration=3600000 (total duration in ms)
    
  simulate-crisis-scenarios.js:
    --scenario=overflow|temperature_alert|low_battery|signal_loss|burst|combined
    --container=1 (container ID to test)
    --duration=60000 (milliseconds)
    
  load-test.js:
    --sensors=100 (number of concurrent sensors)
    --rate=1000 (messages per second)
    --duration=300000 (milliseconds)

`, 'blue');

// Performance Expectations
printSection('📊 PERFORMANCE ATTENDUE');
print(`
  1 Capteur:       0.2 msg/s   |  Latency: ~150ms   |  CPU: 5%
  10 Capteurs:     2 msg/s     |  Latency: ~200ms   |  CPU: 15%
  100 Capteurs:    20 msg/s    |  Latency: ~300ms   |  CPU: 40%
  500 Capteurs:    100+ msg/s  |  Latency: ~500ms   |  CPU: 80%

`, 'green');

// Troubleshooting
printSection('🐛 DÉPANNAGE');
print(`
  ❌ Port 3006 refused?
     → docker-compose restart iot-service
     
  ❌ npm command not found?
     → Installer Node.js 18+ depuis nodejs.org
     
  ❌ Cannot find module 'axios'?
     → npm install dans le répertoire iot-service
     
  ❌ Les données ne s'insèrent pas?
     → Vérifier docker ps | grep container-service
     
  ❌ 202 Accepted responses?
     → Normal - container-service temporairement indisponible

`, 'yellow');

// Next Steps
printSection('✨ PROCHAINES ÉTAPES');
print(`
  1. Démarrer les services:
     docker-compose up -d
     
  2. Lancer un capteur simple:
     npm run simulate:sensor
     
  3. Vérifier les logs:
     docker logs -f ecotrack_iot_service
     
  4. Vérifier les données en base:
     docker exec ecotrack_container_db psql -U postgres \\
       -d ecotrack_container -c "SELECT * FROM mesure LIMIT 10;"
       
  5. Exécuter un test de charge:
     npm run simulate:load-test

`, 'green');

// Footer
print('═'.repeat(70), 'cyan');
print(`
Besoin d'aide? Consultez les fichiers documentation mentionnés plus haut.

Version: 1.0
Date: January 29, 2026
Platform: Linux, macOS, Windows PowerShell
`, 'cyan');
print('═'.repeat(70), 'cyan');
console.log();
