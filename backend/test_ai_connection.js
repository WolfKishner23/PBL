const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function testAI() {
    const url = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/score`;
    console.log(`Testing AI Service at: ${url}`);
    
    try {
        const res = await axios.post(url, {
            invoiceData: {
                invoiceNumber: "INV-2026-249",
                amount: 15814.00,
                debtorCompany: "Ponds",
                debtorGST: "",
                invoiceDate: null,
                dueDate: "2026-06-03T00:00:00.000Z",
                paymentTerms: "Net 60",
                industry: "it",
                concentrationRiskScore: 90,
                externalCreditRating: 75,
                internalPaymentScore: 80,
                invoiceHistoryCount: 0
            }
        });
        console.log('✅ Success:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testAI();
