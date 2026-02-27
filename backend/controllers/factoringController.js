const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendInvoiceStatusEmail } = require('../services/email');

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

        if (!['submitted', 'review'].includes(invoice.status)) {
            return res.status(400).json({
                success: false,
                error: 'Only submitted or reviewed invoices can be approved'
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

        if (!['submitted', 'review'].includes(invoice.status)) {
            return res.status(400).json({
                success: false,
                error: 'Only submitted or reviewed invoices can be rejected'
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

        // Create transaction
        const transaction = await Transaction.create({
            invoiceId: invoice.id,
            financierId: req.user.id,
            businessId: invoice.uploadedBy,
            fundedAmount: fundedAmount || invoice.amount * 0.85,
            returnRate: returnRate || 5.0,
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
        } else if (req.user.role === 'business') {
            where.businessId = req.user.id;
        }

        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { rows: transactions, count: total } = await Transaction.findAndCountAll({
            where,
            include: [
                { model: Invoice, as: 'invoice' },
                { model: User, as: 'financier', attributes: ['id', 'name', 'company'] },
                { model: User, as: 'business', attributes: ['id', 'name', 'company'] }
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
