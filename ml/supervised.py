import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "supervised.pkl")

model = joblib.load(MODEL_PATH)

def fraud_probability(features):
    return model.predict_proba([[features["amount"]]])[0][1]
