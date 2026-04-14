const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('credit', 'debit'),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    referenceId: {
        type: DataTypes.INTEGER, // Usually invoiceId or transactionId
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'wallet_transactions'
});

module.exports = WalletTransaction;
