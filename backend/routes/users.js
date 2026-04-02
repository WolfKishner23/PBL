const router = require('express').Router();
const auth = require('../middleware/auth');
const { getCompanies } = require('../controllers/authController');

// GET /api/users/companies — List all registered companies
router.get('/companies', auth, getCompanies);

module.exports = router;
