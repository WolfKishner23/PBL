const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const { Op } = require('sequelize');

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('📊 Fetching admin dashboard stats...');
        
        const [totalUsers, totalInvoices, totalTransactions] = await Promise.all([
            User.count(),
            Invoice.count(),
            Transaction.count()
        ]);

        console.log(`📈 Counts - Users: ${totalUsers}, Invoices: ${totalInvoices}, Transactions: ${totalTransactions}`);

        // Count invoices by category
        const pendingInvoices = await Invoice.count({ where: { status: { [Op.in]: ['submitted', 'review'] } } });
        const approvedInvoices = await Invoice.count({ where: { status: { [Op.in]: ['confirmed', 'approved'] } } });
        const fundedInvoices = await Invoice.count({ where: { status: { [Op.in]: ['funded', 'paid', 'settled'] } } });
        const settledInvoices = await Invoice.count({ where: { status: 'settled' } });

        console.log(`🔍 Statuses - Pending: ${pendingInvoices}, Approved: ${approvedInvoices}, Funded/Done: ${fundedInvoices}, Settled: ${settledInvoices}`);

        const totalFunded = await Transaction.sum('fundedAmount') || 0;

        // Calculate Total Interest Earned
        // Formula: Interest = Principal (85% of amount) * 3% * number of months until due date
        const transactions = await Transaction.findAll({
            where: { status: 'active' },
            include: [{ model: Invoice, as: 'invoice' }]
        });

        let totalInterestEarned = 0;
        transactions.forEach(t => {
            if (t.invoice) {
                const principal = parseFloat(t.fundedAmount); 
                const fundedAt = new Date(t.fundedAt || t.createdAt);
                const dueDate = new Date(t.invoice.dueDate);
                
                let months = (dueDate.getFullYear() - fundedAt.getFullYear()) * 12 + (dueDate.getMonth() - fundedAt.getMonth());
                if (dueDate.getDate() > fundedAt.getDate()) months++; 
                if (months < 1) months = 1; 

                const interest = principal * 0.03 * months;
                totalInterestEarned += interest;
            }
        });

        console.log(`💰 Financials - Total Funded: ${totalFunded}, Interest Earned: ${totalInterestEarned}`);

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
                settledInvoices,
                totalFunded,
                totalInterestEarned,
                usersByRole
            }
        });
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Server error: ' + error.message });
    }
};

// ─── GET ALL INVOICES ─────────────────────────────────────────────────────────
exports.getAllInvoices = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;

        const offset = (page - 1) * limit;
        const { rows: invoices, count: total } = await Invoice.findAndCountAll({
            where,
            include: [
                { model: User, as: 'uploader', attributes: ['id', 'name', 'company'] },
                { 
                    model: Transaction, 
                    as: 'transaction',
                    include: [{ model: User, as: 'financier', attributes: ['id', 'name'] }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            invoices,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get admin invoices error:', error);
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

        // Get invoice count for each user
        const usersWithInvoiceCount = await Promise.all(users.map(async (user) => {
            const invoiceCount = await Invoice.count({ where: { uploadedBy: user.id } });
            return { ...user.toJSON(), invoiceCount };
        }));

        res.json({
            success: true,
            users: usersWithInvoiceCount,
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
