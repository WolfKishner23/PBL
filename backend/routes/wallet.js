const express = require('express');
const router = express.Router();
const { getWalletData } = require('../controllers/walletController');
const protect = require('../middleware/auth');

router.get('/', protect, (req, res, next) => {
    require('../controllers/walletController').getWalletData(req, res, next);
});

module.exports = router;
