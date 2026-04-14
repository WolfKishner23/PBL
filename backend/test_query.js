const { sequelize } = require('./config/db');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const role = 'finance';
        let conditions = [];
        conditions.push("i.\"status\" IN ('submitted', 'review', 'confirmed', 'approved', 'funded', 'paid', 'closed', 'rejected', 'pdf_processed', 'settled')");
        
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        
        const invoices = await sequelize.query(
            `SELECT i.*, u.name as "uploaderName", u.company as "uploaderCompany"
             FROM "invoices" i
             JOIN "users" u ON i."uploadedBy" = u.id
             ${whereClause}
             ORDER BY i."createdAt" DESC`,
            {
                type: QueryTypes.SELECT
            }
        );
        
        console.log('Count:', invoices.length);
        console.log('First 2:', JSON.stringify(invoices.slice(0, 2), null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

test();
