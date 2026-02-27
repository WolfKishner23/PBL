const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

/**
 * Multer storage config for PDF uploads
 * - Storage: diskStorage
 * - Destination: 'uploads/' folder
 * - Filename: invoice-[timestamp]-[original]
 */

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '-');
        cb(null, `invoice-${timestamp}-${originalName}`);
    }
});

/**
 * File filter: only PDF, PNG, JPG allowed
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, PNG, and JPG files are allowed'), false);
    }
};

/**
 * Multer upload middleware
 * - Max size: 10MB
 */
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * Format currency (INR)
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

/**
 * Calculate days until due
 */
const daysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = {
    generateToken,
    upload,
    formatCurrency,
    daysUntilDue
};
