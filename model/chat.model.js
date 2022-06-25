const { DataTypes } = require('sequelize');
const { chatModel } = require('.');
const { sequelize } = require('../config')

const ChatModel = sequelize.define('Chat', {
    // Model attributes are defined here
    uniqueid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    from_id: {
        type: DataTypes.STRING,
    },
    to_id: {
        type: DataTypes.STRING,
    },
}, {
    freezeTableName: true
});

(async() => {
    // await ChatModel.sync({force:true})
})();

module.exports = ChatModel


