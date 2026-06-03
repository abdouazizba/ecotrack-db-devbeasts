const { v4: uuidv4 } = require('uuid');

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

    // Fetch real container IDs
    let containerIds = [];
    try {
      const [results] = await sequelize.query(
        'SELECT id FROM conteneurs ORDER BY created_at ASC LIMIT 20'
      );
      containerIds = results.map(r => r.id);
    } catch (e) {
      console.log('⚠️ Could not fetch container IDs, using placeholder UUIDs...');
    }
    while (containerIds.length < 20) containerIds.push(uuidv4());

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

    const getUser = (i) => userIds[i % userIds.length] || null;
    const getContainer = (i) => containerIds[i % containerIds.length];
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

    // Dates étalées sur jan–mai 2026 (toutes passées)
    const BASE = new Date('2026-01-05');

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
        latitude:  parseFloat((loc.lat + latOffset).toFixed(6)),
        longitude: parseFloat((loc.lng + lngOffset).toFixed(6)),
        photo_url: null,
        date_resolution,
        notes_resolution,
        created_at: created,
        updated_at: updated,
      };
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
    console.log(`   Created ${created.length} signalements`);

    return created;
  } catch (error) {
    console.error('❌ Error seeding signal database:', error);
    throw error;
  }
}

module.exports = { seedSignalDatabase };
