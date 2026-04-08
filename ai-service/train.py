"""
InvoiceFlow AI Service — Train Risk Scoring Model (Enhanced)
Pipeline with xgboost and explicitly engineered features.
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import os

print("🤖 InvoiceFlow AI — Training Risk Model (Enhanced Pipeline)...")
print("=" * 60)

# ─── Generate Realistic Synthetic Training Data (2000 samples)
np.random.seed(42)
n_samples = 2000

# Step 2: Dataset Augmentation
buyer_reliability = np.concatenate([
    np.random.normal(85, 8, int(n_samples * 0.5)),   # Good buyers
    np.random.normal(65, 10, int(n_samples * 0.3)),  # Average buyers
    np.random.normal(40, 10, int(n_samples * 0.2)),  # Poor buyers
])[:n_samples]
buyer_reliability = np.clip(buyer_reliability, 10, 100)

payment_history_score = np.concatenate([
    np.random.normal(88, 7, int(n_samples * 0.45)),
    np.random.normal(65, 10, int(n_samples * 0.35)),
    np.random.normal(35, 12, int(n_samples * 0.20)),
])[:n_samples]
payment_history_score = np.clip(payment_history_score, 10, 100)

industry_risk_score = np.random.choice(
    [85, 80, 75, 70, 65, 60, 90],
    size=n_samples,
    p=[0.20, 0.10, 0.25, 0.10, 0.15, 0.10, 0.10]
)

invoice_amount = np.concatenate([
    np.random.uniform(10000, 100000, int(n_samples * 0.30)),     
    np.random.uniform(100000, 500000, int(n_samples * 0.35)),    
    np.random.uniform(500000, 2000000, int(n_samples * 0.25)),   
    np.random.uniform(2000000, 10000000, int(n_samples * 0.10)), 
])[:n_samples]

days_to_due = np.random.randint(1, 121, n_samples)  # 1-120 days
past_delay_count = np.random.randint(0, 15, n_samples)

gst_provided = np.random.choice([1, 0], size=n_samples, p=[0.75, 0.25])

avg_payment_delay = np.concatenate([
    np.random.uniform(0, 5, int(n_samples * 0.45)),
    np.random.uniform(5, 20, int(n_samples * 0.35)),
    np.random.uniform(20, 60, int(n_samples * 0.20)),
])[:n_samples]

data = {
    'buyer_reliability': buyer_reliability,
    'payment_history_score': payment_history_score,
    'industry_risk_score': industry_risk_score,
    'invoice_amount': invoice_amount,
    'days_to_due': days_to_due,
    'past_delay_count': past_delay_count,
    'gst_provided': gst_provided,
    'avg_payment_delay': avg_payment_delay,
}

df = pd.DataFrame(data)

# Step 3: Feature Engineering
df['urgency_score'] = 1.0 / np.maximum(df['days_to_due'], 1)
df['risk_index'] = df['invoice_amount'] * df['days_to_due']

# Step 4: Target Variable Creation
def calculate_label(row):
    amount_score = max(0, min(100, 100 - (row['invoice_amount'] / 100000) * 5))
    delay_penalty = max(0, 100 - row['avg_payment_delay'] * 2)
    delay_count_penalty = min(row['past_delay_count'] * 3, 30)
    
    weighted_score = (
        row['buyer_reliability'] * 0.35 +
        row['payment_history_score'] * 0.25 +
        row['industry_risk_score'] * 0.15 +
        amount_score * 0.10 +
        delay_penalty * 0.15
    )
    
    weighted_score -= delay_count_penalty
    if row['gst_provided'] == 1:
        weighted_score = min(100, weighted_score + 5)

    if weighted_score >= 68:
        return 0  # low risk
    elif weighted_score >= 48:
        return 1  # medium risk
    else:
        return 2  # high risk

df['risk_level'] = df.apply(calculate_label, axis=1)

# Step 5: Data Preprocessing
df.fillna(df.mean(), inplace=True)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"📊 Dataset: {n_samples} samples generated")
print(f"   Low risk (0):    {(df['risk_level'] == 0).sum()} ({(df['risk_level'] == 0).mean()*100:.1f}%)")
print(f"   Medium risk (1): {(df['risk_level'] == 1).sum()} ({(df['risk_level'] == 1).mean()*100:.1f}%)")
print(f"   High risk (2):   {(df['risk_level'] == 2).sum()} ({(df['risk_level'] == 2).mean()*100:.1f}%)")
print()

feature_cols = [
    'buyer_reliability', 'payment_history_score', 'industry_risk_score',
    'invoice_amount', 'days_to_due', 'past_delay_count',
    'gst_provided', 'avg_payment_delay', 'urgency_score', 'risk_index'
]

X = df[feature_cols]
y = df['risk_level']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"📋 Train: {len(X_train)} | Test: {len(X_test)}")

# Step 6 & 7: Model Training and Evaluation
print("\n🔬 Comparing Models...")
print("-" * 40)

models = {
    'RandomForest': RandomForestClassifier(
        n_estimators=200, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1
    ),
    'XGBoost': xgb.XGBClassifier(
        n_estimators=150, learning_rate=0.1, max_depth=6, random_state=42, eval_metric='mlogloss'
    ),
    'LogisticRegression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))
    ])
}

best_model = None
best_score = 0
best_name = ""

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
        
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    
    print(f"   {name}: Accuracy = {acc:.4f} | F1 = {f1:.4f}")
    
    if f1 > best_score:
        best_score = f1
        best_model = model
        best_name = name

print(f"\n🏆 Best Model: {best_name} (F1: {best_score:.4f})")

# Final evaluation printed
y_pred = best_model.predict(X_test)
print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Low Risk', 'Medium Risk', 'High Risk']))

print("🔢 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"   Predicted:  Low  Med  High")
for i, row in enumerate(['Low ', 'Med ', 'High']):
    print(f"   Actual {row}: {cm[i]}")

# Step 8: Interpretation
model_for_imp = best_model
if isinstance(best_model, Pipeline):
    model_for_imp = best_model.named_steps['clf']

if hasattr(model_for_imp, 'feature_importances_'):
    importances = model_for_imp.feature_importances_
    print("\n📈 Feature Importance:")
    for name, imp in sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True):
        bar = "█" * int(imp * 50)
        print(f"   {name:<25} {imp:.4f} {bar}")

# Save the model
model_path = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
joblib.dump(best_model, model_path)
joblib.dump(feature_cols, os.path.join(os.path.dirname(__file__), 'feature_cols.pkl'))

print(f"\n💾 Model saved: {model_path}")
print("=" * 60)
print("✅ Pipeline complete!")
