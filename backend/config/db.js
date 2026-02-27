require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    String(process.env.DB_PASSWORD),
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected');

        // Load model associations
        require('../models/index');

        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synced');
    } catch (error) {
        console.error('❌ PostgreSQL Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
