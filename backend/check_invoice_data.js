const { Sequelize, QueryTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
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
        const r = await sequelize.query('SELECT * FROM "invoices" WHERE "invoiceNumber" = \'INV-2026-249\'', { type: QueryTypes.SELECT });
        console.log(JSON.stringify(r[0], null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

check();
