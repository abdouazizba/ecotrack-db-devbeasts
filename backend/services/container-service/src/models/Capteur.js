const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Conteneur = require('./Conteneur');

const Capteur = sequelize.define('Capteur', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code_capteur: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Unique identifier e.g. CAPT-PC-001-REMPLISSAGE',
  },
  type: {
    type: DataTypes.ENUM('REMPLISSAGE', 'TEMPERATURE', 'SIGNAL'),
    allowNull: false,
  },
  id_conteneur: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'conteneurs', key: 'id' },
    onDelete: 'CASCADE',
  },
  statut: {
    type: DataTypes.ENUM('ACTIF', 'INACTIF', 'EN_MAINTENANCE'),
    defaultValue: 'ACTIF',
    allowNull: false,
  },
  batterie: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Battery level 0-100 %',
  },
  derniere_mesure_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'capteurs',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['code_capteur'] },
  ],
});

Capteur.belongsTo(Conteneur, { foreignKey: 'id_conteneur', as: 'conteneur' });
Conteneur.hasMany(Capteur, { foreignKey: 'id_conteneur', as: 'capteurs' });

module.exports = Capteur;
