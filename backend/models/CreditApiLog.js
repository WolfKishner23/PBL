const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CreditApiLog = sequelize.define('CreditApiLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    buyerName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    bureauName: {
        type: DataTypes.STRING(50)
    },
    queryTimestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2)
    },
    responseTimeMs: {
        type: DataTypes.INTEGER
    },
    status: {
        type: DataTypes.STRING(20)
    }
}, {
    timestamps: false,
    tableName: 'credit_api_logs'
});

module.exports = CreditApiLog;
