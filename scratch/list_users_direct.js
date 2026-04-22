const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env' });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

async function listUsers() {
    try {
        const [users] = await sequelize.query('SELECT id, name, email, role FROM "Users"');
        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`${u.id}: ${u.name} (${u.role}) - ${u.email}`);
        });
        console.log('-----------------');
    } catch (err) {
        console.error('Error listing users:', err.message);
    } finally {
        await sequelize.close();
    }
}

listUsers();
