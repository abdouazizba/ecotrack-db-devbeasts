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

    // Create test users with dynamic UUIDs
    const users = await User.bulkCreate([
      {
        id: uuidv4(),
        email: 'agent1@ecotrack.com',
        password: await bcrypt.hash('password123', 10),
        role: 'agent',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'agent2@ecotrack.com',
        password: await bcrypt.hash('password456', 10),
        role: 'agent',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'agent3@ecotrack.com',
        password: await bcrypt.hash('agentpass123', 10),
        role: 'agent',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'citoyen1@ecotrack.com',
        password: await bcrypt.hash('citizen123', 10),
        role: 'citoyen',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'citoyen2@ecotrack.com',
        password: await bcrypt.hash('citizen456', 10),
        role: 'citoyen',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'citoyen3@ecotrack.com',
        password: await bcrypt.hash('citizen789', 10),
        role: 'citoyen',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'citoyen4@ecotrack.com',
        password: await bcrypt.hash('citizen000', 10),
        role: 'citoyen',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'admin@ecotrack.com',
        password: await bcrypt.hash('adminpass123', 10),
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'aziz@ecotrack.com',
        password: await bcrypt.hash('azizadmin123', 10),
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'galdy@ecotrack.com',
        password: await bcrypt.hash('galdyadmin123', 10),
        role: 'admin',
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
      { email: 'agent1@ecotrack.com', password: 'password123', role: 'AGENT' },
      { email: 'agent2@ecotrack.com', password: 'password456', role: 'AGENT' },
      { email: 'agent3@ecotrack.com', password: 'agentpass123', role: 'AGENT' },
      { email: 'citoyen1@ecotrack.com', password: 'citizen123', role: 'CITOYEN' },
      { email: 'citoyen2@ecotrack.com', password: 'citizen456', role: 'CITOYEN' },
      { email: 'citoyen3@ecotrack.com', password: 'citizen789', role: 'CITOYEN' },
      { email: 'citoyen4@ecotrack.com', password: 'citizen000', role: 'CITOYEN' },
      { email: 'admin@ecotrack.com', password: 'adminpass123', role: 'ADMIN' },
      { email: 'aziz@ecotrack.com', password: 'azizadmin123', role: 'ADMIN ' },
      { email: 'galdy@ecotrack.com', password: 'galdyadmin123', role: 'ADMIN ' }
    ];

    credentials.forEach(cred => {
      const roleLabel = cred.role.padEnd(12);
      const emailLabel = cred.email.padEnd(28);
      const pwdLabel = cred.password;
      console.log(`  ${roleLabel} │ ${emailLabel} │ ${pwdLabel}`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

    //  PUBLISH USER.CREATED EVENTS TO RABBITMQ
    console.log(' Publishing user.created events to RabbitMQ...');
    for (const user of users) {
      await EventService.publishEvent('user.created', {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      });
      console.log(`   → ${user.email} (${user.role})`);
    }
    console.log(`\n✓ ${users.length} events published!\n`);

    return users;
  } catch (error) {
    console.error(' Error seeding auth database:', error);
    throw error;
  }
}

module.exports = { seedAuthDatabase };
