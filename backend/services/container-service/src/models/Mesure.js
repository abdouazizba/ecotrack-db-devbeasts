const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Conteneur = require('./Conteneur');

const Mesure = sequelize.define('Mesure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  date_mesure: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  taux_remplissage: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Fill rate in percentage (0-100)',
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Temperature in Celsius',
  },
  batterie: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Battery level in percentage',
  },
  signal_force: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Signal strength indicator',
  },
  id_conteneur: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'conteneurs',
      key: 'id',
    },
  },
}, {
  tableName: 'mesures',
  timestamps: true,
  underscored: true,
});

// Define association
Mesure.belongsTo(Conteneur, { foreignKey: 'id_conteneur', as: 'conteneur' });
Conteneur.hasMany(Mesure, { foreignKey: 'id_conteneur', as: 'mesures' });

module.exports = Mesure;
