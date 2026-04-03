import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', salary: '', risk_level: 'medium', currency: 'INR' });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ ...form, salary: Number(form.salary) || 0 });
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        top: '30%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', margin: '0 auto 16px'
          }}>💰</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Start your AI-powered financial journey
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input placeholder="Srusti" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monthly Salary (₹)</label>
                <input type="number" placeholder="60000" value={form.salary}
                  onChange={e => setForm({ ...form, salary: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Risk Level</label>
                <select value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}>
                  <option value="low">Low (Safe)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Aggressive)</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
