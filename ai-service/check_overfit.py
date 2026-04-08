import train
from sklearn.metrics import accuracy_score

print("\n--- Overfitting Analysis: Train vs Test Accuracy ---")
for name, model in train.models.items():
    train_pred = model.predict(train.X_train)
    test_pred = model.predict(train.X_test)
    
    train_acc = accuracy_score(train.y_train, train_pred)
    test_acc = accuracy_score(train.y_test, test_pred)
    
    diff = train_acc - test_acc
    status = "OVERFITTING DETECTED" if diff > 0.05 else "WELL BALANCED"
    
    print(f"{name:20}: Train={train_acc:.4f} | Test={test_acc:.4f} | Diff={diff:+.4f} | {status}")
