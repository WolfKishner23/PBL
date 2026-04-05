const User = require('./User');
const Invoice = require('./Invoice');
const Transaction = require('./Transaction');
const Feedback = require('./Feedback');

// ─── Associations ─────────────────────────────────────────────────────────────

// Creditor (company who uploaded the invoice)
User.hasMany(Invoice, { foreignKey: 'creditorId', as: 'creditorInvoices' });
Invoice.belongsTo(User, { foreignKey: 'creditorId', as: 'creditor' });

// Debtor (company who owes the money)
User.hasMany(Invoice, { foreignKey: 'debtorId', as: 'debtorInvoices' });
Invoice.belongsTo(User, { foreignKey: 'debtorId', as: 'debtor' });

// Finance Partner who funded
User.hasMany(Invoice, { foreignKey: 'fundedBy', as: 'fundedInvoices' });
Invoice.belongsTo(User, { foreignKey: 'fundedBy', as: 'funder' });

// Invoice → Transaction
Invoice.hasOne(Transaction, { foreignKey: 'invoiceId', as: 'transaction' });
Transaction.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// User → Transaction (financier)
User.hasMany(Transaction, { foreignKey: 'financierId', as: 'fundedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'financierId', as: 'financier' });

// User → Transaction (business/creditor)
User.hasMany(Transaction, { foreignKey: 'businessId', as: 'businessTransactions' });
Transaction.belongsTo(User, { foreignKey: 'businessId', as: 'business' });

module.exports = { User, Invoice, Transaction, Feedback };
