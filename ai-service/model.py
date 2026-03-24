"""
InvoiceFlow AI Service — Risk Prediction Model
Improved: More features, better scoring, realistic Indian B2B context
"""

import joblib
import numpy as np
import os
from datetime import datetime

# ─── Load Trained Model ──────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
model_path = os.path.join(BASE_DIR, 'risk_model.pkl')
feature_cols_path = os.path.join(BASE_DIR, 'feature_cols.pkl')

try:
    risk_model = joblib.load(model_path)
    feature_cols = joblib.load(feature_cols_path)
    print("[OK] Risk model loaded successfully")
except FileNotFoundError:
    print("[WARN] risk_model.pkl not found! Run train.py first.")
    risk_model = None
    feature_cols = [
        'debtor_credit_score', 'payment_history_score', 'industry_risk_score',
        'invoice_validity_score', 'amount', 'days_to_due', 'previous_invoices',
        'gst_provided', 'avg_payment_delay'
    ]

# ─── Industry Risk Lookup Table (Indian B2B context) ─────────────────────────
INDUSTRY_RISK = {
    # High safety industries
    'government': 92,
    'psu': 90,
    'defence': 90,
    'it': 87,
    'it/software': 87,
    'software': 87,
    'technology': 85,
    'information technology': 87,
    # Medium-high safety
    'healthcare': 82,
    'pharma': 82,
    'pharmaceuticals': 82,
    'banking': 80,
    'finance': 78,
    'fmcg': 78,
    # Medium safety
    'manufacturing': 75,
    'automobile': 73,
    'auto': 73,
    'engineering': 72,
    'infrastructure': 70,
    # Medium-low safety
    'export': 68,
    'logistics': 67,
    'retail': 65,
    'e-commerce': 65,
    'ecommerce': 65,
    'food': 64,
    'agriculture': 63,
    # Lower safety
    'construction': 60,
    'real estate': 58,
    'hospitality': 57,
    'textile': 60,
    'gems': 58,
    'other': 62,
}

# ─── GST Validation ──────────────────────────────────────────────────────────
def validate_gst(gst_number: str) -> float:
    """
    Validate GST number format and return credibility score.
    Valid Indian GST: 15 chars, starts with 2-digit state code
    """
    if not gst_number:
        return 0.0
    gst = str(gst_number).strip().upper()
    if len(gst) == 15 and gst[:2].isdigit() and gst[2:12].isalnum():
        return 1.0   # Valid GST format
    elif len(gst) >= 10:
        return 0.7   # Partial/unverified GST
    return 0.3       # Invalid format

# ─── Payment Terms Risk ───────────────────────────────────────────────────────
def payment_terms_score(terms: str) -> float:
    """Score payment terms — shorter terms = lower risk"""
    if not terms:
        return 65.0
    terms = terms.lower()
    if 'net 30' in terms or '30' in terms:
        return 85.0
    elif 'net 45' in terms or '45' in terms:
        return 78.0
    elif 'net 60' in terms or '60' in terms:
        return 70.0
    elif 'net 90' in terms or '90' in terms:
        return 60.0
    elif 'net 120' in terms or '120' in terms:
        return 50.0
    return 65.0

# ─── Calculate Risk Features ─────────────────────────────────────────────────
def calculate_risk_features(invoice_data: dict) -> dict:
    """
    Extract and calculate all risk features from invoice data.
    Supports both snake_case and camelCase field names.
    """

    # ── 1. Debtor Credit Score (0-100) ───────────────────────────────────────
    gst_number = invoice_data.get('gst_number') or invoice_data.get('debtorGST') or ''
    gst_validity = validate_gst(str(gst_number))
    debtor_credit_score = 60.0 + (gst_validity * 35.0)  # Range: 60-95

    # ── 2. Payment History Score (0-100) ─────────────────────────────────────
    previous_invoices = int(invoice_data.get('previous_invoices', 0) or 0)
    avg_delay = float(invoice_data.get('avg_payment_delay', 10) or 10)

    if previous_invoices == 0:
        payment_history_score = 52.0   # New debtor — uncertain
    elif previous_invoices <= 3:
        base = 65.0
        payment_history_score = max(40, base - avg_delay * 0.5)
    elif previous_invoices <= 6:
        base = 75.0
        payment_history_score = max(50, base - avg_delay * 0.4)
    elif previous_invoices <= 10:
        base = 82.0
        payment_history_score = max(55, base - avg_delay * 0.3)
    else:
        base = 90.0
        payment_history_score = max(60, base - avg_delay * 0.2)

    # ── 3. Industry Risk Score (0-100) ───────────────────────────────────────
    industry = (invoice_data.get('industry') or 'other').lower().strip()
    industry_risk_score = float(INDUSTRY_RISK.get(industry, 62.0))

    # ── 4. Invoice Validity Score (0-100) ────────────────────────────────────
    amount = float(invoice_data.get('amount', 0) or 0)
    if amount <= 0:
        invoice_validity_score = 50.0
    elif amount < 100000:        # < 1 Lakh
        invoice_validity_score = 92.0
    elif amount < 500000:        # 1L - 5L
        invoice_validity_score = 82.0
    elif amount < 2000000:       # 5L - 20L
        invoice_validity_score = 72.0
    elif amount < 5000000:       # 20L - 50L
        invoice_validity_score = 62.0
    else:                        # > 50L
        invoice_validity_score = 52.0

    # ── 5. Days to Due ────────────────────────────────────────────────────────
    due_date_str = invoice_data.get('due_date') or invoice_data.get('dueDate')
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(
                str(due_date_str).replace('Z', '+00:00').split('T')[0]
            )
            days_to_due = (due_date.replace(tzinfo=None) - datetime.now()).days
            days_to_due = max(0, days_to_due)
        except (ValueError, TypeError):
            days_to_due = 30
    else:
        days_to_due = 30

    # ── 6. GST provided flag ──────────────────────────────────────────────────
    gst_provided = 1.0 if gst_validity >= 0.7 else 0.0

    return {
        'debtor_credit_score': round(debtor_credit_score, 2),
        'payment_history_score': round(payment_history_score, 2),
        'industry_risk_score': industry_risk_score,
        'invoice_validity_score': round(invoice_validity_score, 2),
        'amount': amount,
        'days_to_due': days_to_due,
        'previous_invoices': previous_invoices,
        'gst_provided': gst_provided,
        'avg_payment_delay': avg_delay,
    }

