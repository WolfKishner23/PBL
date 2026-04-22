require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        String(process.env.DB_PASSWORD),
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            dialectOptions: process.env.DB_HOST !== 'localhost' ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            } : {},
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
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
        await sequelize.sync();
        console.log('✅ Database models synced');
    } catch (error) {
        console.error('❌ PostgreSQL Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
