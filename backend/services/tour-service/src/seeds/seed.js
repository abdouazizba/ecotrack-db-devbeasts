const { v4: uuidv4 } = require('uuid');

// Real agent IDs — must match auth-service and user-service seeds
const AGENT_IDS = [
  'aaaaaaaa-0001-0001-0001-000000000002', // Jean Martin
  'aaaaaaaa-0001-0001-0001-000000000003', // Christophe Tshisekedi
  'aaaaaaaa-0001-0001-0001-000000000011', // Oumar Diallo
  'aaaaaaaa-0001-0001-0001-000000000012', // Fatou Sow
  'aaaaaaaa-0001-0001-0001-000000000013', // Mamadou Coulibaly
  'aaaaaaaa-0001-0001-0001-000000000014', // Kadiatou Barry
  'aaaaaaaa-0001-0001-0001-000000000015', // Ibrahim Keita
  'aaaaaaaa-0001-0001-0001-000000000016', // Aissatou Balde
  'aaaaaaaa-0001-0001-0001-000000000017', // Sekou Camara
  'aaaaaaaa-0001-0001-0001-000000000018', // Mariama Sy
  'aaaaaaaa-0001-0001-0001-000000000019', // Abdoulaye Bah
  'aaaaaaaa-0001-0001-0001-000000000020', // Kadija Toure
  'aaaaaaaa-0001-0001-0001-000000000021', // Mohamed Fall
  'aaaaaaaa-0001-0001-0001-000000000022', // Ramatoulaye Ndiaye
  'aaaaaaaa-0001-0001-0001-000000000023', // Boubacar Diallo
  'aaaaaaaa-0001-0001-0001-000000000024', // Hawa Conte
  'aaaaaaaa-0001-0001-0001-000000000025', // Alpha Conde
  'aaaaaaaa-0001-0001-0001-000000000026', // Mariam Kouyate
  'aaaaaaaa-0001-0001-0001-000000000027', // Lamine Cisse
  'aaaaaaaa-0001-0001-0001-000000000028', // Ndeye Mbaye
  'aaaaaaaa-0001-0001-0001-000000000029', // Cheikh Gueye
  'aaaaaaaa-0001-0001-0001-000000000030', // Sophie Dupont
];

const ZONES = [
  { name: 'Paris Centre',         code: 'PC'  },
  { name: 'Paris Est',            code: 'PE'  },
  { name: 'Paris Nord',           code: 'PN'  },
  { name: 'Paris Sud',            code: 'PS'  },
  { name: 'Boulogne-Billancourt', code: 'BB'  },
  { name: 'Saint-Denis',          code: 'SD'  },
  { name: 'Versailles',           code: 'VER' },
  { name: 'Créteil',              code: 'CRT' },
  { name: 'Nanterre',             code: 'NAN' },
  { name: 'Évry',                 code: 'EVR' },
];

const HEURES_DEBUT = ['06:30:00', '07:00:00', '07:30:00', '08:00:00', '08:30:00'];
const HEURES_FIN   = ['14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00'];

const NOTES_TERMINEE = [
  'Tournée effectuée sans incident.',
  "Quelques conteneurs difficiles d'accès mais collecte complète.",
  'Bonne coopération des habitants pour le tri sélectif.',
  'Conditions météo favorables, tournée rapide.',
  'Plusieurs conteneurs très chargés, temps supplémentaire nécessaire.',
  'Collecte réalisée dans les délais impartis.',
  'Un conteneur déplacé retrouvé et remis en place.',
  'Trafic dense en matinée, léger retard absorbé.',
  null,
  null,
];

const NOTES_ANNULEE = [
  "Tournée annulée en raison d'intempéries (verglas).",
  'Panne du véhicule de collecte.',
  "Tournée annulée — manifestation bloquant l'itinéraire.",
  'Absence imprévue du conducteur, tournée reprogrammée.',
];

const getAgent  = (i) => AGENT_IDS[i % AGENT_IDS.length];
const pick      = (arr, i) => arr[i % arr.length];

