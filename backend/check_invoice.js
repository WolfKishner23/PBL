const { Invoice, User } = require('./models');
const { sequelize } = require('./config/db');

async function checkInvoice() {
    try {
        await sequelize.authenticate();
        const invoice = await Invoice.findOne({ 
            where: { invoiceNumber: 'INV-2026-674' },
            include: [{ model: User, as: 'uploader' }]
        });
        if (invoice) {
            console.log('Invoice details:');
            console.log(`- ID: ${invoice.id}`);
            console.log(`- Number: "${invoice.invoiceNumber}"`);
            console.log(`- Debtor Company: "${invoice.debtorCompany}"`);
            console.log(`- Uploader: ${invoice.uploader ? invoice.uploader.name : 'Unknown'} (Company: "${invoice.uploader ? invoice.uploader.company : 'N/A'}")`);
            console.log(`- Status: ${invoice.status}`);
        } else {
            console.log('Invoice not found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkInvoice();
