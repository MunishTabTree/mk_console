const { DataTypes } = require('sequelize');
const { sequelize } = require('../config')

const ChatMessageModel = sequelize.define('ChatMessage', {
    // Model attributes are defined here
    uniqueid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    data: {
        type: DataTypes.TEXT('long')
    },
}, {
    freezeTableName: true
});

(async() => {
    await ChatMessageModel.sync({force:true})
})();

module.exports = ChatMessageModel


