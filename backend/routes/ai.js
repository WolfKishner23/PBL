const router = require('express').Router();
const auth = require('../middleware/auth');
const { upload } = require('../utils/helpers');
const {
    assessRisk,
    extractInvoiceData,
    getInsights
} = require('../controllers/aiController');

// POST /api/ai/risk/:id      — Assess invoice risk
router.post('/risk/:id', auth, assessRisk);

// POST /api/ai/extract        — Extract data from invoice PDF
router.post('/extract', auth, upload.single('pdf'), extractInvoiceData);

// GET  /api/ai/insights       — Get AI insights
router.get('/insights', auth, getInsights);

module.exports = router;
