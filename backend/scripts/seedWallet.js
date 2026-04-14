const { User, WalletTransaction } = require('../models');
const { sequelize } = require('../config/db');

async function seedWallets() {
    try {
        console.log('🚀 Starting wallet seeding script...');
        
        const users = await User.findAll();
        
        for (const user of users) {
            let balance = 0;
            if (user.role === 'finance') {
                balance = 2000000;
            } else if (user.role === 'company' || user.role === 'admin') {
                balance = 200000;
            }
            
            console.log(`Setting balance for ${user.name} (${user.role}): ₹${balance}`);
            
            // Update balance
            await user.update({ walletBalance: balance });
            
            // Create initial credit transaction
            await WalletTransaction.create({
                userId: user.id,
                amount: balance,
                type: 'credit',
                description: 'Initial simulation balance'
            });
        }
        
        console.log('✅ Wallet seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedWallets();
