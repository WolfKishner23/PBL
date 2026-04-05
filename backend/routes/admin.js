const router = require('express').Router();
const {
    getDashboardStats,
    getAllUsers,
    verifyUser,
    suspendUser,
    deleteUser
} = require('../controllers/adminController');

// GET    /api/admin/stats       — Dashboard statistics
router.get('/stats', getDashboardStats);

// GET    /api/admin/users       — Get all users
router.get('/users', getAllUsers);

// PUT    /api/admin/users/:id/verify  — Verify user
router.put('/users/:id/verify', verifyUser);

// PUT    /api/admin/users/:id/suspend — Toggle suspend user
router.put('/users/:id/suspend', suspendUser);

// DELETE /api/admin/users/:id         — Delete user
router.delete('/users/:id', deleteUser);

module.exports = router;
