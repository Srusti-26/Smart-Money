import React, { useState, useEffect } from 'react';
import api, { formatCurrency } from '../utils/api';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Zap, TrendingUp, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Month {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [insRes, anomRes, predRes, simRes, healthRes] = await Promise.all([
        api.get('/ml/insights'),
        api.get('/ml/anomalies'),
        api.get('/ml/predict'),
        api.get('/ml/simulate?months=12'),
        api.get('/ml/health-score'),
      ]);
      setInsights(insRes.data);
      setAnomalies(anomRes.data);
      setPrediction(predRes.data);
      setSimulation(simRes.data);
      setHealthScore(healthRes.data);
    } catch (err) { toast.error('Failed to load insights'); }
    finally { setLoading(false); }
  };

  const scoreColor = healthScore
    ? healthScore.score >= 80 ? '#22d3a5' : healthScore.score >= 60 ? '#4f8eff' : healthScore.score >= 40 ? '#f59e0b' : '#ef4444'
    : '#4f8eff';

  const circumference = 2 * Math.PI * 54;
  const strokeDash = healthScore ? circumference - (healthScore.score / 100) * circumference : circumference;

  // Build simulation chart data
  const simChartData = simulation?.months?.map((m, i) => ({
    month: m,
    'Current Habits': simulation.current_projection?.[i] || 0,
    'Reduce 20%': simulation.improved_projection?.[i] || 0,
    'Aggressive Save': simulation.aggressive_projection?.[i] || 0,
  })) || [];

  if (loading) return (
    <div>
      <h1 className="page-title">AI Insights</h1>
      <p className="page-subtitle">Analyzing your financial patterns...</p>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">AI Insights</h1>
          <p className="page-subtitle">ML-powered analysis of your financial behavior</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Health Score + Prediction Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Health Score */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Financial Health Score</div>
            <span className="badge badge-info">AI Generated</span>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
              <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="65" cy="65" r="54" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
                <circle cx="65" cy="65" r="54" fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeDasharray={circumference} strokeDashoffset={strokeDash}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {healthScore?.score}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: scoreColor }}>Grade {healthScore?.grade}</div>
              </div>
            </div>
            {/* Breakdown */}
            <div style={{ flex: 1 }}>
              {Object.entries(healthScore?.breakdown || {}).map(([key, val]) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace('_', ' ')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{val.score}/{val.max}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${(val.score / val.max) * 100}%`, background: 'var(--gradient-blue)' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{val.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Prediction */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Next Month Prediction</div>
            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              Linear Regression
            </span>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Predicted Expenses</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginBottom: 8 }}>
              {formatCurrency(prediction?.predicted || 0)}
            </div>
            <span style={{
              padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
              background: prediction?.trend === 'increasing' ? 'rgba(239,68,68,0.1)' : prediction?.trend === 'decreasing' ? 'rgba(34,211,165,0.1)' : 'rgba(79,142,255,0.1)',
              color: prediction?.trend === 'increasing' ? 'var(--accent-red)' : prediction?.trend === 'decreasing' ? 'var(--accent-green)' : 'var(--accent-blue)'
            }}>
              {prediction?.trend === 'increasing' ? '↑' : prediction?.trend === 'decreasing' ? '↓' : '→'} {prediction?.trend} trend
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center' }}>Historical Monthly Expenses</div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={(prediction?.months || []).map((m, i) => ({ month: m, expense: prediction.monthly_data?.[i] || 0 }))}>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Line type="monotone" dataKey="expense" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Confidence: <strong style={{ color: prediction?.confidence === 'high' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{prediction?.confidence}</strong>
          </div>
        </div>
      </div>

      {/* Future Simulation */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>📊 Future Savings Simulation</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>12-month projection</div>
        </div>
        {simulation && (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MONTHLY INCOME</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(simulation.monthly_income)}</div></div>
              <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AVG EXPENSE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)' }}>{formatCurrency(simulation.monthly_expense)}</div></div>
              <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MONTHLY SAVINGS</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(simulation.monthly_savings)}</div></div>
              <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SAVINGS RATE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{simulation.savings_rate}%</div></div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={simChartData}>
                <defs>
                  <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8eff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f8eff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="iG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3a5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3a5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
                <Area type="monotone" dataKey="Current Habits" stroke="#4f8eff" fill="url(#cG)" strokeWidth={2} />
                <Area type="monotone" dataKey="Reduce 20%" stroke="#22d3a5" fill="url(#iG)" strokeWidth={2} />
                <Area type="monotone" dataKey="Aggressive Save" stroke="#8b5cf6" fill="url(#aG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Current habits → 12mo', value: simulation.current_projection?.[11], color: '#4f8eff' },
                { label: 'Reduce 20% → 12mo', value: simulation.improved_projection?.[11], color: '#22d3a5' },
                { label: 'Aggressive → 12mo', value: simulation.aggressive_projection?.[11], color: '#8b5cf6' },
              ].map((item, i) => (
                <div key={i} style={{ flex: '1 1 150px', padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.color }}>{formatCurrency(item.value || 0)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Insights + Anomalies Row */}
      <div className="grid-2">
        {/* AI Insights */}
        <div className="card">
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <Zap size={16} color="var(--accent-blue)" />
            <div className="section-title" style={{ marginBottom: 0 }}>Spending Insights</div>
          </div>
          {insights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} className={`insight-card ${ins.type}`}>
                  <div style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{ins.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 3 }}>{ins.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.message}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Add more transactions to generate insights
            </div>
          )}
        </div>

        {/* Anomalies */}
        <div className="card">
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--accent-amber)" />
            <div className="section-title" style={{ marginBottom: 0 }}>Overspending Alerts</div>
            {anomalies.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700 }}>
                {anomalies.length}
              </span>
            )}
          </div>
          {anomalies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {anomalies.map((a, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                  borderColor: a.severity === 'high' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)',
                  background: a.severity === 'high' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {a.severity === 'high' ? '🚨' : '⚠️'} {a.category}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)', fontSize: '0.9rem' }}>
                      {formatCurrency(a.amount)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {a.description} • {a.date}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: a.severity === 'high' ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                    {a.percentage_above_avg > 0 ? '+' : ''}{a.percentage_above_avg}% above category average ({formatCurrency(a.category_avg)})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No anomalies detected</div>
              <div>Your spending looks normal 🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
