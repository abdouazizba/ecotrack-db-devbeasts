const Zone = require('./Zone');
const Conteneur = require('./Conteneur');
const Mesure = require('./Mesure');
const sequelize = require('../config/database');

// Models are already registered with sequelize when required 
// These models are NOT class-based, they're sequential.define models! So I export them as functions
module.exports = {
  Zone,
  Conteneur,
  Mesure,
  sequelize
};
