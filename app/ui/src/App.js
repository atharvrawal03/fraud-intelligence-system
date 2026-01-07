import React, { useState } from "react";

function App() {
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);

  const analyzeTransaction = async () => {
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_id: "T100",
        account: "ACC1001",
        amount: Number(amount),
        city: "Mumbai",
        time: "12:30"
      })
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Fraud Intelligence Dashboard</h2>

        <input
          type="number"
          placeholder="Enter transaction amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />

        <button onClick={analyzeTransaction} style={styles.button}>
          Analyze
        </button>

        {result && (
          <div style={styles.result}>
            <p><b>Decision:</b> {result.decision}</p>
            <p><b>Explanation:</b> {JSON.stringify(result.explanation)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "rgba(20,20,20,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    backdropFilter: "blur(20px)",
    background: "rgba(255,255,255,0.1)",
    padding: "30px",
    borderRadius: "16px",
    color: "white",
    width: "400px"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px"
  },
  button: {
    width: "100%",
    padding: "10px",
    cursor: "pointer"
  },
  result: {
    marginTop: "20px"
  }
};

export default App;

