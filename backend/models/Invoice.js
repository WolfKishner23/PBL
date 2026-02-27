const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Amount must be positive' }
        }
    },
    debtorCompany: {
        type: DataTypes.STRING,
        allowNull: false
    },
    debtorGST: {
        type: DataTypes.STRING
    },
    invoiceDate: {
        type: DataTypes.DATE
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    paymentTerms: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT
    },
    pdfUrl: {
        type: DataTypes.STRING
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'review', 'approved', 'funded', 'rejected'),
        defaultValue: 'draft'
    },
    riskScore: {
        type: DataTypes.FLOAT
    },
    riskLevel: {
        type: DataTypes.ENUM('low', 'medium', 'high')
    },
    riskDetails: {
        type: DataTypes.JSON
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rejectionReason: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: true,
    tableName: 'invoices'
});

module.exports = Invoice;
