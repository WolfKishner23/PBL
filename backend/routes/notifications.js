const router = require('express').Router();
const auth = require('../middleware/auth');
const { Notification } = require('../models');

// GET /api/notifications — Get all notifications for current user
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// PUT /api/notifications/:id/read — Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' });

        await notification.update({ isRead: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// DELETE /api/notifications/clear — Clear all notifications
router.delete('/clear', auth, async (req, res) => {
    try {
        await Notification.destroy({
            where: { userId: req.user.id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Clear notifications error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
