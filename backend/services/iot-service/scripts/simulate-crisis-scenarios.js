#!/usr/bin/env node

/**
 * Simulateur de Scénarios de Crise IoT
 * Simule des situations d'urgence: débordement, panne capteur, batterie faible, etc.
 * 
 * Usage: node simulate-crisis-scenarios.js [--scenario=overflow] [--container=1] [--duration=60000]
 */

const axios = require('axios');

// Configuration
const SCENARIO = process.argv.find(arg => arg.startsWith('--scenario='))?.split('=')[1] || 'overflow';
const CONTAINER_ID = parseInt(process.argv.find(arg => arg.startsWith('--container='))?.split('=')[1] || '1');
const DURATION = parseInt(process.argv.find(arg => arg.startsWith('--duration='))?.split('=')[1] || '60000');
const BASE_URL = 'http://localhost:3006/api/iot';

const SCENARIOS = {
  overflow: {
    name: '🚨 Débordement Conteneur',
    description: 'Simulation de débordement (remplissage > 95%)',
    duration: 10000,
    run: async () => {
      for (let i = 0; i < 10; i++) {
        const valeur = 85 + (i * 1.5);
        await sendMeasurement({
          capteur_id: 'SENSOR_OVERFLOW',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'REMPLISSAGE',
          valeur: valeur,
          unite: '%',
          qualite_signal: 95,
          batterie: 90
        });
        await sleep(1000);
      }
    }
  },

  temperature_alert: {
    name: '🔥 Alerte Température',
    description: 'Simulation de température critique',
    duration: 15000,
    run: async () => {
      // Augmentation progressive
      for (let i = 0; i < 15; i++) {
        const temp = 35 + (i * 1.2);
        await sendMeasurement({
          capteur_id: 'SENSOR_TEMP_ALERT',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'TEMPERATURE',
          valeur: temp,
          unite: '°C',
          qualite_signal: 85,
          batterie: 85
        });
        await sleep(1000);
      }
    }
  },

  low_battery: {
    name: '🔋 Batterie Faible',
    description: 'Capteur avec batterie dégradée (5-15%)',
    duration: 20000,
    run: async () => {
      for (let i = 0; i < 20; i++) {
        const battery = 15 - i;
        const signal = 50 - (i * 2);
        await sendMeasurement({
          capteur_id: 'SENSOR_LOW_BATTERY',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'POIDS',
          valeur: 200 + Math.random() * 50,
          unite: 'kg',
          qualite_signal: Math.max(5, signal),
          batterie: Math.max(0, battery)
        });
        await sleep(1000);
      }
    }
  },

  signal_loss: {
    name: '📡 Perte de Signal',
    description: 'Qualité de signal dégradée (jusqu\'à 0%)',
    duration: 15000,
    run: async () => {
      for (let i = 0; i < 15; i++) {
        const signal = 100 - (i * 7);
        await sendMeasurement({
          capteur_id: 'SENSOR_SIGNAL_LOSS',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'HUMIDITE',
          valeur: 50 + Math.random() * 30,
          unite: '%RH',
          qualite_signal: Math.max(0, signal),
          batterie: 80
        });
        console.log(`   Signal: ${Math.max(0, signal)}%`);
        await sleep(1000);
      }
    }
  },

  burst: {
    name: '💥 Rafale de Mesures',
    description: 'Envoi rapide de 100 mesures (test de charge)',
    duration: 10000,
    run: async () => {
      for (let i = 0; i < 100; i++) {
        await sendMeasurement({
          capteur_id: `SENSOR_BURST_${i}`,
          conteneur_id: CONTAINER_ID,
          type_capteur: ['REMPLISSAGE', 'TEMPERATURE', 'POIDS', 'HUMIDITE'][i % 4],
          valeur: Math.random() * 100,
          unite: '%',
          qualite_signal: 90,
          batterie: 80
        });
        if ((i + 1) % 10 === 0) {
          console.log(`   ${i + 1}/100 mesures envoyées`);
        }
      }
    }
  },

  combined: {
    name: '🌪️  Scénario Combiné',
    description: 'Combinaison de tous les problèmes',
    duration: 30000,
    run: async () => {
      // Phase 1: Débordement
      console.log('   Phase 1: Débordement...');
      for (let i = 0; i < 5; i++) {
        await sendMeasurement({
          capteur_id: 'SENSOR_COMBINED',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'REMPLISSAGE',
          valeur: 85 + (i * 3),
          unite: '%',
          qualite_signal: 90,
          batterie: 80 - (i * 5)
        });
        await sleep(1000);
      }

      // Phase 2: Température monte
      console.log('   Phase 2: Température augmente...');
      for (let i = 0; i < 5; i++) {
        await sendMeasurement({
          capteur_id: 'SENSOR_COMBINED',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'TEMPERATURE',
          valeur: 30 + (i * 3),
          unite: '°C',
          qualite_signal: 80 - (i * 5),
          batterie: 50 - (i * 5)
        });
        await sleep(1000);
      }

      // Phase 3: Batterie critique + signal faible
      console.log('   Phase 3: Batterie critique...');
      for (let i = 0; i < 5; i++) {
        await sendMeasurement({
          capteur_id: 'SENSOR_COMBINED',
          conteneur_id: CONTAINER_ID,
          type_capteur: 'POIDS',
          valeur: 200 + Math.random() * 100,
          unite: 'kg',
          qualite_signal: Math.max(0, 30 - (i * 10)),
          batterie: Math.max(0, 20 - (i * 5))
        });
        await sleep(1000);
      }
    }
  }
};

async function sendMeasurement(data) {
  try {
    const response = await axios.post(`${BASE_URL}/measure`, data, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Mesure envoyée: ${data.type_capteur} = ${data.valeur}${data.unite}`);
  } catch (error) {
    if (error.response?.status === 202) {
      console.log(`⚠️  Acceptée (202): ${data.type_capteur} = ${data.valeur}${data.unite}`);
    } else {
      console.error(`❌ Erreur: ${error.message}`);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runScenario() {
  const scenario = SCENARIOS[SCENARIO];
  
  if (!scenario) {
    console.error(`❌ Scénario inconnu: ${SCENARIO}`);
    console.log(`\nScénarios disponibles:`);
    Object.entries(SCENARIOS).forEach(([key, value]) => {
      console.log(`  • ${key}: ${value.description}`);
    });
    process.exit(1);
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   ${scenario.name}
║${' '.repeat(62)}║
║ ${scenario.description}${' '.repeat(60 - scenario.description.length)}║
╠════════════════════════════════════════════════════════════════╣
║ Conteneur: ${CONTAINER_ID.toString().padEnd(58)}║
║ Durée estimée: ${scenario.duration}ms${' '.repeat(45 - scenario.duration.toString().length)}║
║${' '.repeat(62)}║
║ Appuyez sur CTRL+C pour arrêter${' '.repeat(29)}║
╚════════════════════════════════════════════════════════════════╝
`);

  try {
    await scenario.run();
    console.log('\n✅ Scénario complété!\n');
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution du scénario:', error.message);
  }

  process.exit(0);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Arrêt du scénario...');
  process.exit(0);
});

runScenario();
