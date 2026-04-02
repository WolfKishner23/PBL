const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { upload } = require('../utils/helpers');
const {
    createInvoice,
    getAllInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    submitInvoice,
    uploadPDF,
    confirmInvoice,
    disputeInvoice,
    fundInvoice,
    markPaid,
    settleInvoice,
    createInvoiceValidation
} = require('../controllers/invoiceController');

// All routes require auth middleware
router.use(auth);

// GET    /api/invoices          → Get all invoices (filtered by role)
router.get('/', getAllInvoices);

// POST   /api/invoices          → Create invoice (only 'company')
router.post('/', authorize('company'), createInvoiceValidation, createInvoice);

// GET    /api/invoices/:id      → Get single invoice
router.get('/:id', getInvoice);

// PUT    /api/invoices/:id      → Update invoice (only owner, only pending)
router.put('/:id', updateInvoice);

// DELETE /api/invoices/:id      → Delete invoice (only 'company', only pending)
router.delete('/:id', authorize('company'), deleteInvoice);

// POST   /api/invoices/:id/submit → Submit invoice (legacy)
router.post('/:id/submit', authorize('company'), submitInvoice);

// POST   /api/invoices/:id/upload → Upload PDF to invoice
router.post('/:id/upload', authorize('company'), upload.single('pdf'), uploadPDF);

// ─── Circular Economy Routes ─────────────────────────────────────────────────

// PUT    /api/invoices/:id/confirm  → Debtor confirms invoice
router.put('/:id/confirm', authorize('company'), confirmInvoice);

// PUT    /api/invoices/:id/dispute  → Debtor disputes invoice
router.put('/:id/dispute', authorize('company'), disputeInvoice);

// PUT    /api/invoices/:id/fund     → Finance partner funds invoice
router.put('/:id/fund', authorize('finance'), fundInvoice);

// PUT    /api/invoices/:id/mark-paid → Debtor marks invoice as paid
router.put('/:id/mark-paid', authorize('company'), markPaid);

// PUT    /api/invoices/:id/settle    → Calculate final settlement
router.put('/:id/settle', authorize('finance', 'admin'), settleInvoice);

module.exports = router;