# ─── Predict Risk ─────────────────────────────────────────────────────────────
def predict_risk(invoice_data: dict) -> dict:
    """
    Predict risk for an invoice using trained ML model.
    Returns comprehensive risk assessment.
    """

    # Calculate features
    features = calculate_risk_features(invoice_data)

    # Build feature array in correct order
    feature_array = np.array([[features[col] for col in feature_cols]])

    # ── ML Model Prediction ───────────────────────────────────────────────────
    if risk_model is not None:
        prediction = risk_model.predict(feature_array)[0]
        probabilities = risk_model.predict_proba(feature_array)[0]
    else:
        # Fallback: rule-based scoring
        amount_score = max(0, min(100, 100 - (features['amount'] / 100000) * 5))
        delay_penalty = max(0, 100 - features['avg_payment_delay'] * 2)
        weighted = (
            features['debtor_credit_score'] * 0.30 +
            features['payment_history_score'] * 0.25 +
            features['industry_risk_score'] * 0.15 +
            features['invoice_validity_score'] * 0.10 +
            amount_score * 0.10 +
            delay_penalty * 0.10
        )
        if weighted >= 72:
            prediction = 0
        elif weighted >= 52:
            prediction = 1
        else:
            prediction = 2
        probabilities = [0.33, 0.33, 0.34]

    # ── Risk Level Mapping ────────────────────────────────────────────────────
    level_map = {0: 'low', 1: 'medium', 2: 'high'}
    risk_level = level_map.get(int(prediction), 'medium')

    # ── Final Risk Score (0-100, higher = safer) ──────────────────────────────
    amount_score = max(0, min(100, 100 - (features['amount'] / 100000) * 5))
    delay_penalty = max(0, 100 - features['avg_payment_delay'] * 2)

    risk_score = int(
        features['debtor_credit_score'] * 0.30 +
        features['payment_history_score'] * 0.25 +
        features['industry_risk_score'] * 0.15 +
        features['invoice_validity_score'] * 0.10 +
        amount_score * 0.10 +
        delay_penalty * 0.10
    )
    risk_score = max(0, min(100, risk_score))

    # ── Confidence ────────────────────────────────────────────────────────────
    confidence = float(max(probabilities))

    # ── Risk Flags (specific issues detected) ────────────────────────────────
    flags = []
    if features['gst_provided'] == 0:
        flags.append("[!] GST number not provided or invalid")
    if features['previous_invoices'] == 0:
        flags.append("[!] First-time debtor - no payment history")
    if features['avg_payment_delay'] > 20:
        flags.append("[!] High average payment delay history")
    if features['amount'] > 2000000:
        flags.append("[!] High invoice amount - increased exposure")
    if features['days_to_due'] < 15:
        flags.append("[!] Very short payment window")
    if features['industry_risk_score'] < 65:
        flags.append("[!] High-risk industry segment")

    # ── Recommendations ───────────────────────────────────────────────────────
    recommendations = {
        'low': {
            'text': 'Invoice is low risk. Recommended for immediate factoring at standard discount rate (1.5-2%).',
            'action': 'APPROVE',
            'discountRate': '1.5-2.0%',
            'advanceRate': '85-90%'
        },
        'medium': {
            'text': 'Invoice has moderate risk. Factoring recommended with slightly higher discount rate (2.5-3.5%).',
            'action': 'REVIEW',
            'discountRate': '2.5-3.5%',
            'advanceRate': '75-85%'
        },
        'high': {
            'text': 'Invoice has high risk. Manual review required. Consider collateral or partial factoring.',
            'action': 'MANUAL_REVIEW',
            'discountRate': '4.0-6.0%',
            'advanceRate': '60-70%'
        }
    }

    rec = recommendations[risk_level]

    return {
        'riskScore': risk_score,
        'riskLevel': risk_level,
        'confidence': round(confidence, 4),
        'details': {
            'debtorCredit': features['debtor_credit_score'],
            'paymentHistory': features['payment_history_score'],
            'industryRisk': features['industry_risk_score'],
            'invoiceValidity': features['invoice_validity_score'],
            'daysToMaturity': features['days_to_due'],
            'gstVerified': bool(features['gst_provided']),
        },
        'recommendation': rec['text'],
        'action': rec['action'],
        'factoringTerms': {
            'discountRate': rec['discountRate'],
            'advanceRate': rec['advanceRate'],
        },
        'flags': flags,
        'scoringBreakdown': {
            'debtorCredit': {'score': features['debtor_credit_score'], 'weight': '30%'},
            'paymentHistory': {'score': features['payment_history_score'], 'weight': '25%'},
            'industryRisk': {'score': features['industry_risk_score'], 'weight': '15%'},
            'invoiceValidity': {'score': features['invoice_validity_score'], 'weight': '10%'},
            'amountRisk': {'score': round(amount_score, 2), 'weight': '10%'},
            'paymentDelay': {'score': round(delay_penalty, 2), 'weight': '10%'},
        }
    }
