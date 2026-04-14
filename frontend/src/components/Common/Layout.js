import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAllRead } from '../../utils/api';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['student','faculty','hod','principal','admin'] },
  { path: '/apply-leave', icon: '📝', label: 'Apply Leave', roles: ['student','faculty','hod','principal'] },
  { path: '/my-leaves', icon: '📋', label: 'My Leaves', roles: ['student','faculty','hod','principal'] },
  { path: '/pending-leaves', icon: '⏳', label: 'Pending Approvals', roles: ['faculty','hod','principal','admin'] },
  { path: '/all-leaves', icon: '📁', label: 'All Leaves', roles: ['admin','principal','hod'] },
  { path: '/attendance', icon: '✅', label: 'Attendance', roles: ['student','faculty','hod','admin'] },
  { path: '/users', icon: '👥', label: 'Users', roles: ['admin','principal','hod'] },
  { path: '/departments', icon: '🏛️', label: 'Departments', roles: ['admin'] },
  { path: '/reports', icon: '📈', label: 'Reports', roles: ['admin','principal','hod'] },
  { path: '/profile', icon: '👤', label: 'Profile', roles: ['student','faculty','hod','principal','admin'] },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/apply-leave': 'Apply for Leave',
  '/my-leaves': 'My Leave Applications',
  '/pending-leaves': 'Pending Approvals',
  '/all-leaves': 'All Leave Applications',
  '/attendance': 'Attendance',
  '/users': 'User Management',
  '/departments': 'Departments',
  '/reports': 'Reports & Analytics',
  '/profile': 'My Profile',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const pageTitle = Object.entries(pageTitles).find(([k]) => currentPath.startsWith(k))?.[1] || 'Dashboard';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const filtered = navItems.filter(item => item.roles.includes(user?.role));

  const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);

useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  };
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 30000); // every 30 seconds
  return () => clearInterval(interval);
}, []);

const handleBellClick = async () => {
  setShowNotifications(!showNotifications);
  if (unreadCount > 0) {
    await markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }
};

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
          <h2>College Leave<br />Management</h2>
          <span>System</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {filtered.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => { logout(); navigate('/login'); }} style={{ color: '#f87171' }}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-right">
            <div style={{ position: 'relative' }}>
  <button onClick={handleBellClick} style={{
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 20, position: 'relative', padding: '4px 8px'
  }}>
    🔔
    {unreadCount > 0 && (
      <span style={{
        position: 'absolute', top: 0, right: 0,
        background: '#dc2626', color: 'white',
        borderRadius: '50%', width: 16, height: 16,
        fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{unreadCount}</span>
    )}
  </button>

  {showNotifications && (
    <div style={{
      position: 'absolute', right: 0, top: 40,
      width: 320, background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 12,
      boxShadow: 'var(--shadow-md)', zIndex: 200,
      maxHeight: 400, overflowY: 'auto'
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
        Notifications
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No notifications yet
        </div>
      ) : notifications.map(n => (
        <div key={n._id} onClick={() => { navigate(`/leaves/${n.leaveId}`); setShowNotifications(false); }}
          style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            cursor: 'pointer', fontSize: 13,
            background: n.isRead ? 'transparent' : 'var(--primary-light)',
            transition: 'background 0.2s'
          }}>
          <div style={{ marginBottom: 4 }}>{n.message}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(n.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
            <div className="user-badge" onClick={() => navigate('/profile')}>
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
