const { validationResult, body } = require('express-validator');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const axios = require('axios');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const riskService = require('../services/riskService');

// ─── Generate Unique Invoice Number: INV-[YEAR]-[3 digits] ───────────────────
const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900); // 3-digit random
    return `INV-${year}-${random}`;
};

// ─── CREATE INVOICE ───────────────────────────────────────────────────────────
exports.createInvoice = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            amount, debtorCompany, debtorGST,
            invoiceDate, dueDate, paymentTerms, description, industry
        } = req.body;

        // Generate unique invoice number
        let invoiceNumber = generateInvoiceNumber();

        // Ensure uniqueness
        let exists = await Invoice.findOne({ where: { invoiceNumber } });
        while (exists) {
            invoiceNumber = generateInvoiceNumber();
            exists = await Invoice.findOne({ where: { invoiceNumber } });
        }

        // Create invoice in PostgreSQL
        const invoice = await Invoice.create({
            invoiceNumber,
            amount,
            debtorCompany: debtorCompany?.trim(),
            debtorGST,
            invoiceDate,
            dueDate,
            paymentTerms,
            description,
            industry,
            uploadedBy: req.user.id,  // Set uploadedBy = req.user.id
            status: 'draft'           // Set status = 'draft'
        });

        res.status(201).json({ success: true, invoice });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET ALL INVOICES (Raw SQL with role-based filtering) ─────────────────────
