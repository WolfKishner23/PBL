const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function cleanup() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const keepNames = ['priya', 'amit', 'kadam', 'raj', 'ram', 'om'];
        
        // 1. Get all users
        const res = await client.query('SELECT id, name FROM users');
        const users = res.rows;
        
        const keptUsers = users.filter(u => {
            const name = u.name.toLowerCase();
            return keepNames.some(k => name.includes(k));
        });
        const keptIds = keptUsers.map(u => u.id);
        const deleteIds = users.filter(u => !keptIds.includes(u.id)).map(u => u.id);

        if (deleteIds.length === 0) {
            console.log('No users to delete.');
            return;
        }

        console.log('Keeping Users:', keptUsers.map(u => u.name));
        console.log('Deleting User Ids:', deleteIds);

        // --- DELETION SEQUENCE (Dependencies first) ---

        // 1. Notifications
        await client.query('DELETE FROM notifications WHERE "userId" = ANY($1)', [deleteIds]);
        
        // 2. Wallet Transactions
        await client.query('DELETE FROM wallet_transactions WHERE "userId" = ANY($1)', [deleteIds]);

        // 3. Feedbacks (check if exists)
        try {
            await client.query('DELETE FROM feedbacks WHERE "userId" = ANY($1)', [deleteIds]);
        } catch(e) { console.log('Feedbacks table skip or error:', e.message); }

        // 4. Concentration Risks
        try {
            await client.query('DELETE FROM concentration_risks WHERE "sellerId" = ANY($1)', [deleteIds]);
        } catch(e) { console.log('ConcentrationRisks skip:', e.message); }

        // 5. Transactions
        // Delete transactions that are NOT associated with kept users
        // A transaction is kept if financierId OR businessId is kept.
        // Also keep if invoiceId belongs to a kept user.
        await client.query(`
            DELETE FROM transactions 
            WHERE "financierId" = ANY($1) 
            OR "businessId" = ANY($1)
            OR "invoiceId" IN (SELECT id FROM invoices WHERE "uploadedBy" = ANY($1))
        `, [deleteIds]);

        // 6. Invoices
        // Delete invoices uploaded by users to be deleted
        await client.query('DELETE FROM invoices WHERE "uploadedBy" = ANY($1)', [deleteIds]);

        // 7. Finally delete the users
        await client.query('DELETE FROM users WHERE id = ANY($1)', [deleteIds]);

        console.log('Cleanup complete. Records for Priya, Amit, Kadam, Raj, Ram, and Om have been preserved.');

    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    } finally {
        await client.end();
    }
}

cleanup();
