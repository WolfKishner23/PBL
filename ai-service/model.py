"""
InvoiceFlow AI Service — Risk Prediction Model (Bridged to custom CSV pipeline)
"""

try:
    from invoice_risk_system import predict_invoice_risk
    print("[OK] Bridged to custom CSV ML pipeline (invoice_risk_system.py)")
    ML_BRIDGE_ACTIVE = True
except ImportError:
    print("[WARN] Could not import invoice_risk_system. Bridge failed.")
    ML_BRIDGE_ACTIVE = False

# ─── Industry Risk Lookup Table ──────────────────────────────────────────────
INDUSTRY_RISK = {
    'government': 92, 'psu': 90, 'defence': 90, 'it': 87, 'software': 87,
    'technology': 85, 'healthcare': 82, 'pharma': 82, 'banking': 80,
    'finance': 78, 'fmcg': 78, 'manufacturing': 75, 'automobile': 73,
    'engineering': 72, 'infrastructure': 70, 'export': 68, 'logistics': 67,
    'retail': 65, 'ecommerce': 65, 'food': 64, 'agriculture': 63,
    'construction': 60, 'real estate': 58, 'hospitality': 57, 'textile': 60,
    'other': 62,
}

def predict_risk(invoice_data: dict) -> dict:
    # 1. Prepare data format expected by invoice_risk_system.py
    # Node backend sends: amount, debtorCompany, debtorGST, invoiceDate, dueDate, paymentTerms
    mapped_data = {
        "invoice_id": invoice_data.get('invoiceNumber', 'Unknown'),
        "buyer_id": invoice_data.get('debtorCompany', 'Unknown'),
        "amount": float(invoice_data.get('amount', 0)),
        "industry": "other",
        "due_date": invoice_data.get('dueDate', '2030-01-01'),
        "actual_payment_date": "",
        "internal_payment_score": float(invoice_data.get('internalPaymentScore', 50)),
        "external_credit_rating": float(invoice_data.get('externalCreditRating', 50)),
        "invoice_history_count": int(invoice_data.get('invoiceHistoryCount', 0)),
        "concentration_risk_score": float(invoice_data.get('concentrationRiskScore', 90))
    }
    
    # Simple NLP to detect industry from company name or data
    text = f"{mapped_data['buyer_id']} {invoice_data.get('debtorGST', '')} {invoice_data.get('industry', '')}".lower()
    for ind in INDUSTRY_RISK.keys():
        if ind in text:
            mapped_data['industry'] = ind
            break

    # 2. Call new ML Model
    if ML_BRIDGE_ACTIVE:
        try:
            model_res = predict_invoice_risk(mapped_data)
        except Exception as e:
            model_res = {"error": str(e)}
            
        if "error" in model_res:
            prediction_label = "Medium Risk"
            probs = {"Low Risk": 33.3, "Medium Risk": 33.3, "High Risk": 33.3}
            print("[WARN] Model predict error:", model_res["error"])
        else:
            prediction_label = model_res.get("prediction", "Medium Risk")
            probs = model_res.get("probabilities", {})
    else:
        prediction_label = "Medium Risk"
        probs = {"Low Risk": 33.3, "Medium Risk": 33.3, "High Risk": 33.3}

    # 3. Format response for Node.js Frontend expectations
    level_map = {
        "Low Risk": "low",
        "Medium Risk": "medium",
        "High Risk": "high" 
    }
    risk_level = level_map.get(prediction_label, "medium")
    
    # Calculate a numerical 0-100 score based on probabilities
    score = (probs.get("Low Risk", 0) * 0.95) + \
            (probs.get("Medium Risk", 0) * 0.65) + \
            (probs.get("High Risk", 0) * 0.30)
    risk_score = max(0, min(100, int(score)))

    # Fallback to defaults if score wasn't correctly parsed
    if risk_score == 0:
        if risk_level == "low": risk_score = 85
        elif risk_level == "medium": risk_score = 65
        else: risk_score = 40

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
    confidence_val = probs.get(prediction_label, 85.0) / 100.0 if probs else 0.85
    
    flags = []
    if risk_level == "high":
        flags.append("[!] AI Algorithm flagged significant risk based on multi-factor analysis.")
    if mapped_data['concentration_risk_score'] <= 60:
        flags.append("[!] High Concentration Risk: Seller is over-dependent on this buyer.")
    if mapped_data['external_credit_rating'] < 40:
        flags.append("[!] Bureau Alert: Low external credit rating detected.")

    return {
        'riskScore': risk_score,
        'riskLevel': risk_level,
        'confidence': round(confidence_val, 4),
        'details': {
            'buyerReliability': 90 if risk_level == "low" else (50 if risk_level == "medium" else 20),
            'paymentHistory': mapped_data['internal_payment_score'],
            'externalCreditRating': mapped_data['external_credit_rating'],
            'concentrationRisk': mapped_data['concentration_risk_score'],
            'industryRisk': INDUSTRY_RISK.get(mapped_data['industry'], 62),
            'invoiceAmount': mapped_data['amount'],
            'daysToMaturity': 30,
            'gstVerified': bool(invoice_data.get('debtorGST')),
            'urgencyScore': 0.5,
            'riskIndex': mapped_data['amount'] * 30
        },
        'recommendation': rec['text'],
        'action': rec['action'],
        'factoringTerms': {
            'discountRate': rec['discountRate'],
            'advanceRate': rec['advanceRate'],
        },
        'flags': flags
    }
