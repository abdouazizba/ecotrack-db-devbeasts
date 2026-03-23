const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const EventService = require('../services/EventService');

/**
 * Seed Auth Service Database
 * Creates test authentication credentials with dynamic UUIDs
 * Publishes "user.created" events for user-service to consume
 */

async function seedAuthDatabase(sequelize) {
  try {
    const User = sequelize.models.User;

    // Check if test users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('✓ Auth database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Seeding Auth database with test users...\n');

    // Create test users with dynamic UUIDs (authentication only, no role)
    const users = await User.bulkCreate([
      {
        id: uuidv4(),
        email: 'aminata.ba@ecotrack.com',
        password: await bcrypt.hash('password123', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'jean.martin@ecotrack.com',
        password: await bcrypt.hash('password456', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'christophe.tshisekedi@ecotrack.com',
        password: await bcrypt.hash('agentpass123', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'fatoumata.diallo@ecotrack.com',
        password: await bcrypt.hash('citizen123', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'pierre.dupont@ecotrack.com',
        password: await bcrypt.hash('citizen456', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'mariam.traore@ecotrack.com',
        password: await bcrypt.hash('citizen789', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'bernard.ndiaye@ecotrack.com',
        password: await bcrypt.hash('citizen000', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'marie.legrand@ecotrack.com',
        password: await bcrypt.hash('adminpass123', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'aziz@ecotrack.com',
        password: await bcrypt.hash('azizadmin123', 10),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'galdy@ecotrack.com',
        password: await bcrypt.hash('galdyadmin123', 10),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log(' Auth database seeded successfully!');
    console.log(` Created ${users.length} test credentials\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const credentials = [
      { email: 'aminata.ba@ecotrack.com', password: 'password123', role: 'CITOYEN' },
      { email: 'jean.martin@ecotrack.com', password: 'password456', role: 'AGENT' },
      { email: 'christophe.tshisekedi@ecotrack.com', password: 'agentpass123', role: 'AGENT' },
      { email: 'fatoumata.diallo@ecotrack.com', password: 'citizen123', role: 'CITOYEN' },
      { email: 'pierre.dupont@ecotrack.com', password: 'citizen456', role: 'CITOYEN' },
      { email: 'mariam.traore@ecotrack.com', password: 'citizen789', role: 'CITOYEN' },
      { email: 'bernard.ndiaye@ecotrack.com', password: 'citizen000', role: 'CITOYEN' },
      { email: 'marie.legrand@ecotrack.com', password: 'adminpass123', role: 'ADMIN' },
      { email: 'aziz@ecotrack.com', password: 'azizadmin123', role: 'ADMIN' },
      { email: 'galdy@ecotrack.com', password: 'galdyadmin123', role: 'ADMIN' }
    ];

    credentials.forEach(cred => {
      const roleLabel = cred.role.padEnd(12);
      const emailLabel = cred.email.padEnd(28);
      const pwdLabel = cred.password;
      console.log(`  ${roleLabel} │ ${emailLabel} │ ${pwdLabel}`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

    // 📤 PUBLISH USER.CREATED EVENTS TO RABBITMQ (Topic Exchange)
    console.log('📤 Publishing user.created events to RabbitMQ (Topic Exchange)...');
    for (const user of users) {
      const published = await EventService.publishEvent('user.created', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      if (published) {
        console.log(`   ✓ Published: ${user.email}`);
      }
    }
    console.log(`\n✓ ${users.length} events published to RabbitMQ!\n`);

    return users;
  } catch (error) {
    console.error(' Error seeding auth database:', error);
    throw error;
  }
}

module.exports = { seedAuthDatabase };
