const User = require('./User');
const Invoice = require('./Invoice');
const Transaction = require('./Transaction');
const Notification = require('./Notification');
const ConcentrationRisk = require('./ConcentrationRisk');
const ExternalCreditRating = require('./ExternalCreditRating');
const CreditApiLog = require('./CreditApiLog');
const WalletTransaction = require('./WalletTransaction');

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

// User → Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Invoice → Notifications
Notification.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// User → Wallet Transactions
User.hasMany(WalletTransaction, { foreignKey: 'userId', as: 'walletTransactions' });
WalletTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → Concentration Risk
User.hasMany(ConcentrationRisk, { foreignKey: 'sellerId', as: 'concentrationRisks' });
ConcentrationRisk.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

module.exports = { 
    User, Invoice, Transaction, Notification, 
    ConcentrationRisk, ExternalCreditRating, CreditApiLog,
    WalletTransaction
};
