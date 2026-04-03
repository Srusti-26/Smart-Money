import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [insights, setInsights] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const month = format(now, 'MM');
  const year = format(now, 'yyyy');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, budgetRes, predRes, healthRes, insightsRes] = await Promise.all([
          api.get(`/transactions/summary?month=${month}&year=${year}`),
          api.get(`/budget/status?month=${month}&year=${year}`),
          api.get('/ml/predict'),
          api.get('/ml/health-score'),
          api.get('/ml/insights'),
        ]);
        setSummary(sumRes.data);
        setBudgetStatus(budgetRes.data);
        setPrediction(predRes.data);
        setHealthScore(healthRes.data);
        setInsights(insightsRes.data);

        // Build 4-month trend
        const trend = [];
        for (let i = 3; i >= 0; i--) {
          const d = subMonths(now, i);
          const m = format(d, 'MM');
          const y = format(d, 'yyyy');
          const res = await api.get(`/transactions/summary?month=${m}&year=${y}`);
          trend.push({ month: format(d, 'MMM'), income: res.data.income, expense: res.data.expense, savings: res.data.savings });
        }
        setMonthlyTrend(trend);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [month, year]);

  const pieData = summary
    ? Object.entries(summary.by_category || {}).map(([name, value]) => ({ name, value }))
    : [];

  const scoreColor = healthScore
    ? healthScore.score >= 80 ? '#22d3a5' : healthScore.score >= 60 ? '#4f8eff' : healthScore.score >= 40 ? '#f59e0b' : '#ef4444'
    : '#4f8eff';

  if (loading) return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle">Loading your financial overview...</div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{format(now, 'MMMM yyyy')} financial overview</p>
        </div>
        {healthScore && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{healthScore.score}</div>
            <div style={{ fontSize: '0.7rem', color: scoreColor, fontWeight: 700 }}>Grade {healthScore.grade}</div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Income</div>
          <div className="stat-value text-green">{formatCurrency(summary?.income || 0)}</div>
          <div className="stat-change" style={{ color: 'var(--accent-green)' }}>
            <TrendingUp size={12} /> This month
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value text-red">{formatCurrency(summary?.expense || 0)}</div>
          <div className="stat-change up">
            <TrendingDown size={12} /> {summary?.count || 0} transactions
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Net Savings</div>
          <div className="stat-value" style={{ color: (summary?.savings || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {formatCurrency(summary?.savings || 0)}
          </div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>
            <PiggyBank size={12} /> {summary?.savings_rate || 0}% savings rate
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Predicted Next Month</div>
          <div className="stat-value text-blue">{formatCurrency(prediction?.predicted || 0)}</div>
          <div className="stat-change" style={{ color: prediction?.trend === 'increasing' ? 'var(--accent-red)' : prediction?.trend === 'decreasing' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
            {prediction?.trend === 'increasing' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {prediction?.trend} trend
          </div>
        </div>
      </div>

      {/* Budget Alert */}
      {budgetStatus?.exceeded && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
          borderRadius: 'var(--radius-sm)', marginBottom: 20,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <AlertTriangle size={18} color="var(--accent-red)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent-red)', fontSize: '0.9rem' }}>Budget Exceeded!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              You've spent {formatCurrency(budgetStatus.total_spent)} of your {formatCurrency(budgetStatus.total_budget)} budget ({budgetStatus.percentage}%)
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Monthly Trend */}
        <div className="card">
          <div className="section-title">Monthly Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3a5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3a5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#22d3a5" strokeWidth={2} fill="url(#incG)" />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="section-title">Spending by Category</div>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pieData.slice(0, 5).map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[item.name], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{CATEGORY_ICONS[item.name]} {item.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No expense data this month
            </div>
          )}
        </div>
      </div>

      {/* Budget + Insights Row */}
      <div className="grid-2">
        {/* Budget Status */}
        <div className="card">
          <div className="section-title">Budget Status</div>
          {budgetStatus && budgetStatus.total_budget ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overall</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {formatCurrency(budgetStatus.total_spent)} / {formatCurrency(budgetStatus.total_budget)}
                </span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 16 }}>
                <div className="progress-fill" style={{
                  width: `${Math.min(budgetStatus.percentage, 100)}%`,
                  background: budgetStatus.exceeded ? 'var(--accent-red)' : budgetStatus.percentage > 75 ? 'var(--accent-amber)' : 'var(--accent-green)'
                }} />
              </div>
              {Object.entries(budgetStatus.category_status || {}).slice(0, 4).map(([cat, status]) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{CATEGORY_ICONS[cat]} {cat}</span>
                    <span style={{ color: status.exceeded ? 'var(--accent-red)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(status.spent)} / {formatCurrency(status.budget)}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${Math.min(status.percentage, 100)}%`,
                      background: status.exceeded ? 'var(--accent-red)' : CATEGORY_COLORS[cat] || 'var(--accent-blue)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <PiggyBank size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p>No budget set for this month</p>
              <a href="/budget" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', marginTop: 6, display: 'block' }}>Set a budget →</a>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>AI Insights</div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'rgba(79,142,255,0.1)', padding: '3px 8px', borderRadius: 20 }}>
              <Zap size={11} /> Powered by ML
            </span>
          </div>
          {insights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.slice(0, 3).map((ins, i) => (
                <div key={i} className={`insight-card ${ins.type}`}>
                  <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{ins.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 2 }}>{ins.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{ins.message}</div>
                  </div>
                </div>
              ))}
              {insights.length > 3 && (
                <a href="/insights" style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', textAlign: 'center' }}>
                  View all {insights.length} insights →
                </a>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Zap size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p>Add transactions to get AI insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
