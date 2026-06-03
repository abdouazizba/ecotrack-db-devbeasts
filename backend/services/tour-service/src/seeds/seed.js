const { v4: uuidv4 } = require('uuid');

const ZONES = [
  { name: 'Paris Centre',         code: 'PC',  lat: 48.8566, lng: 2.3522 },
  { name: 'Paris Est',            code: 'PE',  lat: 48.8530, lng: 2.3790 },
  { name: 'Paris Nord',           code: 'PN',  lat: 48.8870, lng: 2.3620 },
  { name: 'Paris Sud',            code: 'PS',  lat: 48.8260, lng: 2.3490 },
  { name: 'Boulogne-Billancourt', code: 'BB',  lat: 48.8354, lng: 2.2403 },
  { name: 'Saint-Denis',          code: 'SD',  lat: 48.9363, lng: 2.3573 },
  { name: 'Versailles',           code: 'VER', lat: 48.8047, lng: 2.1203 },
  { name: 'Créteil',              code: 'CRT', lat: 48.7764, lng: 2.4556 },
  { name: 'Nanterre',             code: 'NAN', lat: 48.8921, lng: 2.2066 },
  { name: 'Évry',                 code: 'EVR', lat: 48.6303, lng: 2.4428 },
];

const FALLBACK_AGENTS = [
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e',
  'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f',
  'd4e5f6a7-b8c9-4d5e-8f0a-3b4c5d6e7f8a',
  'e5f6a7b8-c9d0-4e5f-8a0b-4c5d6e7f8a9b',
];

const HEURES_DEBUT = ['06:30:00', '07:00:00', '07:30:00', '08:00:00', '08:30:00'];
const HEURES_FIN   = ['14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00', '16:30:00'];

const NOTES_TERMINEE = [
  'Tournée effectuée sans incident.',
  'Quelques conteneurs difficiles d\'accès mais collecte complète.',
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
  'Tournée annulée en raison d\'intempéries (verglas).',
  'Panne du véhicule de collecte.',
  'Tournée annulée — manifestation bloquant l\'itinéraire.',
  'Absence imprévue du conducteur, tournée reprogrammée.',
];