async function seedTourneeDatabase(sequelize) {
  try {
    const Tournee      = sequelize.models.Tournee;
    const TourneeAgent = sequelize.models.TourneeAgent;

    if (!Tournee) {
      console.log('⚠️  Tournee model not found. Skipping seed...');
      return;
    }

    const existing = await Tournee.count();
    if (existing > 0) {
      console.log(`Tour database already seeded (${existing} tournées). Skipping...`);
      return;
    }

    // 8 semaines × 10 zones = 80 tournées
    // Période : 1er juin 2026 → 27 juillet 2026
    // Sem 1-4 : passées (TERMINÉE / ANNULÉE) — juin
    // Sem 5-6 : récentes (TERMINÉE + quelques EN_COURS prises en charge)
    // Sem 7   : courante (EN_COURS prises en charge + PLANIFIÉE à prendre)
    // Sem 8   : futures  (PLANIFIÉE — pas encore prises en charge)
    const BASE_DATE = new Date('2026-06-01');

    const buildStatuts = () => {
      const s = [];
      // sem 1-4: passées — TERMINÉE (quelques ANNULÉE)
      for (let w = 0; w < 4; w++) {
        for (let z = 0; z < 10; z++) {
          const n = w * 10 + z;
          s.push(n % 9 === 0 ? 'ANNULÉE' : 'TERMINÉE');
        }
      }
      // sem 5: terminées récentes
      for (let z = 0; z < 10; z++) {
        s.push(z % 5 === 0 ? 'ANNULÉE' : 'TERMINÉE');
      }
      // sem 6: mix terminées + en cours (prises en charge par agents)
      for (let z = 0; z < 10; z++) {
        s.push(z < 6 ? 'TERMINÉE' : 'EN_COURS');
      }
      // sem 7: courante — quelques prises en charge (EN_COURS) + à prendre (PLANIFIÉE)
      for (let z = 0; z < 10; z++) {
        s.push(z < 4 ? 'EN_COURS' : 'PLANIFIÉE');
      }
      // sem 8: futures — toutes PLANIFIÉE (pas encore prises en charge)
      for (let z = 0; z < 10; z++) {
        s.push('PLANIFIÉE');
      }
      return s;
    };

    const statuts = buildStatuts(); // 80 items

    // Fixed IDs for week-7 and week-8 tournées so signal-service seed can reference them
    // Week 7 (index 60-69): EN_COURS for z<4, PLANIFIÉE for z>=4
    // Week 8 (index 70-79): all PLANIFIÉE (future)
    const FIXED_IDS = {
      // Semaine 7 — EN_COURS
      60: 'cccccccc-0001-0001-0001-000000000061', // Paris Centre  EN_COURS
      61: 'cccccccc-0001-0001-0001-000000000062', // Paris Est     EN_COURS
      62: 'cccccccc-0001-0001-0001-000000000063', // Paris Nord    EN_COURS
      63: 'cccccccc-0001-0001-0001-000000000064', // Paris Sud     EN_COURS
      // Semaine 7 — PLANIFIÉE
      64: 'cccccccc-0001-0001-0001-000000000065', // Boulogne      PLANIFIÉE
      65: 'cccccccc-0001-0001-0001-000000000066', // Saint-Denis   PLANIFIÉE
      66: 'cccccccc-0001-0001-0001-000000000067', // Versailles    PLANIFIÉE
      67: 'cccccccc-0001-0001-0001-000000000068', // Créteil       PLANIFIÉE
      68: 'cccccccc-0001-0001-0001-000000000069', // Nanterre      PLANIFIÉE
      69: 'cccccccc-0001-0001-0001-000000000070', // Évry          PLANIFIÉE
      // Semaine 8 — PLANIFIÉE (futures)
      70: 'cccccccc-0001-0001-0001-000000000071', // Paris Centre  PLANIFIÉE
      71: 'cccccccc-0001-0001-0001-000000000072', // Paris Est     PLANIFIÉE
      72: 'cccccccc-0001-0001-0001-000000000073', // Paris Nord    PLANIFIÉE
      73: 'cccccccc-0001-0001-0001-000000000074', // Paris Sud     PLANIFIÉE
      74: 'cccccccc-0001-0001-0001-000000000075', // Boulogne      PLANIFIÉE
      75: 'cccccccc-0001-0001-0001-000000000076', // Saint-Denis   PLANIFIÉE
      76: 'cccccccc-0001-0001-0001-000000000077', // Versailles    PLANIFIÉE
      77: 'cccccccc-0001-0001-0001-000000000078', // Créteil       PLANIFIÉE
      78: 'cccccccc-0001-0001-0001-000000000079', // Nanterre      PLANIFIÉE
      79: 'cccccccc-0001-0001-0001-000000000080', // Évry          PLANIFIÉE
    };

    const tourneesData = [];
    let num = 1;

    for (let week = 0; week < 8; week++) {
      for (let z = 0; z < ZONES.length; z++) {
        const idx    = week * 10 + z;
        const zone   = ZONES[z];
        const statut = statuts[idx];

        const date = new Date(BASE_DATE);
        date.setDate(date.getDate() + week * 7 + z);

        const isActive    = statut !== 'PLANIFIÉE';
        const isFinished  = statut === 'TERMINÉE';
        const isCancelled = statut === 'ANNULÉE';

        tourneesData.push({
          id:   FIXED_IDS[idx] || uuidv4(),
          code: `TRN-2026-${String(num).padStart(3, '0')}`,
          date,
          statut,
          heure_debut:          isActive   ? pick(HEURES_DEBUT, num * 3) : null,
          heure_fin:            isFinished  ? pick(HEURES_FIN,   num * 2) : null,
          distance_km:          isFinished  ? parseFloat((3.5 + ((num * 1.3) % 8.5)).toFixed(1)) : null,
          conteneurs_collectes: isFinished  ? 8 + (num % 20) : (statut === 'EN_COURS' ? Math.floor((8 + (num % 20)) / 2) : 0),
          notes: isCancelled
            ? pick(NOTES_ANNULEE, num * 5)
            : isFinished
              ? pick(NOTES_TERMINEE, num * 7)
              : null,
        });

        num++;
      }
    }

    const created = await Tournee.bulkCreate(tourneesData);
    console.log(`✅ Created ${created.length} tournées`);

    // TourneeAgent : 1 CONDUCTEUR + 1 COLLECTEUR per tournée (rotated across all 22 agents)
    if (TourneeAgent) {
      const agentEntries = [];

      for (let i = 0; i < created.length; i++) {
        const t          = created[i];
        const isActive   = t.statut !== 'PLANIFIÉE';
        const isFinished = t.statut === 'TERMINÉE';

        agentEntries.push({
          id:               uuidv4(),
          id_tournee:       t.id,
          id_agent:         getAgent(i * 2),
          role:             'CONDUCTEUR',
          heure_debut_reel: isActive   ? pick(HEURES_DEBUT, i) : null,
          heure_fin_reelle: isFinished ? pick(HEURES_FIN,   i) : null,
        });

        agentEntries.push({
          id:               uuidv4(),
          id_tournee:       t.id,
          id_agent:         getAgent(i * 2 + 1),
          role:             'COLLECTEUR',
          heure_debut_reel: isActive   ? pick(HEURES_DEBUT, i + 1) : null,
          heure_fin_reelle: isFinished ? pick(HEURES_FIN,   i + 1) : null,
        });
      }

      await TourneeAgent.bulkCreate(agentEntries);
      console.log(`✅ Created ${agentEntries.length} tournée-agent assignments (${AGENT_IDS.length} agents rotated)`);
    }

    console.log('✅ Tour database seeded successfully!');
    return created;
  } catch (error) {
    console.error('❌ Error seeding tour database:', error);
    throw error;
  }
}

module.exports = { seedTourneeDatabase };
