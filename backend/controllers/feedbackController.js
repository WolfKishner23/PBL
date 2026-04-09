const Feedback = require('../models/Feedback');

// ─── CREATE FEEDBACK (public — no auth required) ──────────────────────────────
exports.createFeedback = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        const feedback = await Feedback.create({ name, email, subject, message });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                id: feedback.id,
                name: feedback.name,
                email: feedback.email,
                subject: feedback.subject,
                createdAt: feedback.createdAt
            }
        });
    } catch (error) {
        console.error('Create feedback error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET ALL FEEDBACKS (admin only) ───────────────────────────────────────────
exports.getAllFeedbacks = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const { rows: feedbacks, count: total } = await Feedback.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            feedbacks,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get feedbacks error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── MARK FEEDBACK AS READ (admin only) ───────────────────────────────────────
exports.markFeedbackRead = async (req, res) => {
    try {
        const feedback = await Feedback.findByPk(req.params.id);
        if (!feedback) {
            return res.status(404).json({ success: false, error: 'Feedback not found' });
        }

        await feedback.update({ isRead: true });
        res.json({ success: true, feedback });
    } catch (error) {
        console.error('Mark feedback read error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── DELETE FEEDBACK (admin only) ─────────────────────────────────────────────
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByPk(req.params.id);
        if (!feedback) {
            return res.status(404).json({ success: false, error: 'Feedback not found' });
        }

        await feedback.destroy();
        res.json({ success: true, message: 'Feedback deleted' });
    } catch (error) {
        console.error('Delete feedback error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
