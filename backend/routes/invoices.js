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
    createInvoiceValidation
} = require('../controllers/invoiceController');

// All routes require auth middleware
router.use(auth);

// GET    /api/invoices          → Get all invoices (filtered by role)
router.get('/', getAllInvoices);

// POST   /api/invoices          → Create invoice (only 'business')
router.post('/', authorize('business'), createInvoiceValidation, createInvoice);

// GET    /api/invoices/:id      → Get single invoice
router.get('/:id', getInvoice);

// PUT    /api/invoices/:id      → Update invoice (only owner, only draft)
router.put('/:id', updateInvoice);

// DELETE /api/invoices/:id      → Delete invoice (only 'business', only draft)
router.delete('/:id', authorize('business'), deleteInvoice);

// POST   /api/invoices/:id/submit → Submit invoice + trigger AI risk scoring
router.post('/:id/submit', authorize('business'), submitInvoice);

// POST   /api/invoices/:id/upload → Upload PDF to invoice
router.post('/:id/upload', authorize('business'), upload.single('pdf'), uploadPDF);

module.exports = router;
