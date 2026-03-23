#!/usr/bin/env node

/**
 * Simulateur Multi-Capteurs IoT
 * Simule N capteurs de différents types envoyant des mesures en parallèle
 * 
 * Usage: node simulate-multiple-sensors.js [--count=10] [--interval=5000] [--duration=3600000]
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const SENSOR_COUNT = parseInt(process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || '10');
const INTERVAL = parseInt(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '5000');
const DURATION = parseInt(process.argv.find(arg => arg.startsWith('--duration='))?.split('=')[1] || '3600000');
const BASE_URL = 'http://localhost:3006/api/iot';

const SENSOR_TYPES = ['REMPLISSAGE', 'TEMPERATURE', 'POIDS', 'HUMIDITE'];
const CONTAINER_IDS = [1, 2, 3, 4, 5];

// Générateurs de valeurs
const valueGenerators = {
  REMPLISSAGE: () => Math.random() * 100,
  TEMPERATURE: () => 15 + Math.random() * 30,
  POIDS: () => 50 + Math.random() * 450,
  HUMIDITE: () => 30 + Math.random() * 70
};

const unitMap = {
  REMPLISSAGE: '%',
  TEMPERATURE: '°C',
  POIDS: 'kg',
  HUMIDITE: '%RH'
};

// Créer capteurs avec types variés
const sensors = Array.from({ length: SENSOR_COUNT }, (_, i) => ({
  id: `SENSOR_${i + 1}`,
  type: SENSOR_TYPES[i % SENSOR_TYPES.length],
  container_id: CONTAINER_IDS[i % CONTAINER_IDS.length],
  measurements: 0,
  success: 0,
  errors: 0
}));

let totalMeasurements = 0;
let totalSuccess = 0;
let totalErrors = 0;

async function sendMeasurement(sensor) {
  try {
    const valueGen = valueGenerators[sensor.type];
    const valeur = valueGen();

    const payload = {
      capteur_id: sensor.id,
      conteneur_id: sensor.container_id,
      type_capteur: sensor.type,
      valeur: valeur,
      unite: unitMap[sensor.type],
      timestamp_capteur: new Date().toISOString(),
      qualite_signal: 75 + Math.random() * 25,
      batterie: 40 + Math.random() * 60
    };

    const response = await axios.post(`${BASE_URL}/measure`, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    sensor.measurements++;
    sensor.success++;
    totalMeasurements++;
    totalSuccess++;

  } catch (error) {
    sensor.measurements++;
    sensor.errors++;
    totalMeasurements++;
    totalErrors++;

    if (error.response?.status === 202) {
      sensor.success++;
      totalSuccess++;
      sensor.errors--;
      totalErrors--;
    }
  }
}

// Boucle de simulation
async function runSimulation() {
  const startTime = Date.now();
  const endTime = startTime + DURATION;

  console.log(`
🚀 Simulateur Multi-Capteurs IoT Démarré
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Nombre de capteurs: ${SENSOR_COUNT}
⏱️  Intervalle d'envoi: ${INTERVAL}ms
⏳ Durée maximale: ${(DURATION / 60000).toFixed(1)}min
📍 Types: ${SENSOR_TYPES.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Capteurs configurés:
`);

  sensors.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.id.padEnd(15)} | Type: ${s.type.padEnd(12)} | Conteneur: ${s.container_id}`);
  });

  console.log('\n📡 Simulation en cours...\n');

  // Envoyer des mesures pour chaque capteur
  const sensorInterval = setInterval(() => {
    sensors.forEach(sensor => {
      sendMeasurement(sensor);
    });
  }, INTERVAL);

  // Afficher les stats toutes les 10 secondes
  const statsInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = (totalSuccess / elapsed * 60).toFixed(2);

    console.clear();
    console.log(`
📊 STATISTIQUES (Temps écoulé: ${elapsed.toFixed(0)}s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${totalMeasurements} | ✅ ${totalSuccess} | ❌ ${totalErrors} | Rate: ${rate} msg/min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Détails par capteur:
${sensors.map(s => 
  `${s.id.padEnd(15)} | ${s.type.padEnd(12)} | Total: ${s.measurements.toString().padStart(4)} | ✅ ${s.success.toString().padStart(3)} | ❌ ${s.errors.toString().padStart(3)}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Appuyez sur CTRL+C pour arrêter
`);
  }, 10000);

  // Vérifier si duration atteinte
  const durationCheck = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(sensorInterval);
      clearInterval(statsInterval);
      clearInterval(durationCheck);
      printFinalStats();
    }
  }, 1000);
}

function printFinalStats() {
  const totalRate = sensors.reduce((sum, s) => sum + s.success, 0);
  const avgSuccessRate = ((totalSuccess / totalMeasurements) * 100).toFixed(2);

  console.log(`

╔════════════════════════════════════════════════════════════════════════╗
║                       📈 RAPPORT FINAL                                 ║
╠════════════════════════════════════════════════════════════════════════╣
║ Total de mesures envoyées: ${totalMeasurements.toString().padEnd(47)} ║
║ Succès: ${totalSuccess.toString().padEnd(66)} ║
║ Erreurs: ${totalErrors.toString().padEnd(66)} ║
║ Taux de succès: ${avgSuccessRate}%${' '.repeat(63 - avgSuccessRate.length)} ║
╠════════════════════════════════════════════════════════════════════════╣
║ Détails par capteur:                                                   ║
║${' '.repeat(76)}║
${sensors.map(s => {
  const rate = s.measurements > 0 ? ((s.success / s.measurements) * 100).toFixed(1) : '0';
  return `║ ${s.id.padEnd(15)} | Type: ${s.type.padEnd(10)} | Mesures: ${s.measurements.toString().padStart(4)} | Succès: ${rate}%${' '.repeat(33 - s.type.length - s.id.length)}║`;
}).join('\n')}
╚════════════════════════════════════════════════════════════════════════╝
`);

  process.exit(0);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Arrêt de la simulation...');
  printFinalStats();
});

// Démarrer
runSimulation();