async function seedTourneeDatabase(sequelize) {
  try {
    const Tournee = sequelize.models.Tournee;
    const TourneeAgent = sequelize.models.TourneeAgent;

    if (!Tournee) {
      console.log('⚠️ Tournee model not found. Skipping seed...');
      return;
    }

    const existing = await Tournee.count();
    if (existing > 0) {
      console.log('Tour database already seeded. Skipping...');
      return;
    }

    // Fetch real agent IDs if available
    let agentIds = [];
    try {
      const [results] = await sequelize.query(
        "SELECT id FROM utilisateurs WHERE role = 'AGENT' ORDER BY created_at ASC LIMIT 10"
      );
      agentIds = results.map(r => r.id);
    } catch (e) {
      console.log('⚠️ Could not fetch agent IDs, using fallback UUIDs...');
    }

    while (agentIds.length < FALLBACK_AGENTS.length) {
      agentIds.push(FALLBACK_AGENTS[agentIds.length]);
    }

    const getAgent = (i) => agentIds[i % agentIds.length];

    // 50 tournées : 5 semaines × 10 zones
    // Semaine 1 : 06 jan, Semaine 2 : 13 jan, ..., Semaine 5 : 03 fév 2026
    // Toutes sont passées (avant juin 2026) => majorité TERMINÉE, quelques ANNULÉE
    const BASE_DATE = new Date('2026-01-06');

    const statuts = [
      // semaine 1 (10) : toutes TERMINÉE
      ...Array(10).fill('TERMINÉE'),
      // semaine 2 (10) : 9 TERMINÉE, 1 ANNULÉE
      ...Array(9).fill('TERMINÉE'), 'ANNULÉE',
      // semaine 3 (10) : 8 TERMINÉE, 1 ANNULÉE, 1 TERMINÉE
      ...Array(9).fill('TERMINÉE'), 'ANNULÉE',
      // semaine 4 (10) : toutes TERMINÉE
      ...Array(10).fill('TERMINÉE'),
      // semaine 5 (10) : 6 TERMINÉE, 2 ANNULÉE, 1 EN_COURS, 1 PLANIFIÉE
      ...Array(6).fill('TERMINÉE'), 'ANNULÉE', 'ANNULÉE', 'EN_COURS', 'PLANIFIÉE',
    ];

    const tourneesData = [];
    let num = 1;

    for (let week = 0; week < 5; week++) {
      for (let z = 0; z < ZONES.length; z++) {
        const idx = week * 10 + z;
        const zone = ZONES[z];
        const statut = statuts[idx];

        const date = new Date(BASE_DATE);
        date.setDate(date.getDate() + week * 7 + z);

        const heureDebutIdx = (num * 3) % HEURES_DEBUT.length;
        const heureFinIdx   = (num * 2) % HEURES_FIN.length;
        const noteIdx       = (num * 7) % NOTES_TERMINEE.length;
        const annuleeIdx    = (num * 5) % NOTES_ANNULEE.length;

        const isActive   = statut !== 'PLANIFIÉE';
        const isFinished = statut === 'TERMINÉE';
        const isCancelled = statut === 'ANNULÉE';

        const conteneurs = isFinished
          ? 8 + (num % 20)
          : statut === 'EN_COURS'
            ? Math.floor((8 + (num % 20)) / 2)
            : 0;

        const distance = isFinished
          ? parseFloat((3.5 + ((num * 1.3) % 8.5)).toFixed(1))
          : statut === 'EN_COURS'
            ? parseFloat((1.5 + ((num * 0.6) % 4)).toFixed(1))
            : null;

        tourneesData.push({
          id: uuidv4(),
          code: `TRN-2026-${String(num).padStart(3, '0')}`,
          date,
          statut,
          heure_debut: isActive       ? HEURES_DEBUT[heureDebutIdx] : null,
          heure_fin:   isFinished     ? HEURES_FIN[heureFinIdx]      : null,
          distance_km: distance,
          conteneurs_collectes: conteneurs,
          notes: isCancelled
            ? NOTES_ANNULEE[annuleeIdx]
            : isFinished
              ? NOTES_TERMINEE[noteIdx]
              : null,
        });

        num++;
      }
    }

    const created = await Tournee.bulkCreate(tourneesData);
    console.log(`✅ Created ${created.length} tournées`);

    // TourneeAgent : 1 CONDUCTEUR + 1 COLLECTEUR par tournée
    if (TourneeAgent) {
      const agentEntries = [];

      for (let i = 0; i < created.length; i++) {
        const t = created[i];
        const statut = t.statut;
        const isActive   = statut !== 'PLANIFIÉE';
        const isFinished = statut === 'TERMINÉE';

        agentEntries.push({
          id: uuidv4(),
          id_tournee: t.id,
          id_agent: getAgent(i),
          role: 'CONDUCTEUR',
          heure_debut_reel:  isActive   ? '07:05:00' : null,
          heure_fin_reelle:  isFinished ? '16:40:00' : null,
        });

        agentEntries.push({
          id: uuidv4(),
          id_tournee: t.id,
          id_agent: getAgent(i + 1),
          role: 'COLLECTEUR',
          heure_debut_reel:  isActive   ? '07:05:00' : null,
          heure_fin_reelle:  isFinished ? '16:40:00' : null,
        });
      }

      await TourneeAgent.bulkCreate(agentEntries);
      console.log(`✅ Created ${agentEntries.length} tournée-agent assignments`);
    }

    console.log('✅ Tour database seeded successfully!');
    return created;
  } catch (error) {
    console.error('❌ Error seeding tour database:', error);
    throw error;
  }
}

module.exports = { seedTourneeDatabase };
