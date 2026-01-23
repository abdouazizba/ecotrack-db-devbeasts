const { v4: uuidv4 } = require('uuid');

/**
 * Seed Tour Service Database
 * Creates test collection tours with routes and schedules
 * References agents by their UUIDs from user-service
 */

// Agent UUIDs (must match user-service TEST_USERS)
const AGENT_IDS = {
  agent1: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  agent2: 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e',
  agent3: 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f'
};

async function seedTourDatabase(sequelize) {
  try {
    const Tour = sequelize.models.Tour;

    // Check if test data already exists
    const existingTours = await Tour.count();
    if (existingTours > 0) {
      console.log('Tour database already seeded. Skipping...');
      return;
    }

    // Create test tours with synchronized agent UUIDs
    const tours = await Tour.bulkCreate([
      {
        id: uuidv4(),
        code: 'TOUR-2026-001',
        description: 'Tournée collecte Zone A - Lundi',
        date_debut: new Date('2026-01-22 07:00:00'),
        date_fin: null,
        agent_id: AGENT_IDS.agent1,
        itineraire: {
          points: [
            { lat: 48.8566, lon: 2.3522, ordre: 1, conteneur: 'CONT-A001' },
            { lat: 48.8600, lon: 2.3555, ordre: 2, conteneur: 'CONT-A002' },
            { lat: 48.8555, lon: 2.3480, ordre: 3, conteneur: 'CONT-A003' }
          ],
          distance_km: 5.2,
          temps_estime_min: 120
        },
        statut: 'en_cours',
        nombre_conteneurs_vides: 0,
        nombre_conteneurs_pleins: 2,
        problemes_signales: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'TOUR-2026-002',
        description: 'Tournée collecte Zone B - Lundi',
        date_debut: new Date('2026-01-22 09:00:00'),
        date_fin: new Date('2026-01-22 12:30:00'),
        agent_id: AGENT_IDS.agent2,
        itineraire: {
          points: [
            { lat: 48.8750, lon: 2.3650, ordre: 1, conteneur: 'CONT-B001' },
            { lat: 48.8720, lon: 2.3690, ordre: 2, conteneur: 'CONT-B002' },
            { lat: 48.8680, lon: 2.3620, ordre: 3, conteneur: 'CONT-B003' }
          ],
          distance_km: 4.8,
          temps_estime_min: 110
        },
        statut: 'termine',
        nombre_conteneurs_vides: 3,
        nombre_conteneurs_pleins: 0,
        problemes_signales: [
          { conteneur: 'CONT-B002', type: 'maintenance_requise', description: 'Porte coincée' }
        ],
        created_at: new Date('2026-01-21'),
        updated_at: new Date('2026-01-21')
      },
      {
        id: uuidv4(),
        code: 'TOUR-2026-003',
        description: 'Tournée collecte Zone C - Mardi',
        date_debut: new Date('2026-01-23 07:30:00'),
        date_fin: null,
        agent_id: AGENT_IDS.agent3,
        itineraire: {
          points: [
            { lat: 48.8400, lon: 2.3300, ordre: 1, conteneur: 'CONT-C001' },
            { lat: 48.8420, lon: 2.3280, ordre: 2, conteneur: 'CONT-C002' }
          ],
          distance_km: 3.2,
          temps_estime_min: 85
        },
        statut: 'planifiee',
        nombre_conteneurs_vides: 0,
        nombre_conteneurs_pleins: 0,
        problemes_signales: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'TOUR-2026-004',
        description: 'Tournée collecte Zone A - Mardi',
        date_debut: new Date('2026-01-23 08:00:00'),
        date_fin: new Date('2026-01-23 11:45:00'),
        agent_id: AGENT_IDS.agent1,
        itineraire: {
          points: [
            { lat: 48.8566, lon: 2.3522, ordre: 1, conteneur: 'CONT-A001' },
            { lat: 48.8600, lon: 2.3555, ordre: 2, conteneur: 'CONT-A002' },
            { lat: 48.8555, lon: 2.3480, ordre: 3, conteneur: 'CONT-A003' }
          ],
          distance_km: 5.2,
          temps_estime_min: 120
        },
        statut: 'termine',
        nombre_conteneurs_vides: 2,
        nombre_conteneurs_pleins: 1,
        problemes_signales: [
          { conteneur: 'CONT-A002', type: 'surcharge', description: 'Dépassement de capacité' }
        ],
        created_at: new Date('2026-01-20'),
        updated_at: new Date('2026-01-20')
      },
      {
        id: uuidv4(),
        code: 'TOUR-2026-005',
        description: 'Tournée collecte Zone B - Mercredi',
        date_debut: new Date('2026-01-24 07:00:00'),
        date_fin: null,
        agent_id: AGENT_IDS.agent2,
        itineraire: {
          points: [
            { lat: 48.8750, lon: 2.3650, ordre: 1, conteneur: 'CONT-B001' },
            { lat: 48.8720, lon: 2.3690, ordre: 2, conteneur: 'CONT-B002' },
            { lat: 48.8680, lon: 2.3620, ordre: 3, conteneur: 'CONT-B003' }
          ],
          distance_km: 4.8,
          temps_estime_min: 110
        },
        statut: 'en_cours',
        nombre_conteneurs_vides: 0,
        nombre_conteneurs_pleins: 1,
        problemes_signales: [],
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ Tour database seeded successfully!');
    console.log(`Created ${tours.length} test tours with synchronized agent UUIDs`);

    return tours;
  } catch (error) {
    console.error('Error seeding tour database:', error);
    throw error;
  }
}

module.exports = { seedTourDatabase };
