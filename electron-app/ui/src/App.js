import React, { useEffect, useState, useMemo, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./App.css";

const API = "http://127.0.0.1:8000";
const ACCESS_CODES = ["BANK-DEMO-2026", "JURY-ACCESS", "ADMIN-ONLY"];

const COLORS = [
  "linear-gradient(135deg, #FF3B30 0%, #FF6B6B 100%)",
  "linear-gradient(135deg, #FF9F0A 0%, #FFD93D 100%)",
  "linear-gradient(135deg, #34C759 0%, #6BD46B 100%)",
  "linear-gradient(135deg, #5AC8FA 0%, #64D2FF 100%)"
];

// Custom Icon components
const Icons = {
  Search: () => <span className="icon">🔍</span>,
  Lock: () => <span className="icon">🔒</span>,
  Unlock: () => <span className="icon">🔓</span>,
  Activity: () => <span className="icon">📈</span>,
  Alert: () => <span className="icon">⚠️</span>,
  TrendingUp: () => <span className="icon">📊</span>,
  Shield: () => <span className="icon">🛡️</span>,
  Globe: () => <span className="icon">🌐</span>,
  Database: () => <span className="icon">💾</span>,
  Zap: () => <span className="icon">⚡</span>,
  Apple: () => <span className="icon">🍎</span>,
  Close: () => <span className="icon">×</span>
};

function riskClass(score) {
  if (score >= 7) return "risk-high";
  if (score >= 4) return "risk-medium";
  return "risk-low";
}

function AnimatedBackground() {
  return (
    <div className="cyber-background">
      <div className="gradient-grid"></div>
      <div className="particles-container">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0, 1, 0],
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>
      <div className="grid-lines"></div>
    </div>
  );
}

