const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const WalletTransaction = require('../models/WalletTransaction');
const { sequelize } = require('../config/db');
const { sendInvoiceStatusEmail } = require('../services/email');

const RISK_RATES = {
    low: 2.0,
    medium: 4.0,
    high: 6.0
};

// ─── REVIEW INVOICE (Finance / Admin) ─────────────────────────────────────────
exports.reviewInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                error: 'Only submitted invoices can be reviewed'
            });
        }

        await invoice.update({ status: 'review' });
        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Review invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── APPROVE INVOICE ──────────────────────────────────────────────────────────
exports.approveInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        // Now requires confirmed status from Buyer (timeline step 2)
        if (invoice.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                error: 'Invoice must be confirmed by the Buyer before approval'
            });
        }

        await invoice.update({
            status: 'approved',
            approvedBy: req.user.id
        });

        // Notify business owner
        const businessUser = await User.findByPk(invoice.uploadedBy);
        if (businessUser) {
            sendInvoiceStatusEmail(businessUser, invoice, 'approved')
                .catch(err => console.error('Email error:', err.message));
        }

        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Approve invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── REJECT INVOICE ──────────────────────────────────────────────────────────
exports.rejectInvoice = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (!['submitted', 'review', 'confirmed'].includes(invoice.status)) {
            return res.status(400).json({
                success: false,
                error: 'Only submitted, reviewed or confirmed invoices can be rejected'
            });
        }

        await invoice.update({
            status: 'rejected',
            rejectionReason: rejectionReason || 'No reason provided',
            approvedBy: req.user.id
        });

        // Notify business owner
        const businessUser = await User.findByPk(invoice.uploadedBy);
        if (businessUser) {
            sendInvoiceStatusEmail(businessUser, invoice, 'rejected')
                .catch(err => console.error('Email error:', err.message));
        }

        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Reject invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── FUND INVOICE ─────────────────────────────────────────────────────────────
