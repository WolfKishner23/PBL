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

// ─── EXTRACT INVOICE DATA (Local Node.js — no AI service call) ───────────────
// Previously forwarded the PDF to the Python AI service, which caused HTTP 429
// rate-limit errors on Render's free tier due to large file transfers.
// Now uses pdf-parse + regex entirely within Node.js (same logic, no network call).
exports.extractInvoiceData = async (req, res) => {
    const fs = require('fs');
    const { extractTextFromPDF, parseInvoiceFields } = require('../utils/pdfExtractor');

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'PDF file is required' });
        }

        const filePath = req.file.path;
        console.log(`[Backend] Extracting PDF locally: ${req.file.originalname}`);

        // Step 1: Extract raw text from PDF using pdf-parse
        const rawText = await extractTextFromPDF(filePath);

        // Step 2: Parse structured fields from the raw text using regex
        const extracted = parseInvoiceFields(rawText);

        // Step 3: Clean up the uploaded temp file
        try {
            fs.unlinkSync(filePath);
        } catch (cleanupErr) {
            console.warn('[Backend] Could not delete temp file:', cleanupErr.message);
        }

        const confidence = rawText && rawText.trim().length > 0 ? 0.85 : 0.0;
        console.log(`[Backend] Extraction complete. Confidence: ${confidence}`);

        res.json({
            success: true,
            extractedData: {
                success: true,
                rawText: rawText ? rawText.slice(0, 500) : '',
                extracted,
                confidence,
            }
        });
    } catch (error) {
        console.error('[Backend] PDF extraction error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Data extraction failed',
            detail: error.message
        });
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
