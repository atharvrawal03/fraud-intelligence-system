import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer 
} from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { motion } from 'framer-motion';
import './TransactionAnalytics.css';

// India GeoJSON (simplified - in production use actual India geoJSON)
const indiaGeoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json';

// Sample city coordinates for India
const cityCoordinates = {
  'Mumbai': [72.8777, 19.0760],
  'Delhi': [77.1025, 28.7041],
  'Bangalore': [77.5946, 12.9716],
  'Chennai': [80.2707, 13.0827],
  'Kolkata': [88.3639, 22.5726],
  'Hyderabad': [78.4867, 17.3850],
  'Pune': [73.8567, 18.5204],
  'Ahmedabad': [72.5714, 23.0225],
  'Jaipur': [75.7873, 26.9124],
  'Lucknow': [80.9462, 26.8467]
};

export default function TransactionAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/bulk')
      .then(res => res.json())
      .then(data => {
        const txs = data.transactions || [];
        setTransactions(txs);
        
        // Process city data for map
        const cityCounts = processCityData(txs);
        setCityData(cityCounts);
        setLoading(false);
      });
  }, []);

  const processCityData = (txs) => {
    const counts = {};
    txs.forEach(tx => {
      const city = tx.location || 'Unknown';
      counts[city] = (counts[city] || 0) + 1;
    });
    
    return Object.entries(counts).map(([city, count]) => ({
      city,
      count,
      coordinates: cityCoordinates[city] || [78.9629, 20.5937] // Default to India center
    }));
  };

  // Prepare data for charts
  const hourlyData = processHourlyData(transactions);
  const riskDistribution = [
    { name: 'High Risk', value: transactions.filter(t => t.risk_score >= 7).length },
    { name: 'Medium Risk', value: transactions.filter(t => t.risk_score >= 4 && t.risk_score < 7).length },
    { name: 'Low Risk', value: transactions.filter(t => t.risk_score < 4).length }
  ];

  const COLORS = ['#FF3B30', '#FF9F0A', '#34C759', '#5AC8FA'];

  if (loading) {
    return <div className="loading">Loading Analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <motion.button 
          className="back-btn"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back to Dashboard
        </motion.button>
        <h1>Transaction Intelligence Hub</h1>
        <div className="stats-summary">
          <span>Total: {transactions.length} transactions</span>
          <span>High Risk: {riskDistribution[0].value}</span>
          <span>Cities: {cityData.length}</span>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Left Column - Map */}
        <div className="map-section cyber-card">
          <h2>📍 Transaction Intensity Map - India</h2>
          <div className="map-container">
            <ResponsiveContainer width="100%" height={400}>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  center: [78.9629, 22.5937],
                  scale: 900
                }}
              >
                <Geographies geography={indiaGeoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#EAEAEC"
                        stroke="#D6D6DA"
                      />
                    ))
                  }
                </Geographies>
                
                {/* City markers */}
                {cityData.map((city, i) => (
                  <Marker key={i} coordinates={city.coordinates}>
                    <circle
                      r={Math.min(Math.max(city.count / 2, 5), 20)}
                      fill={city.count > 10 ? "#FF3B30" : city.count > 5 ? "#FF9F0A" : "#34C759"}
                      fillOpacity={0.7}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      y={-Math.min(Math.max(city.count / 2, 5), 20) - 5}
                      style={{ fontFamily: 'system-ui', fill: '#333', fontSize: '10px' }}
                    >
                      {city.city}
                    </text>
                  </Marker>
                ))}
              </ComposableMap>
            </ResponsiveContainer>
          </div>
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-dot high"></span> High Activity (&gt;10)
            </div>
            <div className="legend-item">
              <span className="legend-dot medium"></span> Medium (5-10)
            </div>
            <div className="legend-item">
              <span className="legend-dot low"></span> Low (&lt;5)
            </div>
          </div>
        </div>

        {/* Middle Column - Charts */}
        <div className="charts-section">
          <div className="cyber-card chart-card">
            <h3>📊 Transactions by Hour</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#5AC8FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="cyber-card chart-card">
            <h3>⚠️ Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - Transaction List */}
        <div className="transactions-section cyber-card">
          <div className="section-header">
            <h2>📝 All Transactions ({transactions.length})</h2>
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="search-input"
            />
          </div>
          <div className="transactions-list">
            {transactions.map((tx, i) => (
              <motion.div 
                key={i} 
                className={`transaction-item ${tx.risk_score >= 7 ? 'high-risk' : tx.risk_score >= 4 ? 'medium-risk' : 'low-risk'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.01 }}
              >
                <div className="tx-info">
                  <div className="tx-account">{tx.account}</div>
                  <div className="tx-location">📍 {tx.location}</div>
                </div>
                <div className="tx-details">
                  <div className="tx-amount">₹{tx.amount.toLocaleString()}</div>
                  <div className={`risk-badge risk-${tx.risk_score >= 7 ? 'high' : tx.risk_score >= 4 ? 'medium' : 'low'}`}>
                    Risk {tx.risk_score}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function processHourlyData(transactions) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
  
  transactions.forEach(tx => {
    // Simulate hour from timestamp
    const hour = new Date().getHours();
    hours[hour % 24].count++;
  });
  
  return hours;
}

function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}
