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
        
        // Get all users
        const res = await client.query('SELECT id, name FROM users');
        const users = res.rows;
        
        const keptUsers = users.filter(u => {
            const name = u.name.toLowerCase();
            return keepNames.some(k => name.includes(k));
        });
        const keptIds = keptUsers.map(u => u.id);
        const deleteIds = users.filter(u => !keptIds.includes(u.id)).map(u => u.id);

        console.log('Keeping:', keptUsers.map(u => u.name));
        console.log('Deleting Ids:', deleteIds);

        // 1. Delete notifications for users to be deleted
        await client.query('DELETE FROM "Notifications" WHERE "userId" = ANY($1)', [deleteIds]);
        
        // 2. Delete wallet transactions for users to be deleted
        await client.query('DELETE FROM "WalletTransactions" WHERE "userId" = ANY($1)', [deleteIds]);

        // 3. Delete feedbacks
        await client.query('DELETE FROM "Feedbacks" WHERE "userId" = ANY($1)', [deleteIds]);

        // 4. Invoices and Transactions are tricky.
        // We want to keep all data "about them" (the 6 users).
        // This means any invoice where uploaderId IS in keptIds OR debtor is one of them?
        // Actually, debtorCompany is a string in Invoices, not a foreign key.
        
        // So we keep invoices where uploaderId IN (keptIds)
        // And transactions where financierId IN (keptIds) OR invoiceId refers to a kept invoice.
        
        // Let's first delete transactions that don't involve kept users.
        // A transaction involves a financier (user) and an invoice.
        await client.query(`
            DELETE FROM "Transactions" 
            WHERE "financierId" NOT IN (SELECT id FROM users WHERE name ILIKE ANY($1))
            AND "invoiceId" NOT IN (SELECT id FROM "Invoices" WHERE "uploaderId" IN (SELECT id FROM users WHERE name ILIKE ANY($1)))
        `, [keepNames.map(k => `%${k}%`)]);

        // 5. Delete invoices that don't belong to kept users.
        await client.query(`
            DELETE FROM "Invoices" 
            WHERE "uploaderId" NOT IN (SELECT id FROM users WHERE name ILIKE ANY($1))
        `, [keepNames.map(k => `%${k}%`)]);

        // 6. Finally delete the users
        await client.query('DELETE FROM users WHERE id = ANY($1)', [deleteIds]);

        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

cleanup();
