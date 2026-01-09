from fastapi import FastAPI
import subprocess
import json
import os

from ml.features import build_features
from ml.supervised import fraud_probability

app = FastAPI()



BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CPP_ENGINE_PATH = os.path.join(BASE_DIR, "rules", "rule_engine")


def run_cpp_engine(transactions):
    payload = {
        "transactions": transactions
    }

    result = subprocess.run(
        [CPP_ENGINE_PATH],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True
    )

    return json.loads(result.stdout)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
def analyze(request: dict):
    transactions = request["transactions"]

    cpp_result = run_cpp_engine(transactions)

    # Run ML on latest transaction
    features = build_features(transactions[-1])
    ml_prob = fraud_probability(features)

    # Hybrid decision logic
    final_decision = cpp_result["final_status"]
    if ml_prob > 0.85:
        final_decision = "Suspicious"

    return {
        "final_decision": final_decision,
        "rule_engine": cpp_result,
        "ml_probability": float(round(ml_prob, 3))
    }

