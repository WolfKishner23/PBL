// ─── GET WALLET DATA ──────────────────────────────────────────────────────────
exports.getWalletData = async (req, res) => {
    try {
        const { User, WalletTransaction } = require('../models');
        const user = await User.findByPk(req.user.id, {
            attributes: ['walletBalance']
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const transactions = await WalletTransaction.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json({
            success: true,
            balance: user.walletBalance,
            transactions
        });
    } catch (error) {
        console.error('Get wallet data error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
