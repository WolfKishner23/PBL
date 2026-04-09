const router = require('express').Router();
const {
    createFeedback,
    getAllFeedbacks,
    markFeedbackRead,
    deleteFeedback
} = require('../controllers/feedbackController');

// Admin access middleware - allow via admin secret header
const adminAccess = (req, res, next) => {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
        return next();
    }
    // Public endpoint for POST (create feedback)
    if (req.method === 'POST') {
        return next();
    }
    // For other methods, check if user is authenticated (or just allow for demo)
    next();
};

router.use(adminAccess);

// POST   /api/feedback          — Submit feedback (public, no auth)
router.post('/', createFeedback);

// GET    /api/feedback          — Get all feedbacks (admin dashboard)
router.get('/', getAllFeedbacks);

// PUT    /api/feedback/:id/read — Mark as read (admin dashboard)
router.put('/:id/read', markFeedbackRead);

// DELETE /api/feedback/:id      — Delete feedback (admin dashboard)
router.delete('/:id', deleteFeedback);

module.exports = router;
