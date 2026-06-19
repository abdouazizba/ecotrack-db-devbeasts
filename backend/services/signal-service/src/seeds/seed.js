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

async function seedSignalDatabase(sequelize) {
  try {
    const Signalement = sequelize.models.Signalement;

    if (!Signalement) {
      console.log('⚠️ Signalement model not found. Skipping seed...');
      return;
    }

    const existing = await Signalement.count();
    if (existing > 0) {
      await Signalement.destroy({ truncate: true, cascade: true });
      console.log(`Cleared ${existing} signalements, re-seeding with latest data...`);
    }

    // Fetch real containers (id + id_zone) from container-service internal endpoint
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

    // Fetch real user IDs (citoyens pour la majorité, null pour IoT)
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
    const getLoc = (i) => LOCATIONS[i % LOCATIONS.length];

    // Distribution : 50 signalements
    // Types     : CONTENEUR_PLEIN×15, CONTENEUR_ENDOMMAGÉ×10, DÉBORDEMENT×10, MAUVAISE_ODEUR×8, AUTRE×7
    // Statuts   : FERMÉ×20, EN_COURS×15, OUVERT×10, REJETÉ×5
    // Priorités : NORMALE×20, HAUTE×17, BASSE×8, CRITIQUE×5
    const PLAN = [
      // type,                  statut,                  priorite
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'HAUTE'],
      ['CONTENEUR_ENDOMMAGÉ',   'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['DÉBORDEMENT',           'FERMÉ',                 'CRITIQUE'],
      ['MAUVAISE_ODEUR',        'EN_COURS_DE_TRAITEMENT','NORMALE'],
      ['CONTENEUR_PLEIN',       'OUVERT',                'NORMALE'],
      ['AUTRE',                 'OUVERT',                'BASSE'],
      ['CONTENEUR_ENDOMMAGÉ',   'FERMÉ',                 'HAUTE'],
      ['DÉBORDEMENT',           'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'NORMALE'],
      ['MAUVAISE_ODEUR',        'OUVERT',                'NORMALE'],
      ['CONTENEUR_PLEIN',       'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['CONTENEUR_ENDOMMAGÉ',   'OUVERT',                'NORMALE'],
      ['DÉBORDEMENT',           'FERMÉ',                 'CRITIQUE'],
      ['AUTRE',                 'REJETÉ',                'BASSE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'NORMALE'],
      ['MAUVAISE_ODEUR',        'FERMÉ',                 'BASSE'],
      ['CONTENEUR_ENDOMMAGÉ',   'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['DÉBORDEMENT',           'OUVERT',                'HAUTE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'HAUTE'],
      ['AUTRE',                 'EN_COURS_DE_TRAITEMENT','NORMALE'],
      ['CONTENEUR_PLEIN',       'REJETÉ',                'BASSE'],
      ['CONTENEUR_ENDOMMAGÉ',   'FERMÉ',                 'NORMALE'],
      ['DÉBORDEMENT',           'FERMÉ',                 'HAUTE'],
      ['MAUVAISE_ODEUR',        'EN_COURS_DE_TRAITEMENT','NORMALE'],
      ['CONTENEUR_PLEIN',       'OUVERT',                'NORMALE'],
      ['AUTRE',                 'FERMÉ',                 'BASSE'],
      ['CONTENEUR_ENDOMMAGÉ',   'OUVERT',                'HAUTE'],
      ['DÉBORDEMENT',           'EN_COURS_DE_TRAITEMENT','CRITIQUE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'NORMALE'],
      ['MAUVAISE_ODEUR',        'OUVERT',                'BASSE'],
      ['CONTENEUR_PLEIN',       'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['CONTENEUR_ENDOMMAGÉ',   'FERMÉ',                 'NORMALE'],
      ['DÉBORDEMENT',           'REJETÉ',                'NORMALE'],
      ['AUTRE',                 'OUVERT',                'BASSE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'HAUTE'],
      ['MAUVAISE_ODEUR',        'FERMÉ',                 'NORMALE'],
      ['CONTENEUR_ENDOMMAGÉ',   'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['DÉBORDEMENT',           'FERMÉ',                 'HAUTE'],
      ['CONTENEUR_PLEIN',       'OUVERT',                'NORMALE'],
      ['AUTRE',                 'EN_COURS_DE_TRAITEMENT','NORMALE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'CRITIQUE'],
      ['CONTENEUR_ENDOMMAGÉ',   'REJETÉ',                'BASSE'],
      ['DÉBORDEMENT',           'OUVERT',                'HAUTE'],
      ['MAUVAISE_ODEUR',        'EN_COURS_DE_TRAITEMENT','NORMALE'],
      ['CONTENEUR_PLEIN',       'FERMÉ',                 'NORMALE'],
      ['AUTRE',                 'FERMÉ',                 'BASSE'],
      ['CONTENEUR_ENDOMMAGÉ',   'OUVERT',                'NORMALE'],
      ['DÉBORDEMENT',           'FERMÉ',                 'CRITIQUE'],
      ['CONTENEUR_PLEIN',       'EN_COURS_DE_TRAITEMENT','HAUTE'],
      ['MAUVAISE_ODEUR',        'REJETÉ',                'BASSE'],
    ];

    // IDs fixes des tournées EN_COURS (semaine 7) et PLANIFIÉES — doit correspondre au tour-service seed
    const TOURNEE_IDS = {
      EN_COURS: [
        'cccccccc-0001-0001-0001-000000000061', // Paris Centre
        'cccccccc-0001-0001-0001-000000000062', // Paris Est
        'cccccccc-0001-0001-0001-000000000063', // Paris Nord
        'cccccccc-0001-0001-0001-000000000064', // Paris Sud
      ],
      PLANIFIÉE: [
        'cccccccc-0001-0001-0001-000000000065', // Boulogne
        'cccccccc-0001-0001-0001-000000000066', // Saint-Denis
        'cccccccc-0001-0001-0001-000000000067', // Versailles
        'cccccccc-0001-0001-0001-000000000068', // Créteil
        'cccccccc-0001-0001-0001-000000000069', // Nanterre
        'cccccccc-0001-0001-0001-000000000070', // Évry
      ],
      PLANIFIÉE_S8: [
        'cccccccc-0001-0001-0001-000000000071', // Paris Centre  S8
        'cccccccc-0001-0001-0001-000000000072', // Paris Est     S8
        'cccccccc-0001-0001-0001-000000000073', // Paris Nord    S8
        'cccccccc-0001-0001-0001-000000000074', // Paris Sud     S8
        'cccccccc-0001-0001-0001-000000000075', // Boulogne      S8
        'cccccccc-0001-0001-0001-000000000076', // Saint-Denis   S8
        'cccccccc-0001-0001-0001-000000000077', // Versailles    S8
        'cccccccc-0001-0001-0001-000000000078', // Créteil       S8 (TRN-2026-078)
        'cccccccc-0001-0001-0001-000000000079', // Nanterre      S8
        'cccccccc-0001-0001-0001-000000000080', // Évry          S8
      ],
    };

    // Dates étalées sur juin 2026 (alignées avec les tournées)
    const BASE = new Date('2026-06-01');

    const signalements = PLAN.map(([type, statut, priorite], i) => {
      const descList = DESCRIPTIONS[type];
      const desc = descList[i % descList.length];
      const loc = getLoc(i);

      // ~3 jours entre chaque signalement
      const created = new Date(BASE);
      created.setDate(created.getDate() + i * 3);

      const updated = new Date(created);
      updated.setDate(updated.getDate() + (statut === 'OUVERT' ? 0 : 1 + (i % 4)));

      let date_resolution = null;
      let notes_resolution = null;

      if (statut === 'FERMÉ') {
        date_resolution = new Date(updated);
        date_resolution.setHours(10 + (i % 6));
        const notesList = NOTES_RESOLUTION.FERMÉ;
        notes_resolution = notesList[i % notesList.length];
      } else if (statut === 'REJETÉ') {
        date_resolution = new Date(updated);
        date_resolution.setHours(9 + (i % 4));
        const notesList = NOTES_RESOLUTION.REJETÉ;
        notes_resolution = notesList[i % notesList.length];
      }

      // Quelques signalements IoT (id_utilisateur null) : indices multiples de 7
      const id_utilisateur = i % 7 === 0 ? null : getUser(i);

      // Légère variation de coordonnées autour du point de zone (±0.005°)
      const latOffset = ((i * 17) % 100 - 50) / 10000;
      const lngOffset = ((i * 23) % 100 - 50) / 10000;

      return {
        id: uuidv4(),
        type,
        description: desc,
        statut,
        priorite,
        id_conteneur: getContainer(i),
        id_utilisateur,
        id_tournee: null,
        id_zone:    getZone(i),
        latitude:  parseFloat((loc.lat + latOffset).toFixed(6)),
        longitude: parseFloat((loc.lng + lngOffset).toFixed(6)),
        photo_url: null,
        date_resolution,
        notes_resolution,
        created_at: created,
        updated_at: updated,
      };
    });

    // ── Signalements liés aux tournées EN_COURS (à traiter par les agents) ──────
    const BASE_TOURNEE = new Date('2026-06-01'); // récents — pour les tournées de la semaine 7
    const TOURNEE_SIGS_PLAN = [
      // type,                   statut,                  priorite, idx_tournee_EC
      ['CONTENEUR_PLEIN',        'EN_COURS_DE_TRAITEMENT','HAUTE',    0],
      ['DÉBORDEMENT',            'OUVERT',                'CRITIQUE', 0],
      ['MAUVAISE_ODEUR',         'OUVERT',                'NORMALE',  0],
      ['CONTENEUR_PLEIN',        'OUVERT',                'NORMALE',  1],
      ['CONTENEUR_ENDOMMAGÉ',    'EN_COURS_DE_TRAITEMENT','HAUTE',    1],
      ['DÉBORDEMENT',            'OUVERT',                'HAUTE',    1],
      ['MAUVAISE_ODEUR',         'OUVERT',                'NORMALE',  2],
      ['CONTENEUR_PLEIN',        'EN_COURS_DE_TRAITEMENT','NORMALE',  2],
      ['AUTRE',                  'OUVERT',                'BASSE',    2],
      ['DÉBORDEMENT',            'OUVERT',                'CRITIQUE', 3],
      ['CONTENEUR_PLEIN',        'OUVERT',                'HAUTE',    3],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT',                'NORMALE',  3],
    ];

    // Signalements liés aux tournées PLANIFIÉES — 3 par tournée (6 tournées × 3 = 18)
    const PLANIFIEE_SIGS_PLAN = [
      // Boulogne (idx=0) — 3 signalements
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  0],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    0],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  0],
      // Saint-Denis (idx=1) — 3 signalements
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  1],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    1],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    1],
      // Versailles (idx=2) — 3 signalements
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    2],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  2],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    2],
      // Créteil (idx=3) — 3 signalements
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  3],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  3],
      ['AUTRE',                  'OUVERT', 'BASSE',    3],
      // Nanterre (idx=4) — 3 signalements
      ['DÉBORDEMENT',            'OUVERT', 'CRITIQUE', 4],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    4],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'NORMALE',  4],
      // Évry (idx=5) — 3 signalements
      ['AUTRE',                  'OUVERT', 'BASSE',    5],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  5],
      ['MAUVAISE_ODEUR',         'OUVERT', 'HAUTE',    5],
    ];

    TOURNEE_SIGS_PLAN.forEach(([type, statut, priorite, ecIdx], i) => {
      const tourneeId = TOURNEE_IDS.EN_COURS[ecIdx];
      const descList  = DESCRIPTIONS[type];
      const loc       = LOCATIONS[ecIdx];
      const latOff    = ((i * 13) % 100 - 50) / 10000;
      const lngOff    = ((i * 19) % 100 - 50) / 10000;
      const dt        = new Date(BASE_TOURNEE);
      dt.setDate(dt.getDate() + i);

      signalements.push({
        id:             uuidv4(),
        type,
        description:    descList[i % descList.length],
        statut,
        priorite,
        id_conteneur:   getContainer(i + 50),
        id_utilisateur: getUser(i + 50),
        id_tournee:     tourneeId,
        id_zone:        getZone(i + 50),
        latitude:       parseFloat((loc.lat + latOff).toFixed(6)),
        longitude:      parseFloat((loc.lng + lngOff).toFixed(6)),
        photo_url:      null,
        date_resolution: null,
        notes_resolution: null,
        created_at:     dt,
        updated_at:     dt,
      });
    });

    PLANIFIEE_SIGS_PLAN.forEach(([type, statut, priorite, plIdx], i) => {
      const tourneeId = TOURNEE_IDS.PLANIFIÉE[plIdx];
      const descList  = DESCRIPTIONS[type];
      const loc       = LOCATIONS[(plIdx + 4) % LOCATIONS.length];
      const latOff    = ((i * 11) % 100 - 50) / 10000;
      const lngOff    = ((i * 17) % 100 - 50) / 10000;
      const dt        = new Date(BASE_TOURNEE);
      dt.setDate(dt.getDate() + i + 2);

      signalements.push({
        id:             uuidv4(),
        type,
        description:    descList[i % descList.length],
        statut,
        priorite,
        id_conteneur:   getContainer(i + 62),
        id_utilisateur: getUser(i + 62),
        id_tournee:     tourneeId,
        id_zone:        getZone(i + 62),
        latitude:       parseFloat((loc.lat + latOff).toFixed(6)),
        longitude:      parseFloat((loc.lng + lngOff).toFixed(6)),
        photo_url:      null,
        date_resolution: null,
        notes_resolution: null,
        created_at:     dt,
        updated_at:     dt,
      });
    });

    // Signalements liés aux tournées PLANIFIÉES semaine 8 — 3 par tournée (10 × 3 = 30)
    const PLANIFIEE_S8_SIGS_PLAN = [
      // Paris Centre S8 (idx=0)
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  0],
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    0],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    0],
      // Paris Est S8 (idx=1)
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    1],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  1],
      ['AUTRE',                  'OUVERT', 'BASSE',    1],
      // Paris Nord S8 (idx=2)
      ['DÉBORDEMENT',            'OUVERT', 'CRITIQUE', 2],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    2],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  2],
      // Paris Sud S8 (idx=3)
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  3],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    3],
      ['DÉBORDEMENT',            'OUVERT', 'NORMALE',  3],
      // Boulogne S8 (idx=4)
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    4],
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    4],
      ['AUTRE',                  'OUVERT', 'NORMALE',  4],
      // Saint-Denis S8 (idx=5)
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    5],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  5],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'NORMALE',  5],
      // Versailles S8 (idx=6)
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    6],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  6],
      ['DÉBORDEMENT',            'OUVERT', 'CRITIQUE', 6],
      // Créteil S8 (idx=7) — TRN-2026-078
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'HAUTE',    7],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  7],
      ['AUTRE',                  'OUVERT', 'BASSE',    7],
      // Nanterre S8 (idx=8)
      ['DÉBORDEMENT',            'OUVERT', 'HAUTE',    8],
      ['MAUVAISE_ODEUR',         'OUVERT', 'NORMALE',  8],
      ['CONTENEUR_PLEIN',        'OUVERT', 'NORMALE',  8],
      // Évry S8 (idx=9)
      ['CONTENEUR_PLEIN',        'OUVERT', 'HAUTE',    9],
      ['CONTENEUR_ENDOMMAGÉ',    'OUVERT', 'NORMALE',  9],
      ['MAUVAISE_ODEUR',         'OUVERT', 'BASSE',    9],
    ];

    PLANIFIEE_S8_SIGS_PLAN.forEach(([type, statut, priorite, s8Idx], i) => {
      const tourneeId = TOURNEE_IDS.PLANIFIÉE_S8[s8Idx];
      const descList  = DESCRIPTIONS[type];
      const loc       = LOCATIONS[s8Idx % LOCATIONS.length];
      const latOff    = ((i * 13) % 100 - 50) / 10000;
      const lngOff    = ((i * 19) % 100 - 50) / 10000;
      const dt        = new Date(BASE_TOURNEE);
      dt.setDate(dt.getDate() + i + 5);

      signalements.push({
        id:             uuidv4(),
        type,
        description:    descList[i % descList.length],
        statut,
        priorite,
        id_conteneur:   getContainer(i + 80),
        id_utilisateur: getUser(i + 80),
        id_tournee:     tourneeId,
        id_zone:        getZone(i + 80),
        latitude:       parseFloat((loc.lat + latOff).toFixed(6)),
        longitude:      parseFloat((loc.lng + lngOff).toFixed(6)),
        photo_url:      null,
        date_resolution: null,
        notes_resolution: null,
        created_at:     dt,
        updated_at:     dt,
      });
    });

    const transaction = await sequelize.transaction();
    let created;
    try {
      created = await Signalement.bulkCreate(signalements, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    console.log('✅ Signal database seeded successfully!');
    const linkedCount = TOURNEE_SIGS_PLAN.length + PLANIFIEE_SIGS_PLAN.length + PLANIFIEE_S8_SIGS_PLAN.length;
    console.log(`   Created ${created.length} signalements (dont ${linkedCount} liés à des tournées — 3/tournée EN_COURS, 3/tournée PLANIFIÉE S7, 3/tournée PLANIFIÉE S8)`);

    return created;
  } catch (error) {
    console.error('❌ Error seeding signal database:', error);
    throw error;
  }
}

module.exports = { seedSignalDatabase };
