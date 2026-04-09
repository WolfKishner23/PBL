const router = require('express').Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
    getDashboardStats,
    getAllUsers,
    verifyUser,
    suspendUser,
    deleteUser
} = require('../controllers/adminController');

// Middleware: accept either ADMIN_SECRET header (frontend admin panel)
// OR a valid JWT with admin role
const adminAccess = (req, res, next) => {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
        // Frontend admin panel — skip JWT, inject a mock admin user
        req.user = { id: 0, name: 'Admin', role: 'admin', isSuspended: false };
        return next();
    }
    // Otherwise fall through normal JWT auth + RBAC
    auth(req, res, () => authorize('admin')(req, res, next));
};

router.use(adminAccess);

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
