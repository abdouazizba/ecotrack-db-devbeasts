const bcrypt = require('bcryptjs');

/**
 * Seed Auth Service Database
 * Uses fixed UUIDs so the user-service seed can create matching profiles
 * without depending on RabbitMQ events being received.
 */

const SEED_USERS = [
  // ── Admins ─────────────────────────────────────────────────────────────────
  { id: 'aaaaaaaa-0001-0001-0001-000000000000', email: 'superadmin@ecotrack.com',            password: 'ecotrack123',   nom: 'EcoTrack',   prenom: 'SuperAdmin',  role: 'super_admin' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000008', email: 'marie.legrand@ecotrack.com',         password: 'adminpass123',  nom: 'Legrand',    prenom: 'Marie',       role: 'admin'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000009', email: 'aziz@ecotrack.com',                  password: 'azizadmin123', nom: 'Ba',         prenom: 'Aziz',        role: 'admin'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000010', email: 'galdy@ecotrack.com',                 password: 'galdyadmin123',nom: 'Admin',      prenom: 'Galdy',       role: 'admin'       },

  // ── Citoyens ────────────────────────────────────────────────────────────────
  { id: 'aaaaaaaa-0001-0001-0001-000000000001', email: 'aminata.ba@ecotrack.com',            password: 'password123',  nom: 'Ba',         prenom: 'Aminata',     role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000004', email: 'fatoumata.diallo@ecotrack.com',      password: 'citizen123',   nom: 'Diallo',     prenom: 'Fatoumata',   role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000005', email: 'pierre.dupont@ecotrack.com',         password: 'citizen456',   nom: 'Dupont',     prenom: 'Pierre',      role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000006', email: 'mariam.traore@ecotrack.com',         password: 'citizen789',   nom: 'Traore',     prenom: 'Mariam',      role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000007', email: 'bernard.ndiaye@ecotrack.com',        password: 'citizen000',   nom: 'Ndiaye',     prenom: 'Bernard',     role: 'citoyen'     },

  // ── Agents ──────────────────────────────────────────────────────────────────
  { id: 'aaaaaaaa-0001-0001-0001-000000000002', email: 'jean.martin@ecotrack.com',           password: 'Agent2025!',   nom: 'Martin',     prenom: 'Jean',        role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000003', email: 'christophe.tshisekedi@ecotrack.com', password: 'Agent2025!',   nom: 'Tshisekedi', prenom: 'Christophe',  role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000011', email: 'oumar.diallo@ecotrack.com',          password: 'Agent2025!',   nom: 'Diallo',     prenom: 'Oumar',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000012', email: 'fatou.sow@ecotrack.com',             password: 'Agent2025!',   nom: 'Sow',        prenom: 'Fatou',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000013', email: 'mamadou.coulibaly@ecotrack.com',     password: 'Agent2025!',   nom: 'Coulibaly',  prenom: 'Mamadou',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000014', email: 'kadiatou.barry@ecotrack.com',        password: 'Agent2025!',   nom: 'Barry',      prenom: 'Kadiatou',    role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000015', email: 'ibrahim.keita@ecotrack.com',         password: 'Agent2025!',   nom: 'Keita',      prenom: 'Ibrahim',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000016', email: 'aissatou.balde@ecotrack.com',        password: 'Agent2025!',   nom: 'Balde',      prenom: 'Aissatou',    role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000017', email: 'sekou.camara@ecotrack.com',          password: 'Agent2025!',   nom: 'Camara',     prenom: 'Sekou',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000018', email: 'mariama.sy@ecotrack.com',            password: 'Agent2025!',   nom: 'Sy',         prenom: 'Mariama',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000019', email: 'abdoulaye.bah@ecotrack.com',         password: 'Agent2025!',   nom: 'Bah',        prenom: 'Abdoulaye',   role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000020', email: 'kadija.toure@ecotrack.com',          password: 'Agent2025!',   nom: 'Toure',      prenom: 'Kadija',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000021', email: 'mohamed.fall@ecotrack.com',          password: 'Agent2025!',   nom: 'Fall',       prenom: 'Mohamed',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000022', email: 'ramatoulaye.ndiaye@ecotrack.com',    password: 'Agent2025!',   nom: 'Ndiaye',     prenom: 'Ramatoulaye', role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000023', email: 'boubacar.diallo@ecotrack.com',       password: 'Agent2025!',   nom: 'Diallo',     prenom: 'Boubacar',    role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000024', email: 'hawa.conte@ecotrack.com',            password: 'Agent2025!',   nom: 'Conte',      prenom: 'Hawa',        role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000025', email: 'alpha.conde@ecotrack.com',           password: 'Agent2025!',   nom: 'Conde',      prenom: 'Alpha',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000026', email: 'mariam.kouyate@ecotrack.com',        password: 'Agent2025!',   nom: 'Kouyate',    prenom: 'Mariam',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000027', email: 'lamine.cisse@ecotrack.com',          password: 'Agent2025!',   nom: 'Cisse',      prenom: 'Lamine',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000028', email: 'ndeye.mbaye@ecotrack.com',           password: 'Agent2025!',   nom: 'Mbaye',      prenom: 'Ndeye',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000029', email: 'cheikh.gueye@ecotrack.com',          password: 'Agent2025!',   nom: 'Gueye',      prenom: 'Cheikh',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000030', email: 'sophie.dupont@ecotrack.com',         password: 'Agent2025!',   nom: 'Dupont',     prenom: 'Sophie',      role: 'agent'       },
];

module.exports.SEED_USERS = SEED_USERS;

async function seedAuthDatabase(sequelize) {
  try {
    const User = sequelize.models.User;

    console.log('🌱 Seeding Auth database (idempotent)...\n');

    const now = new Date();
    let created = 0;
    let updated = 0;

    for (const u of SEED_USERS) {
      const existing = await User.findOne({ where: { id: u.id } });

      if (!existing) {
        await User.create({
          id:         u.id,
          email:      u.email,
          password:   await bcrypt.hash(u.password, 10),
          nom:        u.nom,
          prenom:     u.prenom,
          role:       u.role,
          created_at: now,
          updated_at: now,
        });
        console.log(`   ✓ Created  ${u.role.toUpperCase().padEnd(12)} │ ${u.email}`);
        created++;
      } else if (existing.role !== u.role) {
        await existing.update({ role: u.role, updated_at: now });
        console.log(`   ✓ Fixed role ${existing.role} → ${u.role} for ${u.email}`);
        updated++;
      }
    }

    console.log(`\n✅ Auth seed done: ${created} created, ${updated} role(s) corrected.\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST CREDENTIALS (agents):');
    console.log('═══════════════════════════════════════════════════════════');
    SEED_USERS.filter((u) => u.role === 'agent').forEach((u) => {
      console.log(`  AGENT        │ ${u.email.padEnd(42)} │ ${u.password}`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

    return { created, updated };
  } catch (error) {
    console.error('✗ Error seeding auth database:', error);
    throw error;
  }
}

module.exports = { seedAuthDatabase, SEED_USERS };
