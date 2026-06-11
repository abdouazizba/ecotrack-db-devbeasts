const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

/**
 * Fixed user list — must match auth-service/src/seeds/seed.js SEED_USERS exactly
 * (same IDs, same roles). This allows the user-service to populate its own
 * database without relying on RabbitMQ events being received.
 */
const SEED_USERS = [
  { id: 'aaaaaaaa-0001-0001-0001-000000000000', email: 'superadmin@ecotrack.com',            nom: 'EcoTrack',   prenom: 'SuperAdmin', role: 'super_admin' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000001', email: 'aminata.ba@ecotrack.com',           nom: 'Ba',         prenom: 'Aminata',    role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000002', email: 'jean.martin@ecotrack.com',           nom: 'Martin',     prenom: 'Jean',       role: 'agent'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000003', email: 'christophe.tshisekedi@ecotrack.com', nom: 'Tshisekedi', prenom: 'Christophe', role: 'agent'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000004', email: 'fatoumata.diallo@ecotrack.com',      nom: 'Diallo',     prenom: 'Fatoumata',  role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000005', email: 'pierre.dupont@ecotrack.com',         nom: 'Dupont',     prenom: 'Pierre',     role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000006', email: 'mariam.traore@ecotrack.com',         nom: 'Traore',     prenom: 'Mariam',     role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000007', email: 'bernard.ndiaye@ecotrack.com',        nom: 'Ndiaye',     prenom: 'Bernard',    role: 'citoyen' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000008', email: 'marie.legrand@ecotrack.com',         nom: 'Legrand',    prenom: 'Marie',      role: 'admin'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000009', email: 'aziz@ecotrack.com',                  nom: 'Ba',         prenom: 'Aziz',       role: 'admin'   },
  { id: 'aaaaaaaa-0001-0001-0001-000000000010', email: 'galdy@ecotrack.com',                 nom: 'Admin',      prenom: 'Galdy',      role: 'admin'   },
];

async function seedUserDatabase(sequelize) {
  try {
    console.log('🌱 Seeding User database (idempotent)...\n');

    const now = new Date();
    let created = 0;
    let skipped = 0;

    for (const u of SEED_USERS) {
      // findOrCreate is idempotent: safe on every restart
      const [, userCreated] = await Utilisateur.findOrCreate({
        where: { id: u.id },
        defaults: {
          email:          u.email,
          nom:            u.nom,
          prenom:         u.prenom,
          role:           u.role,
          is_active:      true,
          date_naissance: null,
          last_login:     null,
          created_at:     now,
          updated_at:     now,
        },
      });

      if (!userCreated) {
        skipped++;
        continue;
      }

      // Use the last segment of the UUID for a unique badge (e.g. "000000000002")
      const uniqueSuffix = u.id.split('-').pop().slice(-6).toUpperCase();

      if (u.role === 'agent') {
        await Agent.findOrCreate({
          where: { id: u.id },
          defaults: {
            id:                   u.id,
            numero_badge:         `AGENT-${uniqueSuffix}`,
            id_zone:              null,
            date_assignment_zone: now,
            created_at:           now,
            updated_at:           now,
          },
        });
      } else if (u.role === 'admin' || u.role === 'super_admin') {
        await Admin.findOrCreate({
          where: { id: u.id },
          defaults: {
            id:           u.id,
            niveau_acces: u.role === 'super_admin' ? 'super_admin' : 'admin',
            permissions: {
              manage_users:     true,
              manage_resources: true,
              manage_zones:     u.role === 'super_admin',
              view_statistics:  true,
              manage_admins:    u.role === 'super_admin',
            },
            created_at: now,
            updated_at: now,
          },
        });
      } else {
        await Citoyen.findOrCreate({
          where: { id: u.id },
          defaults: {
            id:                  u.id,
            email_verified:      false,
            nombre_signalements: 0,
            score_reputation:    50,
            telephone:           null,
            created_at:          now,
            updated_at:          now,
          },
        });
      }

      created++;
      console.log(`   ✓ Created ${u.role.padEnd(10)} │ ${u.prenom} ${u.nom} (${u.email})`);
    }

    if (skipped > 0) console.log(`   ↷ ${skipped} users already exist — skipped`);
    console.log(`\n✅ User seed done: ${created} created, ${skipped} skipped.\n`);
    return { created, skipped };
  } catch (error) {
    // Non-fatal: log and continue so the service starts even if seed fails
    console.error('✗ Error seeding user database:', error.message);
  }
}

module.exports = { seedUserDatabase };
