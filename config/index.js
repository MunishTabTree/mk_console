// sequelize mysql config

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('mk_console', 'munish', 'Munish@123', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});


module.exports = {
    sequelize
}
