const { Invoice, ExternalCreditRating, CreditApiLog, ConcentrationRisk } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

/**
 * Calculate Concentration Risk for a seller-buyer pair
 * Formula: (Total amount of invoices for this buyer / Total amount of all invoices for this seller) * 100
 */
exports.calculateConcentrationRisk = async (sellerId, debtorCompany) => {
    try {
        // 1. Get total amount for this specific debtor by this seller
        const debtorTotal = await Invoice.sum('amount', {
            where: {
                uploadedBy: sellerId,
                debtorCompany: debtorCompany,
                status: { [Op.not]: 'draft' }
            }
        }) || 0;

        // 2. Get total amount of all submitted/review invoices by this seller
        const sellerTotal = await Invoice.sum('amount', {
            where: {
                uploadedBy: sellerId,
                status: { [Op.not]: 'draft' }
            }
        }) || 0;

        if (sellerTotal === 0) return 90; // Default to low risk if no history

        const concentrationPct = (debtorTotal / sellerTotal) * 100;
        
        // Map to risk score per requirements:
        // ≥80% = HIGH risk (30/100)
        // 60-79% = MEDIUM risk (60/100)
        // <60% = LOW risk (90/100)
        let riskScore = 90;
        let riskFlag = 'low';

        if (concentrationPct >= 80) {
            riskScore = 30;
            riskFlag = 'high';
        } else if (concentrationPct >= 60) {
            riskScore = 60;
            riskFlag = 'medium';
        }

        // Upsert concentration record for analytics
        await ConcentrationRisk.upsert({
            sellerId,
            buyerName: debtorCompany,
            totalInvoiceAmount: debtorTotal,
            concentrationPercentage: concentrationPct,
            riskFlag,
            lastCalculatedDate: new Date()
        });

        return { score: riskScore, percentage: concentrationPct, flag: riskFlag };
    } catch (error) {
        console.error('Error calculating concentration risk:', error);
        return { score: 90, percentage: 0, flag: 'low' }; // Fallback
    }
};

/**
 * Fetch external credit rating from Bureau (Mocked)
 * Implements 90-day caching
 */
exports.getExternalCreditRating = async (debtorCompany) => {
    try {
        const CACHE_DAYS = 90;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - CACHE_DAYS);

        // 1. Check Cache
        const cached = await ExternalCreditRating.findOne({
            where: {
                buyerName: debtorCompany,
                lastUpdated: { [Op.gte]: expiryDate }
            }
        });

        if (cached) {
            console.log(`[RiskService] Using cached credit rating for ${debtorCompany}: ${cached.creditScore}`);
            return cached.creditScore;
        }

        // 2. Mock API Query
        console.log(`[RiskService] Querying Bureau API for ${debtorCompany}... (Cost: ₹20.00)`);
        const startTime = Date.now();
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate a pseudo-random score based on company name to stay consistent for demos
        let mockScore = 300 + (debtorCompany.length * 15) % 600;
        if (debtorCompany.toLowerCase().includes('global') || debtorCompany.toLowerCase().includes('corp')) {
            mockScore = Math.min(900, mockScore + 150);
        }

        // Normalize score 300-900 to 0-100
        const normalizedScore = Math.round(((mockScore - 300) / 600) * 100);

        // 3. Log Query
        await CreditApiLog.create({
            buyerName: debtorCompany,
            bureauName: 'EXPERIAN_MOCK',
            queryTimestamp: new Date(),
            cost: 20.00,
            responseTimeMs: Date.now() - startTime,
            status: 'success'
        });

        // 4. Update Cache
        await ExternalCreditRating.upsert({
            buyerName: debtorCompany,
            bureauName: 'EXPERIAN_MOCK',
            creditScore: normalizedScore,
            ratingGrade: mockScore > 750 ? 'AAA' : (mockScore > 650 ? 'AA' : 'B'),
            lastUpdated: new Date(),
            apiResponseJson: JSON.stringify({ raw_score: mockScore, source: 'MockBureau' }),
            queryCost: 20.00,
            status: 'active'
        });

        return normalizedScore;
    } catch (error) {
        console.error('Error fetching external credit rating:', error);
        return 50; // Fallback to middle-ground
    }
};

/**
 * Get internal payment history score for a buyer
 * Based on past invoice payment delays
 */
exports.getInternalPaymentScore = async (debtorCompany) => {
    try {
        const history = await Invoice.findAll({
            where: {
                debtorCompany: debtorCompany,
                status: 'paid'
            },
            attributes: ['amount', 'dueDate', 'updatedAt'], // Use updatedAt as payment date for mock
            limit: 20
        });

        if (history.length === 0) return 50;

        // Simple logic: lower delay = higher score
        let totalScore = 0;
        history.forEach(inv => {
            const delay = Math.max(0, (new Date(inv.updatedAt) - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
            totalScore += Math.max(0, 100 - (delay * 2));
        });

        return {
            score: Math.round(totalScore / history.length),
            count: history.length
        };
    } catch (error) {
        return { score: 50, count: 0 };
    }
};
