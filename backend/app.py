from fastapi import FastAPI
import subprocess
import json
import os

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
        capture_output=True
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"C++ Engine Error:\n{result.stderr}"
        )

    return json.loads(result.stdout)


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
def analyze(request: dict):

    if "transactions" not in request:
        return {"error": "Missing 'transactions' key in request"}

    cpp_result = run_cpp_engine(request["transactions"])

    return {
        "cpp_rules": cpp_result
    }
