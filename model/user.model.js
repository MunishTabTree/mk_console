const { DataTypes } = require('sequelize');
const { sequelize } = require('../config')

const UserModel = sequelize.define('User', {
    // Model attributes are defined here
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING
        // allowNull defaults to true
    },
    password: {
        type: DataTypes.STRING
        // allowNull defaults to true
    }
}, {
    freezeTableName: true
});

module.exports = UserModel


