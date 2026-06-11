const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Signalement = sequelize.define('Signalement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('CONTENEUR_PLEIN', 'CONTENEUR_ENDOMMAGÉ', 'MAUVAISE_ODEUR', 'DÉBORDEMENT', 'AUTRE'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM('OUVERT', 'EN_COURS_DE_TRAITEMENT', 'FERMÉ', 'REJETÉ'),
      defaultValue: 'OUVERT',
      allowNull: false,
    },
    priorite: {
      type: DataTypes.ENUM('BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE'),
      defaultValue: 'NORMALE',
      allowNull: false,
    },
    id_conteneur: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    id_utilisateur: {
      type: DataTypes.UUID,
      allowNull: true, // null pour les signalements auto-générés par IoT (pas de citoyen)
    },
    id_tournee: {
      type: DataTypes.UUID,
      allowNull: true, // null si signalement hors tournée
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    date_resolution: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes_resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['id_conteneur'] },
      { fields: ['statut'] },
      { fields: ['id_utilisateur'] },
    ],
  });

  return Signalement;
};
