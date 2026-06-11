const Zone = require('./Zone');
const Conteneur = require('./Conteneur');
const Capteur = require('./Capteur');
const Mesure = require('./Mesure');
const MesureArchive = require('./MesureArchive');
const sequelize = require('../config/database');

// Associations Capteur ↔ Mesure
Mesure.belongsTo(Capteur, { foreignKey: 'id_capteur', as: 'capteur', constraints: false });
Capteur.hasMany(Mesure, { foreignKey: 'id_capteur', as: 'mesures', constraints: false });

module.exports = {
  Zone,
  Conteneur,
  Capteur,
  Mesure,
  MesureArchive,
  sequelize,
};
