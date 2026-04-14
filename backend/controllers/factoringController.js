const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
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
    try {
        const { fundedAmount, returnRate } = req.body;
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.status !== 'approved') {
            return res.status(400).json({
                success: false,
                error: 'Only approved invoices can be funded'
            });
        }

        // Determine rate based on risk level
        const rate = RISK_RATES[invoice.riskLevel] || 5.0;

        // Create transaction
        const transaction = await Transaction.create({
            invoiceId: invoice.id,
            financierId: req.user.id,
            businessId: invoice.uploadedBy,
            fundedAmount: invoice.amount * 0.85, // Enforce 85% advance
            returnRate: rate,
            status: 'active'
        });

        await invoice.update({ status: 'funded' });

        // Notify business owner
        const businessUser = await User.findByPk(invoice.uploadedBy);
        if (businessUser) {
            sendInvoiceStatusEmail(businessUser, invoice, 'funded')
                .catch(err => console.error('Email error:', err.message));
        }

        res.json({ success: true, transaction, invoice });
    } catch (error) {
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
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        if (invoice.status !== 'funded') {
            return res.status(400).json({ success: false, error: 'Only funded invoices can be paid' });
        }

        await invoice.update({ status: 'paid' });
        res.json({ success: true, invoice });
    } catch (error) {
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

        // 1. Calculate Interest: Principal × 3% × (days/30)
        const principal = parseFloat(transaction.fundedAmount);
        const amount = parseFloat(invoice.amount);
        
        // Calculate days between funding and now
        const fundedAt = new Date(transaction.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - fundedAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // At least 1 day
        
        const months = diffDays / 30;
        const interest = principal * (transaction.returnRate / 100) * months;
        const profit = amount - principal - interest;

        // 2. Update Statuses
        await transaction.update({ status: 'completed' });
        await invoice.update({ status: 'settled' });

        // 3. Create Notifications
        const messages = {
            seller: `Invoice ${invoice.invoiceNumber} has been closed. You received ₹${principal.toLocaleString('en-IN')} early, repaid ₹${principal.toLocaleString('en-IN')}, your profit is ₹${profit.toLocaleString('en-IN')}`,
            buyer: `Invoice ${invoice.invoiceNumber} has been closed. You paid ₹${amount.toLocaleString('en-IN')} on time. Transaction complete.`,
            finance: `Invoice ${invoice.invoiceNumber} settled. You earned ₹${interest.toLocaleString('en-IN')} profit.`
        };

        // Seller notification
        await Notification.create({
            userId: invoice.uploadedBy,
            message: messages.seller,
            type: 'success',
            invoiceId: invoice.id
        });

        // Buyer notification (Debtor)
        // Find debtor user by company name if possible, or just skip if no user account
        const debtorUser = await User.findOne({ where: { company: invoice.debtorCompany } });
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
                totalPaid: amount,
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
