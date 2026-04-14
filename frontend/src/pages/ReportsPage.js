import React, { useState, useEffect } from 'react';
import { getDashboardStats, getLeaveReport, getDepartments } from '../utils/api';
import toast from 'react-hot-toast';

const getBadge = (status) => <span className={`badge badge-${status}`}>{status}</span>;

export default function ReportsPage() {
  const [dashStats, setDashStats] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', department: '', role: '' });

  useEffect(() => {
    Promise.all([getDashboardStats(), getDepartments()])
      .then(([sRes, dRes]) => {
        setDashStats(sRes.data);
        setDepartments(dRes.data.departments);
      }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const loadLeaveReport = async () => {
    setReportLoading(true);
    try {
      const res = await getLeaveReport(filters);
      setLeaves(res.data.leaves);
    } catch { toast.error('Failed to load report'); }
    finally { setReportLoading(false); }
  };

  useEffect(() => { if (tab === 'leaves') loadLeaveReport(); }, [tab]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;

  const leavesByType = dashStats?.leavesByType || [];
  const totalLeaves = leavesByType.reduce((s, l) => s + l.count, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Institutional leave and attendance insights</p>
      </div>

      <div className="tabs">
        {['overview', 'leaves'].map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : '📋 Leave Report'}
          </button>
        ))}
      </div>

      {tab === 'overview' && dashStats && (
        <div>
          {/* Summary Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: dashStats.stats.totalUsers, icon: '👥', bg: '#f5f3ff', color: '#7c3aed' },
              { label: 'Total Students', value: dashStats.stats.students, icon: '🎓', bg: '#eff6ff', color: '#2563eb' },
              { label: 'Total Faculty', value: dashStats.stats.faculty, icon: '👨‍🏫', bg: '#ecfeff', color: '#0891b2' },
              { label: 'Total Leaves', value: dashStats.stats.totalLeaves, icon: '📋', bg: '#fafaf9', color: '#57534e' },
              { label: 'Approved', value: dashStats.stats.approvedLeaves, icon: '✅', bg: '#f0fdf4', color: '#16a34a' },
              { label: 'Pending', value: dashStats.stats.pendingLeaves, icon: '⏳', bg: '#fffbeb', color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                <div><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Leaves by Type */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Leave Applications by Type</div>
              {leavesByType.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}><p>No data yet</p></div>
              ) : leavesByType.map(item => {
                const pct = totalLeaves > 0 ? (item.count / totalLeaves * 100).toFixed(0) : 0;
                const colors = { casual: '#d97706', medical: '#dc2626', earned: '#16a34a', emergency: '#7c3aed', maternity: '#0891b2', other: '#64748b' };
                const color = colors[item._id] || '#64748b';
                return (
                  <div key={item._id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{item._id} Leave</span>
                      <span style={{ fontSize: 13, color }}>{item.count} ({pct}%)</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly Trend */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Monthly Leave Trend</div>
              {dashStats.monthlyLeaves?.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}><p>No data yet</p></div>
              ) : (
                <div>
                  {dashStats.monthlyLeaves?.slice(-6).map((m, i) => {
                    const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    const maxCount = Math.max(...dashStats.monthlyLeaves.map(x => x.count), 1);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, width: 32, color: 'var(--text-secondary)' }}>{monthNames[m._id.month]}</span>
                        <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 50, height: 20, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 50, width: `${(m.count / maxCount) * 100}%`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
                            <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>{m.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <input className="form-control" type="date" name="fromDate" value={filters.fromDate} onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))} />
              <input className="form-control" type="date" name="toDate" value={filters.toDate} onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))} />
              <select className="form-control" value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <select className="form-control" value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
                <option value="">All Roles</option>
                {['student','faculty','hod','principal'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn btn-primary" onClick={loadLeaveReport} disabled={reportLoading}>
                {reportLoading ? 'Loading...' : '🔍 Generate Report'}
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Leave Report — {leaves.length} records</strong>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Applied</th></tr>
                </thead>
                <tbody>
                  {reportLoading ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></td></tr>
                  ) : leaves.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Click "Generate Report" to load data</td></tr>
                  ) : leaves.map(l => (
                    <tr key={l._id}>
                      <td><strong>{l.applicant?.name}</strong><br /><span className="text-xs text-muted">{l.applicant?.rollNo || l.applicant?.employeeId}</span></td>
                      <td style={{ textTransform: 'capitalize' }} className="text-sm">{l.applicant?.role}</td>
                      <td style={{ textTransform: 'capitalize' }}>{l.leaveType}</td>
                      <td className="text-sm">{new Date(l.fromDate).toLocaleDateString()}</td>
                      <td className="text-sm">{new Date(l.toDate).toLocaleDateString()}</td>
                      <td><strong>{l.numberOfDays}</strong></td>
                      <td>{getBadge(l.status)}</td>
                      <td className="text-sm text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
