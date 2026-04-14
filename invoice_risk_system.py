import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import warnings

warnings.filterwarnings('ignore')

# ---------------------------------------------------------
# 1-7. PIPELINE: LOAD, PREPROCESS, TRAIN, EVALUATE, SAVE
# ---------------------------------------------------------
def load_and_preprocess_data(file_path):
    """
    1. LOAD DATA & 2. PREPROCESSING
    """
    print(f"Loading data from {file_path}...")
    try:
        df = pd.read_csv(file_path)
        print("Data loaded successfully.")
    except FileNotFoundError:
        print(f" Error: {file_path} not found. Generating dummy dataset for testing purposes...")
        df = generate_dummy_data()
        
    print("\n--- First few rows of the dataset ---")
    print(df.head())

    print("\nPreprocessing data...")
    
    # --- Feature Engineering ---
    # payment_delay = actual_payment_date - due_date
    if 'actual_payment_date' in df.columns and 'due_date' in df.columns:
        df['actual_payment_date'] = pd.to_datetime(df['actual_payment_date'])
        df['due_date'] = pd.to_datetime(df['due_date'])
        df['payment_delay'] = (df['actual_payment_date'] - df['due_date']).dt.days
    elif 'payment_delay' not in df.columns:
        df['payment_delay'] = np.random.randint(-10, 60, size=len(df)) # Fallback if missing

    # buyer reliability score (based on past behavior)
    if 'buyer_id' in df.columns and 'payment_delay' in df.columns:
        # Calculate mean payment delay per buyer (lower delay = better)
        buyer_avg_delay = df.groupby('buyer_id')['payment_delay'].transform('mean')
        # Map delay to a 0-100 reliability score (Assuming >60 days delay = 0 score)
        df['buyer_reliability_score'] = 100 - (np.clip(buyer_avg_delay, 0, 60) * (100/60))
    elif 'buyer_reliability_score' not in df.columns:
        df['buyer_reliability_score'] = pd.Series(np.random.randint(50, 100, size=len(df)))

    # --- Generate Target Variable if missing ---
    if 'risk_label' not in df.columns:
        print("Target variable 'risk_label' missing. Generating using logic based on payment delay...")
        def assign_risk(delay):
            if pd.isna(delay): return 'High Risk'
            if delay <= 3: return 'Low Risk'
            elif delay <= 15: return 'Medium Risk'
            else: return 'High Risk'
        df['risk_label'] = df['payment_delay'].apply(assign_risk)

    # --- Drop Irrelevant Columns ---
    cols_to_drop = ['actual_payment_date', 'due_date', 'invoice_id', 'buyer_id', 'invoice_date']
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

    # --- Handle Missing Values ---
    # Fill numeric columns with the mean
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    for col in numerical_cols:
        df[col] = df[col].fillna(df[col].mean())
        
    # --- Encode Categorical Variables ---
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    categorical_cols = [c for c in categorical_cols if c != 'risk_label']
    
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = df[col].fillna('Unknown').astype(str)
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    # Encode Target Variable separately to keep fixed order
    # 0 = Low Risk, 1 = Medium Risk, 2 = High Risk
    risk_mapping = {'Low Risk': 0, 'Medium Risk': 1, 'High Risk': 2}
    # Standardize string variations if any (Low, Medium, High instead of Low Risk etc.)
    df['risk_label'] = df['risk_label'].astype(str).apply(
        lambda x: f"{x} Risk" if "Risk" not in x else x
    )
    df['risk_label'] = df['risk_label'].map(risk_mapping)
    df = df.dropna(subset=['risk_label'])

    return df, label_encoders

def generate_dummy_data():
    """Fallback utility to generate synthetic invoice data if CSV is not present."""
    np.random.seed(42)
    n = 1000
    dates = pd.date_range(start='2023-01-01', periods=n, freq='10h')
    data = {
        'invoice_id': [f"INV-{i}" for i in range(n)],
        'buyer_id': np.random.choice([f"BUYER-{i}" for i in range(30)], n),
        'amount': np.random.uniform(500, 50000, n),
        'industry': np.random.choice(['Tech', 'Retail', 'Mfg', 'Health'], n),
        'due_date': dates.strftime('%Y-%m-%d'),
    }
    df = pd.DataFrame(data)
    # Add actual payment date (simulate some delays)
    delays = np.random.normal(loc=8, scale=12, size=n).astype(int)
    df['actual_payment_date'] = (pd.to_datetime(df['due_date']) + pd.to_timedelta(delays, unit='D')).dt.strftime('%Y-%m-%d')
    return df

