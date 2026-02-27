const { validationResult, body } = require('express-validator');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const { sendEmail } = require('../services/email');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, role, company, gstNumber, industry } = req.body;

        // Check if email already exists in PostgreSQL
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            });
        }

        // Create new user (password hashed via beforeCreate hook with salt 12)
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'business',
            company,
            gstNumber,
            industry
        });

        // ─── Raw SQL Query to demonstrate SQL knowledge ───────────────────────
        const rawResult = await sequelize.query(
            `SELECT id, name, email, role, "createdAt" FROM "users" WHERE email = :email`,
            {
                replacements: { email: user.email },
                type: QueryTypes.SELECT
            }
        );
        console.log('📋 Raw SQL - New user registered:', rawResult);

        // Generate JWT token (expires in 7d)
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email in PostgreSQL
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if user is suspended
        if (user.isSuspended) {
            return res.status(403).json({
                success: false,
                error: 'Account suspended. Contact admin for assistance.'
            });
        }

        // Compare password using bcryptjs
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        // Get user from req.user (set by auth middleware), exclude password
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'otp', 'otpExpiry'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No account found with this email'
            });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and expiry (10 mins) to user record
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.update({ otp, otpExpiry });

        // Send email with OTP using Nodemailer
        await sendEmail({
            to: user.email,
            subject: 'InvoiceFlow — Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6C63FF;">🔐 Password Reset Request</h2>
                    <p>Hi <strong>${user.name}</strong>,</p>
                    <p>You requested a password reset. Use the OTP below to reset your password:</p>
                    <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6C63FF;">${otp}</span>
                    </div>
                    <p style="color: #888;">This OTP is valid for <strong>10 minutes</strong>.</p>
                    <p style="color: #888;">If you didn't request this, please ignore this email.</p>
                    <hr />
                    <p style="color: #aaa; font-size: 12px;">— The InvoiceFlow Team</p>
                </div>
            `
        });

        res.json({
            success: true,
            message: 'OTP sent to email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, error: 'Failed to send OTP email' });
    }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, company, gstNumber, industry } = req.body;

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        await user.update({ name, company, gstNumber, industry });

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company,
                gstNumber: user.gstNumber,
                industry: user.industry
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// ─── Validation Rules ─────────────────────────────────────────────────────────
exports.registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role')
        .optional()
        .isIn(['business', 'finance', 'admin']).withMessage('Role must be business, finance, or admin')
];

exports.loginValidation = [
    body('email')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
];
