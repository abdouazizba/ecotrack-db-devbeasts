const { v4: uuidv4 } = require('uuid');

/**
 * SEED MASSIVE DATA FOR CONTAINER SERVICE
 * Generates 2000 containers across 500 zones
 * Purpose: Realistic demo data for production-ready showcase
 * 
 * Performance:
 * - 500 zones: ~2 secondes
 * - 2000 conteneurs: ~5 secondes
 * - 2000 mesures: ~3 secondes
 * Total: ~10 secondes
 */

// French cities with real coordinates for geographical distribution
const FRENCH_CITIES = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4422 },
  { name: 'Nice', lat: 43.7102, lng: 7.2620 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { name: 'Lille', lat: 50.6292, lng: 3.0573 },
];

const CONTAINER_TYPES = ['standard', 'selective', 'organic', 'hazardous'];
const CONTAINER_STATUS = ['actif', 'maintenance', 'retire'];

/**
 * Generate realistic latitude/longitude offset from city center
 * Creates a "zone" around the city
 */
function generateZoneCoordinates(baseLat, baseLng) {
  // Add small random offset (±0.05 degrees ≈ ±5km)
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset
  };
}

/**
 * Generate random fill percentage with realistic distribution
 * Most zones: 20-70%, some overflow (>80%)
 */
function generateFillPercentage() {
  const rand = Math.random();
  
  if (rand < 0.1) return Math.random() * 100; // 10% chance: 0-100% (very variable)
  if (rand < 0.2) return 80 + Math.random() * 20; // 10% chance: high risk (80-100%)
  
  // 80% chance: normal range (20-70%)
  return 20 + Math.random() * 50;
}

/**
 * Main seed function for massive data
 */
