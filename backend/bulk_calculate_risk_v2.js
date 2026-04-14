const { Sequelize, QueryTypes } = require('sequelize');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function sync() {
    console.log('=== STARTING BULK RISK SCORE SYNC (STANDALONE) ===');
    
    const sequelize = new Sequelize(
        process.env.DB_NAME || 'invoiceflow',
        process.env.DB_USER || 'invoiceflow_user',
        process.env.DB_PASSWORD || 'invoiceflow123',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: false
        }
    );

    try {
        // Find invoices that are NOT drafts but don't have a risk score yet
        const invoices = await sequelize.query(
            'SELECT * FROM "invoices" WHERE status IN (\'review\', \'submitted\') AND "riskLevel" IS NULL',
            { type: QueryTypes.SELECT }
        );

        console.log(`Found ${invoices.length} invoices to re-process.`);

        for (const invoice of invoices) {
            console.log(`\nProcessing ${invoice.invoiceNumber}...`);

            try {
                // Mocking the risk service internal details for speed in sync script
                // In a real prod case we'd import the full service, but here we just want the AI score back.
                
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
                        // Defaults for historical factors
                        concentrationRiskScore: 90,
                        externalCreditRating: 75,
                        internalPaymentScore: 80,
                        invoiceHistoryCount: 0
                    }
                });

                const riskResult = aiResponse.data;

                // Save to DB
                await sequelize.query(
                    'UPDATE "invoices" SET "riskScore" = :score, "riskLevel" = :level, "riskDetails" = :details WHERE id = :id',
                    {
                        replacements: {
                            score: riskResult.riskScore,
                            level: riskResult.riskLevel,
                            details: JSON.stringify(riskResult.details),
                            id: invoice.id
                        },
                        type: QueryTypes.UPDATE
                    }
                );

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
