const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ConcentrationRisk = sequelize.define('ConcentrationRisk', {
    sellerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    buyerName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        primaryKey: true
    },
    totalInvoiceAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    },
    concentrationPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00
    },
    riskFlag: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'low'
    },
    lastCalculatedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'seller_buyer_concentration'
});

module.exports = ConcentrationRisk;
