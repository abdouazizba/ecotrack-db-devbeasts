#!/usr/bin/env node
/**
 * Seed 500K citoyens into auth_db + user_db
 *
 * Usage:
 *   node scripts/seed-500k.js                  # default 500,000
 *   node scripts/seed-500k.js 100000           # custom count
 *
 * Prerequisites:
 *   - PostgreSQL containers running (auth-db:5432, user-db:5436)
 *   - Or PgBouncer running (pgbouncer:6432)
 *   - npm install pg uuid bcryptjs (already in auth-service deps)
 */

const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const TOTAL = parseInt(process.argv[2], 10) || 500_000;
const BATCH_SIZE = 5000;

const AUTH_DB = {
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: parseInt(process.env.AUTH_DB_PORT, 10) || 5432,
  database: 'ecotrack_auth',
  user: 'postgres',
  password: 'postgres',
};

const USER_DB = {
  host: process.env.USER_DB_HOST || 'localhost',
  port: parseInt(process.env.USER_DB_PORT, 10) || 5436,
  database: 'ecotrack_user',
  user: 'postgres',
  password: 'postgres',
};

const PRENOMS = [
  'Aminata','Fatou','Oumar','Mamadou','Kadiatou','Ibrahim','Aissatou','Sekou',
  'Mariama','Abdoulaye','Kadija','Mohamed','Ramatoulaye','Boubacar','Hawa',
  'Alpha','Mariam','Lamine','Ndeye','Cheikh','Sophie','Pierre','Marie',
  'Jean','Claire','Thomas','Julie','Nicolas','Emma','Lucas','Camille',
  'Alexandre','Sarah','Maxime','Laura','Antoine','Pauline','Hugo','Charlotte',
  'Adrien','Manon','David','Lea','Romain','Chloe','Julien','Elise',
];

const NOMS = [
  'Ba','Diallo','Sow','Coulibaly','Barry','Keita','Balde','Camara','Sy',
  'Toure','Fall','Ndiaye','Conte','Conde','Kouyate','Cisse','Mbaye','Gueye',
  'Dupont','Martin','Bernard','Petit','Robert','Richard','Durand','Moreau',
  'Laurent','Simon','Michel','Garcia','David','Thomas','Bertrand','Morel',
  'Lefebvre','Leroy','Roux','Girard','Bonnet','Mercier','Blanc','Guerin',
];

const DOMAINS = ['gmail.com','yahoo.fr','outlook.com','hotmail.fr','orange.fr','free.fr','ecotrack.city'];

