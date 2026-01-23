const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Zone = require('./Zone');

const Conteneur = sequelize.define('Conteneur', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code_conteneur: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type_conteneur: {
    type: DataTypes.ENUM('standard', 'selective', 'organic', 'hazardous'),
    allowNull: false,
  },
  capacite: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Capacity in liters',
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('actif', 'maintenance', 'retire'),
    defaultValue: 'actif',
  },
  date_installation: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  id_zone: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'zones',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'conteneurs',
  timestamps: true,
  underscored: true,
});

// Define association
Conteneur.belongsTo(Zone, { foreignKey: 'id_zone', as: 'zone' });
Zone.hasMany(Conteneur, { foreignKey: 'id_zone', as: 'conteneurs' });

module.exports = Conteneur;
