import React, { useState, useEffect } from 'react';
import api, { formatCurrency, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/api';
import toast from 'react-hot-toast';
import { PiggyBank, Save, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export default function Budget() {
  const [budget, setBudget] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ total_budget: '', category_budgets: {} });
  const [month, setMonth] = useState(format(new Date(), 'MM'));
  const [year, setYear] = useState(format(new Date(), 'yyyy'));

  const BUDGET_CATS = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education'];

  useEffect(() => {
    fetchBudget();
  }, [month, year]);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get(`/budget/?month=${month}&year=${year}`),
        api.get(`/budget/status?month=${month}&year=${year}`)
      ]);
      setBudget(bRes.data);
      setStatus(sRes.data);
      if (bRes.data) {
        setForm({
          total_budget: bRes.data.total_budget,
          category_budgets: bRes.data.category_budgets || {}
        });
      }
    } catch { toast.error('Failed to load budget'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/budget/', { ...form, month, year, total_budget: Number(form.total_budget) });
      toast.success('Budget saved!');
      fetchBudget();
    } catch { toast.error('Failed to save budget'); }
    finally { setSaving(false); }
  };

  const setCatBudget = (cat, val) => {
    setForm(f => ({ ...f, category_budgets: { ...f.category_budgets, [cat]: Number(val) || 0 } }));
  };

  const catTotal = Object.values(form.category_budgets).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Budget Planner</h1>
          <p className="page-subtitle">Set and track your monthly spending limits</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={month} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, '0');
              return <option key={m} value={m}>{format(new Date(2024, i), 'MMMM')}</option>;
            })}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} style={{ width: 'auto' }}>
            {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Budget Alert */}
      {status?.exceeded && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
          borderRadius: 'var(--radius-sm)', marginBottom: 20,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <AlertTriangle size={20} color="var(--accent-red)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--accent-red)' }}>⚠️ Budget Exceeded!</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              You've overspent by {formatCurrency(status.total_spent - status.total_budget)} ({status.percentage}% of budget used)
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Set Budget Form */}
        <div className="card">
          <div className="section-title">Set Monthly Budget</div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Total Monthly Budget (₹)</label>
              <input type="number" placeholder="e.g. 45000" value={form.total_budget}
                onChange={e => setForm(f => ({ ...f, total_budget: e.target.value }))} required />
              {catTotal > 0 && Number(form.total_budget) > 0 && (
                <div style={{ fontSize: '0.75rem', marginTop: 6, color: catTotal > Number(form.total_budget) ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  Category budgets sum: {formatCurrency(catTotal)} / {formatCurrency(Number(form.total_budget))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Category Budgets (optional)
              </div>
              {BUDGET_CATS.map(cat => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: '0.85rem', width: 130, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </span>
                  <input type="number" placeholder="0" min="0"
                    value={form.category_budgets[cat] || ''}
                    onChange={e => setCatBudget(cat, e.target.value)}
                    style={{ padding: '7px 12px', fontSize: '0.85rem' }} />
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center' }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </form>
        </div>

        {/* Budget Status */}
        <div className="card">
          <div className="section-title">Spending vs Budget</div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading...</div>
          ) : status?.total_budget ? (
            <>
              {/* Overall */}
              <div style={{
                padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>TOTAL SPENT</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: status.exceeded ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                      {formatCurrency(status.total_spent)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>BUDGET</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatCurrency(status.total_budget)}</div>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 10, marginBottom: 8 }}>
                  <div className="progress-fill" style={{
                    width: `${Math.min(status.percentage, 100)}%`,
                    background: status.exceeded ? 'var(--accent-red)' : status.percentage > 75 ? 'var(--accent-amber)' : 'var(--accent-green)'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{status.percentage}% used</span>
                  <span style={{ color: status.exceeded ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 600 }}>
                    {status.exceeded ? `Over by ${formatCurrency(status.total_spent - status.total_budget)}` : `${formatCurrency(status.remaining)} remaining`}
                  </span>
                </div>
              </div>

              {/* Category breakdown */}
              {Object.entries(status.category_status || {}).map(([cat, s]) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{CATEGORY_ICONS[cat]} {cat}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {s.exceeded && <AlertTriangle size={12} color="var(--accent-red)" />}
                      <span style={{ fontFamily: 'var(--font-mono)', color: s.exceeded ? 'var(--accent-red)' : 'var(--text-primary)', fontWeight: 600 }}>
                        {formatCurrency(s.spent)} / {formatCurrency(s.budget)}
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{
                      width: `${Math.min(s.percentage, 100)}%`,
                      background: s.exceeded ? 'var(--accent-red)' : CATEGORY_COLORS[cat] || 'var(--accent-blue)'
                    }} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <PiggyBank size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No budget set</p>
              <p style={{ fontSize: '0.85rem' }}>Set a budget on the left to start tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Class Mode Card */}
      <div className="card" style={{ marginTop: 20, background: 'rgba(79,142,255,0.04)', border: '1px solid rgba(79,142,255,0.15)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>🏠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--accent-blue)' }}>Middle-Class Smart Budget Tips</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { icon: '📊', tip: 'Follow 50/30/20 rule: 50% needs, 30% wants, 20% savings' },
                { icon: '💳', tip: 'Track EMIs — keep total EMIs under 40% of income' },
                { icon: '🛡️', tip: 'Emergency fund = 6 months of expenses' },
                { icon: '🍽️', tip: 'Reduce food spending by 20% to save ₹2,000+/month' },
              ].map((item, i) => (
                <div key={i} style={{ flex: '1 1 220px', display: 'flex', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>{item.icon}</span><span>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
