require('dotenv').config({ path: '../.env' });
const { Sequelize, QueryTypes } = require('sequelize');

async function debug() {
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
        const invoices = await sequelize.query(
            'SELECT id, "invoiceNumber", "debtorCompany", status, "riskLevel", "riskScore" FROM "invoices" WHERE "invoiceNumber" IN (\'INV-2026-249\', \'INV-2026-873\')', 
            { type: QueryTypes.SELECT }
        );
        console.log('--- TARGET INVOICES ---');
        console.table(invoices);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

debug();
