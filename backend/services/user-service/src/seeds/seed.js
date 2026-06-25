const { Utilisateur, Agent, Citoyen, Admin } = require('../models');

/**
 * Fixed user list — must match auth-service/src/seeds/seed.js SEED_USERS exactly
 * (same IDs, same roles). This allows the user-service to populate its own
 * database without relying on RabbitMQ events being received.
 */
const SEED_USERS = [
  // ── Admins ──────────────────────────────────────────────────────────────────
  { id: 'aaaaaaaa-0001-0001-0001-000000000000', email: 'superadmin@ecotrack.com',            nom: 'EcoTrack',   prenom: 'SuperAdmin',  role: 'super_admin' },
  { id: 'aaaaaaaa-0001-0001-0001-000000000008', email: 'marie.legrand@ecotrack.com',         nom: 'Legrand',    prenom: 'Marie',       role: 'admin'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000009', email: 'aziz@ecotrack.com',                  nom: 'Ba',         prenom: 'Aziz',        role: 'admin'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000010', email: 'galdy@ecotrack.com',                 nom: 'Admin',      prenom: 'Galdy',       role: 'admin'       },

  // ── Citoyens ─────────────────────────────────────────────────────────────────
  { id: 'aaaaaaaa-0001-0001-0001-000000000001', email: 'aminata.ba@ecotrack.com',            nom: 'Ba',         prenom: 'Aminata',     role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000004', email: 'fatoumata.diallo@ecotrack.com',      nom: 'Diallo',     prenom: 'Fatoumata',   role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000005', email: 'pierre.dupont@ecotrack.com',         nom: 'Dupont',     prenom: 'Pierre',      role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000006', email: 'mariam.traore@ecotrack.com',         nom: 'Traore',     prenom: 'Mariam',      role: 'citoyen'     },
  { id: 'aaaaaaaa-0001-0001-0001-000000000007', email: 'bernard.ndiaye@ecotrack.com',        nom: 'Ndiaye',     prenom: 'Bernard',     role: 'citoyen'     },

  // ── Agents ───────────────────────────────────────────────────────────────────
  { id: 'aaaaaaaa-0001-0001-0001-000000000002', email: 'jean.martin@ecotrack.com',           nom: 'Martin',     prenom: 'Jean',        role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000003', email: 'christophe.tshisekedi@ecotrack.com', nom: 'Tshisekedi', prenom: 'Christophe',  role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000011', email: 'oumar.diallo@ecotrack.com',          nom: 'Diallo',     prenom: 'Oumar',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000012', email: 'fatou.sow@ecotrack.com',             nom: 'Sow',        prenom: 'Fatou',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000013', email: 'mamadou.coulibaly@ecotrack.com',     nom: 'Coulibaly',  prenom: 'Mamadou',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000014', email: 'kadiatou.barry@ecotrack.com',        nom: 'Barry',      prenom: 'Kadiatou',    role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000015', email: 'ibrahim.keita@ecotrack.com',         nom: 'Keita',      prenom: 'Ibrahim',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000016', email: 'aissatou.balde@ecotrack.com',        nom: 'Balde',      prenom: 'Aissatou',    role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000017', email: 'sekou.camara@ecotrack.com',          nom: 'Camara',     prenom: 'Sekou',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000018', email: 'mariama.sy@ecotrack.com',            nom: 'Sy',         prenom: 'Mariama',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000019', email: 'abdoulaye.bah@ecotrack.com',         nom: 'Bah',        prenom: 'Abdoulaye',   role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000020', email: 'kadija.toure@ecotrack.com',          nom: 'Toure',      prenom: 'Kadija',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000021', email: 'mohamed.fall@ecotrack.com',          nom: 'Fall',       prenom: 'Mohamed',     role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000022', email: 'ramatoulaye.ndiaye@ecotrack.com',    nom: 'Ndiaye',     prenom: 'Ramatoulaye', role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000023', email: 'boubacar.diallo@ecotrack.com',       nom: 'Diallo',     prenom: 'Boubacar',    role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000024', email: 'hawa.conte@ecotrack.com',            nom: 'Conte',      prenom: 'Hawa',        role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000025', email: 'alpha.conde@ecotrack.com',           nom: 'Conde',      prenom: 'Alpha',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000026', email: 'mariam.kouyate@ecotrack.com',        nom: 'Kouyate',    prenom: 'Mariam',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000027', email: 'lamine.cisse@ecotrack.com',          nom: 'Cisse',      prenom: 'Lamine',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000028', email: 'ndeye.mbaye@ecotrack.com',           nom: 'Mbaye',      prenom: 'Ndeye',       role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000029', email: 'cheikh.gueye@ecotrack.com',          nom: 'Gueye',      prenom: 'Cheikh',      role: 'agent'       },
  { id: 'aaaaaaaa-0001-0001-0001-000000000030', email: 'sophie.dupont@ecotrack.com',         nom: 'Dupont',     prenom: 'Sophie',      role: 'agent'       },
];

async function seedUserDatabase(sequelize) {
  try {
    console.log('🌱 Seeding User database (idempotent)...\n');

    const now = new Date();
    let created = 0;
    let skipped = 0;

    for (const u of SEED_USERS) {
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
            score_reputation:    0,
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
    console.error('✗ Error seeding user database:', error.message);
  }
}

module.exports = { seedUserDatabase };
