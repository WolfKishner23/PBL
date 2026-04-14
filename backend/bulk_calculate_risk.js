const { Invoice, User } = require('./models');
const { calculateConcentrationRisk, getExternalCreditRating, getInternalPaymentScore } = require('./services/riskService');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function sync() {
    console.log('=== STARTING BULK RISK SCORE SYNC ===');
    
    try {
        // Find invoices that are NOT drafts but don't have a risk score yet
        const invoices = await Invoice.findAll({
            where: {
                status: ['review', 'submitted'],
                riskLevel: null
            }
        });

        console.log(`Found ${invoices.length} invoices to re-process.`);

        for (const invoice of invoices) {
            console.log(`\nProcessing ${invoice.invoiceNumber}...`);

            try {
                // 1. Gather factors
                const sellerId = invoice.uploadedBy;
                const debtorCompany = invoice.debtorCompany;

                const [concentration, externalRating, internalHistory] = await Promise.all([
                    calculateConcentrationRisk(sellerId, debtorCompany),
                    getExternalCreditRating(debtorCompany),
                    getInternalPaymentScore(debtorCompany)
                ]);

                // 2. Call AI Service
                const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/score`, {
                    invoiceData: {
                        invoiceNumber: invoice.invoiceNumber,
                        amount: parseFloat(invoice.amount),
                        debtorCompany: invoice.debtorCompany,
                        debtorGST: invoice.debtorGST,
                        invoiceDate: invoice.invoiceDate,
                        dueDate: invoice.dueDate,
                        paymentTerms: invoice.paymentTerms,
                        industry: invoice.industry,
                        concentrationRiskScore: concentration.score,
                        externalCreditRating: externalRating,
                        internalPaymentScore: internalHistory.score,
                        invoiceHistoryCount: internalHistory.count
                    }
                });

                const riskResult = aiResponse.data;

                // 3. Save to DB
                await invoice.update({
                    riskScore: riskResult.riskScore,
                    riskLevel: riskResult.riskLevel,
                    riskDetails: riskResult.details
                });

                console.log(`✅ Success for ${invoice.invoiceNumber}: Score ${riskResult.riskScore} (${riskResult.riskLevel})`);
            } catch (err) {
                console.error(`❌ Failed for ${invoice.invoiceNumber}:`, err.message);
            }
        }

        console.log('\n=== SYNC COMPLETED ===');
        process.exit(0);
    } catch (error) {
        console.error('Fatal Sync Error:', error.message);
        process.exit(1);
    }
}

sync();
