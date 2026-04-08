/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Usage:
 *   router.get('/', auth, authorize('admin'), controller)
 *   router.get('/', auth, authorize('admin', 'finance'), controller)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
            });
        }

        next();
    };
};

module.exports = authorize;
