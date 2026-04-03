import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,142,255,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', margin: '0 auto 16px'
          }}>💰</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your Smart Money account
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: 44 }} required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}
              style={{ justifyContent: 'center', marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Create one</Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)',
          fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center'
        }}>
          Demo: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>srusti@example.com</span> / <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>password123</span>
        </div>
      </div>
    </div>
  );
}
