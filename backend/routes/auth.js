const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    register,
    login,
    getMe,
    forgotPassword,
    updateProfile,
    registerValidation,
    loginValidation
} = require('../controllers/authController');

// POST /api/auth/register — Register new user
router.post('/register', registerValidation, register);

// POST /api/auth/login — Login user
router.post('/login', loginValidation, login);

// GET  /api/auth/me — Get current logged-in user
router.get('/me', auth, getMe);

// POST /api/auth/forgot — Forgot password (send OTP)
router.post('/forgot', forgotPassword);

// PUT  /api/auth/profile — Update profile
router.put('/profile', auth, updateProfile);

module.exports = router;
