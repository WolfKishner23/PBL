const { User, Invoice, Transaction } = require('./backend/models/index');
const { connectDB, sequelize } = require('./backend/config/db');

async function test() {
    try {
        await connectDB();
        const u = await User.count();
        const i = await Invoice.count();
        const t = await Transaction.count();
        console.log('--- DB SUMMARY ---');
        console.log('Users:', u);
        console.log('Invoices:', i);
        console.log('Transactions:', t);
        
        const invoices = await Invoice.findAll({ limit: 5 });
        console.log('Sample Invoices:', invoices.map(inv => ({ id: inv.id, status: inv.status })));
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

test();
