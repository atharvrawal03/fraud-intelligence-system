from sklearn.ensemble import IsolationForest
import joblib

model = IsolationForest(contamination=0.1)
model.fit([[10000],[15000],[200000]])

joblib.dump(model,"../models/anomaly.pkl")

def anomaly_score(amount):
    return model.decision_function([[amount]])[0]