// bcrypt hash for "password123" (pre-computed to avoid hashing 500K times)
const PASSWORD_HASH = '$2b$10$LkPz7eFgP0Z0PvQbIiGJpOXBcBK.L2Vy7Gh5DpXJxKxxKLZnUUHYq';

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ECOTRACK — SEED ${TOTAL.toLocaleString()} CITOYENS`);
  console.log(`  Batch size: ${BATCH_SIZE.toLocaleString()}`);
  console.log(`${'='.repeat(60)}\n`);

  const authClient = new Client(AUTH_DB);
  const userClient = new Client(USER_DB);

  try {
    await authClient.connect();
    await userClient.connect();
    console.log('Connected to auth_db and user_db\n');

    const existingCount = (await authClient.query(
      "SELECT COUNT(*) as c FROM users WHERE role = 'citoyen'"
    )).rows[0].c;
    console.log(`Existing citoyens in auth_db: ${parseInt(existingCount).toLocaleString()}`);

    const totalBatches = Math.ceil(TOTAL / BATCH_SIZE);
    const startTime = Date.now();
    let created = 0;

    for (let batch = 0; batch < totalBatches; batch++) {
      const batchStart = Date.now();
      const size = Math.min(BATCH_SIZE, TOTAL - created);

      // Build batch data
      const authValues = [];
      const authParams = [];
      const userValues = [];
      const userParams = [];
      const citoyenValues = [];
      const citoyenParams = [];

      for (let i = 0; i < size; i++) {
        const id = uuidv4();
        const prenom = randomFrom(PRENOMS);
        const nom = randomFrom(NOMS);
        const suffix = crypto.randomBytes(4).toString('hex');
        const email = `${prenom.toLowerCase()}.${nom.toLowerCase()}.${suffix}@${randomFrom(DOMAINS)}`;
        const now = new Date().toISOString();

        const offset = authParams.length;
        authParams.push(id, email, PASSWORD_HASH, nom, prenom, 'citoyen', now, now);
        authValues.push(`($${offset+1},$${offset+2},$${offset+3},$${offset+4},$${offset+5},$${offset+6},$${offset+7},$${offset+8})`);

        const uOffset = userParams.length;
        userParams.push(id, email, nom, prenom, 'citoyen', true, now, now);
        userValues.push(`($${uOffset+1},$${uOffset+2},$${uOffset+3},$${uOffset+4},$${uOffset+5},$${uOffset+6},$${uOffset+7},$${uOffset+8})`);

        const cOffset = citoyenParams.length;
        citoyenParams.push(id, false, 0, 0, now, now);
        citoyenValues.push(`($${cOffset+1},$${cOffset+2},$${cOffset+3},$${cOffset+4},$${cOffset+5},$${cOffset+6})`);
      }

      // Bulk insert auth_db
      await authClient.query(
        `INSERT INTO users (id, email, password, nom, prenom, role, created_at, updated_at)
         VALUES ${authValues.join(',')}
         ON CONFLICT (email) DO NOTHING`,
        authParams
      );

      // Bulk insert user_db — utilisateurs
      await userClient.query(
        `INSERT INTO utilisateurs (id, email, nom, prenom, role, is_active, created_at, updated_at)
         VALUES ${userValues.join(',')}
         ON CONFLICT (email) DO NOTHING`,
        userParams
      );

      // Bulk insert user_db — citoyens
      await userClient.query(
        `INSERT INTO citoyens (id, email_verified, nombre_signalements, score_reputation, created_at, updated_at)
         VALUES ${citoyenValues.join(',')}
         ON CONFLICT (id) DO NOTHING`,
        citoyenParams
      );

      created += size;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const batchMs = Date.now() - batchStart;
      const pct = ((created / TOTAL) * 100).toFixed(1);
      const eta = created > 0 ? (((Date.now() - startTime) / created) * (TOTAL - created) / 1000).toFixed(0) : '?';

      process.stdout.write(
        `\r  [${pct}%] ${created.toLocaleString()} / ${TOTAL.toLocaleString()} — ` +
        `batch ${batchMs}ms — ${elapsed}s elapsed — ETA ${eta}s   `
      );
    }

    console.log('\n');

    // Verify
    const finalAuth    = (await authClient.query("SELECT COUNT(*) as c FROM users WHERE role = 'citoyen'")).rows[0].c;
    const finalUser    = (await userClient.query("SELECT COUNT(*) as c FROM utilisateurs WHERE role = 'citoyen'")).rows[0].c;
    const finalCitoyen = (await userClient.query("SELECT COUNT(*) as c FROM citoyens")).rows[0].c;

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  auth_db citoyens:      ${parseInt(finalAuth).toLocaleString()}`);
    console.log(`  user_db utilisateurs:  ${parseInt(finalUser).toLocaleString()}`);
    console.log(`  user_db citoyens:      ${parseInt(finalCitoyen).toLocaleString()}`);
    console.log(`  Duration: ${duration}s`);
    console.log(`  Rate: ${Math.round(created / (duration)) .toLocaleString()} users/sec`);
    console.log(`\n  Done!\n`);

  } catch (err) {
    console.error('\nError:', err.message);
    process.exit(1);
  } finally {
    await authClient.end();
    await userClient.end();
  }
}

run();
