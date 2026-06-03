const { v4: uuidv4 } = require('uuid');

/**
 * SEED MASSIVE DATA FOR CONTAINER SERVICE
 * Generates 2000 containers across 500 zones in Paris & Île-de-France
 */

// Paris & Île-de-France localities with real coordinates
// code must be unique — used directly in code_zone to avoid collisions
const IDF_LOCALITIES = [
  { name: 'Paris Centre',         code: 'PC',  lat: 48.8566, lng: 2.3522 },  // 1er-4ème
  { name: 'Paris Est',            code: 'PE',  lat: 48.8530, lng: 2.3790 },  // 11ème-12ème
  { name: 'Paris Nord',           code: 'PN',  lat: 48.8870, lng: 2.3620 },  // 18ème-19ème
  { name: 'Paris Sud',            code: 'PS',  lat: 48.8260, lng: 2.3490 },  // 13ème-14ème
  { name: 'Boulogne-Billancourt', code: 'BB',  lat: 48.8354, lng: 2.2403 },  // 92
  { name: 'Saint-Denis',          code: 'SD',  lat: 48.9363, lng: 2.3573 },  // 93
  { name: 'Versailles',           code: 'VER', lat: 48.8047, lng: 2.1203 },  // 78
  { name: 'Créteil',              code: 'CRT', lat: 48.7764, lng: 2.4556 },  // 94
  { name: 'Nanterre',             code: 'NAN', lat: 48.8921, lng: 2.2066 },  // 92
  { name: 'Évry-Courcouronnes',   code: 'EVR', lat: 48.6303, lng: 2.4428 },  // 91
];

const CONTAINER_TYPES = ['standard', 'selective', 'organic', 'hazardous'];
const CONTAINER_STATUS = ['actif', 'maintenance', 'retire'];

function generateZoneCoordinates(baseLat, baseLng) {
  // ±0.04 degrees ≈ ±4km — reste dans la même commune
  const latOffset = (Math.random() - 0.5) * 0.08;
  const lngOffset = (Math.random() - 0.5) * 0.08;
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
  };
}

function generateFillPercentage() {
  const rand = Math.random();
  if (rand < 0.1) return Math.random() * 100;
  if (rand < 0.2) return 80 + Math.random() * 20;
  return 20 + Math.random() * 50;
}

