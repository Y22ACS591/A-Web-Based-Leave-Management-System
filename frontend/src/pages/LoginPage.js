import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { label: 'Admin', email: 'admin@college.edu', password: 'admin123', color: '#7c3aed' },
    { label: 'Principal', email: 'principal@college.edu', password: 'principal123', color: '#0891b2' },
    { label: 'HOD', email: 'hod.cse@college.edu', password: 'hod123', color: '#d97706' },
    { label: 'Faculty', email: 'faculty@college.edu', password: 'faculty123', color: '#16a34a' },
    { label: 'Student', email: 'student1@college.edu', password: 'student123', color: '#2563eb' },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">🎓</div>
          <h1>College Leave System</h1>
          <p>Sign in to manage your leave applications</p>
        </div>

        {error && <div className="alert alert-danger mb-4">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" required />
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><div className="spinner" /> Signing in...</> : '🔐 Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24 }}>
          {/* <p className="text-sm text-muted" style={{ marginBottom: 10, textAlign: 'center' }}>Quick Demo Login:</p> */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {demoLogins.map(d => (
              <button key={d.label} className="btn btn-sm" onClick={() => setForm({ email: d.email, password: d.password })}
                style={{ background: d.color + '15', color: d.color, border: `1px solid ${d.color}30`, borderRadius: 50 }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
        </p> */}
      </div>
    </div>
  );
}
