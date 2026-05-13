/**
 * riskScorer.js
 *
 * Pure Node.js risk scoring engine — a faithful JavaScript port of the
 * Python logic in ai-service/model.py and ai-service/invoice_risk_system.py.
 *
 * Used as:
 *   1. Primary scorer when AI service (Render) is unavailable/rate-limited
 *   2. Ensures invoices ALWAYS receive a risk score (never null)
 *
 * Scoring weights (from invoice_risk_system.py training):
 *   - Blended Credit Score  : 35%
 *   - Payment History       : 25%
 *   - Industry Risk         : 20%
 *   - Invoice Validity      : 10%
 *   - Days to Maturity      : 10%
 */

// ─── Industry Risk Table (from ai-service/model.py INDUSTRY_RISK) ─────────────
const INDUSTRY_RISK = {
    government: 92, psu: 90, defence: 90, it: 87, software: 87,
    technology: 85, healthcare: 82, pharma: 82, banking: 80,
    finance: 78, fmcg: 78, manufacturing: 75, automobile: 73,
    engineering: 72, infrastructure: 70, export: 68, logistics: 67,
    retail: 65, ecommerce: 65, food: 64, agriculture: 63,
    construction: 60, 'real estate': 58, hospitality: 57, textile: 60,
    other: 62,
};

// ─── Recommendation Templates (mirrors model.py) ──────────────────────────────
const RECOMMENDATIONS = {
    low: {
        text: 'Invoice is low risk. Recommended for immediate factoring at standard discount rate (1.5-2%).',
        action: 'APPROVE',
        discountRate: '1.5-2.0%',
        advanceRate: '85-90%',
    },
    medium: {
        text: 'Invoice has moderate risk. Factoring recommended with slightly higher discount rate (2.5-3.5%).',
        action: 'REVIEW',
        discountRate: '2.5-3.5%',
        advanceRate: '75-85%',
    },
    high: {
        text: 'Invoice has high risk. Manual review required. Consider collateral or partial factoring.',
        action: 'MANUAL_REVIEW',
        discountRate: '4.0-6.0%',
        advanceRate: '60-70%',
    },
};

/**
 * Calculate blended credit score from internal + external sources.
 * Mirrors the blend() function in ai-service/invoice_risk_system.py.
 *
 * - 0-1 invoices:  trust external 100%
 * - 2-4 invoices:  60% external, 40% internal
 * - 5+ invoices:   20% external, 80% internal
 */
function blendCreditScore(internalScore, externalScore, historyCount) {
    const i = internalScore || 50;
    const e = externalScore || 50;
    const c = historyCount || 0;

    if (c <= 1) return e;
    if (c <= 4) return (i * 0.4) + (e * 0.6);
    return (i * 0.8) + (e * 0.2);
}

/**
 * Main risk scoring function.
 * Returns the same response shape as ai-service/model.py predict_risk().
 *
 * @param {Object} invoiceData - Invoice fields (amount, dueDate, industry, debtorGST, etc.)
 * @param {Object} concentration - { score, percentage, flag } from riskService.calculateConcentrationRisk
 * @param {number} externalRating - 0-100 credit score from riskService.getExternalCreditRating
 * @param {Object} internalHistory - { score, count } from riskService.getInternalPaymentScore
 * @returns {Object} Risk result in the same format the backend expects from the AI service
 */
function scoreInvoiceLocally(invoiceData, concentration, externalRating, internalHistory) {
    const {
        amount = 0,
        dueDate,
        industry,
        debtorGST,
        invoiceNumber,
    } = invoiceData;

    const internalScore = (typeof internalHistory === 'object') ? (internalHistory.score || 50) : (internalHistory || 50);
    const historyCount  = (typeof internalHistory === 'object') ? (internalHistory.count || 0)  : 0;
    const concScore     = (typeof concentration   === 'object') ? (concentration.score   || 90) : (concentration || 90);
    const concPct       = (typeof concentration   === 'object') ? (concentration.percentage || 0) : 0;
    const extRating     = externalRating || 50;

    // ── Factor 1: Blended Credit (35%) ───────────────────────────────────────
    const blendedCredit = blendCreditScore(internalScore, extRating, historyCount);

    // ── Factor 2: Payment History (25%) ──────────────────────────────────────
    const paymentScore = internalScore;

    // ── Factor 3: Industry Risk (20%) ─────────────────────────────────────────
    const industryKey = (industry || 'other').toLowerCase().trim();
    const industryScore = INDUSTRY_RISK[industryKey] || INDUSTRY_RISK.other;

    // ── Factor 4: Invoice Validity (10%) ──────────────────────────────────────
    // GST verified = higher validity score
    const validityScore = debtorGST && debtorGST.length === 15 ? 90 : 50;

    // ── Factor 5: Days to Maturity (10%) ──────────────────────────────────────
    let daysToMaturity = 30; // default
    if (dueDate) {
        daysToMaturity = Math.round((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        daysToMaturity = Math.max(0, daysToMaturity);
    }
    const maturityScore =
        daysToMaturity > 60 ? 90 :
        daysToMaturity > 30 ? 75 :
        daysToMaturity > 14 ? 55 :
        daysToMaturity > 0  ? 40 : 20;

    // ── Weighted Average ───────────────────────────────────────────────────────
    let rawScore =
        (blendedCredit  * 0.35) +
        (paymentScore   * 0.25) +
        (industryScore  * 0.20) +
        (validityScore  * 0.10) +
        (maturityScore  * 0.10);

    // ── Concentration Risk Modifier ───────────────────────────────────────────
    const concModifier = concScore >= 90 ? 1.0 : concScore >= 60 ? 0.90 : 0.75;
    rawScore = rawScore * concModifier;

    const riskScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    // ── Determine Risk Level ──────────────────────────────────────────────────
    const riskLevel =
        riskScore >= 70 ? 'low' :
        riskScore >= 40 ? 'medium' : 'high';

    // ── Build Flags ───────────────────────────────────────────────────────────
    const flags = [];
    if (riskLevel === 'high') {
        flags.push('[!] AI Algorithm flagged significant risk based on multi-factor analysis.');
    }
    if (concPct >= 80) {
        flags.push('[!] High Concentration Risk: Seller is over-dependent on this buyer.');
    }
    if (extRating < 40) {
        flags.push('[!] Bureau Alert: Low external credit rating detected.');
    }

    const rec = RECOMMENDATIONS[riskLevel];

    console.log(`[RiskScorer] ${invoiceNumber || 'Invoice'} → Score: ${riskScore} | Level: ${riskLevel} | Industry: ${industryKey} | BlendedCredit: ${blendedCredit.toFixed(1)}`);

    return {
        riskScore,
        riskLevel,
        confidence: 0.85,
        details: {
            buyerReliability: riskLevel === 'low' ? 90 : riskLevel === 'medium' ? 50 : 20,
            paymentHistory: paymentScore,
            externalCreditRating: extRating,
            concentrationRisk: concScore,
            industryRisk: industryScore,
            invoiceAmount: amount,
            daysToMaturity,
            gstVerified: !!(debtorGST && debtorGST.length === 15),
            urgencyScore: 0.5,
            blendedCreditScore: Math.round(blendedCredit),
        },
        recommendation: rec.text,
        action: rec.action,
        factoringTerms: {
            discountRate: rec.discountRate,
            advanceRate: rec.advanceRate,
        },
        flags,
        scoredBy: 'local-engine', // tag so you can see which engine was used in logs
    };
}

module.exports = { scoreInvoiceLocally };