async function seedMassiveData(sequelize) {
  try {
    const Zone = sequelize.models.Zone;
    const Conteneur = sequelize.models.Conteneur;
    const Capteur = sequelize.models.Capteur;
    const Mesure = sequelize.models.Mesure;

    const existingZones = await Zone.count();
    const existingCapteurs = await Capteur.count();
    const EXPECTED_CAPTEURS = 6000; // 2000 containers × 3 types

    if (existingZones > 0 && existingCapteurs >= EXPECTED_CAPTEURS) {
      console.log('✓ Database already seeded. Skipping...');
      return;
    }

    if (existingZones > 0 || existingCapteurs > 0) {
      console.log('⚠️  Seed obsolète détecté (capteurs IoT manquants). Nettoyage en cours...');
      await Mesure.destroy({ truncate: true, cascade: true });
      await Capteur.destroy({ truncate: true, cascade: true });
      await Conteneur.destroy({ truncate: true, cascade: true });
      await Zone.destroy({ truncate: true, cascade: true });
      console.log('✓ Tables vidées, re-seed en cours...\n');
    }

    console.log('🌱 STARTING MASSIVE SEED (Paris & Île-de-France) - Please wait...\n');
    console.log('═══════════════════════════════════════════════════════════');

    // ============ PHASE 1: CREATE 500 ZONES ============
    console.log('PHASE 1: Creating 500 zones...');
    const zoneStartTime = Date.now();

    const zones = [];
    let zoneIndex = 1;

    for (const locality of IDF_LOCALITIES) {
      // 50 zones per locality
      for (let i = 0; i < 50; i++) {
        const coords = generateZoneCoordinates(locality.lat, locality.lng);

        zones.push({
          id: uuidv4(),
          nom: `${locality.name} - Secteur ${i + 1}`,
          code_zone: `ZONE-${locality.code}-${String(i + 1).padStart(3, '0')}`,
          latitude: coords.latitude,
          longitude: coords.longitude,
          population_estimee: 1000 + Math.floor(Math.random() * 5000),
          description: `Zone de collecte ${i + 1} — ${locality.name}`,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (zoneIndex % 50 === 0) {
          console.log(`   ⏳ ${zoneIndex}/500 zones créées...`);
        }
        zoneIndex++;
      }
    }

    await Zone.bulkCreate(zones, { batchSize: 100, logging: false });

    const zoneDuration = Date.now() - zoneStartTime;
    console.log(`✓ Zones créées en ${(zoneDuration / 1000).toFixed(2)}s\n`);

    // ============ PHASE 2: CREATE 2000 CONTAINERS ============
    console.log('📦 PHASE 2: Creating 2000 containers (4 per zone)...');
    const containerStartTime = Date.now();

    const containers = [];
    let containerIndex = 1;

    for (const zone of zones) {
      for (let c = 0; c < 4; c++) {
        const containerLat = zone.latitude + (Math.random() - 0.5) * 0.01;
        const containerLng = zone.longitude + (Math.random() - 0.5) * 0.01;

        containers.push({
          id: uuidv4(),
          code_conteneur: `CONT-${containerIndex.toString().padStart(5, '0')}`,
          type_conteneur: CONTAINER_TYPES[Math.floor(Math.random() * CONTAINER_TYPES.length)],
          capacite: [60, 120, 150, 240][Math.floor(Math.random() * 4)],
          latitude: containerLat,
          longitude: containerLng,
          statut: CONTAINER_STATUS[Math.floor(Math.random() * CONTAINER_STATUS.length)],
          date_installation: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          id_zone: zone.id,
          notes: `Conteneur de la zone ${zone.code_zone}`,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (containerIndex % 200 === 0) {
          console.log(`   ⏳ ${containerIndex}/2000 containers créés...`);
        }
        containerIndex++;
      }
    }

    await Conteneur.bulkCreate(containers, { batchSize: 100, logging: false });

    const containerDuration = Date.now() - containerStartTime;
    console.log(`✓ Containers créés en ${(containerDuration / 1000).toFixed(2)}s\n`);

    // ============ PHASE 3: CREATE 3 CAPTEURS PER CONTAINER (6000 total) ============
    console.log('📡 PHASE 3: Creating 3 IoT sensors per container (6000 total)...');
    const capteurStartTime = Date.now();

    const SENSOR_TYPES = ['REMPLISSAGE', 'TEMPERATURE', 'SIGNAL'];
    const capteurs = [];
    // Map containerId → { REMPLISSAGE: id, TEMPERATURE: id, SIGNAL: id }
    const capteurMap = new Map();

    for (const container of containers) {
      const ids = {};
      for (const type of SENSOR_TYPES) {
        const id = uuidv4();
        ids[type] = id;
        capteurs.push({
          id,
          code_capteur: `CAPT-${container.code_conteneur}-${type.substring(0, 4)}`,
          type,
          id_conteneur: container.id,
          statut: 'ACTIF',
          batterie: 70 + Math.floor(Math.random() * 30),
          derniere_mesure_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      capteurMap.set(container.id, ids);
    }

    await Capteur.bulkCreate(capteurs, { batchSize: 200, logging: false });

    const capteurDuration = Date.now() - capteurStartTime;
    console.log(`✓ Capteurs créés en ${(capteurDuration / 1000).toFixed(2)}s\n`);

    // ============ PHASE 4: CREATE INITIAL MEASUREMENTS ============
    console.log('📊 PHASE 4: Creating initial measurements (2000)...');
    const measureStartTime = Date.now();

    const measures = [];
    let measureIndex = 1;

    for (const container of containers) {
      const fillPercentage = generateFillPercentage();
      const capteurIds = capteurMap.get(container.id);

      measures.push({
        id: uuidv4(),
        date_mesure: new Date(),
        id_conteneur: container.id,
        id_capteur: capteurIds ? capteurIds['REMPLISSAGE'] : null,
        taux_remplissage: Math.min(100, Math.max(0, fillPercentage)),
        temperature: 5 + Math.random() * 20,
        batterie: 40 + Math.floor(Math.random() * 60),
        signal_force: -100 + Math.floor(Math.random() * 40),
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (measureIndex % 500 === 0) {
        console.log(`   ⏳ ${measureIndex}/2000 mesures créées...`);
      }
      measureIndex++;
    }

    await Mesure.bulkCreate(measures, { batchSize: 100, logging: false });

    const measureDuration = Date.now() - measureStartTime;
    console.log(`✓ Mesures créées en ${(measureDuration / 1000).toFixed(2)}s\n`);

    // ============ SUMMARY ============
    const totalTime = (zoneDuration + containerDuration + capteurDuration + measureDuration) / 1000;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MASSIVE SEED TERMINÉ AVEC SUCCÈS!\n');
    console.log('📈 STATISTIQUES:');
    console.log(`   • Zones: ${zones.length}`);
    console.log(`   • Containers: ${containers.length}`);
    console.log(`   • Capteurs IoT: ${capteurs.length} (3 par container)`);
    console.log(`   • Mesures: ${measures.length}`);
    console.log(`   • Total: ${zones.length + containers.length + capteurs.length + measures.length} enregistrements`);
    console.log(`   • Durée totale: ${totalTime.toFixed(2)}s\n`);

    console.log('🗺️  DISTRIBUTION GÉOGRAPHIQUE (Paris & Île-de-France):');
    for (const locality of IDF_LOCALITIES) {
      const localityContainers = containers.filter(c => {
        const zone = zones.find(z => z.id === c.id_zone);
        return zone && zone.nom.includes(locality.name);
      });
      console.log(`   • ${locality.name}: ${localityContainers.length} containers`);
    }

    console.log('\n📊 RÉPARTITION DES TAUX DE REMPLISSAGE:');
    const lowFill = measures.filter(m => m.taux_remplissage < 30).length;
    const normalFill = measures.filter(m => m.taux_remplissage >= 30 && m.taux_remplissage < 80).length;
    const highFill = measures.filter(m => m.taux_remplissage >= 80).length;
    console.log(`   • Bas (<30%): ${lowFill} containers`);
    console.log(`   • Normal (30-80%): ${normalFill} containers`);
    console.log(`   • Élevé (>80%): ${highFill} containers ⚠️`);

    console.log('\n💾 ÉTAT BASE DE DONNÉES:');
    console.log(`   • Zones: ${await Zone.count()} total`);
    console.log(`   • Containers: ${await Conteneur.count()} total`);
    console.log(`   • Capteurs IoT: ${await Capteur.count()} total`);
    console.log(`   • Mesures: ${await Mesure.count()} total`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return { zones: zones.length, containers: containers.length, measures: measures.length };

  } catch (error) {
    console.error('❌ Erreur lors du seed massif:', error);
    throw error;
  }
}

module.exports = { seedMassiveData };
