const User = require('./User');
const Invoice = require('./Invoice');
const Transaction = require('./Transaction');

// ─── Associations ─────────────────────────────────────────────────────────────

// User → Invoices (uploaded)
User.hasMany(Invoice, { foreignKey: 'uploadedBy', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// User → Invoices (approved)
User.hasMany(Invoice, { foreignKey: 'approvedBy', as: 'approvedInvoices' });
Invoice.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Invoice → Transaction
Invoice.hasOne(Transaction, { foreignKey: 'invoiceId', as: 'transaction' });
Transaction.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// User → Transaction (financier)
User.hasMany(Transaction, { foreignKey: 'financierId', as: 'fundedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'financierId', as: 'financier' });

// User → Transaction (business)
User.hasMany(Transaction, { foreignKey: 'businessId', as: 'businessTransactions' });
Transaction.belongsTo(User, { foreignKey: 'businessId', as: 'business' });

module.exports = { User, Invoice, Transaction };
