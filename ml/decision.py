def final_decision(rule, ml_prob, anomaly, profile):
    if rule == 2:
        return "BLOCK"
    if ml_prob > 0.85:
        return "BLOCK"
    if anomaly < -0.4 or profile > 0:
        return "ALERT"
    return "ALLOW"
