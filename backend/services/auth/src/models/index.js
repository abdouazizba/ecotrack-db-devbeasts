const sequelize = require('../config/database');
const User = require('./User');

// Initialize models
const models = {
  User: User(sequelize),
};

// Export both models and sequelize for sync
module.exports = {
  sequelize,
  ...models,
};
