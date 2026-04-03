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
    // ─── Circular Economy Fields ──────────────────────────────────────────
    creditorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    debtorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // ─── Legacy fields kept for backward compatibility ────────────────────
    debtorCompany: {
        type: DataTypes.STRING
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
    industry: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.TEXT
    },
    pdfUrl: {
        type: DataTypes.STRING
    },
    // ─── Status Flow: pending → debtor_confirmed → funded → paid → settled
    status: {
        type: DataTypes.ENUM('pending', 'debtor_confirmed', 'disputed', 'funded', 'paid', 'settled'),
        defaultValue: 'pending'
    },
    // ─── Finance Partner who funded ──────────────────────────────────────
    fundedBy: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // ─── Financial Calculations ──────────────────────────────────────────
    advanceAmount: {
        type: DataTypes.DECIMAL(12, 2)
    },
    discountFee: {
        type: DataTypes.DECIMAL(12, 2)
    },
    // ─── Risk Assessment ─────────────────────────────────────────────────
    riskScore: {
        type: DataTypes.FLOAT
    },
    riskLabel: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH')
    },
    riskDetails: {
        type: DataTypes.JSON
    },
    // ─── Legacy fields (kept intact) ─────────────────────────────────────
    rejectionReason: {
        type: DataTypes.TEXT
    },
    // ─── Lifecycle Timestamps ────────────────────────────────────────────
    confirmedAt: {
        type: DataTypes.DATE
    },
    fundedAt: {
        type: DataTypes.DATE
    },
    paidAt: {
        type: DataTypes.DATE
    },
    settledAt: {
        type: DataTypes.DATE
    }
}, {
    timestamps: true,
    tableName: 'invoices'
});

module.exports = Invoice;
