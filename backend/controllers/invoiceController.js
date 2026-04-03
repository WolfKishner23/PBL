const { validationResult, body } = require('express-validator');
const { QueryTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const axios = require('axios');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const logger = require('../utils/logger');

// ─── Generate Unique Invoice Number: INV-[YEAR]-[3 digits] ───────────────────
const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900); // 3-digit random
    return `INV-${year}-${random}`;
};

// ─── RISK SCORE CALCULATION ──────────────────────────────────────────────────
async function calculateRiskScore(invoice) {
    let score = 50; // Base score
    const details = { base: 50 };

    // Debtor confirmed → minus 15 points (lower = better)
    if (invoice.status === 'debtor_confirmed') {
        score -= 15;
        details.debtorConfirmed = -15;
    }

    // Invoice amount above 5 lakh → plus 10 points (higher risk)
    const amount = parseFloat(invoice.amount);
    if (amount > 500000) {
        score += 10;
        details.highAmount = 10;
    }

    // Debtor has previous defaults (disputed invoices) → plus 20 points
    const defaultCount = await Invoice.count({
        where: {
            debtorId: invoice.debtorId,
            status: 'disputed'
        }
    });
    if (defaultCount > 0) {
        score += 20;
        details.previousDefaults = 20;
        details.defaultCount = defaultCount;
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label;
    if (score <= 40) label = 'LOW';
    else if (score <= 70) label = 'MEDIUM';
    else label = 'HIGH';

    return { score, label, details };
}

// ─── CREATE INVOICE (Creditor uploads against a Debtor) ──────────────────────
exports.createInvoice = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            amount, debtorId, debtorGST,
            invoiceDate, dueDate, paymentTerms, description, industry
        } = req.body;

        // Validate debtor exists and is a company
        const debtor = await User.findByPk(debtorId);
        if (!debtor || debtor.role !== 'company') {
            return res.status(400).json({ success: false, error: 'Invalid debtor company' });
        }

        // Cannot create invoice against yourself
        if (parseInt(debtorId) === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot create invoice against yourself' });
        }

        // Generate unique invoice number
        let invoiceNumber = generateInvoiceNumber();
        let exists = await Invoice.findOne({ where: { invoiceNumber } });
        while (exists) {
            invoiceNumber = generateInvoiceNumber();
            exists = await Invoice.findOne({ where: { invoiceNumber } });
        }

        // Create invoice
        const invoice = await Invoice.create({
            invoiceNumber,
            amount,
            creditorId: req.user.id,
            debtorId: parseInt(debtorId),
            debtorCompany: debtor.company || debtor.name,
            debtorGST: debtorGST || debtor.gstNumber,
            invoiceDate,
            dueDate,
            paymentTerms,
            description,
            industry,
            status: 'pending',
            advanceAmount: parseFloat(amount) * 0.85,
            discountFee: parseFloat(amount) * 0.02
        });

        res.status(201).json({ success: true, invoice });
    } catch (error) {
        logger.error('Create invoice error', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET ALL INVOICES (role-based filtering) ─────────────────────────────────
exports.getAllInvoices = async (req, res) => {
    try {
        const { status, search, view } = req.query;
        const role = req.user.role;
        const userId = req.user.id;

        let conditions = [];
        let replacements = {};

        // Company user
        if (role === 'company') {
            if (view === 'debtor') {
                // Invoices where I am the debtor
                conditions.push('i."debtorId" = :userId');
            } else if (view === 'creditor') {
                // Invoices I uploaded as creditor
                conditions.push('i."creditorId" = :userId');
            } else {
                // Default: show both
                conditions.push('(i."creditorId" = :userId OR i."debtorId" = :userId)');
            }
            replacements.userId = userId;
        }
        // Finance user → see debtor_confirmed invoices (ready to fund) + their funded ones
        else if (role === 'finance') {
            conditions.push('(i."status" = \'debtor_confirmed\' OR i."fundedBy" = :userId)');
            replacements.userId = userId;
        }
        // Admin → see all

        // Optional filters
        if (status) {
            conditions.push('i."status" = :status');
            replacements.status = status;
        }
        if (search) {
            conditions.push('(cr."company" ILIKE :search OR db."company" ILIKE :search OR i."invoiceNumber" ILIKE :search)');
            replacements.search = `%${search}%`;
        }

        const whereClause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        const invoices = await sequelize.query(
            `SELECT i.*,
                    cr.name as "creditorName", cr.company as "creditorCompany",
                    db.name as "debtorName", db.company as "debtorCompanyName",
                    fp.name as "funderName", fp.company as "funderCompany"
             FROM "invoices" i
             JOIN "users" cr ON i."creditorId" = cr.id
             JOIN "users" db ON i."debtorId" = db.id
             LEFT JOIN "users" fp ON i."fundedBy" = fp.id
             ${whereClause}
             ORDER BY i."createdAt" DESC`,
            {
                replacements,
                type: QueryTypes.SELECT
            }
        );

        res.json({
            success: true,
            count: invoices.length,
            invoices
        });
    } catch (error) {
        logger.error('Get all invoices error', { error: error.message, userId: req.user.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET SINGLE INVOICE ──────────────────────────────────────────────────────
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: User, as: 'creditor', attributes: ['id', 'name', 'email', 'company'] },
                { model: User, as: 'debtor', attributes: ['id', 'name', 'email', 'company'] },
                { model: User, as: 'funder', attributes: ['id', 'name', 'email', 'company'] }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        res.json({ success: true, invoice });
    } catch (error) {
        logger.error('Get invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── UPDATE INVOICE ───────────────────────────────────────────────────────────
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.creditorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (invoice.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending invoices can be edited'
            });
        }

        const { amount, debtorGST, dueDate, paymentTerms, description } = req.body;
        const updates = {
            amount: amount || invoice.amount,
            debtorGST: debtorGST !== undefined ? debtorGST : invoice.debtorGST,
            dueDate: dueDate || invoice.dueDate,
            paymentTerms: paymentTerms !== undefined ? paymentTerms : invoice.paymentTerms,
            description: description !== undefined ? description : invoice.description
        };

        // Recalculate advance and fee if amount changed
        if (amount) {
            updates.advanceAmount = parseFloat(amount) * 0.85;
            updates.discountFee = parseFloat(amount) * 0.02;
        }

        await invoice.update(updates);
        res.json({ success: true, invoice });
    } catch (error) {
        logger.error('Update invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── DELETE INVOICE ──────────────────────────────────────────────────────────
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.creditorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (invoice.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending invoices can be deleted'
            });
        }

        await invoice.destroy();
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (error) {
        logger.error('Delete invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── DEBTOR CONFIRMS INVOICE ─────────────────────────────────────────────────
exports.confirmInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(req.params.id, { transaction: t });

        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        // Only the debtor can confirm
        if (invoice.debtorId !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ success: false, error: 'Only the debtor can confirm this invoice' });
        }

        if (invoice.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Only pending invoices can be confirmed' });
        }

        // Update status + calculate risk score in a single atomic transaction
        const risk = await calculateRiskScore(invoice);
        await invoice.update({
            status: 'debtor_confirmed',
            confirmedAt: new Date(),
            riskScore: risk.score,
            riskLabel: risk.label,
            riskDetails: risk.details
        }, { transaction: t });

        await t.commit();
        await invoice.reload();

        logger.info('✅ Invoice confirmed by debtor', { invoiceNumber: invoice.invoiceNumber, riskLabel: risk.label, riskScore: risk.score, debtorId: req.user.id });

        res.json({ success: true, invoice, riskScore: risk });
    } catch (error) {
        await t.rollback();
        logger.error('Confirm invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── DEBTOR DISPUTES INVOICE ─────────────────────────────────────────────────
exports.disputeInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.debtorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the debtor can dispute this invoice' });
        }

        if (invoice.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Only pending invoices can be disputed' });
        }

        const { reason } = req.body;
        await invoice.update({
            status: 'disputed',
            rejectionReason: reason || 'Disputed by debtor'
        });

        logger.warn('⚠️ Invoice disputed by debtor', { invoiceNumber: invoice.invoiceNumber, debtorId: req.user.id, reason: reason || 'Disputed by debtor' });

        res.json({ success: true, invoice });
    } catch (error) {
        logger.error('Dispute invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── FINANCE PARTNER FUNDS INVOICE ───────────────────────────────────────────
exports.fundInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // SELECT FOR UPDATE — locks this invoice row to prevent double-funding
        const invoice = await Invoice.findOne({
            where: { id: req.params.id },
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.status !== 'debtor_confirmed') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                error: 'Only debtor-confirmed invoices can be funded'
            });
        }

        // Calculate advance and fee
        const amount = parseFloat(invoice.amount);
        const advanceAmount = amount * 0.85;
        const discountFee = amount * 0.02;

        await invoice.update({
            status: 'funded',
            fundedBy: req.user.id,
            fundedAt: new Date(),
            advanceAmount,
            discountFee
        }, { transaction: t });

        await t.commit();

        logger.info('💰 Invoice funded', { invoiceNumber: invoice.invoiceNumber, fundedBy: req.user.id, advanceAmount, discountFee });

        await invoice.reload();
        res.json({ success: true, invoice });
    } catch (error) {
        await t.rollback();
        logger.error('Fund invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── DEBTOR MARKS INVOICE AS PAID ────────────────────────────────────────────
exports.markPaid = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.debtorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the debtor can mark as paid' });
        }

        if (invoice.status !== 'funded') {
            return res.status(400).json({ success: false, error: 'Only funded invoices can be marked as paid' });
        }

        await invoice.update({ status: 'paid', paidAt: new Date() });
        logger.info('✅ Invoice marked as paid', { invoiceNumber: invoice.invoiceNumber, debtorId: req.user.id });

        await invoice.reload();
        res.json({ success: true, invoice });
    } catch (error) {
        logger.error('Mark paid error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── SETTLE INVOICE (Final settlement calculation) ───────────────────────────
exports.settleInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(req.params.id, { transaction: t });

        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.status !== 'paid') {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Only paid invoices can be settled' });
        }

        const amount = parseFloat(invoice.amount);
        const advanceAmount = parseFloat(invoice.advanceAmount) || amount * 0.85;
        const discountFee = parseFloat(invoice.discountFee) || amount * 0.02;

        // Settlement: Finance partner gets back advance + discount fee
        // Creditor gets: full amount - advance already received = remainder
        const financeReturn = advanceAmount + discountFee;
        const creditorRemainder = amount - advanceAmount - discountFee;

        await invoice.update({ status: 'settled', settledAt: new Date() }, { transaction: t });

        await t.commit();

        logger.info('🏦 Invoice settled', { invoiceNumber: invoice.invoiceNumber, financeReturn, creditorRemainder, profit: discountFee });

        await invoice.reload();
        res.json({
            success: true,
            invoice,
            settlement: {
                invoiceAmount: amount,
                advanceAmount,
                discountFee,
                financePartnerReturn: financeReturn,
                creditorRemainder,
                financePartnerProfit: discountFee
            }
        });
    } catch (error) {
        await t.rollback();
        logger.error('Settle invoice error', { error: error.message, invoiceId: req.params.id });
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── SUBMIT INVOICE (Legacy — triggers AI risk scoring) ──────────────────────
exports.submitInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.creditorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // For backward compatibility: auto-confirm if pending
        if (invoice.status === 'pending') {
            await invoice.update({ status: 'pending' });
        }

        await invoice.reload();
        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Submit invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── UPLOAD PDF ──────────────────────────────────────────────────────────────
exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.creditorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const pdfUrl = `/uploads/${req.file.filename}`;
        await invoice.update({ pdfUrl });

        res.json({ success: true, pdfUrl });
    } catch (error) {
        console.error('Upload PDF error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── Validation Rules ─────────────────────────────────────────────────────────
exports.createInvoiceValidation = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('debtorId').isInt().withMessage('Debtor company is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required')
];
