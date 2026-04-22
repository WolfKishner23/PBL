const { User, Invoice } = require('./models');
const { sequelize } = require('./config/db');

async function verifyFix() {
    try {
        await sequelize.authenticate();
        
        // 1. Get the invoice with the trailing space
        const invoice = await Invoice.findOne({ where: { invoiceNumber: 'INV-2026-674' } });
        console.log(`Testing with Invoice: ${invoice.invoiceNumber}, Debtor: "${invoice.debtorCompany}"`);

        // 2. Try the old logic (should fail if we hadn't fixed it, but here we test the new logic)
        const buyerExact = await User.findOne({ where: { company: invoice.debtorCompany } });
        console.log(`Old logic find: ${buyerExact ? 'Found' : 'Not Found'}`);

        // 3. Try the new logic
        const buyerNew = await User.findOne({ 
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('company'))),
                (invoice.debtorCompany || '').trim().toLowerCase()
            )
        });
        console.log(`New logic find: ${buyerNew ? 'Found (SUCCESS)' : 'Not Found (FAILURE)'}`);
        
        if (buyerNew) {
            console.log(`Buyer found: ${buyerNew.name} (Company: "${buyerNew.company}")`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyFix();
