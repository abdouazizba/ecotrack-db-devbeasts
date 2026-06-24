const { v4: uuidv4 } = require('uuid');

const AGENT_IDS = [
  'aaaaaaaa-0001-0001-0001-000000000002',
  'aaaaaaaa-0001-0001-0001-000000000003',
  'aaaaaaaa-0001-0001-0001-000000000011',
  'aaaaaaaa-0001-0001-0001-000000000012',
  'aaaaaaaa-0001-0001-0001-000000000013',
  'aaaaaaaa-0001-0001-0001-000000000014',
  'aaaaaaaa-0001-0001-0001-000000000015',
  'aaaaaaaa-0001-0001-0001-000000000016',
  'aaaaaaaa-0001-0001-0001-000000000017',
  'aaaaaaaa-0001-0001-0001-000000000018',
  'aaaaaaaa-0001-0001-0001-000000000019',
  'aaaaaaaa-0001-0001-0001-000000000020',
  'aaaaaaaa-0001-0001-0001-000000000021',
  'aaaaaaaa-0001-0001-0001-000000000022',
  'aaaaaaaa-0001-0001-0001-000000000023',
  'aaaaaaaa-0001-0001-0001-000000000024',
  'aaaaaaaa-0001-0001-0001-000000000025',
  'aaaaaaaa-0001-0001-0001-000000000026',
  'aaaaaaaa-0001-0001-0001-000000000027',
  'aaaaaaaa-0001-0001-0001-000000000028',
  'aaaaaaaa-0001-0001-0001-000000000029',
  'aaaaaaaa-0001-0001-0001-000000000030',
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

const getAgent = (i) => AGENT_IDS[i % AGENT_IDS.length];
const pick     = (arr, i) => arr[i % arr.length];

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

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

    // ── Dates dynamiques relatives à aujourd'hui ──────────────────────────
    const NOW   = new Date();
    const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

    // 8 slots × 10 zones = 80 tournées
    //
    // Slot 0 : -84 jours (~3 mois)    → TERMINÉE / ANNULÉE
    // Slot 1 : -63 jours (~2 mois)    → TERMINÉE / ANNULÉE
    // Slot 2 : -35 jours (~5 sem.)    → TERMINÉE / ANNULÉE
    // Slot 3 : -14 jours (~2 sem.)    → TERMINÉE
    // Slot 4 :  -7 jours (sem. dern.) → TERMINÉE
    // Slot 5 :  semaine courante      → EN_COURS (z < 4) / PLANIFIÉE (z ≥ 4)
    //           date = TODAY + (z - 3) → z0=-3d, z1=-2d, z2=-1d, z3=0, z4=+1d … z9=+6d
    // Slot 6 :  +7 jours (sem. proch.)→ PLANIFIÉE
    // Slot 7 : +14 jours (+2 sem.)    → PLANIFIÉE

    const PAST_OFFSETS = [-84, -63, -35, -14, -7];

    function getSlotDate(slot, z) {
      if (slot < 5) return addDays(TODAY, PAST_OFFSETS[slot] + z);
      if (slot === 5) return addDays(TODAY, z - 3);
      return addDays(TODAY, (slot - 5) * 7 + z);
    }

    function getSlotStatut(slot, z, idx) {
      if (slot < 5) return (idx % 11 === 0) ? 'ANNULÉE' : 'TERMINÉE';
      if (slot === 5) return z < 4 ? 'EN_COURS' : 'PLANIFIÉE';
      return 'PLANIFIÉE';
    }

    // IDs fixes pour les slots 5-7 (courant + futur) — signal-service y fait référence
    const FIXED_IDS = {};
    for (let i = 50; i < 80; i++) {
      FIXED_IDS[i] = `cccccccc-0001-0001-0001-${String(i + 1).padStart(12, '0')}`;
    }

    const tourneesData = [];
    let num = 1;

    for (let slot = 0; slot < 8; slot++) {
      for (let z = 0; z < ZONES.length; z++) {
        const idx    = slot * 10 + z;
        const date   = getSlotDate(slot, z);
        const statut = getSlotStatut(slot, z, idx);

        const isActive    = statut !== 'PLANIFIÉE';
        const isFinished  = statut === 'TERMINÉE';
        const isCancelled = statut === 'ANNULÉE';

        tourneesData.push({
          id:   FIXED_IDS[idx] || uuidv4(),
          code: `TRN-${date.getFullYear()}-${String(num).padStart(3, '0')}`,
          date,
          statut,
          heure_debut:          isActive   ? pick(HEURES_DEBUT, num * 3) : null,
          heure_fin:            isFinished ? pick(HEURES_FIN,   num * 2) : null,
          distance_km:          isFinished ? parseFloat((3.5 + ((num * 1.3) % 8.5)).toFixed(1)) : null,
          conteneurs_collectes: isFinished ? 8 + (num % 20)
                              : statut === 'EN_COURS' ? Math.floor((8 + (num % 20)) / 2)
                              : 0,
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

    const countByStatut = {};
    created.forEach(t => { countByStatut[t.statut] = (countByStatut[t.statut] || 0) + 1; });
    console.log(`✅ Created ${created.length} tournées — ${JSON.stringify(countByStatut)}`);

    // ── TourneeAgent : 1 CONDUCTEUR + 1 COLLECTEUR par tournée ─────────
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

    await seedVehicules(sequelize);

    return created;
  } catch (error) {
    console.error('❌ Error seeding tour database:', error);
    throw error;
  }
}

// ── VEHICULES SEED ──────────────────────────────────────────────────────────

const MARQUES = [
  { marque: 'Renault', modeles: ['Midlum 220', 'Premium 280', 'D Wide 320'] },
  { marque: 'Mercedes', modeles: ['Econic 2630', 'Atego 1224', 'Arocs 2536'] },
  { marque: 'Volvo', modeles: ['FE 280', 'FL 250', 'FMX 420'] },
  { marque: 'Iveco', modeles: ['Eurocargo 180', 'Stralis 310', 'Daily 70C'] },
  { marque: 'MAN', modeles: ['TGS 26.360', 'TGM 18.290', 'TGL 12.250'] },
  { marque: 'DAF', modeles: ['CF 290', 'LF 230'] },
  { marque: 'Scania', modeles: ['P 280', 'L 280'] },
];

const TYPES_VEHICULE = ['BENNE', 'COMPACTEUR', 'UTILITAIRE', 'CAMION_GRUE'];
const CAPACITES = { BENNE: 12, COMPACTEUR: 18, UTILITAIRE: 3.5, CAMION_GRUE: 8 };

const IMMAT_PREFIXES = [
  'AB', 'CD', 'EF', 'GH', 'JK', 'LM', 'NP', 'QR', 'ST', 'UV',
  'WX', 'YZ', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH',
  'JJ', 'KK',
];

async function seedVehicules(sequelize) {
  const Vehicule = sequelize.models.Vehicule;
  if (!Vehicule) {
    console.log('⚠️  Vehicule model not found. Skipping vehicle seed...');
    return;
  }

  const existing = await Vehicule.count();
  if (existing > 0) {
    console.log(`Vehicle database already seeded (${existing} véhicules). Skipping...`);
    return;
  }

  const vehiculesData = [];

  for (let i = 0; i < AGENT_IDS.length; i++) {
    const marqueObj = MARQUES[i % MARQUES.length];
    const modele = marqueObj.modeles[i % marqueObj.modeles.length];
    const type = TYPES_VEHICULE[i % TYPES_VEHICULE.length];
    const capacite = CAPACITES[type] + (i % 3);

    const prefix = IMMAT_PREFIXES[i];
    const num = String(100 + i * 37).slice(0, 3);
    const suffix = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 5) % 26));
    const immat = `${prefix}-${num}-${suffix}`;

    const baseDate = new Date('2026-01-15');
    baseDate.setDate(baseDate.getDate() + i * 12);
    const nextControl = new Date('2027-03-01');
    nextControl.setMonth(nextControl.getMonth() + (i % 8));

    const isActive = i % 7 !== 0;
    const isMaint  = !isActive && i % 14 === 0;

    vehiculesData.push({
      id: uuidv4(),
      immatriculation: immat,
      marque: marqueObj.marque,
      modele,
      type_vehicule: type,
      capacite_tonnes: parseFloat(capacite.toFixed(1)),
      kilometrage: 15000 + (i * 3721) % 120000,
      statut: isMaint ? 'EN_MAINTENANCE' : (isActive ? 'ACTIF' : 'INACTIF'),
      id_agent: AGENT_IDS[i],
      date_derniere_maintenance: baseDate,
      date_prochain_controle: nextControl,
      notes: null,
    });
  }

  const created = await Vehicule.bulkCreate(vehiculesData);
  console.log(`✅ Created ${created.length} véhicules (1 per agent)`);
}

module.exports = { seedTourneeDatabase };
