const { User } = require('./models');
const { sequelize } = require('./config/db');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        console.log('Users in database:');
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Name: ${u.name}, Company: "${u.company}", Role: ${u.role}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
