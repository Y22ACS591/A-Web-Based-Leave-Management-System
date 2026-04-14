import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyLeave } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ApplyLeave() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    leaveType: user?.role === 'student' ? 'medical' : 'casual', fromDate: '', toDate: '', reason: '',
    isHalfDay: false, halfDayType: 'morning', emergencyContact: '', substituteName: ''
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const calcDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    if (form.isHalfDay) return 0.5;
    const diff = Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async e => {
  e.preventDefault();
  setError('');
  if (new Date(form.toDate) < new Date(form.fromDate)) {
    return setError('End date must be after start date');
  }
  setLoading(true);
  try {
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    if (documentFile) formData.append('document', documentFile);
    await applyLeave(formData);
    toast.success('Leave application submitted successfully!');
    navigate('/my-leaves');
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to submit leave application');
  } finally {
    setLoading(false);
  }
};

  const balance = user?.leaveBalance;
  const days = calcDays();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-subtitle">Fill in the form below to submit your leave application</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          {error && <div className="alert alert-danger mb-4">⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select className="form-control" name="leaveType" value={form.leaveType} onChange={handleChange} required>
                {user?.role === 'student' ? (
  <>
    <option value="medical">Medical Leave</option>
    <option value="od">Attending to (Workshop / Hackathon / Sports / Quiz)</option>
  </>
) : (
  <>
    <option value="casual">Casual Leave</option>
    <option value="medical">Medical Leave</option>
    <option value="od">OD Leave (On Duty)</option>
  </>
)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" name="isHalfDay" checked={form.isHalfDay} onChange={handleChange} />
                Half Day Leave
              </label>
            </div>

            {form.isHalfDay && (
              <div className="form-group">
                <label className="form-label">Half Day Type</label>
                <select className="form-control" name="halfDayType" value={form.halfDayType} onChange={handleChange}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">From Date *</label>
                <input className="form-control" type="date" name="fromDate" value={form.fromDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="form-group">
                <label className="form-label">To Date *</label>
                <input className="form-control" type="date" name="toDate" value={form.toDate} onChange={handleChange} min={form.fromDate} required disabled={form.isHalfDay} />
              </div>
            </div>

            {days > 0 && (
              <div style={{ background: 'var(--primary-light)', border: '1px solid var(--border-focus)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>
                📅 Duration: {days} day(s)
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-control" name="reason" value={form.reason} onChange={handleChange} rows={4} placeholder="Provide a detailed reason for your leave..." required style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group">
  <label className="form-label">
    Upload Document
    {form.leaveType === 'medical' && <span style={{ color: '#dc2626' }}> (required)</span>}
    {form.leaveType === 'od' && <span style={{ color: '#2563eb' }}> (letter / invitation)</span>}
  </label>
  <input
    className="form-control"
    type="file"
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={e => setDocumentFile(e.target.files[0])}
  />
  {documentFile && (
    <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
      ✅ {documentFile.name} selected
    </div>
  )}
  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
    Accepted: PDF, JPG, PNG (max 5MB)
  </div>
</div>

            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input className="form-control" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Contact number during leave" />
            </div>

            {['faculty', 'hod'].includes(user?.role) && (
              <div className="form-group">
                <label className="form-label">Substitute Arranged (if any)</label>
                <input className="form-control" name="substituteName" value={form.substituteName} onChange={handleChange} placeholder="Name of substitute faculty" />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <><div className="spinner" /> Submitting...</> : '📤 Submit Application'}
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/my-leaves')}>Cancel</button>
            </div>
          </form>
        </div>

        {/* Leave Balance Info */}
        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">Leave Balance</div></div>
            {(user?.role === 'student' ? ['medical'] : ['casual', 'medical', 'earned']).map(type => (
              <div key={type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{type} Leave</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{balance?.[type] ?? 0} days left</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{
                    width: `${(balance?.[type] / (type === 'casual' ? 12 : type === 'medical' ? 6 : 15)) * 100}%`,
                    background: type === 'casual' ? '#d97706' : type === 'medical' ? '#dc2626' : '#16a34a'
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>📋 Guidelines</div>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 2 }}>
              <li>Apply at least 1 day in advance for planned leaves</li>
              <li>Medical leaves require a doctor's certificate</li>
              <li>Emergency leaves can be applied retrospectively</li>
              <li>Leave approval follows: Faculty → HOD → Principal</li>
              <li>You'll receive email notifications on status updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
