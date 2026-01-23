const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Seed Auth Service Database
 * Creates test authentication credentials
 * IMPORTANT: These UUIDs are shared with user-service via the same seed data
 */

// Shared test user data (IDs must match between auth and user services)
// A UTILISER : subscrire aux services avec ces credentials
const TEST_USERS = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', // Agent 1
    email: 'agent1@ecotrack.com',
    password: 'password123',
    role: 'agent'
  },
  {
    id: 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', // Agent 2
    email: 'agent2@ecotrack.com',
    password: 'password456',
    role: 'agent'
  },
  {
    id: 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', // Agent 3
    email: 'agent3@ecotrack.com',
    password: 'agentpass123',
    role: 'agent'
  },
  {
    id: 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', // Citoyen 1
    email: 'citoyen1@ecotrack.com',
    password: 'citizen123',
    role: 'citoyen'
  },
  {
    id: 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', // Citoyen 2
    email: 'citoyen2@ecotrack.com',
    password: 'citizen456',
    role: 'citoyen'
  },
  {
    id: 'f6a7b8c9-d0e1-4f5a-8b9c-5d6e7f8a9b0c', // Citoyen 3
    email: 'citoyen3@ecotrack.com',
    password: 'citizen789',
    role: 'citoyen'
  },
  {
    id: 'a7b8c9d0-e1f2-4a5b-8c9d-6e7f8a9b0c1d', // Citoyen 4
    email: 'citoyen4@ecotrack.com',
    password: 'citizen000',
    role: 'citoyen'
  },
  {
    id: 'b8c9d0e1-f2a3-4b5c-8d9e-7f8a9b0c1d2e', // Admin 1 (Super Admin)
    email: 'admin@ecotrack.com',
    password: 'adminpass123',
    role: 'admin'
  },
  {
    id: 'c9d0e1f2-a3b4-4c5d-8e9f-8a9b0c1d2e3f', // Admin 2 (Moderator)
    email: 'moderator@ecotrack.com',
    password: 'modpass123',
    role: 'admin'
  }
];

async function seedAuthDatabase(sequelize) {
  try {
    const User = sequelize.models.User;

    // Check if test users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('Auth database already seeded. Skipping...');
      return;
    }

    // Create test users with consistent IDs
    const hashedUsers = await Promise.all(
      TEST_USERS.map(async (user) => ({
        id: user.id,
        email: user.email,
        password: await bcrypt.hash(user.password, 10),
        role: user.role,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );

    const users = await User.bulkCreate(hashedUsers);

    console.log('✅ Auth database seeded successfully!');
    console.log(`Created ${users.length} test credentials`);
    console.log('\nTest Credentials:');
    TEST_USERS.forEach(user => {
      console.log(`  ${user.role.toUpperCase().padEnd(10)} - ${user.email.padEnd(25)} / ${user.password}`);
    });

    return users;
  } catch (error) {
    console.error('Error seeding auth database:', error);
    throw error;
  }
}

module.exports = { seedAuthDatabase, TEST_USERS };
