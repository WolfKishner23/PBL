const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExternalCreditRating = sequelize.define('ExternalCreditRating', {
    buyerName: {
        type: DataTypes.STRING(100),
        primaryKey: true,
        allowNull: false
    },
    bureauName: {
        type: DataTypes.STRING(50)
    },
    creditScore: {
        type: DataTypes.INTEGER
    },
    ratingGrade: {
        type: DataTypes.STRING(10)
    },
    lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    apiResponseJson: {
        type: DataTypes.TEXT
    },
    queryCost: {
        type: DataTypes.DECIMAL(10, 2)
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'external_credit_ratings'
});

module.exports = ExternalCreditRating;
