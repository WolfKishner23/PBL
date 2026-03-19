"""
InvoiceFlow AI Service — Train Risk Scoring Model
Improved: 2000 samples, realistic data, multiple models, cross-validation
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import os

print("🤖 InvoiceFlow AI — Training Risk Model...")
print("=" * 60)

# ─── Generate Realistic Synthetic Training Data (2000 samples) ────────────────
np.random.seed(42)
n_samples = 2000

# Realistic feature distributions
debtor_credit_score = np.concatenate([
    np.random.normal(85, 8, int(n_samples * 0.5)),   # Good debtors
    np.random.normal(65, 10, int(n_samples * 0.3)),  # Average debtors
    np.random.normal(40, 10, int(n_samples * 0.2)),  # Poor debtors
])[:n_samples]
debtor_credit_score = np.clip(debtor_credit_score, 10, 100)

payment_history_score = np.concatenate([
    np.random.normal(88, 7, int(n_samples * 0.45)),  # Good payers
    np.random.normal(65, 10, int(n_samples * 0.35)), # Average payers
    np.random.normal(35, 12, int(n_samples * 0.20)), # Poor payers
])[:n_samples]
payment_history_score = np.clip(payment_history_score, 10, 100)

industry_risk_score = np.random.choice(
    [85, 80, 75, 70, 65, 60, 90],  # IT, Healthcare, Mfg, Export, Retail, Construction, Govt
    size=n_samples,
    p=[0.20, 0.10, 0.25, 0.10, 0.15, 0.10, 0.10]
)

invoice_validity_score = np.concatenate([
    np.random.normal(88, 5, int(n_samples * 0.4)),   # Small invoices
    np.random.normal(78, 5, int(n_samples * 0.3)),   # Medium invoices
    np.random.normal(68, 5, int(n_samples * 0.2)),   # Large invoices
    np.random.normal(58, 5, int(n_samples * 0.1)),   # Very large invoices
])[:n_samples]
invoice_validity_score = np.clip(invoice_validity_score, 10, 100)

# Amount in INR — realistic distribution for Indian B2B invoices
amount = np.concatenate([
    np.random.uniform(10000, 100000, int(n_samples * 0.30)),     # Small: 10K-1L
    np.random.uniform(100000, 500000, int(n_samples * 0.35)),    # Medium: 1L-5L
    np.random.uniform(500000, 2000000, int(n_samples * 0.25)),   # Large: 5L-20L
    np.random.uniform(2000000, 10000000, int(n_samples * 0.10)), # Very large: 20L-1Cr
])[:n_samples]

days_to_due = np.random.randint(7, 180, n_samples)
previous_invoices = np.random.randint(0, 30, n_samples)

# GST provided flag (1=yes, 0=no)
gst_provided = np.random.choice([1, 0], size=n_samples, p=[0.75, 0.25])

# Payment delay history (avg days late on previous invoices)
avg_payment_delay = np.concatenate([
    np.random.uniform(0, 5, int(n_samples * 0.45)),    # Excellent payers
    np.random.uniform(5, 20, int(n_samples * 0.35)),   # Average payers
    np.random.uniform(20, 60, int(n_samples * 0.20)),  # Late payers
])[:n_samples]

data = {
    'debtor_credit_score': debtor_credit_score,
    'payment_history_score': payment_history_score,
    'industry_risk_score': industry_risk_score,
    'invoice_validity_score': invoice_validity_score,
    'amount': amount,
    'days_to_due': days_to_due,
    'previous_invoices': previous_invoices,
    'gst_provided': gst_provided,
    'avg_payment_delay': avg_payment_delay,
}

df = pd.DataFrame(data)

# ─── Generate Realistic Labels ────────────────────────────────────────────────
def calculate_label(row):
    # Weighted risk score (higher = safer = lower risk)
    amount_score = max(0, min(100, 100 - (row['amount'] / 100000) * 5))
    delay_penalty = max(0, 100 - row['avg_payment_delay'] * 2)

    weighted_score = (
        row['debtor_credit_score'] * 0.30 +
        row['payment_history_score'] * 0.25 +
        row['industry_risk_score'] * 0.15 +
        row['invoice_validity_score'] * 0.10 +
        amount_score * 0.10 +
        delay_penalty * 0.10
    )

    # Add GST bonus
    if row['gst_provided'] == 1:
        weighted_score = min(100, weighted_score + 5)

    # Add experience bonus
    if row['previous_invoices'] >= 7:
        weighted_score = min(100, weighted_score + 3)

    if weighted_score >= 72:
        return 0  # low risk
    elif weighted_score >= 52:
        return 1  # medium risk
    else:
        return 2  # high risk

df['risk_level'] = df.apply(calculate_label, axis=1)

# Shuffle dataset
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"📊 Dataset: {n_samples} samples generated")
print(f"   Low risk (0):    {(df['risk_level'] == 0).sum()} ({(df['risk_level'] == 0).mean()*100:.1f}%)")
print(f"   Medium risk (1): {(df['risk_level'] == 1).sum()} ({(df['risk_level'] == 1).mean()*100:.1f}%)")
print(f"   High risk (2):   {(df['risk_level'] == 2).sum()} ({(df['risk_level'] == 2).mean()*100:.1f}%)")
print()

# ─── Feature Engineering ──────────────────────────────────────────────────────
feature_cols = [
    'debtor_credit_score', 'payment_history_score', 'industry_risk_score',
    'invoice_validity_score', 'amount', 'days_to_due', 'previous_invoices',
    'gst_provided', 'avg_payment_delay'
]

X = df[feature_cols]
y = df['risk_level']

# ─── Train/Test Split ─────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"📋 Train: {len(X_train)} | Test: {len(X_test)}")

# ─── Compare Multiple Models ──────────────────────────────────────────────────
print("\n🔬 Comparing Models...")
print("-" * 40)

models = {
    'RandomForest': RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    ),
    'GradientBoosting': GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    ),
    'LogisticRegression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        ))
    ])
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
best_model = None
best_score = 0
best_name = ""

for name, model in models.items():
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
    print(f"   {name}: CV Accuracy = {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    if cv_scores.mean() > best_score:
        best_score = cv_scores.mean()
        best_model = model
        best_name = name

print(f"\n🏆 Best Model: {best_name} (CV Accuracy: {best_score:.4f})")

# ─── Train Best Model ─────────────────────────────────────────────────────────
print(f"\n🚀 Training {best_name} on full training set...")
best_model.fit(X_train, y_train)

# ─── Evaluate ─────────────────────────────────────────────────────────────────
y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n✅ Test Accuracy:  {accuracy:.4f} ({accuracy * 100:.1f}%)")
print(f"\n📊 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Low Risk', 'Medium Risk', 'High Risk']))

print(f"\n🔢 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"   Predicted:  Low  Med  High")
for i, row in enumerate(['Low ', 'Med ', 'High']):
    print(f"   Actual {row}: {cm[i]}")

# ─── Feature Importance (RandomForest/GradientBoosting) ──────────────────────
if hasattr(best_model, 'feature_importances_'):
    importances = best_model.feature_importances_
elif hasattr(best_model, 'named_steps'):
    importances = None
else:
    importances = None

if importances is not None:
    print("\n📈 Feature Importance:")
    for name, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True):
        bar = "█" * int(imp * 50)
        print(f"   {name:<28} {imp:.4f} {bar}")

# ─── Save Model ──────────────────────────────────────────────────────────────
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
joblib.dump(best_model, model_path)

# Save feature column names for use in model.py
joblib.dump(feature_cols, os.path.join(os.path.dirname(__file__), 'feature_cols.pkl'))

print(f"\n💾 Model saved: {model_path}")
print("=" * 60)
print(f"✅ Training complete!")
print(f"   Final Accuracy: {accuracy * 100:.1f}%")
print(f"   Run: uvicorn main:app --reload --port 8000")
