from fastapi import FastAPI
import subprocess, json
from ml.features import build_features
from ml.supervised import fraud_probability
from ml.anomaly import anomaly_score
from ml.decision import final_decision
from profiles.profile_check import profile_risk
from ml.explain import explain

app = FastAPI()

@app.post("/analyze")
def analyze(tx: dict):
    output = subprocess.check_output(
        ["../rules/rule_engine"],
        input=str(tx["amount"]).encode()
    )
    rule = json.loads(output)["rule_amount"]

    features = build_features(tx)
    decision = final_decision(
        rule,
        fraud_probability(features),
        anomaly_score(tx["amount"]),
        profile_risk(tx["account"], tx["amount"], tx["city"])
    )

    return {
        "decision": decision,
        "explanation": explain(features)
    }
