const axios = require('axios');
const Invoice = require('../models/Invoice');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ─── ASSESS INVOICE RISK ──────────────────────────────────────────────────────
exports.assessRisk = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        // Call Python AI service
        const response = await axios.post(`${AI_SERVICE_URL}/api/risk-assessment`, {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: parseFloat(invoice.amount),
            debtorCompany: invoice.debtorCompany,
            debtorGST: invoice.debtorGST,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            paymentTerms: invoice.paymentTerms
        });

        const { riskScore, riskLevel, details } = response.data;

        // Update invoice with risk data
        await invoice.update({
            riskScore,
            riskLevel,
            riskDetails: details
        });

        res.json({
            success: true,
            risk: {
                score: riskScore,
                level: riskLevel,
                details
            },
            invoice
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'AI Service unavailable. Please ensure the Python AI service is running on ' + AI_SERVICE_URL
            });
        }
        console.error('AI risk assessment error:', error.message);
        res.status(500).json({ success: false, error: 'Risk assessment failed' });
    }
};

// ─── EXTRACT INVOICE DATA (OCR) ──────────────────────────────────────────────
exports.extractInvoiceData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'PDF file is required' });
        }

        // Call Python AI service for OCR
        const FormData = require('form-data');
        const fs = require('fs');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const response = await axios.post(`${AI_SERVICE_URL}/api/extract-invoice`, formData, {
            headers: formData.getHeaders()
        });

        res.json({
            success: true,
            extractedData: response.data
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'AI Service unavailable'
            });
        }
        console.error('AI extract error:', error.message);
        res.status(500).json({ success: false, error: 'Data extraction failed' });
    }
};

// ─── GET AI INSIGHTS ──────────────────────────────────────────────────────────
exports.getInsights = async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICE_URL}/api/insights`, {
            params: { userId: req.user.id }
        });

        res.json({
            success: true,
            insights: response.data
        });
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                error: 'AI Service unavailable'
            });
        }
        console.error('AI insights error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get insights' });
    }
};
