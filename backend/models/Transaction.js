const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    financierId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    businessId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    fundedAmount: {
        type: DataTypes.DECIMAL(12, 2)
    },
    returnRate: {
        type: DataTypes.FLOAT
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'defaulted'),
        defaultValue: 'active'
    },
    fundedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'transactions'
});

module.exports = Transaction;
