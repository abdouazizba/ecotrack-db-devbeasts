#!/usr/bin/env node

/**
 * Script de Test de Charge IoT
 * Teste la performance et la stabilité sous charge élevée
 * 
 * Usage: node load-test.js [--sensors=100] [--duration=300000] [--rate=1000]
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const SENSOR_COUNT = parseInt(process.argv.find(arg => arg.startsWith('--sensors='))?.split('=')[1] || '100');
const DURATION = parseInt(process.argv.find(arg => arg.startsWith('--duration='))?.split('=')[1] || '300000');
const RATE = parseInt(process.argv.find(arg => arg.startsWith('--rate='))?.split('=')[1] || '1000');

const BASE_URL = 'http://localhost:3006/api/iot';
const SENSOR_TYPES = ['REMPLISSAGE', 'TEMPERATURE', 'POIDS', 'HUMIDITE'];

let stats = {
  total: 0,
  success: 0,
  errors: 0,
  responses: [],
  minTime: Infinity,
  maxTime: 0,
  totalTime: 0,
  startTime: 0,
  endTime: 0
};

async function sendMeasurement(sensorIndex) {
  const startTime = performance.now();
  
  try {
    const sensorType = SENSOR_TYPES[sensorIndex % SENSOR_TYPES.length];
    const payload = {
      capteur_id: `LOAD_TEST_${sensorIndex}`,
      conteneur_id: (sensorIndex % 10) + 1,
      type_capteur: sensorType,
      valeur: Math.random() * 100,
      unite: '%',
      qualite_signal: 85,
      batterie: 75
    };

    const response = await axios.post(`${BASE_URL}/measure`, payload, {
      timeout: 5000
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    stats.total++;
    stats.success++;
    stats.totalTime += responseTime;
    stats.minTime = Math.min(stats.minTime, responseTime);
    stats.maxTime = Math.max(stats.maxTime, responseTime);
    stats.responses.push(responseTime);

  } catch (error) {
    stats.total++;
    if (error.response?.status === 202) {
      stats.success++;
    } else {
      stats.errors++;
    }
  }
}

async function runLoadTest() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    🔥 TEST DE CHARGE IoT                           ║
╠════════════════════════════════════════════════════════════════════╣
║ Capteurs simultanés: ${SENSOR_COUNT.toString().padEnd(49)}║
║ Durée du test: ${(DURATION / 1000).toFixed(1)} secondes${' '.repeat(46 - (DURATION / 1000).toFixed(1).length)}║
║ Taux de mesures: ${RATE} msg/sec${' '.repeat(48 - RATE.toString().length)}║
║ Mesures totales estimées: ${(RATE * (DURATION / 1000)).toFixed(0)}${' '.repeat(41 - (RATE * (DURATION / 1000)).toFixed(0).toString().length)}║
╚════════════════════════════════════════════════════════════════════╝

📡 Démarrage du test de charge...
`);

  stats.startTime = Date.now();
  const endTime = stats.startTime + DURATION;
  let requestCount = 0;

  // Stats en temps réel
  const statsInterval = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const avgTime = stats.success > 0 ? (stats.totalTime / stats.success).toFixed(2) : 0;
    const rate = (stats.total / elapsed).toFixed(2);

    console.clear();
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              📊 STATISTIQUES EN TEMPS RÉEL (${elapsed.toFixed(1)}s)
╠════════════════════════════════════════════════════════════════════╣
║ Total reqûetes: ${stats.total.toString().padEnd(55)}║
║ Succès: ${stats.success.toString().padEnd(61)}║
║ Erreurs: ${stats.errors.toString().padEnd(60)}║
║ Taux: ${rate.toString().padEnd(63)}msg/sec║
║${' '.repeat(66)}║
║ Temps de réponse:${' '.repeat(48)}║
║   Min: ${stats.minTime.toFixed(2)}ms${' '.repeat(56 - stats.minTime.toFixed(2).length)}║
║   Max: ${stats.maxTime.toFixed(2)}ms${' '.repeat(56 - stats.maxTime.toFixed(2).length)}║
║   Avg: ${avgTime}ms${' '.repeat(57 - avgTime.toString().length)}║
╚════════════════════════════════════════════════════════════════════╝
`);
  }, 2000);

  // Envoi des mesures
  const sendInterval = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(sendInterval);
      clearInterval(statsInterval);
      printFinalReport();
      return;
    }

    // Envoyer RATE messages par seconde
    for (let i = 0; i < (RATE / 10); i++) {
      const sensorIndex = requestCount++;
      sendMeasurement(sensorIndex);
    }
  }, 100);
}

function calculatePercentile(arr, percentile) {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function printFinalReport() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const avgTime = stats.success > 0 ? (stats.totalTime / stats.success).toFixed(2) : 0;
  const p50 = calculatePercentile([...stats.responses], 50).toFixed(2);
  const p95 = calculatePercentile([...stats.responses], 95).toFixed(2);
  const p99 = calculatePercentile([...stats.responses], 99).toFixed(2);
  const throughput = (stats.total / elapsed).toFixed(2);
  const successRate = ((stats.success / stats.total) * 100).toFixed(2);

  console.log(`

╔════════════════════════════════════════════════════════════════════╗
║                   📈 RAPPORT FINAL DU TEST                         ║
╠════════════════════════════════════════════════════════════════════╣
║ RÉSULTATS GLOBAUX                                                  ║
║  Total reqûetes: ${stats.total.toString().padEnd(52)}║
║  Succès: ${stats.success.toString().padEnd(60)}║
║  Erreurs: ${stats.errors.toString().padEnd(59)}║
║  Taux de succès: ${successRate}%${' '.repeat(48 - successRate.length)}║
║  Durée: ${elapsed.toFixed(1)}s${' '.repeat(57 - elapsed.toFixed(1).length)}║
║  Débit: ${throughput} req/sec${' '.repeat(49 - throughput.length)}║
║                                                                    ║
║ TEMPS DE RÉPONSE (ms)                                              ║
║  Min: ${stats.minTime.toFixed(2)}${' '.repeat(56 - stats.minTime.toFixed(2).length)}║
║  Max: ${stats.maxTime.toFixed(2)}${' '.repeat(56 - stats.maxTime.toFixed(2).length)}║
║  Avg: ${avgTime}${' '.repeat(57 - avgTime.toString().length)}║
║  P50: ${p50}${' '.repeat(57 - p50.length)}║
║  P95: ${p95}${' '.repeat(57 - p95.length)}║
║  P99: ${p99}${' '.repeat(57 - p99.length)}║
║                                                                    ║
║ VERDICT:${' '.repeat(57)}║
║${successRate > 95 ? '  ✅ Excellent (>95%)' : successRate > 90 ? '  🟢 Bon (>90%)' : '  🟡 Acceptable'}${' '.repeat(45 - (successRate > 95 ? 20 : successRate > 90 ? 17 : 15))}║
╚════════════════════════════════════════════════════════════════════╝
`);

  process.exit(0);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Arrêt du test de charge...');
  printFinalReport();
});

runLoadTest();
