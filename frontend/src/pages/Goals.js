import React, { useState, useEffect } from 'react';
import api, { formatCurrency } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Target, X } from 'lucide-react';

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState(goal || { name: '', target_amount: '', current_amount: '', deadline_months: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (goal?.id) {
        await api.put(`/goals/${goal.id}`, form);
        toast.success('Goal updated!');
      } else {
        await api.post('/goals/', form);
        toast.success('Goal created!');
      }
      onSave();
    } catch { toast.error('Failed to save goal'); }
    finally { setSaving(false); }
  };

  const remaining = Number(form.target_amount) - Number(form.current_amount || 0);
  const monthly = form.deadline_months ? Math.ceil(remaining / Number(form.deadline_months)) : 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{goal?.id ? 'Edit' : 'New'} Financial Goal</h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input placeholder="e.g. Emergency Fund, Europe Trip..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input type="number" placeholder="100000" value={form.target_amount}
                onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Current Savings (₹)</label>
              <input type="number" placeholder="0" value={form.current_amount}
                onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Timeline (months)</label>
              <input type="number" placeholder="12" value={form.deadline_months}
                onChange={e => setForm(f => ({ ...f, deadline_months: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          {monthly > 0 && (
            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(79,142,255,0.08)', border: '1px solid rgba(79,142,255,0.15)', marginBottom: 16, fontSize: '0.85rem' }}>
              💡 You need to save <strong style={{ color: 'var(--accent-blue)' }}>{formatCurrency(monthly)}/month</strong> to reach this goal
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary w-full" onClick={onClose} style={{ justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center' }}>
              {saving ? 'Saving...' : goal?.id ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PRIORITY_COLOR = { high: 'var(--accent-red)', medium: 'var(--accent-amber)', low: 'var(--accent-green)' };
const PRIORITY_ICON = { high: '🔴', medium: '🟡', low: '🟢' };
const GOAL_EMOJIS = ['🏠', '✈️', '💻', '🚗', '📚', '💍', '🏖️', '🛡️', '🏆', '💰'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals/');
      setGoals(res.data);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      fetchGoals();
    } catch { toast.error('Failed to delete'); }
  };

  const totalNeeded = goals.reduce((s, g) => s + (g.monthly_savings_needed || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Financial Goals</h1>
          <p className="page-subtitle">Plan and track your savings goals</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditGoal(null); setShowModal(true); }}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {goals.length > 0 && (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 20,
          background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)',
          display: 'flex', gap: 24, alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>TOTAL GOALS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{goals.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>MONTHLY SAVINGS NEEDED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{formatCurrency(totalNeeded)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>TOTAL TARGET</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(goals.reduce((s, g) => s + g.target_amount, 0))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 220 }} />)}
        </div>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No goals yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>Create your first financial goal and start working towards it</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {goals.map((goal, idx) => {
            const progress = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
            const remaining = goal.target_amount - goal.current_amount;
            const emoji = GOAL_EMOJIS[idx % GOAL_EMOJIS.length];

            return (
              <div key={goal.id} className="card" style={{ borderTop: `3px solid ${PRIORITY_COLOR[goal.priority]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, fontSize: '1.4rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--bg-secondary)'
                    }}>{emoji}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{goal.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {PRIORITY_ICON[goal.priority]} {goal.priority} priority
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditGoal(goal); setShowModal(true); }}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(goal.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                    <span style={{ fontWeight: 600, color: progress === 100 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{
                      width: `${progress}%`,
                      background: progress === 100 ? 'var(--gradient-green)' : 'var(--gradient-blue)'
                    }} />
                  </div>
                </div>

                {/* Amounts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>SAVED</div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', fontSize: '0.95rem' }}>{formatCurrency(goal.current_amount)}</div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>TARGET</div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{formatCurrency(goal.target_amount)}</div>
                  </div>
                </div>

                {/* Monthly savings */}
                <div style={{ padding: '10px 14px', background: 'rgba(79,142,255,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,255,0.12)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                    Save {formatCurrency(goal.monthly_savings_needed)}/mo for {goal.deadline_months} months
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Remaining: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(remaining)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <GoalModal
          goal={editGoal}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchGoals(); }}
        />
      )}
    </div>
  );
}
