#!/usr/bin/env node

/**
 * Simulateur de Capteur IoT Unique
 * Envoie des mesures continues à l'IoT-Service
 * 
 * Usage: node simulate-single-sensor.js [--type=REMPLISSAGE] [--interval=5000] [--gateway]
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const SENSOR_TYPE = process.argv.includes('--type=TEMPERATURE') ? 'TEMPERATURE' :
                    process.argv.includes('--type=POIDS') ? 'POIDS' :
                    process.argv.includes('--type=HUMIDITE') ? 'HUMIDITE' :
                    process.argv.includes('--type=GPS') ? 'GPS' : 'REMPLISSAGE';

const INTERVAL = parseInt(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '5000');
const USE_GATEWAY = process.argv.includes('--gateway');
const BASE_URL = USE_GATEWAY ? 'http://localhost:3000/api/iot' : 'http://localhost:3006/api/iot';
const CONTAINER_ID = 1;
const SENSOR_ID = `SENSOR_${SENSOR_TYPE}_${Math.floor(Math.random() * 1000)}`;

// Générateurs de valeurs selon le type de capteur
const valueGenerators = {
  REMPLISSAGE: () => Math.random() * 100,                    // 0-100%
  TEMPERATURE: () => 15 + Math.random() * 30,               // 15-45°C
  POIDS: () => 50 + Math.random() * 450,                    // 50-500kg
  HUMIDITE: () => 30 + Math.random() * 70,                  // 30-100%RH
  GPS: () => ({
    lat: 43.6 + (Math.random() - 0.5) * 0.1,
    lng: 7.2 + (Math.random() - 0.5) * 0.1
  })
};

const unitMap = {
  REMPLISSAGE: '%',
  TEMPERATURE: '°C',
  POIDS: 'kg',
  HUMIDITE: '%RH',
  GPS: 'lat,lng'
};

let measurementCount = 0;
let successCount = 0;
let errorCount = 0;

async function sendMeasurement() {
  try {
    const valueGen = valueGenerators[SENSOR_TYPE];
    const rawValue = valueGen();
    const valeur = typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue;

    const payload = {
      capteur_id: SENSOR_ID,
      conteneur_id: CONTAINER_ID,
      type_capteur: SENSOR_TYPE,
      valeur: valeur,
      unite: unitMap[SENSOR_TYPE],
      timestamp_capteur: new Date().toISOString(),
      qualite_signal: 80 + Math.random() * 20,  // 80-100%
      batterie: 50 + Math.random() * 50         // 50-100%
    };

    const response = await axios.post(`${BASE_URL}/measure`, payload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    measurementCount++;
    successCount++;

    console.log(`✅ [${new Date().toLocaleTimeString()}] #${measurementCount} ${SENSOR_TYPE}: ${valeur} ${unitMap[SENSOR_TYPE]}`);
    if (response.data.message_id) {
      console.log(`   Message ID: ${response.data.message_id}`);
    }

  } catch (error) {
    measurementCount++;
    errorCount++;
    console.error(`❌ [${new Date().toLocaleTimeString()}] Erreur: ${error.message}`);
    if (error.response?.status === 202) {
      console.log(`   ⚠️  Acceptée (202) - Container-Service temporairement indisponible`);
      successCount++;
      errorCount--;
    }
  }
}

// Afficher les stats toutes les 30 secondes
function printStats() {
  const uptime = Math.floor(process.uptime());
  const rate = (successCount / uptime * 60).toFixed(2);
  console.log(`\n📊 Stats: ${successCount}/${measurementCount} succès | ${rate} msg/min | Uptime: ${uptime}s`);
}

console.log(`
🚀 Simulateur Capteur IoT Démarré
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Endpoint: ${BASE_URL}/measure
🔌 Capteur: ${SENSOR_ID}
📦 Conteneur ID: ${CONTAINER_ID}
📊 Type: ${SENSOR_TYPE}
⏱️  Intervalle: ${INTERVAL}ms
🌐 Mode: ${USE_GATEWAY ? 'Gateway (3000)' : 'Direct (3006)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Appuyez sur CTRL+C pour arrêter
`);

// Démarrer la simulation
setInterval(sendMeasurement, INTERVAL);
setInterval(printStats, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📈 Résumé Final');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total mesures: ${measurementCount}`);
  console.log(`Succès: ${successCount}`);
  console.log(`Erreurs: ${errorCount}`);
  console.log(`Taux de succès: ${((successCount / measurementCount) * 100).toFixed(2)}%`);
  process.exit(0);
});
