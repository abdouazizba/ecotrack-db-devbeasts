const bcrypt = require('bcryptjs');
const EventService = require('../services/EventService');

/**
 * Seed Auth Service Database
 * Uses fixed UUIDs so the user-service seed can create matching profiles
 * without depending on RabbitMQ events being received.
 */

// Fixed UUIDs shared with user-service/src/seeds/seed.js
const SEED_USERS = [
  { id: 'aaaaaaaa-0001-0001-0001-000000000001', email: 'aminata.ba@ecotrack.com',           password: 'password123',   nom: 'Ba',         prenom: 'Aminata',    role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000002', email: 'jean.martin@ecotrack.com',           password: 'password456',   nom: 'Martin',     prenom: 'Jean',       role: 'agent'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000003', email: 'christophe.tshisekedi@ecotrack.com', password: 'agentpass123',  nom: 'Tshisekedi', prenom: 'Christophe', role: 'agent'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000004', email: 'fatoumata.diallo@ecotrack.com',      password: 'citizen123',    nom: 'Diallo',     prenom: 'Fatoumata',  role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000005', email: 'pierre.dupont@ecotrack.com',         password: 'citizen456',    nom: 'Dupont',     prenom: 'Pierre',     role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000006', email: 'mariam.traore@ecotrack.com',         password: 'citizen789',    nom: 'Traore',     prenom: 'Mariam',     role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000007', email: 'bernard.ndiaye@ecotrack.com',        password: 'citizen000',    nom: 'Ndiaye',     prenom: 'Bernard',    role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000008', email: 'marie.legrand@ecotrack.com',         password: 'adminpass123',  nom: 'Legrand',    prenom: 'Marie',      role: 'admin'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000009', email: 'aziz@ecotrack.com',                  password: 'azizadmin123',  nom: 'Ba',         prenom: 'Aziz',       role: 'admin'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000010', email: 'galdy@ecotrack.com',                 password: 'galdyadmin123', nom: 'Admin',      prenom: 'Galdy',      role: 'admin'   },
];

module.exports.SEED_USERS = SEED_USERS;

async function seedAuthDatabase(sequelize) {
  try {
    const User = sequelize.models.User;

    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('✓ Auth database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Seeding Auth database with test users...\n');

    const now = new Date();
    const users = await User.bulkCreate(
      await Promise.all(SEED_USERS.map(async (u) => ({
        id:         u.id,
        email:      u.email,
        password:   await bcrypt.hash(u.password, 10),
        nom:        u.nom,
        prenom:     u.prenom,
        role:       u.role,
        created_at: now,
        updated_at: now,
      })))
    );

    console.log('✓ Auth database seeded successfully!');
    console.log(`✓ Created ${users.length} test credentials\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    SEED_USERS.forEach((u) => {
      console.log(`  ${u.role.toUpperCase().padEnd(12)} │ ${u.email.padEnd(42)} │ ${u.password}`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

    // Publish events for services that depend on RabbitMQ
    console.log('📤 Publishing user.created events to RabbitMQ...');
    for (const user of users) {
      const published = await EventService.publishEvent('user.created', {
        id:         user.id,
        email:      user.email,
        nom:        user.nom || '',
        prenom:     user.prenom || '',
        role:       user.role || 'citoyen',
        created_at: user.created_at,
      });
      if (published) console.log(`   ✓ Published: ${user.email}`);
    }
    console.log(`\n✓ ${users.length} events published to RabbitMQ!\n`);

    return users;
  } catch (error) {
    console.error('✗ Error seeding auth database:', error);
    throw error;
  }
}

module.exports = { seedAuthDatabase, SEED_USERS };
