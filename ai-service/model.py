"""
InvoiceFlow AI Service — Risk Prediction Model
Loads trained RandomForestClassifier and predicts invoice risk
"""

import joblib
import numpy as np
import os
from datetime import datetime

# ─── Load Trained Model ──────────────────────────────────────────────────────
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')

try:
    risk_model = joblib.load(model_path)
    print("✅ Risk model loaded successfully")
except FileNotFoundError:
    print("⚠️  risk_model.pkl not found! Run train.py first.")
    risk_model = None


# ─── Industry Risk Lookup Table ──────────────────────────────────────────────
INDUSTRY_RISK = {
    'it': 85,
    'it/software': 85,
    'software': 85,
    'technology': 85,
    'manufacturing': 75,
    'export': 70,
    'retail': 65,
    'government': 90,
    'healthcare': 80,
    'pharma': 80,
    'finance': 75,
    'banking': 80,
    'construction': 60,
    'other': 60,
}


def calculate_risk_features(invoice_data: dict) -> dict:
    """
    Extract and calculate risk features from invoice data.
    Returns a dict of all computed feature scores.
    """

    # 1. Debtor Credit Score — based on GST number
    gst_number = invoice_data.get('gst_number') or invoice_data.get('debtorGST')
    debtor_credit_score = 90.0 if gst_number else 70.0

    # 2. Payment History Score — based on previous invoice count
    previous_invoices = invoice_data.get('previous_invoices', 0)
    if previous_invoices == 0:
        payment_history_score = 50.0
    elif previous_invoices <= 3:
        payment_history_score = 65.0
    elif previous_invoices <= 6:
        payment_history_score = 75.0
    else:
        payment_history_score = 90.0

    # 3. Industry Risk Score — lookup table
    industry = (invoice_data.get('industry') or 'other').lower().strip()
    industry_risk_score = INDUSTRY_RISK.get(industry, 60.0)

    # 4. Invoice Validity Score — based on amount
    amount = float(invoice_data.get('amount', 0))
    if amount < 100000:
        invoice_validity_score = 90.0
    elif amount < 500000:
        invoice_validity_score = 80.0
    elif amount < 1000000:
        invoice_validity_score = 70.0
    else:
        invoice_validity_score = 60.0

    # 5. Days to Due — calculate from dueDate
    due_date_str = invoice_data.get('due_date') or invoice_data.get('dueDate')
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(str(due_date_str).replace('Z', '+00:00'))
            days_to_due = (due_date.replace(tzinfo=None) - datetime.now()).days
            days_to_due = max(0, days_to_due)
        except (ValueError, TypeError):
            days_to_due = 30
    else:
        days_to_due = 30

    return {
        'debtor_credit_score': debtor_credit_score,
        'payment_history_score': payment_history_score,
        'industry_risk_score': industry_risk_score,
        'invoice_validity_score': invoice_validity_score,
        'amount': amount,
        'days_to_due': days_to_due,
        'previous_invoices': previous_invoices,
    }


def predict_risk(invoice_data: dict) -> dict:
    """
    Predict risk for an invoice using the trained ML model.
    Returns risk score, level, confidence, details, and recommendation.
    """

    # Calculate all features
    features = calculate_risk_features(invoice_data)

    # Prepare feature array for ML model
    feature_array = np.array([[
        features['debtor_credit_score'],
        features['payment_history_score'],
        features['industry_risk_score'],
        features['invoice_validity_score'],
        features['amount'],
        features['days_to_due'],
        features['previous_invoices'],
    ]])

    # Run ML model prediction
    if risk_model is not None:
        prediction = risk_model.predict(feature_array)[0]
        probabilities = risk_model.predict_proba(feature_array)[0]
    else:
        # Fallback: rule-based scoring if model not loaded
        weighted = (
            features['debtor_credit_score'] * 0.35 +
            features['payment_history_score'] * 0.25 +
            features['industry_risk_score'] * 0.20 +
            features['invoice_validity_score'] * 0.10 +
            (100 - features['amount'] / 50000) * 0.10
        )
        if weighted >= 70:
            prediction = 0
        elif weighted >= 50:
            prediction = 1
        else:
            prediction = 2
        probabilities = [0.33, 0.33, 0.34]

    # Map prediction to level
    level_map = {0: 'low', 1: 'medium', 2: 'high'}
    risk_level = level_map.get(int(prediction), 'medium')

    # Calculate final weighted score (0-100, higher = safer)
    risk_score = int(
        features['debtor_credit_score'] * 0.35 +
        features['payment_history_score'] * 0.25 +
        features['industry_risk_score'] * 0.20 +
        features['invoice_validity_score'] * 0.10 +
        min(100, features['days_to_due']) * 0.10
    )

    # Get confidence from probability
    confidence = float(max(probabilities))

    # Generate recommendation
    recommendations = {
        'low': 'Invoice has low risk. Recommended for immediate factoring with standard terms.',
        'medium': 'Invoice has moderate risk. Consider factoring with slightly higher discount rate.',
        'high': 'Invoice has high risk. Manual review recommended before factoring approval.',
    }

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
        },
        'recommendation': recommendations[risk_level],
    }
