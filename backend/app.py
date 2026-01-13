from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- SAMPLE DATA ----------------
transactions = [
    {
        "account": f"ACC{1000 + i}",
        "amount": random.randint(1000, 500000),
        "location": random.choice(["Delhi", "Mumbai", "Bangalore", "Pune"])
    }
    for i in range(200)
]

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"status": "Backend running"}

# ---------------- BULK TRANSACTIONS ----------------
@app.get("/bulk")
def bulk():
    enriched = []

    for t in transactions:
        risk_score = round(
            min(10, (t["amount"] / 50000) + random.uniform(0, 2)),
            2
        )

        if risk_score >= 7:
            risk_label = "High"
        elif risk_score >= 4:
            risk_label = "Medium"
        else:
            risk_label = "Low"

        enriched.append({
            "account": t["account"],
            "amount": t["amount"],
            "location": t["location"],
            "risk_score": risk_score,
            "risk_level": risk_label
        })

    return {
        "count": len(enriched),
        "transactions": enriched
    }

# ---------------- ACCOUNT DETAILS ----------------
@app.get("/account/{account_id}")
def account_details(account_id: str):
    account_tx = [
        t for t in transactions if t["account"] == account_id
    ]

    if not account_tx:
        return {"error": "Account not found"}

    total_amount = sum(t["amount"] for t in account_tx)
    avg_risk = round(
        sum((t["amount"] / 50000) for t in account_tx) / len(account_tx),
        2
    )

    return {
        "account": account_id,
        "total_transactions": len(account_tx),
        "total_amount": total_amount,
        "average_risk_score": avg_risk,
        "transactions": account_tx
    }