function CyberCard({ children, className = "", hover = false }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-200, 200], [8, -8]);
  const rotateY = useTransform(mouseX, [-200, 200], [-8, 8]);
  const rotateXSpring = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 300, damping: 30 });
  
  const handleMouseMove = (e) => {
    if (!ref.current || !hover) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`cyber-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX: rotateXSpring,
        rotateY: rotateYSpring
      }}
      whileHover={hover ? { scale: 1.02 } : {}}
    >
      <div className="card-glow"></div>
      {children}
    </motion.div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem("unlocked") === "true"
  );
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [account, setAccount] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  });

  // Splash screen with enhanced animation
  useEffect(() => {
    setTimeout(() => setLoading(false), 3200);
  }, []);

  // Fetch transactions
  useEffect(() => {
    if (!unlocked) return;
    fetch(`${API}/bulk`)
      .then(res => res.json())
      .then(data => {
        const txs = data.transactions || [];
        setTransactions(txs);
        calculateStats(txs);
      });
  }, [unlocked]);

  // Animate incoming feed
  useEffect(() => {
    if (!unlocked) return;
    const interval = setInterval(() => {
      fetch(`${API}/bulk`)
        .then(res => res.json())
        .then(data => {
          if (!data.transactions) return;
          const tx =
            data.transactions[
              Math.floor(Math.random() * data.transactions.length)
            ];
          setTransactions(prev => {
            const newTxs = [tx, ...prev.slice(0, 199)];
            calculateStats(newTxs);
            return newTxs;
          });
        });
    }, 1800);
    return () => clearInterval(interval);
  }, [unlocked]);

  const calculateStats = (txs) => {
    const high = txs.filter(t => t.risk_score >= 7).length;
    const medium = txs.filter(t => t.risk_score >= 4 && t.risk_score < 7).length;
    const low = txs.filter(t => t.risk_score < 4).length;
    setStats({
      total: txs.length,
      highRisk: high,
      mediumRisk: medium,
      lowRisk: low
    });
  };

  const filtered = useMemo(() => 
    account
      ? transactions.filter(t => t.account === account)
      : transactions
  , [account, transactions]);

  const pieData = [
    { name: "High", value: stats.highRisk, color: COLORS[0] },
    { name: "Medium", value: stats.mediumRisk, color: COLORS[1] },
    { name: "Low", value: stats.lowRisk, color: COLORS[2] }
  ];

  const topRisky = useMemo(() =>
    transactions
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 8)
      .map(t => ({ ...t, riskClass: riskClass(t.risk_score) }))
  , [transactions]);

  if (loading) {
    return (
      <div className="cyber-splash">
        <AnimatedBackground />
        <motion.div
          className="splash-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="apple-logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <Icons.Apple />
          </motion.div>
          <motion.h1
            className="cyber-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1 }}
          >
            <span className="gradient-text">FRAUD INTELLIGENCE</span>
            <motion.div
              className="title-sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              Quantum Security System
            </motion.div>
          </motion.h1>
          <motion.div
            className="loading-bar"
            initial={{ width: 0 }}
            animate={{ width: "300px" }}
            transition={{ duration: 2, delay: 1.5 }}
          />
        </motion.div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="cyber-access">
        <AnimatedBackground />
        <CyberCard className="access-card" hover>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="access-content"
          >
            <div className="access-header">
              <Icons.Lock />
              <h2>Quantum Encryption</h2>
              <p>Enter Access Credentials</p>
            </div>
            
            <div className="input-group">
              <Icons.Shield />
              <input
                type="password"
                placeholder="Invite Code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="cyber-input"
                onKeyPress={(e) => e.key === 'Enter' && 
                  ACCESS_CODES.includes(code) && 
                  (sessionStorage.setItem("unlocked", "true"), setUnlocked(true))}
              />
              <motion.div 
                className="input-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: code ? 1 : 0 }}
              />
            </div>
            
            <motion.button
              className="unlock-btn"
              onClick={() => {
                if (ACCESS_CODES.includes(code)) {
                  sessionStorage.setItem("unlocked", "true");
                  setUnlocked(true);
                } else {
                  alert("⛔ Invalid Quantum Signature");
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icons.Unlock />
              Quantum Unlock
            </motion.button>
            
            <div className="hint">
              <Icons.Zap />
              <span>Try: BANK-DEMO-2026</span>
            </div>
          </motion.div>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="cyber-dashboard">
      <AnimatedBackground />
      
      {/* Header */}
      <motion.header 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-left">
          <Icons.Apple />
          <h1 className="dashboard-title">
            <span className="gradient-text">Quantum Fraud Intelligence</span>
            
          </h1>
        </div>
        <div className="header-right">
          <motion.div 
            className="live-indicator"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Icons.Activity />
            <span>LIVE</span>
          </motion.div>
        </div>
      </motion.header>

      {/* Search Bar */}
      <motion.div
        className="search-container"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Icons.Search />
        <input
          className="cyber-search"
          placeholder="Search Account ID or Transaction..."
          value={account}
          onChange={e => setAccount(e.target.value)}
        />
        <div className="search-stats">
          <Icons.Database />
          <span>{transactions.length.toLocaleString()} TX</span>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Panel - Transactions */}
        <CyberCard className="main-panel" hover>
          <div className="panel-header">
            <h2>
              <Icons.Globe />
              Live Transaction Stream
            </h2>
            <div className="panel-actions">
              <span className="risk-badge high">{stats.highRisk} High Risk</span>
              <span className="risk-badge medium">{stats.mediumRisk} Medium</span>
            </div>
          </div>
          
          <div className="transactions-container">
            <AnimatePresence>
              {filtered.slice(0, 15).map((t, i) => (
                <motion.div
                  key={`${t.account}-${i}`}
                  className={`transaction-row ${riskClass(t.risk_score)}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <div className="tx-main">
                    <span className="tx-account">{t.account}</span>
                    <span className="tx-location">
                      <Icons.Globe />
                      {t.location}
                    </span>
                  </div>
                  <div className="tx-details">
                    <span className="tx-amount">₹{t.amount.toLocaleString()}</span>
                    <div className={`risk-score ${riskClass(t.risk_score)}`}>
                      <div className="risk-dot"></div>
                      Risk {t.risk_score}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {account && (
            <motion.button
              className="details-btn"
              onClick={() => setShowDetails(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icons.TrendingUp />
              Neural Analysis →
            </motion.button>
          )}
        </CyberCard>

        {/* Right Panels */}
        <div className="side-panels">
          {/* Stats Panel */}
          <CyberCard className="stats-panel">
            <h3><Icons.Activity /> Risk Distribution</h3>
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color.split(' ')[4].replace('#','').slice(0,6)}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center">
                <span className="total-count">{stats.total}</span>
                <span className="total-label">Total TX</span>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-item high">
                <div className="stat-value">{stats.highRisk}</div>
                <div className="stat-label">High Risk</div>
              </div>
              <div className="stat-item medium">
                <div className="stat-value">{stats.mediumRisk}</div>
                <div className="stat-label">Medium</div>
              </div>
              <div className="stat-item low">
                <div className="stat-value">{stats.lowRisk}</div>
                <div className="stat-label">Low Risk</div>
              </div>
            </div>
          </CyberCard>

          {/* Leaderboard */}
          <CyberCard className="leaderboard-panel">
            <h3><Icons.Alert /> Threat Leaderboard</h3>
            <div className="leaderboard-list">
              {topRisky.map((t, i) => (
                <motion.div
                  key={t.account}
                  className={`leaderboard-item ${t.riskClass}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="rank">
                    <span className="rank-number">{i + 1}</span>
                    <div className="account-info">
                      <span className="account-id">{t.account}</span>
                      <span className="account-meta">{t.location}</span>
                    </div>
                  </div>
                  <div className="risk-info">
                    <div className={`risk-badge ${t.riskClass}`}>
                      {t.risk_score}
                    </div>
                    <div className="amount">₹{t.amount.toLocaleString()}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CyberCard>
        </div>
      </div>

      {/* Account Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
            />
            <motion.div
              className="account-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <CyberCard className="modal-content">
                <div className="modal-header">
                  <h2>Neural Analysis: {account}</h2>
                  <button className="close-btn" onClick={() => setShowDetails(false)}>
                    <Icons.Close />
                  </button>
                </div>
                
                <div className="modal-grid">
                  <div className="modal-stat">
                    <span className="stat-label">Total Transactions</span>
                    <span className="stat-value">{filtered.length}</span>
                  </div>
                  <div className="modal-stat">
                    <span className="stat-label">Average Risk</span>
                    <span className="stat-value high">
                      {(
                        filtered.reduce((s, t) => s + t.risk_score, 0) /
                        Math.max(1, filtered.length)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="modal-stat">
                    <span className="stat-label">Total Volume</span>
                    <span className="stat-value">
                      ₹{filtered.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="modal-stat">
                    <span className="stat-label">Anomaly Score</span>
                    <span className="stat-value medium">
                      {Math.min(10, Math.max(0, 
                        filtered.reduce((s, t) => s + t.risk_score, 0) / 
                        Math.max(1, filtered.length) * 1.2
                      )).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="modal-btn secondary">Export Report</button>
                  <button className="modal-btn primary">Flag Account</button>
                </div>
              </CyberCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
