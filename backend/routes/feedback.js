const router = require('express').Router();
const {
    createFeedback,
    getAllFeedbacks,
    markFeedbackRead,
    deleteFeedback
} = require('../controllers/feedbackController');

// POST   /api/feedback          — Submit feedback (public, no auth)
router.post('/', createFeedback);

// GET    /api/feedback          — Get all feedbacks (admin dashboard)
router.get('/', getAllFeedbacks);

// PUT    /api/feedback/:id/read — Mark as read (admin dashboard)
router.put('/:id/read', markFeedbackRead);

// DELETE /api/feedback/:id      — Delete feedback (admin dashboard)
router.delete('/:id', deleteFeedback);

module.exports = router;