def train_and_evaluate(X_train, y_train, X_test, y_test):
    """
    3, 4, 5. MODEL BUILDING, TRAINING, EVALUATION
    """
    print("\nTraining and evaluating models...")
    
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'XGBoost': XGBClassifier(eval_metric='mlogloss', random_state=42, use_label_encoder=False)
    }
    
    best_model = None
    best_f1 = -1
    best_name = ""
    
    for name, model in models.items():
        # Cross validation on training data
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1_macro')
        
        # Train model
        model.fit(X_train, y_train)
        
        # Predict on test set
        y_pred = model.predict(X_test)
        
        # Evaluation Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        print(f"\n--- {name} ---")
        print(f"CV F1-Score (Macro): {cv_scores.mean():.4f}")
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall:    {rec:.4f}")
        print(f"F1-score:  {f1:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_name = name
            
    print(f"\nBest Model Selected: {best_name} (Test F1-score: {best_f1:.4f})")
    return best_model

def run_training_pipeline(csv_file_path):
    # Load and Preprocess
    df, label_encoders = load_and_preprocess_data(csv_file_path)
    
    X = df.drop(columns=['risk_label'])
    y = df['risk_label'].astype(int)
    feature_cols = list(X.columns)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale Features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train & Auto-select Best
    best_model = train_and_evaluate(X_train_scaled, y_train, X_test_scaled, y_test)
    
    # Confusion Matrix Output
    y_pred = best_model.predict(X_test_scaled)
    print("\nConfusion Matrix (Best Model):")
    print(confusion_matrix(y_test, y_pred))
    
    # Save the model
    artifacts = {
        'model': best_model,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'label_encoders': label_encoders
    }
    joblib.dump(artifacts, 'invoice_risk_model.pkl')
    print("\n Model saved successfully to 'invoice_risk_model.pkl'")
    
    # 7. OUTPUT PREDICTIONS (Sample)
    print("\n--- Output predictions on sample test data ---")
    sample_X = X_test.head(5)
    sample_X_scaled = scaler.transform(sample_X)
    preds = best_model.predict(sample_X_scaled)
    probs = best_model.predict_proba(sample_X_scaled)
    
    risk_mapping = {0: 'Low Risk', 1: 'Medium Risk', 2: 'High Risk'}
    for i, (pred, prob) in enumerate(zip(preds, probs)):
        conf = prob[pred] * 100
        print(f"Sample {i+1} -> Prediction: {risk_mapping[pred]} | Confidence: {conf:.2f}% | Prob Spread: {np.round(prob, 3)}")


# ---------------------------------------------------------
# 8. PRODUCTION FUNCTION
# ---------------------------------------------------------
def predict_invoice_risk(new_invoice_data):
    """
    Production function that takes a dictionary (JSON representing a new invoice)
    and returns a predicted risk score and classification.
    """
    try:
        artifacts = joblib.load('invoice_risk_model.pkl')
    except FileNotFoundError:
        return {"error": "Model file 'invoice_risk_model.pkl' not found. Train first."}
        
    model = artifacts['model']
    scaler = artifacts['scaler']
    feature_cols = artifacts['feature_cols']
    label_encoders = artifacts['label_encoders']
    
    # Convert input to DataFrame
    df = pd.DataFrame([new_invoice_data])
    
    # Reproduce Feature Engineering
    if 'actual_payment_date' in df.columns and 'due_date' in df.columns:
        df['actual_payment_date'] = pd.to_datetime(df['actual_payment_date'])
        df['due_date'] = pd.to_datetime(df['due_date'])
        df['payment_delay'] = (df['actual_payment_date'] - df['due_date']).dt.days
    elif 'payment_delay' not in df.columns:
        df['payment_delay'] = 0 # Default assumption

    # Handle missing buyer_reliability_score for unseen data
    if 'buyer_reliability_score' not in df.columns:
         df['buyer_reliability_score'] = 50 # Default middle-ground
    
    # Add any missing features with default 0 to prevent crashes
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
            
    # Apply encoders
    for col, le in label_encoders.items():
        if col in df.columns:
            df[col] = df[col].astype(str)
            # Map known categories, default to the first class if unknown
            df[col] = df[col].apply(lambda x: x if x in le.classes_ else le.classes_[0])
            df[col] = le.transform(df[col])
            
    # Keep only the exact features the model was trained on
    X_new = df[feature_cols]
    
    # Scale features
    X_new_scaled = scaler.transform(X_new)
    
    # Make Prediction
    pred = model.predict(X_new_scaled)[0]
    probs = model.predict_proba(X_new_scaled)[0]
    
    # 6. RISK SCORING CONVERSION
    risk_mapping = {0: 'Low Risk', 1: 'Medium Risk', 2: 'High Risk'}
    
    return {
        "prediction": risk_mapping[pred],
        "probabilities": {
            "Low Risk": round(probs[0]*100, 2),
            "Medium Risk": round(probs[1]*100, 2),
            "High Risk": round(probs[2]*100, 2)
        },
        "status": "success",
        "message": "Risk evaluation completed."
    }

if __name__ == "__main__":
    # --- execution trigger ---
    CSV_PATH = 'dataset.csv' # User can place their dataset here
    
    print("=== INVOICE RISK SCORING SYSTEM START ===")
    run_training_pipeline(CSV_PATH)
    
    # Demonstrate the Production Function
    print("\n=== TESTING PRODUCTION ENDPOINT ===")
    sample_invoice_json = {
        "invoice_id": "INV-NEW-991",
        "buyer_id": "BUYER-8",
        "amount": 25000,
        "industry": "Tech",
        "due_date": "2026-05-01",
        "actual_payment_date": "2026-05-15" # 14 days late!
    }
    print("Incoming Data:", sample_invoice_json)
    
    result = predict_invoice_risk(sample_invoice_json)
    print("\nAPI Response:")
    for k, v in result.items():
        print(f"  {k}: {v}")
