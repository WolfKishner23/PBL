"""
InvoiceFlow AI Service — Train Risk Scoring Model
Uses scikit-learn RandomForestClassifier on synthetic data
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("🤖 InvoiceFlow AI — Training Risk Model...")
print("=" * 50)

# ─── Generate Synthetic Training Data (500 samples) ───────────────────────────
np.random.seed(42)
n_samples = 500

data = {
    'debtor_credit_score': np.random.uniform(20, 100, n_samples),
    'payment_history_score': np.random.uniform(20, 100, n_samples),
    'industry_risk_score': np.random.uniform(20, 100, n_samples),
    'invoice_validity_score': np.random.uniform(30, 100, n_samples),
    'amount': np.random.uniform(10000, 5000000, n_samples),
    'days_to_due': np.random.randint(15, 120, n_samples),
    'previous_invoices': np.random.randint(0, 20, n_samples),
}

df = pd.DataFrame(data)

# ─── Generate Labels Using Weighted Score ─────────────────────────────────────
def calculate_label(row):
    weighted_score = (
        row['debtor_credit_score'] * 0.35 +
        row['payment_history_score'] * 0.25 +
        row['industry_risk_score'] * 0.20 +
        row['invoice_validity_score'] * 0.10 +
        (100 - row['amount'] / 50000) * 0.10
    )
    if weighted_score >= 70:
        return 0  # low risk
    elif weighted_score >= 50:
        return 1  # medium risk
    else:
        return 2  # high risk

df['risk_level'] = df.apply(calculate_label, axis=1)

print(f"📊 Dataset: {n_samples} samples generated")
print(f"   Low risk (0):    {(df['risk_level'] == 0).sum()}")
print(f"   Medium risk (1): {(df['risk_level'] == 1).sum()}")
print(f"   High risk (2):   {(df['risk_level'] == 2).sum()}")
print()

# ─── Split Data ───────────────────────────────────────────────────────────────
X = df[['debtor_credit_score', 'payment_history_score', 'industry_risk_score',
        'invoice_validity_score', 'amount', 'days_to_due', 'previous_invoices']]
y = df['risk_level']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"📋 Train set: {len(X_train)} | Test set: {len(X_test)}")

# ─── Train RandomForestClassifier ─────────────────────────────────────────────
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    max_depth=10,
    min_samples_split=5
)

model.fit(X_train, y_train)

# ─── Evaluate ─────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n✅ Model Accuracy: {accuracy:.4f} ({accuracy * 100:.1f}%)")
print(f"\n📊 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High']))

# ─── Feature Importance ──────────────────────────────────────────────────────
feature_names = X.columns.tolist()
importances = model.feature_importances_
print("📈 Feature Importance:")
for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
    print(f"   {name}: {imp:.4f}")

# ─── Save Model ──────────────────────────────────────────────────────────────
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
joblib.dump(model, model_path)
print(f"\n💾 Model saved to: {model_path}")
print("=" * 50)
print("✅ Training complete! Run: uvicorn main:app --reload --port 8000")
