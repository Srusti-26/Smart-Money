import React, { useState, useEffect, useCallback } from 'react';
import api, { formatCurrency, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Filter, Sparkles, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

function TransactionModal({ tx, onClose, onSave }) {
  const [form, setForm] = useState(tx || {
    amount: '', category: 'Food', date: format(new Date(), 'yyyy-MM-dd'),
    description: '', type: 'expense', is_recurring: false
  });
  const [autoLoading, setAutoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const autoCategorize = async () => {
    if (!form.description) return;
    setAutoLoading(true);
    try {
      const res = await api.post('/ml/categorize', { description: form.description });
      setForm(f => ({ ...f, category: res.data.category }));
      toast.success(`Auto-categorized as ${res.data.category}`);
    } catch { toast.error('Auto-categorize failed'); }
    finally { setAutoLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tx?.id) {
        await api.put(`/transactions/${tx.id}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions/', form);
        toast.success('Transaction added');
      }
      onSave();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{tx?.id ? 'Edit' : 'Add'} Transaction</h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['expense', 'income'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className="btn"
                  style={{
                    flex: 1, justifyContent: 'center',
                    background: form.type === t ? (t === 'expense' ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,165,0.15)') : 'transparent',
                    border: `1px solid ${form.type === t ? (t === 'expense' ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,165,0.3)') : 'var(--border)'}`,
                    color: form.type === t ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'var(--text-muted)',
                  }}>
                  {t === 'expense' ? '📤 Expense' : '📥 Income'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" placeholder="0" value={form.amount} min="0" step="0.01"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="e.g. Zomato order, Netflix subscription..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={autoCategorize} disabled={autoLoading}
                title="Auto-categorize with AI" style={{ flexShrink: 0 }}>
                <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} />
                {autoLoading ? '...' : 'AI'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.is_recurring} style={{ width: 'auto' }}
                onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} />
              Recurring / Subscription
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary w-full" onClick={onClose} style={{ justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center' }}>
              {saving ? 'Saving...' : tx?.id ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '', category: '',
    month: format(new Date(), 'MM'),
    year: format(new Date(), 'yyyy')
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      const res = await api.get(`/transactions/?${params}`);
      setTransactions(res.data);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTransactions();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = transactions.filter(t =>
    !search || t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Track and manage all your financial activities</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card-sm" style={{ borderTop: '2px solid var(--accent-green)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>INCOME</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalIncome)}</div>
        </div>
        <div className="card-sm" style={{ borderTop: '2px solid var(--accent-red)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>EXPENSES</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalExpense)}</div>
        </div>
        <div className="card-sm" style={{ borderTop: '2px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>NET</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: totalIncome - totalExpense >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search transactions..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
          </div>
          <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} style={{ width: 'auto' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, '0');
              return <option key={m} value={m}>{format(new Date(2024, i), 'MMMM')}</option>;
            })}
          </select>
          <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} style={{ width: 'auto' }}>
            {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={{ width: 'auto' }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={{ width: 'auto' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchTransactions}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions found</div>
            <div style={{ fontSize: '0.85rem' }}>Add your first transaction to get started</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.9rem' }}>{tx.description || '—'}</span>
                        {tx.is_recurring && (
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(79,142,255,0.1)', color: 'var(--accent-blue)', borderRadius: 10 }}>🔄 Recurring</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                        borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        background: `${CATEGORY_COLORS[tx.category] || '#6b7280'}18`,
                        color: CATEGORY_COLORS[tx.category] || '#6b7280'
                      }}>
                        {CATEGORY_ICONS[tx.category]} {tx.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type === 'income' ? '↑' : '↓'} {tx.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditTx(tx); setShowModal(true); }}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(tx.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          tx={editTx}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchTransactions(); }}
        />
      )}
    </div>
  );
}
