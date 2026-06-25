const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Paris & Île-de-France coordinates (aligned with container-service zones)
const LOCATIONS = [
  { lat: 48.8566, lng: 2.3522 }, // Paris Centre
  { lat: 48.8530, lng: 2.3790 }, // Paris Est
  { lat: 48.8870, lng: 2.3620 }, // Paris Nord
  { lat: 48.8260, lng: 2.3490 }, // Paris Sud
  { lat: 48.8354, lng: 2.2403 }, // Boulogne-Billancourt
  { lat: 48.9363, lng: 2.3573 }, // Saint-Denis
  { lat: 48.8047, lng: 2.1203 }, // Versailles
  { lat: 48.7764, lng: 2.4556 }, // Créteil
  { lat: 48.8921, lng: 2.2066 }, // Nanterre
  { lat: 48.6303, lng: 2.4428 }, // Évry
];

const TYPES = [
  'CONTENEUR_PLEIN',
  'CONTENEUR_ENDOMMAGÉ',
  'MAUVAISE_ODEUR',
  'DÉBORDEMENT',
  'AUTRE',
];

const DESCRIPTIONS = {
  CONTENEUR_PLEIN: [
    'Conteneur de recyclage complètement plein depuis plus de 2 jours.',
    'Conteneur débordant, impossible d\'ajouter des déchets.',
    'Bac de compost saturé, fermentation visible.',
    'Conteneur ordures ménagères plein à craquer.',
    'Poubelle de tri jaune pleine, couvercle impossible à fermer.',
    'Conteneur vert saturé, déchets commencent à déborder.',
    'Bac gris bondé depuis vendredi, aucune collecte effectuée.',
    'Conteneur de verre plein, bouteilles entassées à côté.',
    'Poubelle collective pleine, résidents se plaignent.',
    'Conteneur d\'ordures non vidé lors de la dernière tournée, déborde.',
  ],
  CONTENEUR_ENDOMMAGÉ: [
    'Porte du conteneur coincée, impossible à fermer correctement.',
    'Roue avant du conteneur cassée, il ne peut plus être déplacé.',
    'Couvercle du bac arraché, les déchets sont exposés.',
    'Conteneur brûlé partiellement, odeur de plastique fondu.',
    'Poignée de levée cassée, collecte impossible sans réparation.',
    'Conteneur renversé et cabossé suite à un accident de voiture.',
    'Fond du conteneur percé, fuite de liquides.',
    'Serrure du bac à verrou cassée, impossible à sécuriser.',
    'Conteneur vandalisé, graffitis et dommages structurels.',
    'Pédale d\'ouverture du bac défaillante.',
  ],
  MAUVAISE_ODEUR: [
    'Odeur nauséabonde émanant du conteneur depuis plusieurs jours.',
    'Forte odeur de fermentation autour du bac à compost.',
    'Odeur pestilentielle signalée par plusieurs riverains.',
    'Puanteur insupportable, probablement des déchets organiques oubliés.',
    'Odeur de pourriture suspecte près du conteneur gris.',
    'Liquide malodorant s\'écoulant sous le bac.',
    'Odeur de brûlé autour du conteneur de recyclage.',
    'Mauvaise odeur signalée par des commerçants du quartier.',
  ],
  DÉBORDEMENT: [
    'Déchets éparpillés sur 5m autour du conteneur, contamination du trottoir.',
    'Sacs poubelles empilés à côté du bac plein, risque sanitaire.',
    'Débordement important suite à la fête de quartier du week-end.',
    'Déchets renversés par le vent, la moitié sur la chaussée.',
    'Bac débordant depuis 3 jours, déchets attirés par des animaux.',
    'Dépôt sauvage constaté autour du conteneur bondé.',
    'Sacs déchirés et contenu répandu sur le trottoir.',
    'Débordement signalé après le marché hebdomadaire.',
    'Ordures débordantes bloquant partiellement l\'accès au trottoir.',
    'Zone contaminée sur 10m² autour du bac renversé.',
  ],
  AUTRE: [
    'Conteneur déplacé de son emplacement habituel d\'environ 20m.',
    'Conteneur occupé par des squatteurs, inutilisable.',
    'Matériel encombrant déposé illégalement dans le conteneur.',
    'Serrure de sécurité enlevée, bac accessible à tous.',
    'Conteneur bloqué par un véhicule garé dessus.',
    'Étiquette de tri effacée, les résidents ne savent plus quoi y mettre.',
    'Conteneur retourné par des individus mal intentionnés.',
  ],
};

