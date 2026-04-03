import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, Target, PiggyBank,
  Lightbulb, TrendingUp, LogOut, Menu, X, ChevronRight, User
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/budget', label: 'Budget', icon: PiggyBank },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/insights', label: 'AI Insights', icon: Lightbulb },
  { path: '/investments', label: 'Investments', icon: TrendingUp },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNav = (path) => { navigate(path); setSidebarOpen(false); };

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', padding: '0 4px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0
          }}>💰</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Smart Money</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Financial Advisor</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1 }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <div key={path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => handleNav(path)}>
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{
          marginTop: 'auto',
          padding: '14px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gradient-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, flexShrink: 0
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm w-full" onClick={logout} style={{ justifyContent: 'center' }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="btn btn-secondary btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span style={{ fontWeight: 700 }}>Smart Money</span>
          <div style={{ width: 36 }} />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