exports.getAllInvoices = async (req, res) => {
    try {
        const { status, riskLevel, search } = req.query;
        const role = req.user.role;
        const userId = req.user.id;

        // Build WHERE conditions based on role
        let conditions = [];
        let replacements = {};

        // Business user → get their uploaded invoices OR invoices where they are the debtor
        if (role === 'company') {
            const user = await User.findByPk(userId);
            const userCompany = user ? user.company.trim() : '—NONE—';
            conditions.push('(i."uploadedBy" = :userId OR TRIM(i."debtorCompany") ILIKE :userCompany)');
            replacements.userId = userId;
            replacements.userCompany = userCompany;
        }
        // Finance user → get all submitted/review/confirmed/approved/funded/paid/closed/settled/rejected invoices
        else if (role === 'finance') {
            conditions.push('i."status" IN (\'submitted\', \'review\', \'confirmed\', \'approved\', \'funded\', \'paid\', \'closed\', \'settled\', \'rejected\')');
        }
        // Admin → get all invoices (no role filter)

        // Optional filters
        if (status) {
            conditions.push('i."status" = :status');
            replacements.status = status;
        }
        if (riskLevel) {
            conditions.push('i."riskLevel" = :riskLevel');
            replacements.riskLevel = riskLevel;
        }
        if (search) {
            conditions.push('(i."debtorCompany" ILIKE :search OR u."company" ILIKE :search)');
            replacements.search = `%${search}%`;
        }

        const whereClause = conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ')
            : '';

        // ─── Raw SQL Query to demonstrate SQL knowledge ───────────────────────
        const invoices = await sequelize.query(
            `SELECT i.*, u.name as "uploaderName", u.company as "uploaderCompany"
             FROM "invoices" i
             LEFT JOIN "users" u ON i."uploadedBy" = u.id
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
        console.error('Get all invoices error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET SINGLE INVOICE ──────────────────────────────────────────────────────
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: User, as: 'uploader', attributes: ['id', 'name', 'email', 'company'] },
                { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        // Business can only see their own invoices
        if (req.user.role === 'company' && invoice.uploadedBy !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this invoice' });
        }

        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Get invoice error:', error);
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

        // Only owner can update
        if (invoice.uploadedBy !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Only if status is 'draft'
        if (invoice.status !== 'draft') {
            return res.status(400).json({
                success: false,
                error: 'Only draft invoices can be edited'
            });
        }

        // Update allowed fields only
        const { amount, debtorCompany, debtorGST, dueDate, paymentTerms, description } = req.body;
        await invoice.update({
            amount: amount || invoice.amount,
            debtorCompany: debtorCompany ? debtorCompany.trim() : invoice.debtorCompany,
            debtorGST: debtorGST !== undefined ? debtorGST : invoice.debtorGST,
            dueDate: dueDate || invoice.dueDate,
            paymentTerms: paymentTerms !== undefined ? paymentTerms : invoice.paymentTerms,
            description: description !== undefined ? description : invoice.description
        });

        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Update invoice error:', error);
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

        // Only owner can delete
        if (invoice.uploadedBy !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Only if status is 'draft'
        if (invoice.status !== 'draft') {
            return res.status(400).json({
                success: false,
                error: 'Only draft invoices can be deleted'
            });
        }

        await invoice.destroy();
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── CONFIRM INVOICE (Buyer confirms debt) ───────────────────────────────────
exports.confirmInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        const user = await User.findByPk(req.user.id);
        const buyerCompany = (invoice.debtorCompany || '').trim().toLowerCase();
        const userCompany = (user.company || '').trim().toLowerCase();

        if (buyerCompany !== userCompany) {
            return res.status(403).json({ success: false, error: 'Not authorized to confirm this invoice' });
        }

        if (invoice.status !== 'review' && invoice.status !== 'submitted') {
            return res.status(400).json({ success: false, error: 'Invoice cannot be confirmed in current status' });
        }

        await invoice.update({ status: 'confirmed' });
        res.json({ success: true, invoice });
    } catch (error) {
        console.error('Confirm invoice error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── SUBMIT INVOICE (+ AI Risk Scoring) ──────────────────────────────────────
exports.submitInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        if (invoice.uploadedBy !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (invoice.status !== 'draft') {
            return res.status(400).json({
                success: false,
                error: 'Only draft invoices can be submitted'
            });
        }

        // Change status to 'submitted'
        await invoice.update({ status: 'submitted' });

        // Automatically trigger AI risk scoring
        let riskResult = null;
        try {
            // 1. Calculate Advanced Risk Factors
            const concentration = await riskService.calculateConcentrationRisk(invoice.uploadedBy, invoice.debtorCompany);
            const externalRating = await riskService.getExternalCreditRating(invoice.debtorCompany);
            const internalHistory = await riskService.getInternalPaymentScore(invoice.debtorCompany);

            console.log(`[Integration] Concentration: ${concentration.percentage.toFixed(1)}%, Credit Rating: ${externalRating}`);

            // 2. Call AI Service with expanded data points
            const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/score`, {
                invoiceData: {
                    invoiceNumber: invoice.invoiceNumber,
                    amount: parseFloat(invoice.amount),
                    debtorCompany: invoice.debtorCompany,
                    debtorGST: invoice.debtorGST,
                    invoiceDate: invoice.invoiceDate,
                    dueDate: invoice.dueDate,
                    paymentTerms: invoice.paymentTerms,
                    industry: invoice.industry,
                    // New Factors
                    concentrationRiskScore: concentration.score,
                    externalCreditRating: externalRating,
                    internalPaymentScore: internalHistory.score,
                    invoiceHistoryCount: internalHistory.count
                }
            });

            riskResult = aiResponse.data;

            // Save risk score, level, details to invoice
            await invoice.update({
                riskScore: riskResult.riskScore,
                riskLevel: riskResult.riskLevel,
                riskDetails: riskResult.details,
                status: 'review'  // Change status to 'review'
            });

            console.log(`🤖 AI Risk Score for ${invoice.invoiceNumber}: ${riskResult.riskScore} (${riskResult.riskLevel})`);
        } catch (aiError) {
            // AI service unavailable — still submit, just skip risk scoring
            console.warn('⚠️  AI Service unavailable, skipping risk scoring:', aiError.message);
            await invoice.update({ status: 'review' });
            riskResult = { message: 'AI service unavailable, risk scoring skipped' };
        }

        // Reload invoice with updated fields
        await invoice.reload();

        res.json({
            success: true,
            invoice,
            riskResult
        });
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

        if (invoice.uploadedBy !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // Update invoice pdfUrl
        const pdfUrl = `/uploads/${req.file.filename}`;
        await invoice.update({ pdfUrl });

        res.json({ success: true, pdfUrl });
    } catch (error) {
        console.error('Upload PDF error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET RISK ASSESSMENT (Preview before submission) ────────────────────────
exports.getRiskAssessment = async (req, res) => {
    try {
        const { amount, debtorCompany, debtorGST, invoiceDate, dueDate, paymentTerms, industry } = req.body;

        if (!amount || !debtorCompany) {
            return res.status(400).json({ success: false, error: 'Amount and debtor company are required' });
        }

        // 1. Calculate Advanced Risk Factors
        // Note: For preview, we use the current user's ID
        const concentration = await riskService.calculateConcentrationRisk(req.user.id, debtorCompany);
        const externalRating = await riskService.getExternalCreditRating(debtorCompany);
        const internalHistory = await riskService.getInternalPaymentScore(debtorCompany);

        // 2. Call AI Service
        try {
            const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/score`, {
                invoiceData: {
                    amount: parseFloat(amount),
                    debtorCompany,
                    debtorGST,
                    invoiceDate,
                    dueDate,
                    paymentTerms,
                    industry,
                    concentrationRiskScore: concentration.score,
                    externalCreditRating: externalRating,
                    internalPaymentScore: internalHistory.score,
                    invoiceHistoryCount: internalHistory.count
                }
            });

            res.json({ success: true, riskResult: aiResponse.data });
        } catch (aiError) {
            console.warn('⚠️  AI Service unavailable during preview:', aiError.message);
            res.status(503).json({ success: false, error: 'AI Risk Service currently unavailable. Please try again later.' });
        }
    } catch (error) {
        console.error('Risk assessment preview error:', error);
        res.status(500).json({ success: false, error: 'Server error during risk assessment' });
    }
};

// ─── Validation Rules ─────────────────────────────────────────────────────────
exports.createInvoiceValidation = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('debtorCompany').notEmpty().withMessage('Debtor company is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required')
];
