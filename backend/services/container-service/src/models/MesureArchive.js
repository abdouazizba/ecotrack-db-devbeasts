const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MesureArchive = sequelize.define('MesureArchive', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  date_mesure: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  taux_remplissage: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  batterie: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  signal_force: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_conteneur: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  id_capteur: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'mesures_archive',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['id_conteneur', 'date_mesure'] },
    { fields: ['archived_at'] },
  ],
});

module.exports = MesureArchive;