exports.fundInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.status !== 'approved') {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Only approved invoices can be funded' });
        }

        const financier = await User.findByPk(req.user.id);
        const seller = await User.findByPk(invoice.uploadedBy);

        // Check Financier Balance
        const fundAmount = parseFloat(invoice.amount); // 100% advance
        if (parseFloat(financier.walletBalance) < fundAmount) {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Insufficient wallet balance to fund this invoice' });
        }

        // 1. Deduct from Financier
        await financier.update({ walletBalance: parseFloat(financier.walletBalance) - fundAmount }, { transaction: t });
        await WalletTransaction.create({
            userId: financier.id,
            amount: fundAmount,
            type: 'debit',
            description: `Funding invoice ${invoice.invoiceNumber}`,
            referenceId: invoice.id
        }, { transaction: t });

        // 2. Add to Seller
        await seller.update({ walletBalance: parseFloat(seller.walletBalance) + fundAmount }, { transaction: t });
        await WalletTransaction.create({
            userId: seller.id,
            amount: fundAmount,
            type: 'credit',
            description: `Early payment for invoice ${invoice.invoiceNumber}`,
            referenceId: invoice.id
        }, { transaction: t });

        // 3. Update Invoice & Create Transaction
        const rate = RISK_RATES[invoice.riskLevel] || 5.0;
        const factoringTransaction = await Transaction.create({
            invoiceId: invoice.id,
            financierId: req.user.id,
            businessId: invoice.uploadedBy,
            fundedAmount: fundAmount,
            returnRate: rate,
            status: 'active'
        }, { transaction: t });

        await invoice.update({ status: 'funded' }, { transaction: t });

        await t.commit();

        // Notify business owner
        if (seller) {
            sendInvoiceStatusEmail(seller, invoice, 'funded')
                .catch(err => console.error('Email error:', err.message));
        }

        res.json({ success: true, transaction: factoringTransaction, invoice });
    } catch (error) {
        if (t) await t.rollback();
        console.error('Fund invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET TRANSACTIONS ─────────────────────────────────────────────────────────
exports.getTransactions = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const where = {};

        // Filter by role
        if (req.user.role === 'finance') {
            where.financierId = req.user.id;
        } else if (req.user.role === 'company') {
            where.businessId = req.user.id;
        }

        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { rows: transactions, count: total } = await Transaction.findAndCountAll({
            where,
            include: [
                { model: Invoice, as: 'invoice' },
                { model: User, as: 'financier', attributes: ['id', 'name', 'company'] },
                { model: User, as: 'company', attributes: ['id', 'name', 'company'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── PAY INVOICE (Buyer pays on due date) ─────────────────────────────────────
exports.payInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.status !== 'funded') {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Only funded invoices can be paid' });
        }

        // Find Buyer User (using trimmed, case-insensitive match)
        const buyer = await User.findOne({ 
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('company'))),
                (invoice.debtorCompany || '').trim().toLowerCase()
            )
        });
        if (!buyer) {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Buyer is not a registered user on InvoiceFlow. Payment cannot be processed.' });
        }

        const factoringTransaction = await Transaction.findOne({ where: { invoiceId: invoice.id } });
        const financier = await User.findByPk(factoringTransaction.financierId);

        // Calculate Interest: Principal × Rate% × (actual days/30)
        const principal = parseFloat(invoice.amount);
        const fundedAt = new Date(factoringTransaction.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - fundedAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const interest = principal * (factoringTransaction.returnRate / 100) * (diffDays / 30);
        const totalPayment = principal + interest;

        // Check Buyer Balance
        if (parseFloat(buyer.walletBalance) < totalPayment) {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Insufficient wallet balance. Please add funds to your wallet.' });
        }

        // 1. Deduct from Buyer
        await buyer.update({ walletBalance: parseFloat(buyer.walletBalance) - totalPayment }, { transaction: t });
        await WalletTransaction.create({
            userId: buyer.id,
            amount: totalPayment,
            type: 'debit',
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            referenceId: invoice.id
        }, { transaction: t });

        // 2. Add to Financier
        await financier.update({ walletBalance: parseFloat(financier.walletBalance) + totalPayment }, { transaction: t });
        await WalletTransaction.create({
            userId: financier.id,
            amount: totalPayment,
            type: 'credit',
            description: `Repayment received for invoice ${invoice.invoiceNumber}`,
            referenceId: invoice.id
        }, { transaction: t });

        await invoice.update({ status: 'paid' }, { transaction: t });
        await t.commit();

        res.json({ success: true, invoice, paidAmount: totalPayment, interest });
    } catch (error) {
        if (t) await t.rollback();
        console.error('Pay invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── SETTLE INVOICE (Finance/Admin closes invoice) ─────────────────────────────
exports.settleInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        if (invoice.status !== 'paid') {
            return res.status(400).json({ success: false, error: 'Invoice must be paid by Buyer before settlement' });
        }

        const transaction = await Transaction.findOne({ where: { invoiceId: invoice.id } });
        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Associated transaction not found' });
        }

        // 1. Calculate Summary for notification (no wallet movement here as it happened in payInvoice)
        const principal = parseFloat(transaction.fundedAmount);
        const amount = parseFloat(invoice.amount);
        const fundedAt = new Date(transaction.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - fundedAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const interest = principal * (transaction.returnRate / 100) * (diffDays / 30);
        const totalPaid = amount + interest;
        const profit = totalPaid - principal;

        // 2. Update Statuses
        await transaction.update({ status: 'completed' });
        await invoice.update({ status: 'settled' });

        // 3. Create Notifications (Corrected flow messages)
        const messages = {
            seller: `Invoice ${invoice.invoiceNumber} has been settled. You received ₹${principal.toLocaleString('en-IN')} upfront. Transaction complete.`,
            buyer: `Invoice ${invoice.invoiceNumber} settled. You paid ₹${totalPaid.toLocaleString('en-IN')} (including interest).`,
            finance: `Invoice ${invoice.invoiceNumber} settled. You received ₹${totalPaid.toLocaleString('en-IN')} repayment.`
        };

        // Seller notification
        await Notification.create({
            userId: invoice.uploadedBy,
            message: messages.seller,
            type: 'success',
            invoiceId: invoice.id
        });

        // Buyer notification (Debtor)
        // Find debtor user by company name (trimmed, case-insensitive)
        const debtorUser = await User.findOne({ 
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('company'))),
                (invoice.debtorCompany || '').trim().toLowerCase()
            )
        });
        if (debtorUser) {
            await Notification.create({
                userId: debtorUser.id,
                message: messages.buyer,
                type: 'success',
                invoiceId: invoice.id
            });
        }

        // Finance Partner notification
        await Notification.create({
            userId: transaction.financierId,
            message: messages.finance,
            type: 'success',
            invoiceId: invoice.id
        });

        res.json({
            success: true,
            invoice,
            summary: {
                principal,
                interest,
                profit,
                totalPaid: totalPaid,
                daysElapsed: diffDays
            }
        });
    } catch (error) {
        console.error('Settle invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── COMPLETE TRANSACTION ─────────────────────────────────────────────────────
exports.completeTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);

        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        if (transaction.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Only active transactions can be completed'
            });
        }

        await transaction.update({ status: 'completed' });
        res.json({ success: true, transaction });
    } catch (error) {
        console.error('Complete transaction error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
