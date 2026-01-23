const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const basename = path.basename(__filename);
const models = {};

// Load all models
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
  });

// Associate models
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Define associations manually
if (models.Tournee && models.TourneeAgent) {
  models.Tournee.hasMany(models.TourneeAgent, {
    foreignKey: 'id_tournee',
    as: 'agents',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  models.TourneeAgent.belongsTo(models.Tournee, {
    foreignKey: 'id_tournee',
    as: 'tournee',
  });
}

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
