import shap, joblib
model = joblib.load("../models/supervised.pkl")
explainer = shap.Explainer(model)

def explain(features):
    values = explainer([[features["amount"]]])
    return {"amount": float(values.values[0][0])}
