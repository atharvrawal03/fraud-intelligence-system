def build_features(tx):
    return {
        "amount": tx["amount"],
        "is_high": 1 if tx["amount"] > 200000 else 0
    }
