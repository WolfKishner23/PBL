const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
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
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'info' // e.g., 'info', 'success', 'warning'
    },
    invoiceId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'invoices',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    tableName: 'notifications'
});

module.exports = Notification;
