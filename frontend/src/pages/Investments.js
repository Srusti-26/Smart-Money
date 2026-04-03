import React, { useState, useEffect } from 'react';
import api, { formatCurrency } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { TrendingUp, Shield, Zap, Save } from 'lucide-react';

const RISK_COLORS = {
  safe: { bg: 'rgba(34,211,165,0.08)', border: 'rgba(34,211,165,0.2)', color: '#22d3a5', label: 'Low Risk' },
  moderate: { bg: 'rgba(79,142,255,0.08)', border: 'rgba(79,142,255,0.2)', color: '#4f8eff', label: 'Medium Risk' },
  aggressive: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', label: 'High Risk' },
};

const RISK_ICONS = { safe: '🛡️', moderate: '⚖️', aggressive: '🚀' };

export default function Investments() {
  const { user, updateProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskLevel, setRiskLevel] = useState(user?.risk_level || 'medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRiskLevel(user?.risk_level || 'medium');
  }, [user]);

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/investments');
      setData(res.data);
    } catch { toast.error('Failed to load investment suggestions'); }
    finally { setLoading(false); }
  };

  const handleRiskUpdate = async () => {
    setSaving(true);
    try {
      await updateProfile({ risk_level: riskLevel });
      await fetchSuggestions();
      toast.success('Risk profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="page-title">Investment Advisor</h1>
      <p className="page-subtitle">Personalized investment suggestions based on your savings & risk profile</p>

      {/* Monthly Savings Banner */}
      {data && (
        <div style={{
          padding: '20px 24px', borderRadius: 'var(--radius)', marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(79,142,255,0.1), rgba(139,92,246,0.1))',
          border: '1px solid rgba(79,142,255,0.2)', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Monthly Savings
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: data.monthly_savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {formatCurrency(data.monthly_savings)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.monthly_savings > 0
                ? `Great! You have ${formatCurrency(data.monthly_savings)} to invest each month. Here's how we suggest allocating it:`
                : `Your expenses exceed your income. Focus on reducing expenses before investing.`}
            </div>
          </div>
        </div>
      )}

      {/* Risk Level Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Your Risk Profile</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { value: 'low', label: 'Conservative', desc: 'Capital preservation, steady returns', icon: '🛡️' },
            { value: 'medium', label: 'Balanced', desc: 'Mix of safety and growth', icon: '⚖️' },
            { value: 'high', label: 'Aggressive', desc: 'Maximum growth, higher risk', icon: '🚀' },
          ].map(option => (
            <div key={option.value}
              onClick={() => setRiskLevel(option.value)}
              style={{
                flex: '1 1 180px', padding: '16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: `2px solid ${riskLevel === option.value ? 'var(--accent-blue)' : 'var(--border)'}`,
                background: riskLevel === option.value ? 'rgba(79,142,255,0.08)' : 'transparent',
                transition: 'all 0.2s'
              }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{option.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>{option.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{option.desc}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={handleRiskUpdate} disabled={saving}>
          <Save size={14} /> {saving ? 'Updating...' : 'Update Risk Profile'}
        </button>
      </div>

      {/* Investment Suggestions */}
      <div className="section-title">Recommended Allocation</div>
      {loading ? (
        <div className="grid-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {(data?.suggestions || []).map((item, i) => {
            const style = RISK_COLORS[item.type] || RISK_COLORS.moderate;
            return (
              <div key={i} className="card" style={{ borderLeft: `3px solid ${style.color}`, background: style.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: '1.5rem' }}>{RISK_ICONS[item.type] || '📊'}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ALLOCATION</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: style.color }}>{item.allocation}%</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.95rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{item.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 10, background: `${style.color}20`, color: style.color, fontWeight: 600 }}>
                    {style.label}
                  </span>
                  {item.amount > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: style.color }}>
                      {formatCurrency(item.amount)}/mo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Indian Market Tips */}
      <div className="card" style={{ background: 'rgba(34,211,165,0.03)', border: '1px solid rgba(34,211,165,0.12)' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
          <TrendingUp size={18} color="var(--accent-green)" />
          <div className="section-title" style={{ marginBottom: 0, color: 'var(--accent-green)' }}>Indian Market Investment Guide</div>
        </div>
        <div className="grid-3" style={{ gap: 12 }}>
          {[
            { icon: '📈', title: 'SIP in Mutual Funds', tips: ['Start with ₹500/month', 'Nifty 50 index funds for beginners', 'Use Groww, Zerodha, or Paytm Money'] },
            { icon: '🏦', title: 'Tax Saving (80C)', tips: ['ELSS Funds — best returns + tax benefit', 'PPF — safe, 15-year lock-in', 'NPS — retirement + extra 50k deduction'] },
            { icon: '🥇', title: 'Emergency First', tips: ['Keep 6 months expenses liquid', 'Liquid funds or savings account', 'Never invest emergency fund'] },
          ].map((section, i) => (
            <div key={i} style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{section.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>{section.title}</div>
              {section.tips.map((tip, j) => (
                <div key={j} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>•</span> {tip}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
