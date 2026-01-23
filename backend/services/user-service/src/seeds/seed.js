const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

// Shared test user IDs synchronized across all services
const TEST_USERS = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', // Agent 1
    email: 'agent1@ecotrack.com',
    nom: 'Martin',
    prenom: 'Jean',
    date_naissance: new Date('1985-03-15'),
    role: 'agent',
    password: 'password123'
  },
  {
    id: 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e', // Agent 2
    email: 'agent2@ecotrack.com',
    nom: 'Dubois',
    prenom: 'Marie',
    date_naissance: new Date('1990-07-22'),
    role: 'agent',
    password: 'password456'
  },
  {
    id: 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f', // Agent 3
    email: 'agent3@ecotrack.com',
    nom: 'Bernard',
    prenom: 'Pierre',
    date_naissance: new Date('1988-11-08'),
    role: 'agent',
    password: 'agentpass123'
  },
  {
    id: 'd4e5f6a7-b8c9-4d5e-8f9a-3b4c5d6e7f8a', // Citoyen 1
    email: 'citoyen1@ecotrack.com',
    nom: 'Leclerc',
    prenom: 'Sophie',
    date_naissance: new Date('1992-05-18'),
    role: 'citoyen',
    password: 'citizen123'
  },
  {
    id: 'e5f6a7b8-c9d0-4e5f-8a9b-4c5d6e7f8a9b', // Citoyen 2
    email: 'citoyen2@ecotrack.com',
    nom: 'Moreau',
    prenom: 'Laurent',
    date_naissance: new Date('1987-09-30'),
    role: 'citoyen',
    password: 'citizen456'
  },
  {
    id: 'f6a7b8c9-d0e1-4f5a-8b9c-5d6e7f8a9b0c', // Citoyen 3
    email: 'citoyen3@ecotrack.com',
    nom: 'Garcia',
    prenom: 'Carmen',
    date_naissance: new Date('1995-02-14'),
    role: 'citoyen',
    password: 'citizen789'
  },
  {
    id: 'a7b8c9d0-e1f2-4a5b-8c9d-6e7f8a9b0c1d', // Citoyen 4
    email: 'citoyen4@ecotrack.com',
    nom: 'Martinez',
    prenom: 'Diego',
    date_naissance: new Date('1991-06-25'),
    role: 'citoyen',
    password: 'citizen000'
  },
  {
    id: 'b8c9d0e1-f2a3-4b5c-8d9e-7f8a9b0c1d2e', // Admin 1
    email: 'admin@ecotrack.com',
    nom: 'Admin',
    prenom: 'Super',
    date_naissance: new Date('1980-01-01'),
    role: 'admin',
    password: 'adminpass123'
  },
  {
    id: 'c9d0e1f2-a3b4-4c5d-8e9f-8a9b0c1d2e3f', // Admin 2
    email: 'moderator@ecotrack.com',
    nom: 'Modérateur',
    prenom: 'Chef',
    date_naissance: new Date('1985-06-10'),
    role: 'admin',
    password: 'modpass123'
  }
];

/**
 * Seed User Service Database
 * Creates test users with profiles, synchronized with auth-service via shared UUIDs
 */
async function seedUserDatabase(sequelize) {
  try {
    // Check if test users already exist
    const existingUsers = await Utilisateur.count();
    if (existingUsers > 0) {
      console.log('✓ User database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Starting user database seeding with synchronized UUIDs...');

    // Create Utilisateurs with shared IDs from TEST_USERS
    const utilisateurs = await Promise.all(
      TEST_USERS.map(user =>
        Utilisateur.create({
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          date_naissance: user.date_naissance,
          role: user.role,
          is_active: true,
          last_login: null
        })
      )
    );

    console.log(`✓ Created ${utilisateurs.length} utilisateurs`);

    // Create Agent profiles (IDs 0, 1, 2)
    const agentIds = [TEST_USERS[0].id, TEST_USERS[1].id, TEST_USERS[2].id];
    await Promise.all(agentIds.map((id, index) =>
      Agent.create({
        id: id,
        numero_badge: `BADGE-${1001 + index}`,
        id_zone: uuidv4(),
        date_assignment_zone: new Date()
      })
    ));

    console.log(`✓ Created ${agentIds.length} agents`);

    // Create Citoyen profiles (IDs 3, 4, 5, 6)
    const citoyenIds = [TEST_USERS[3].id, TEST_USERS[4].id, TEST_USERS[5].id, TEST_USERS[6].id];
    await Promise.all(citoyenIds.map((id, index) =>
      Citoyen.create({
        id: id,
        email_verified: index < 2,
        nombre_signalements: Math.floor(Math.random() * 15),
        score_reputation: Math.floor(40 + Math.random() * 60),
        telephone: `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
      })
    ));

    console.log(`✓ Created ${citoyenIds.length} citoyens`);

    // Create Admin profiles (IDs 7, 8)
    const adminIds = [TEST_USERS[7].id, TEST_USERS[8].id];
    await Promise.all(adminIds.map((id, index) =>
      Admin.create({
        id: id,
        niveau_acces: index === 0 ? 'super_admin' : 'admin',
        permissions: {
          manage_users: true,
          manage_resources: true,
          manage_zones: true,
          view_statistics: true,
          manage_admins: index === 0
        }
      })
    ));

    console.log(`✓ Created ${adminIds.length} admins`);

    console.log('✅ User database seeded successfully!');
    console.log(`✓ Total: ${agentIds.length} agents + ${citoyenIds.length} citoyens + ${adminIds.length} admins = ${utilisateurs.length} users`);

    return { utilisateurs, agents: agentIds.length, citoyens: citoyenIds.length, admins: adminIds.length };
  } catch (error) {
    console.error(' Error seeding user database:', error.message);
    throw error;
  }
}

module.exports = { seedUserDatabase, TEST_USERS };
