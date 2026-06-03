const Zone = require('./Zone');
const Conteneur = require('./Conteneur');
const Capteur = require('./Capteur');
const Mesure = require('./Mesure');
const sequelize = require('../config/database');

// Associations Capteur ↔ Mesure
const { DataTypes } = require('sequelize');
Mesure.belongsTo(Capteur, { foreignKey: 'id_capteur', as: 'capteur', constraints: false });
Capteur.hasMany(Mesure, { foreignKey: 'id_capteur', as: 'mesures', constraints: false });

module.exports = {
  Zone,
  Conteneur,
  Capteur,
  Mesure,
  sequelize,
};
