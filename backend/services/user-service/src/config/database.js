const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecotrack_user',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  models: [__dirname + '/../models'],
});

module.exports = sequelize;
