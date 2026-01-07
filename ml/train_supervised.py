import pandas as pd
import xgboost as xgb
import joblib
import os

# Get project root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "supervised.pkl")

# Dummy training data
data = pd.DataFrame({
    "amount": [10000, 50000, 200000, 300000],
    "label": [0, 0, 1, 1]
})

X = data[["amount"]]
y = data["label"]

model = xgb.XGBClassifier()
model.fit(X, y)

# Save model safely
joblib.dump(model, MODEL_PATH)

print(MODEL_PATH)
