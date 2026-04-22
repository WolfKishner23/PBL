const { User } = require('./models');
const { sequelize } = require('./config/db');

async function listUsers() {
    try {
        const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
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
