const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
    reviewInvoice,
    approveInvoice,
    rejectInvoice,
    fundInvoice,
    getTransactions,
    completeTransaction
} = require('../controllers/factoringController');

// PUT  /api/factoring/:id/review    — Start review (finance/admin)
router.put('/:id/review', auth, authorize('finance', 'admin'), reviewInvoice);

// PUT  /api/factoring/:id/approve   — Approve invoice (finance/admin)
router.put('/:id/approve', auth, authorize('finance', 'admin'), approveInvoice);

// PUT  /api/factoring/:id/reject    — Reject invoice (finance/admin)
router.put('/:id/reject', auth, authorize('finance', 'admin'), rejectInvoice);

// POST /api/factoring/:id/fund      — Fund approved invoice (finance)
router.post('/:id/fund', auth, authorize('finance'), fundInvoice);

// GET  /api/factoring/transactions  — Get transactions
router.get('/transactions', auth, getTransactions);

// PUT  /api/factoring/transactions/:id/complete — Complete transaction
router.put('/transactions/:id/complete', auth, authorize('finance', 'admin'), completeTransaction);

module.exports = router;
