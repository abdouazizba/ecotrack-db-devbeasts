const { v4: uuidv4 } = require('uuid');

/**
 * Seed Container Service Database
 * Creates test waste containers with different types and locations
 * Uses Sequelize for proper database integration with dynamic UUIDs
 */

async function seedContainerDatabase(sequelize) {
  try {
    const Zone = sequelize.models.Zone;
    const Conteneur = sequelize.models.Conteneur;
    const Mesure = sequelize.models.Mesure;

    // Check if test data already exists
    const existingZones = await Zone.count();
    if (existingZones > 0) {
      console.log('Container database already seeded. Skipping...');
      return;
    }

    // First create zones
    const zones = await Zone.bulkCreate([
      {
        id: uuidv4(),
        nom: 'Zone A - Île de la Cité',
        code_zone: 'ZONE-A',
        population_estimee: 15000,
        description: 'Central Paris - Historic district',
        is_active: true
      },
      {
        id: uuidv4(),
        nom: 'Zone B - Marais',
        code_zone: 'ZONE-B',
        population_estimee: 20000,
        description: 'Paris 3rd and 4th arrondissements',
        is_active: true
      },
      {
        id: uuidv4(),
        nom: 'Zone C - Montmartre',
        code_zone: 'ZONE-C',
        population_estimee: 18000,
        description: 'Paris 18th arrondissement',
        is_active: true
      }
    ]);

    // Then create containers
    const containers = await Conteneur.bulkCreate([
      // Zone A containers
      {
        id: uuidv4(),
        code_conteneur: 'CONT-A001',
        type_conteneur: 'standard',
        capacite: 120,
        latitude: 48.8566,
        longitude: 2.3522,
        date_installation: new Date('2023-01-15'),
        id_zone: zones[0].id,
        notes: 'Recyclage bin near Rivoli'
      },
      {
        id: uuidv4(),
        code_conteneur: 'CONT-A002',
        type_conteneur: 'selective',
        capacite: 150,
        latitude: 48.8600,
        longitude: 2.3555,
        date_installation: new Date('2023-03-22'),
        id_zone: zones[0].id,
        notes: 'General waste near Champs-Élysées'
      },
      {
        id: uuidv4(),
        code_conteneur: 'CONT-A003',
        type_conteneur: 'organic',
        capacite: 100,
        latitude: 48.8555,
        longitude: 2.3480,
        date_installation: new Date('2023-06-10'),
        id_zone: zones[0].id,
        notes: 'Compost bin near Saint-Germain'
      },
      // Zone B containers
      {
        id: uuidv4(),
        code_conteneur: 'CONT-B001',
        type_conteneur: 'standard',
        capacite: 120,
        latitude: 48.8750,
        longitude: 2.3650,
        date_installation: new Date('2023-02-05'),
        id_zone: zones[1].id,
        notes: 'Recyclage near Turenne'
      },
      {
        id: uuidv4(),
        code_conteneur: 'CONT-B002',
        type_conteneur: 'selective',
        capacite: 150,
        latitude: 48.8720,
        longitude: 2.3690,
        date_installation: new Date('2023-04-18'),
        id_zone: zones[1].id,
        notes: 'General waste near Vaugirard',
        statut: 'maintenance'
      },
      {
        id: uuidv4(),
        code_conteneur: 'CONT-B003',
        type_conteneur: 'hazardous',
        capacite: 100,
        latitude: 48.8680,
        longitude: 2.3620,
        date_installation: new Date('2023-05-30'),
        id_zone: zones[1].id,
        notes: 'Glass near Mouffetard'
      },
      // Zone C containers
      {
        id: uuidv4(),
        code_conteneur: 'CONT-C001',
        type_conteneur: 'standard',
        capacite: 120,
        latitude: 48.8400,
        longitude: 2.3300,
        date_installation: new Date('2023-07-12'),
        id_zone: zones[2].id,
        notes: 'Recyclage near Montaigne'
      },
      {
        id: uuidv4(),
        code_conteneur: 'CONT-C002',
        type_conteneur: 'organic',
        capacite: 100,
        latitude: 48.8420,
        longitude: 2.3280,
        date_installation: new Date('2023-08-25'),
        id_zone: zones[2].id,
        notes: 'Compost near Paix',
        statut: 'retire'
      }
    ]);

    // Create some measurements for containers
    const mesures = await Mesure.bulkCreate([
      {
        id: uuidv4(),
        date_mesure: new Date(),
        taux_remplissage: 65,
        temperature: 18.5,
        batterie: 85,
        signal_force: -75,
        id_conteneur: containers[0].id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        date_mesure: new Date(),
        taux_remplissage: 82,
        temperature: 19.2,
        batterie: 90,
        signal_force: -72,
        id_conteneur: containers[1].id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        date_mesure: new Date(),
        taux_remplissage: 45,
        temperature: 17.8,
        batterie: 78,
        signal_force: -80,
        id_conteneur: containers[2].id,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        date_mesure: new Date(),
        taux_remplissage: 92,
        temperature: 20.1,
        batterie: 45,
        signal_force: -68,
        id_conteneur: containers[3].id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log(`✓ Created ${mesures.length} measurements\n`);
    console.log('✅ Container database seeded successfully!');
    console.log(`📝 Total: ${zones.length} zones, ${containers.length} containers, ${mesures.length} measurements\n`);

    return { zones, containers, mesures };
  } catch (error) {
    console.error('❌ Error seeding container database:', error);
    throw error;
  }
}

module.exports = { seedContainerDatabase };
