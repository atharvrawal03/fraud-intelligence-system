import json
profiles = json.load(open("profiles.json"))

def profile_risk(acc, amount, city):
    risk = 0
    p = profiles.get(acc)
    if amount > p["avg_amount"] * 3:
        risk += 0.5
    if city not in p["cities"]:
        risk += 0.5
    return risk
