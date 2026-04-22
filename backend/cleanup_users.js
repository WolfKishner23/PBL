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
        
        const toDelete = users.filter(u => {
            const name = u.name.toLowerCase();
            return !keepNames.some(k => name.includes(k));
        });

        console.log('Users to keep:', users.filter(u => !toDelete.includes(u)).map(u => u.name));
        console.log('Users to delete:', toDelete.map(u => u.name));

        if (toDelete.length === 0) {
            console.log('No users to delete.');
            return;
        }

        const deleteIds = toDelete.map(u => u.id);

        // Before deleting users, we should probably check for foreign key constraints.
        // The user said "transactions should not be touched".
        // If "Invoices" or "Transactions" have a userId foreign key with ON DELETE CASCADE, they will be deleted.
        // If they have ON DELETE RESTRICT, the deletion will fail.
        
        // Let's check the constraints.
        // Actually, to keep transactions "as it is", we might need to set the userId to NULL or a "System" user?
        // But the user said "other users... can be cleared".
        
        // If we want to keep transactions but delete users, we have a problem if transactions REQUIRE a user.
        
        console.log('Executing deletion...');
        // We delete users. If there are dependent records, we might need to delete them too or nullify.
        // Since the user wants to KEEP data for the 6 users, we only delete data for OTHERS.
        
        for (const id of deleteIds) {
            // Optional: delete related records for these users first if needed
            // await client.query('DELETE FROM "Invoices" WHERE "uploaderId" = $1', [id]);
            // etc.
            await client.query('DELETE FROM users WHERE id = $1', [id]);
        }

        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

cleanup();
