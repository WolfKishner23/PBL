require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const s = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

const NEW_PASSWORD = 'password123';
const EMAIL = 'priya@company.com';

async function main() {
    try {
        const hash = await bcrypt.hash(NEW_PASSWORD, 12);
        const [updated] = await s.query(
            `UPDATE users SET password = :hash WHERE email = :email`,
            { replacements: { hash, email: EMAIL } }
        );
        console.log(`✅ Password for ${EMAIL} has been reset to: ${NEW_PASSWORD}`);
        console.log('   You can now log in with these credentials.');
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}
main();
