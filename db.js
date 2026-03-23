const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres', 'postgres', 'publicdb', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = { sequelize, DataTypes };