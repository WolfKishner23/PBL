const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const { Op } = require('sequelize');

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalInvoices = await Invoice.count();
        const totalTransactions = await Transaction.count();

        const pendingInvoices = await Invoice.count({ where: { status: 'submitted' } });
        const approvedInvoices = await Invoice.count({ where: { status: 'approved' } });
        const fundedInvoices = await Invoice.count({ where: { status: 'funded' } });

        const totalFunded = await Transaction.sum('fundedAmount') || 0;

        const usersByRole = await User.findAll({
            attributes: ['role', [User.sequelize.fn('COUNT', '*'), 'count']],
            group: ['role']
        });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalInvoices,
                totalTransactions,
                pendingInvoices,
                approvedInvoices,
                fundedInvoices,
                totalFunded,
                usersByRole
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query;
        const where = {};
        if (role) where.role = role;

        const offset = (page - 1) * limit;
        const { rows: users, count: total } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── VERIFY USER ──────────────────────────────────────────────────────────────
exports.verifyUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        await user.update({ isVerified: true });

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── SUSPEND USER ─────────────────────────────────────────────────────────────
exports.suspendUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, error: 'Cannot suspend admin users' });
        }

        await user.update({ isSuspended: !user.isSuspended });

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isSuspended: user.isSuspended
            }
        });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── DELETE USER ──────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, error: 'Cannot delete admin users' });
        }

        await user.destroy();
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
