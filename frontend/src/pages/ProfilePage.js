import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords don't match");
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPw(true);
    try {
      await changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChangingPw(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const roleColors = { student: '#2563eb', faculty: '#16a34a', hod: '#d97706', principal: '#7c3aed', admin: '#dc2626' };
  const roleColor = roleColors[user?.role] || '#64748b';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Profile Card */}
        <div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: roleColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, margin: '0 auto 16px' }}>
              {initials}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
            <span className="badge badge-info" style={{ textTransform: 'capitalize', marginTop: 8, background: roleColor + '15', color: roleColor }}>{user?.role}</span>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['📧', user?.email],
                ['📱', user?.phone || 'Not set'],
                ['🏛️', user?.department?.name || 'N/A'],
                ['🆔', user?.rollNo || user?.employeeId || 'N/A'],
              ].map(([icon, val]) => (
                <div key={icon} style={{ padding: '10px', background: 'var(--bg)', borderRadius: 8, fontSize: 13 }}>
                  <span>{icon} </span><span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Balance */}
          {user?.leaveBalance && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Leave Balance</div>
              {Object.entries(user.leaveBalance).map(([type, val]) => {
                const max = { casual: 12, medical: 6, earned: 15 }[type] || 12;
                const colors = { casual: '#d97706', medical: '#dc2626', earned: '#16a34a' };
                return (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{type} Leave</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: colors[type] }}>{val} / {max} days</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${(val / max) * 100}%`, background: colors[type] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Forms */}
        <div className="card">
          <div className="tabs">
            <button className={`tab${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>Edit Profile</button>
            <button className={`tab${tab === 'password' ? ' active' : ''}`} onClick={() => setTab('password')}>Change Password</button>
          </div>

          {tab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" value={user?.email} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Your phone number" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input className="form-control" value={user?.role} disabled style={{ textTransform: 'capitalize' }} />
              </div>
              {user?.department && (
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" value={user?.department?.name} disabled />
                </div>
              )}
              <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
                {saving ? <><div className="spinner" /> Saving...</> : '💾 Save Changes'}
              </button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-control" type="password" value={pwForm.oldPassword} onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))} required placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-control" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-control" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required placeholder="Repeat new password" />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={changingPw}>
                {changingPw ? <><div className="spinner" /> Changing...</> : '🔐 Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