const NOTES_RESOLUTION = {
  FERMÉ: [
    'Conteneur vidé lors de la tournée du lendemain.',
    'Réparation effectuée par l\'équipe de maintenance.',
    'Zone nettoyée et déchets ramassés par les agents.',
    'Bac remplacé par un nouveau conteneur.',
    'Intervention rapide de l\'équipe de collecte.',
    'Problème résolu après contact avec le gestionnaire de zone.',
    'Contenu évacué et conteneur désinfecté.',
    'Collecte exceptionnelle organisée suite au signalement.',
  ],
  REJETÉ: [
    'Signalement en doublon avec le ticket #PRE-042.',
    'Vérification sur place : conteneur en état normal.',
    'Signalement hors périmètre de notre collectivité.',
    'Problème résolu avant intervention, signalement rejeté.',
  ],
};

const PRIORITIES = ['NORMALE', 'HAUTE', 'BASSE', 'CRITIQUE'];

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

async function seedSignalDatabase(sequelize) {
  try {
    const Signalement = sequelize.models.Signalement;

    if (!Signalement) {
      console.log('⚠️ Signalement model not found. Skipping seed...');
      return;
    }

    const existing = await Signalement.count();
    if (existing > 0) {
      console.log(`Signal database already seeded (${existing} signalements). Skipping...`);
      return;
    }

    // ── Dates dynamiques relatives à aujourd'hui ──────────────────────────
    const NOW   = new Date();
    const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

    // Fetch real containers
    let containers = [];
    try {
      const containerUrl = `${process.env.CONTAINER_SERVICE_URL || 'http://container-service:3002'}/internal/containers`;
      const { data } = await axios.get(containerUrl, { timeout: 10000 });
      containers = Array.isArray(data) ? data.filter(c => c.id && c.id_zone) : [];
      console.log(`✓ Fetched ${containers.length} containers from container-service`);
    } catch (e) {
      console.log('⚠️ Could not fetch containers from container-service, using placeholder IDs...');
    }
    while (containers.length < 20) containers.push({ id: uuidv4(), id_zone: null });

    // Fetch real user IDs
    let userIds = [];
    try {
      const [results] = await sequelize.query(
        "SELECT id FROM utilisateurs WHERE role IN ('CITOYEN', 'AGENT') ORDER BY created_at ASC LIMIT 10"
      );
      userIds = results.map(r => r.id);
    } catch (e) {
      console.log('⚠️ Could not fetch user IDs, signals will have null id_utilisateur...');
    }

    const getUser      = (i) => userIds[i % userIds.length] || null;
    const getContainer = (i) => containers[i % containers.length].id;
    const getZone      = (i) => containers[i % containers.length].id_zone || null;
    const getLoc       = (i) => LOCATIONS[i % LOCATIONS.length];

    // ── IDs fixes des tournées (doivent correspondre au tour-service seed) ──
    // Slot 5 (semaine courante) : indices 50-59 → IDs 51-60
    // Slot 6 (semaine prochaine) : indices 60-69 → IDs 61-70
    // Slot 7 (+2 semaines) : indices 70-79 → IDs 71-80
    const TOURNEE_IDS = {
      EN_COURS: [
        'cccccccc-0001-0001-0001-000000000051', // Paris Centre
        'cccccccc-0001-0001-0001-000000000052', // Paris Est
        'cccccccc-0001-0001-0001-000000000053', // Paris Nord
        'cccccccc-0001-0001-0001-000000000054', // Paris Sud
      ],
      PLANIFIÉE_COURANTE: [
        'cccccccc-0001-0001-0001-000000000055', // Boulogne
        'cccccccc-0001-0001-0001-000000000056', // Saint-Denis
        'cccccccc-0001-0001-0001-000000000057', // Versailles
        'cccccccc-0001-0001-0001-000000000058', // Créteil
        'cccccccc-0001-0001-0001-000000000059', // Nanterre
        'cccccccc-0001-0001-0001-000000000060', // Évry
      ],
      PLANIFIÉE_W1: [
        'cccccccc-0001-0001-0001-000000000061', // Paris Centre  +1 sem.
        'cccccccc-0001-0001-0001-000000000062', // Paris Est     +1 sem.
        'cccccccc-0001-0001-0001-000000000063', // Paris Nord    +1 sem.
        'cccccccc-0001-0001-0001-000000000064', // Paris Sud     +1 sem.
        'cccccccc-0001-0001-0001-000000000065', // Boulogne      +1 sem.
        'cccccccc-0001-0001-0001-000000000066', // Saint-Denis   +1 sem.
        'cccccccc-0001-0001-0001-000000000067', // Versailles    +1 sem.
        'cccccccc-0001-0001-0001-000000000068', // Créteil       +1 sem.
        'cccccccc-0001-0001-0001-000000000069', // Nanterre      +1 sem.
        'cccccccc-0001-0001-0001-000000000070', // Évry          +1 sem.
      ],
      PLANIFIÉE_W2: [
        'cccccccc-0001-0001-0001-000000000071', // Paris Centre  +2 sem.
        'cccccccc-0001-0001-0001-000000000072', // Paris Est     +2 sem.
        'cccccccc-0001-0001-0001-000000000073', // Paris Nord    +2 sem.
        'cccccccc-0001-0001-0001-000000000074', // Paris Sud     +2 sem.
        'cccccccc-0001-0001-0001-000000000075', // Boulogne      +2 sem.
        'cccccccc-0001-0001-0001-000000000076', // Saint-Denis   +2 sem.
        'cccccccc-0001-0001-0001-000000000077', // Versailles    +2 sem.
        'cccccccc-0001-0001-0001-000000000078', // Créteil       +2 sem.
        'cccccccc-0001-0001-0001-000000000079', // Nanterre      +2 sem.
        'cccccccc-0001-0001-0001-000000000080', // Évry          +2 sem.
      ],
    };

    // ══════════════════════════════════════════════════════════════════════
    // 1) SIGNALEMENTS AUTONOMES (50)
    //    Étalés sur ~100 jours en arrière : index 0 = -100j, index 49 = -2j
    //    Statuts cohérents avec l'ancienneté :
    //      i  0-15 : FERMÉ (anciens, résolus)
    //      i 16-19 : REJETÉ (anciens, rejetés)
    //      i 20-34 : EN_COURS_DE_TRAITEMENT (récents, en cours)
    //      i 35-49 : OUVERT (très récents, pas encore pris en charge)
    // ══════════════════════════════════════════════════════════════════════

    function getStandaloneStatut(i) {
      if (i < 16) return 'FERMÉ';
      if (i < 20) return 'REJETÉ';
      if (i < 35) return 'EN_COURS_DE_TRAITEMENT';
      return 'OUVERT';
    }

    const signalements = [];

    for (let i = 0; i < 50; i++) {
      const type     = TYPES[i % TYPES.length];
      const statut   = getStandaloneStatut(i);
      const priorite = PRIORITIES[i % PRIORITIES.length];
      const descList = DESCRIPTIONS[type];
      const desc     = descList[i % descList.length];
      const loc      = getLoc(i);

      const created = addDays(TODAY, -(100 - i * 2));
      const updated = addDays(created, statut === 'OUVERT' ? 0 : 1 + (i % 4));

      let date_resolution  = null;
      let notes_resolution = null;

      if (statut === 'FERMÉ') {
        date_resolution = new Date(updated);
        date_resolution.setHours(10 + (i % 6));
        notes_resolution = NOTES_RESOLUTION.FERMÉ[i % NOTES_RESOLUTION.FERMÉ.length];
      } else if (statut === 'REJETÉ') {
        date_resolution = new Date(updated);
        date_resolution.setHours(9 + (i % 4));
        notes_resolution = NOTES_RESOLUTION.REJETÉ[i % NOTES_RESOLUTION.REJETÉ.length];
      }

      const id_utilisateur = i % 7 === 0 ? null : getUser(i);

      const latOffset = ((i * 17) % 100 - 50) / 10000;
      const lngOffset = ((i * 23) % 100 - 50) / 10000;

      signalements.push({
        id: uuidv4(),
        type,
        description: desc,
        statut,
        priorite,
        id_conteneur:    getContainer(i),
        id_utilisateur,
        id_tournee:      null,
        id_zone:         getZone(i),
        latitude:        parseFloat((loc.lat + latOffset).toFixed(6)),
        longitude:       parseFloat((loc.lng + lngOffset).toFixed(6)),
        photo_url:       null,
        date_resolution,
        notes_resolution,
        created_at:      created,
        updated_at:      updated,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // 2) SIGNALEMENTS LIÉS AUX TOURNÉES EN_COURS (12)
    //    Signalés il y a quelques jours, en cours de traitement ou en attente
    // ══════════════════════════════════════════════════════════════════════

    const TOURNEE_SIGS_PLAN = [
      ['CONTENEUR_PLEIN',        'EN_COURS_DE_TRAITEMENT', 'HAUTE',    0],
      ['DÉBORDEMENT',            'OUVERT',                 'CRITIQUE', 0],
      ['MAUVAISE_ODEUR',         'OUVERT',                 'NORMALE',  0],
      ['CONTENEUR_PLEIN',        'OUVERT',                 'NORMALE',  1],
      ['CONTENEUR_ENDOMMAGÉ',    'EN_COURS_DE_TRAITEMENT', 'HAUTE',    1],
      ['DÉBORDEMENT',            'OUVERT',                 'HAUTE',    1],
      ['MAUVAISE_ODEUR',         'OUVERT',                 'NORMALE',  2],
      ['CONTENEUR_PLEIN',        'EN_COURS_DE_TRAITEMENT', 'NORMALE',  2],
      ['AUTRE',                  'OUVERT',                 'BASSE',    2],
      ['DÉBORDEMENT',            'OUVERT',                 'CRITIQUE', 3],
      ['CONTENEUR_PLEIN',        'OUVERT',                 'HAUTE',    3],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT',                 'NORMALE',  3],
    ];

    TOURNEE_SIGS_PLAN.forEach(([type, statut, priorite, ecIdx], i) => {
      const tourneeId = TOURNEE_IDS.EN_COURS[ecIdx];
      const descList  = DESCRIPTIONS[type];
      const loc       = LOCATIONS[ecIdx];
      const latOff    = ((i * 13) % 100 - 50) / 10000;
      const lngOff    = ((i * 19) % 100 - 50) / 10000;
      const dt        = addDays(TODAY, -(5 - (i % 5)));

      signalements.push({
        id:              uuidv4(),
        type,
        description:     descList[i % descList.length],
        statut,
        priorite,
        id_conteneur:    getContainer(i + 50),
        id_utilisateur:  getUser(i + 50),
        id_tournee:      tourneeId,
        id_zone:         getZone(i + 50),
        latitude:        parseFloat((loc.lat + latOff).toFixed(6)),
        longitude:       parseFloat((loc.lng + lngOff).toFixed(6)),
        photo_url:       null,
        date_resolution: null,
        notes_resolution: null,
        created_at:      dt,
        updated_at:      dt,
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // 3) SIGNALEMENTS LIÉS AUX TOURNÉES PLANIFIÉES — semaine courante (18)
    //    Signalés récemment, tous OUVERT, en attente de la tournée
    // ══════════════════════════════════════════════════════════════════════

    const PLANIFIEE_SIGS_PLAN = [
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  0],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    0],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  0],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  1],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    1],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    1],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    2],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  2],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    2],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  3],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  3],
      ['AUTRE',                  'OUVERT', 'BASSE',    3],
      ['DÉBORDEMENT',            'OUVERT', 'CRITIQUE', 4],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    4],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'NORMALE',  4],
      ['AUTRE',                  'OUVERT', 'BASSE',    5],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  5],
      ['MAUVAISE_ODEUR',         'OUVERT', 'HAUTE',    5],
    ];

    PLANIFIEE_SIGS_PLAN.forEach(([type, statut, priorite, plIdx], i) => {
      const tourneeId = TOURNEE_IDS.PLANIFIÉE_COURANTE[plIdx];
      const descList  = DESCRIPTIONS[type];
      const loc       = LOCATIONS[(plIdx + 4) % LOCATIONS.length];
      const latOff    = ((i * 11) % 100 - 50) / 10000;
      const lngOff    = ((i * 17) % 100 - 50) / 10000;
      const dt        = addDays(TODAY, -(3 + (i % 5)));

      signalements.push({
        id:              uuidv4(),
        type,
        description:     descList[i % descList.length],
        statut,
        priorite,
        id_conteneur:    getContainer(i + 62),
        id_utilisateur:  getUser(i + 62),
        id_tournee:      tourneeId,
        id_zone:         getZone(i + 62),
        latitude:        parseFloat((loc.lat + latOff).toFixed(6)),
        longitude:       parseFloat((loc.lng + lngOff).toFixed(6)),
        photo_url:       null,
        date_resolution: null,
        notes_resolution: null,
        created_at:      dt,
        updated_at:      dt,
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // 4) SIGNALEMENTS LIÉS AUX TOURNÉES PLANIFIÉES — semaine +1 (30)
    //    3 par tournée × 10 tournées. Signalés il y a 1-7 jours, tous OUVERT
    // ══════════════════════════════════════════════════════════════════════

    const PLANIFIEE_W1_SIGS_PLAN = [
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  0],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    0],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    0],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    1],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  1],
      ['AUTRE',                  'OUVERT', 'BASSE',    1],
      ['DÉBORDEMENT',            'OUVERT', 'CRITIQUE', 2],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    2],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  2],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  3],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    3],
      ['DÉBORDEMENT',            'OUVERT', 'NORMALE',  3],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    4],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    4],
      ['AUTRE',                  'OUVERT', 'NORMALE',  4],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    5],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  5],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'NORMALE',  5],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    6],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  6],
      ['DÉBORDEMENT',            'OUVERT', 'CRITIQUE', 6],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    7],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  7],
      ['AUTRE',                  'OUVERT', 'BASSE',    7],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    8],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  8],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  8],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    9],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'NORMALE',  9],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    9],
    ];

    PLANIFIEE_W1_SIGS_PLAN.forEach(([type, statut, priorite, w1Idx], i) => {
      const tourneeId = TOURNEE_IDS.PLANIFIÉE_W1[w1Idx];
      const descList  = DESCRIPTIONS[type];
      const loc       = LOCATIONS[w1Idx % LOCATIONS.length];
      const latOff    = ((i * 13) % 100 - 50) / 10000;
      const lngOff    = ((i * 19) % 100 - 50) / 10000;
      const dt        = addDays(TODAY, -(1 + (i % 7)));

      signalements.push({
        id:              uuidv4(),
        type,
        description:     descList[i % descList.length],
        statut,
        priorite,
        id_conteneur:    getContainer(i + 80),
        id_utilisateur:  getUser(i + 80),
        id_tournee:      tourneeId,
        id_zone:         getZone(i + 80),
        latitude:        parseFloat((loc.lat + latOff).toFixed(6)),
        longitude:       parseFloat((loc.lng + lngOff).toFixed(6)),
        photo_url:       null,
        date_resolution: null,
        notes_resolution: null,
        created_at:      dt,
        updated_at:      dt,
      });
    });

    // ══════════════════════════════════════════════════════════════════════

    const transaction = await sequelize.transaction();
    let created;
    try {
      created = await Signalement.bulkCreate(signalements, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    const countByStatut = {};
    signalements.forEach(s => { countByStatut[s.statut] = (countByStatut[s.statut] || 0) + 1; });

    const linkedCount = TOURNEE_SIGS_PLAN.length + PLANIFIEE_SIGS_PLAN.length + PLANIFIEE_W1_SIGS_PLAN.length;
    console.log('✅ Signal database seeded successfully!');
    console.log(`   Created ${created.length} signalements — ${JSON.stringify(countByStatut)}`);
    console.log(`   Dont ${linkedCount} liés à des tournées (12 EN_COURS, 18 PLANIFIÉE sem. courante, 30 PLANIFIÉE sem. +1)`);

    return created;
  } catch (error) {
    console.error('❌ Error seeding signal database:', error);
    throw error;
  }
}

module.exports = { seedSignalDatabase };
