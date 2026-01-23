const sequelize = require('../config/database');

const Utilisateur = require('./Utilisateur')(sequelize);
const Agent = require('./Agent')(sequelize);
const Citoyen = require('./Citoyen')(sequelize);
const Admin = require('./Admin')(sequelize);

// Define associations
if (Utilisateur.hasOne) {
  Utilisateur.hasOne(Agent, { foreignKey: 'utilisateur_id' });
  Utilisateur.hasOne(Citoyen, { foreignKey: 'utilisateur_id' });
  Utilisateur.hasOne(Admin, { foreignKey: 'utilisateur_id' });
}

module.exports = {
  sequelize,
  Utilisateur,
  Agent,
  Citoyen,
  Admin,
};