async function seedMassiveData(sequelize) {
  try {
    const Zone = sequelize.models.Zone;
    const Conteneur = sequelize.models.Conteneur;
    const Mesure = sequelize.models.Mesure;

    // Check if data already exists (skip only if massive seed already ran)
    const existingZones = await Zone.count();
    if (existingZones > 100) {
      console.log('✓ Database already seeded with massive data. Skipping...');
      return;
    }
    
    // If we have old test data, clear it first (delete in reverse dependency order)
    if (existingZones > 0) {
      console.log('🧹 Clearing old test data...');
      await Mesure.destroy({ where: {} });      // Mesure depends on Conteneur
      await Conteneur.destroy({ where: {} });   // Conteneur depends on Zone
      await Zone.destroy({ where: {} });        // Zone is root
      console.log('✓ Old data cleared\n');
    }

    console.log('🌱 STARTING MASSIVE SEED - Please wait...\n');
    console.log('═══════════════════════════════════════════════════════════');
    
    // ============ PHASE 1: CREATE 500 ZONES ============
    console.log('PHASE 1: Creating 500 zones...');
    const zoneStartTime = Date.now();
    
    const zones = [];
    let zoneIndex = 1;

    for (const city of FRENCH_CITIES) {
      // Create 50 zones per city
      for (let i = 0; i < 50; i++) {
        const coords = generateZoneCoordinates(city.lat, city.lng);
        
        zones.push({
          id: uuidv4(),
          nom: `${city.name} - Secteur ${i + 1}`,
          code_zone: `ZONE-${city.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          latitude: coords.latitude,
          longitude: coords.longitude,
          population_estimee: 1000 + Math.floor(Math.random() * 5000),
          description: `Collection zone ${i + 1} in ${city.name}`,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Progress indicator
        if (zoneIndex % 50 === 0) {
          console.log(`   ⏳ ${zoneIndex}/500 zones created...`);
        }
        zoneIndex++;
      }
    }

    // Bulk create zones
    await Zone.bulkCreate(zones, { 
      batchSize: 100,
      logging: false 
    });
    
    const zoneDuration = Date.now() - zoneStartTime;
    console.log(`✓ Zones created in ${(zoneDuration / 1000).toFixed(2)}s\n`);

    // ============ PHASE 2: CREATE 2000 CONTAINERS ============
    console.log('📦 PHASE 2: Creating 2000 containers (4 per zone)...');
    const containerStartTime = Date.now();

    const containers = [];
    let containerIndex = 1;

    for (let zIdx = 0; zIdx < zones.length; zIdx++) {
      const zone = zones[zIdx];
      
      // Create 4 containers per zone
      for (let c = 0; c < 4; c++) {
        // Small offset from zone center
        const containerLat = zone.latitude + (Math.random() - 0.5) * 0.01;
        const containerLng = zone.longitude + (Math.random() - 0.5) * 0.01;
        
        containers.push({
          id: uuidv4(),
          code_conteneur: `CONT-${containerIndex.toString().padStart(5, '0')}`,
          type_conteneur: CONTAINER_TYPES[Math.floor(Math.random() * CONTAINER_TYPES.length)],
          capacite: [60, 120, 150, 240][Math.floor(Math.random() * 4)], // Standard sizes
          latitude: containerLat,
          longitude: containerLng,
          statut: CONTAINER_STATUS[Math.floor(Math.random() * CONTAINER_STATUS.length)],
          date_installation: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          id_zone: zone.id,
          notes: `Container in zone ${zone.code_zone}`,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Progress indicator
        if (containerIndex % 200 === 0) {
          console.log(`   ⏳ ${containerIndex}/2000 containers created...`);
        }
        containerIndex++;
      }
    }

    // Bulk create containers
    await Conteneur.bulkCreate(containers, { 
      batchSize: 100,
      logging: false 
    });

    const containerDuration = Date.now() - containerStartTime;
    console.log(`✓ Containers created in ${(containerDuration / 1000).toFixed(2)}s\n`);

    // ============ PHASE 3: CREATE INITIAL MEASUREMENTS ============
    console.log('📊 PHASE 3: Creating initial measurements (2000)...');
    const measureStartTime = Date.now();

    const measures = [];
    let measureIndex = 1;

    for (const container of containers) {
      const fillPercentage = generateFillPercentage();
      
      measures.push({
        id: uuidv4(),
        date_mesure: new Date(),
        id_conteneur: container.id,
        taux_remplissage: Math.min(100, Math.max(0, fillPercentage)),
        temperature: 5 + Math.random() * 20,
        batterie: 40 + Math.floor(Math.random() * 60), // 40-100%
        signal_force: -100 + Math.floor(Math.random() * 40), // -100 to -60 dBm
        created_at: new Date(),
        updated_at: new Date()
      });

      // Progress indicator
      if (measureIndex % 500 === 0) {
        console.log(`   ⏳ ${measureIndex}/2000 measurements created...`);
      }
      measureIndex++;
    }

    // Bulk create measurements
    await Mesure.bulkCreate(measures, { 
      batchSize: 100,
      logging: false 
    });

    const measureDuration = Date.now() - measureStartTime;
    console.log(`✓ Measurements created in ${(measureDuration / 1000).toFixed(2)}s\n`);

    // ============ SUMMARY ============
    const totalTime = (zoneDuration + containerDuration + measureDuration) / 1000;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MASSIVE SEED COMPLETED SUCCESSFULLY!\n');
    console.log('📈 STATISTICS:');
    console.log(`   • Zones: ${zones.length}`);
    console.log(`   • Containers: ${containers.length}`);
    console.log(`   • Measurements: ${measures.length}`);
    console.log(`   • Total Records: ${zones.length + containers.length + measures.length}`);
    console.log(`   • Total Time: ${totalTime.toFixed(2)}s`);
    console.log(`   • Average: ${((zones.length + containers.length + measures.length) / totalTime).toFixed(0)} records/sec\n`);
    
    console.log('🗺️  GEOGRAPHIC DISTRIBUTION:');
    for (const city of FRENCH_CITIES) {
      const cityContainers = containers.filter(c => {
        const zone = zones.find(z => z.id === c.id_zone);
        return zone && zone.nom.includes(city.name);
      });
      console.log(`   • ${city.name}: ${cityContainers.length} containers`);
    }
    
    console.log('\n📊 FILL LEVEL DISTRIBUTION:');
    const lowFill = measures.filter(m => m.taux_remplissage < 30).length;
    const normalFill = measures.filter(m => m.taux_remplissage >= 30 && m.taux_remplissage < 80).length;
    const highFill = measures.filter(m => m.taux_remplissage >= 80).length;
    console.log(`   • Low (<30%): ${lowFill} containers`);
    console.log(`   • Normal (30-80%): ${normalFill} containers`);
    console.log(`   • High (>80%): ${highFill} containers ⚠️`);
    
    console.log('\n💾 DATABASE STATUS:');
    console.log(`   • Zones: ${await Zone.count()} total`);
    console.log(`   • Containers: ${await Conteneur.count()} total`);
    console.log(`   • Measurements: ${await Mesure.count()} total`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return { zones: zones.length, containers: containers.length, measures: measures.length };

  } catch (error) {
    console.error('❌ Error seeding massive data:', error);
    throw error;
  }
}

module.exports = { seedMassiveData };
