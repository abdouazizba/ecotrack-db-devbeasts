const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zone = sequelize.define('Zone', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code_zone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  geometrie: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'GeoJSON geometry of the zone',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Latitude coordinate of the zone center',
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Longitude coordinate of the zone center',
  },
  population_estimee: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'zones',
  timestamps: true,
  underscored: true,
});

module.exports = Zone;
