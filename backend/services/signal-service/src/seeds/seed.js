const { v4: uuidv4 } = require('uuid');

/**
 * Seed Signal Service Database
 * Creates test signal reports from citizens about issues
 * References citizens by their UUIDs from user-service
 */

// Citoyen UUIDs (must match user-service TEST_USERS)
const CITOYEN_IDS = {
  citoyen1: 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a',
  citoyen2: 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b',
  citoyen3: 'f6a7b8c9-d0e1-4f5a-8b9c-5d6e7f8a9b0c',
  citoyen4: 'a7b8c9d0-e1f2-4a5b-8c9d-6e7f8a9b0c1d'
};

async function seedSignalDatabase(sequelize) {
  try {
    const Signal = sequelize.models.Signal;

    // Check if test data already exists
    const existingSignals = await Signal.count();
    if (existingSignals > 0) {
      console.log('Signal database already seeded. Skipping...');
      return;
    }

    const signals = await Signal.bulkCreate([
      {
        id: uuidv4(),
        code: 'SIG-2026-001',
        type: 'surcharge',
        conteneur_id: 'CONT-A001',
        localisation: { lat: 48.8566, lon: 2.3522, adresse: '123 Rue de Rivoli, Paris' },
        description: 'Conteneur de recyclage complètement plein depuis 2 jours',
        statut: 'traite',
        priorite: 'haute',
        citoyen_id: CITOYEN_IDS.citoyen1,
        date_signalement: new Date('2026-01-20 10:30:00'),
        date_resolution: new Date('2026-01-21 14:00:00'),
        photos: [
          'https://example.com/photos/sig-001-1.jpg',
          'https://example.com/photos/sig-001-2.jpg'
        ],
        feedback_citoyen: {
          satisfaction: 5,
          commentaire: 'Très bien, conteneur vidé rapidement'
        },
        created_at: new Date('2026-01-20'),
        updated_at: new Date('2026-01-21')
      },
      {
        id: uuidv4(),
        code: 'SIG-2026-002',
        type: 'conteneur_endommage',
        conteneur_id: 'CONT-B002',
        localisation: { lat: 48.8720, lon: 2.3690, adresse: '112 Rue de Vaugirard, Paris' },
        description: 'Porte du conteneur coincée, impossible à fermer',
        statut: 'en_cours',
        priorite: 'haute',
        citoyen_id: CITOYEN_IDS.citoyen2,
        date_signalement: new Date('2026-01-20 15:45:00'),
        date_resolution: null,
        photos: [
          'https://example.com/photos/sig-002-1.jpg'
        ],
        feedback_citoyen: null,
        created_at: new Date('2026-01-20'),
        updated_at: new Date('2026-01-20')
      },
      {
        id: uuidv4(),
        code: 'SIG-2026-003',
        type: 'mauvaise_localisation',
        conteneur_id: 'CONT-A002',
        localisation: { lat: 48.8600, lon: 2.3555, adresse: '45 Avenue des Champs-Élysées, Paris' },
        description: 'Conteneur déplacé, pas à sa position habituelle',
        statut: 'en_attente',
        priorite: 'normale',
        citoyen_id: CITOYEN_IDS.citoyen3,
        date_signalement: new Date('2026-01-21 09:15:00'),
        date_resolution: null,
        photos: [],
        feedback_citoyen: null,
        created_at: new Date('2026-01-21'),
        updated_at: new Date('2026-01-21')
      },
      {
        id: uuidv4(),
        code: 'SIG-2026-004',
        type: 'dechets_eparpilles',
        conteneur_id: 'CONT-C001',
        localisation: { lat: 48.8400, lon: 2.3300, adresse: '789 Avenue Montaigne, Paris' },
        description: 'Déchets éparpillés autour du conteneur, contamination',
        statut: 'traite',
        priorite: 'haute',
        citoyen_id: CITOYEN_IDS.citoyen4,
        date_signalement: new Date('2026-01-19 14:20:00'),
        date_resolution: new Date('2026-01-20 11:00:00'),
        photos: [
          'https://example.com/photos/sig-004-1.jpg',
          'https://example.com/photos/sig-004-2.jpg',
          'https://example.com/photos/sig-004-3.jpg'
        ],
        feedback_citoyen: {
          satisfaction: 4,
          commentaire: 'Nettoyage bien fait, mais pris du temps'
        },
        created_at: new Date('2026-01-19'),
        updated_at: new Date('2026-01-20')
      },
      {
        id: uuidv4(),
        code: 'SIG-2026-005',
        type: 'probleme_odeur',
        conteneur_id: 'CONT-B001',
        localisation: { lat: 48.8750, lon: 2.3650, adresse: '200 Rue de Turenne, Paris' },
        description: 'Odeur très désagréable provenant du conteneur de recyclage',
        statut: 'en_cours',
        priorite: 'normal',
        citoyen_id: CITOYEN_IDS.citoyen1,
        date_signalement: new Date('2026-01-21 11:30:00'),
        date_resolution: null,
        photos: [],
        feedback_citoyen: null,
        created_at: new Date('2026-01-21'),
        updated_at: new Date('2026-01-21')
      },
      {
        id: uuidv4(),
        code: 'SIG-2026-006',
        type: 'surcharge',
        conteneur_id: 'CONT-A003',
        localisation: { lat: 48.8555, lon: 2.3480, adresse: '78 Boulevard Saint-Germain, Paris' },
        description: 'Conteneur compost débordant',
        statut: 'traite',
        priorite: 'normal',
        citoyen_id: CITOYEN_IDS.citoyen3,
        date_signalement: new Date('2026-01-18 13:00:00'),
        date_resolution: new Date('2026-01-19 10:30:00'),
        photos: [
          'https://example.com/photos/sig-006-1.jpg'
        ],
        feedback_citoyen: {
          satisfaction: 5,
          commentaire: 'Excellent service'
        },
        created_at: new Date('2026-01-18'),
        updated_at: new Date('2026-01-19')
      }
    ]);

    console.log('✅ Signal database seeded successfully!');
    console.log(`Created ${signals.length} test signal reports with synchronized citoyen UUIDs`);

    return signals;
  } catch (error) {
    console.error('Error seeding signal database:', error);
    throw error;
  }
}

module.exports = { seedSignalDatabase };
