import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaveStats, getDashboardStats, getMyLeaves, getPendingLeaves } from '../utils/api';

const StatCard = ({ icon, label, value, bg, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}><span>{icon}</span></div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const getBadge = (status) => <span className={`badge badge-${status}`}>{status}</span>;

export default function Dashboard() {
  const { user,logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
  logout();          // clears authentication
  navigate('/login'); // redirect to login page
};
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const statsRes = await getLeaveStats();
        setStats(statsRes.data.stats);

        if (['admin', 'principal', 'hod'].includes(user.role)) {
          const adminRes = await getDashboardStats();
          setAdminStats(adminRes.data);
        }

        if (['faculty', 'hod', 'principal', 'admin'].includes(user.role)) {
          const pendRes = await getPendingLeaves();
          setPendingCount(pendRes.data.leaves.length);
        }

        const leavesRes = await getMyLeaves();
        setRecentLeaves(leavesRes.data.leaves.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      

      {/* Leave Balance */}
      {stats && user?.role === 'student' && (
  <div className="stats-grid">
    <StatCard icon="📋" label="Total Leaves" value={stats.totalApplied} bg="#eff6ff" color="#2563eb" />
    <StatCard icon="⏳" label="Pending" value={stats.pending} bg="#fffbeb" color="#d97706" />
    <StatCard icon="✅" label="Approved" value={stats.approved} bg="#f0fdf4" color="#16a34a" />
    <StatCard icon="❌" label="Rejected" value={stats.rejected} bg="#fef2f2" color="#dc2626" />
  </div>
)}

{stats && user?.role !== 'student' && (
  <div className="stats-grid">
    <StatCard icon="🟡" label="Casual Leave" value={stats.leaveBalance?.casual ?? 0} bg="#fffbeb" color="#d97706" />
    <StatCard icon="🔴" label="Medical Leave" value={stats.leaveBalance?.medical ?? 0} bg="#fef2f2" color="#dc2626" />
    <StatCard icon="🔵" label="OD Leave" value={stats.leaveBalance?.od ?? 0} bg="#eff6ff" color="#2563eb" />
    <StatCard icon="⏳" label="Pending" value={stats.pending} bg="#fdf4ff" color="#9333ea" />
    <StatCard icon="✅" label="Approved" value={stats.approved} bg="#f0fdf4" color="#16a34a" />
    <StatCard icon="❌" label="Rejected" value={stats.rejected} bg="#fef2f2" color="#dc2626" />
  </div>
)}

      {/* Admin/HOD/Principal Stats */}
      {adminStats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard icon="👥" label="Total Users" value={adminStats.stats.totalUsers} bg="#f5f3ff" color="#7c3aed" />
          <StatCard icon="🎓" label="Students" value={adminStats.stats.students} bg="#eff6ff" color="#2563eb" />
          <StatCard icon="👨‍🏫" label="Faculty" value={adminStats.stats.faculty} bg="#ecfeff" color="#0891b2" />
          <StatCard icon="⏳" label="Pending Approvals" value={adminStats.stats.pendingLeaves} bg="#fffbeb" color="#d97706" />
        </div>
      )}

      <div className="grid-2">
        {/* Recent Leaves */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">My Recent Leaves</div>
              <div className="card-subtitle">Last 5 applications</div>
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/my-leaves')}>View All</button>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="icon">📋</div>
              <p>No leave applications yet</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/apply-leave')}>Apply Now</button>
            </div>
          ) : (
            <div>
              {recentLeaves.map(l => (
                <div key={l._id} onClick={() => navigate(`/leaves/${l._id}`)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{l.leaveType} Leave</div>
                    <div className="text-sm text-muted">{new Date(l.fromDate).toLocaleDateString()} – {new Date(l.toDate).toLocaleDateString()}</div>
                  </div>
                  {getBadge(l.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {user.role !== 'admin' && (
              <button className="btn btn-primary" onClick={() => navigate('/apply-leave')} style={{ justifyContent: 'flex-start', padding: '14px 18px' }}>
                📝 Apply for Leave
              </button>
            )}
            <button className="btn btn-outline" onClick={() => navigate('/my-leaves')} style={{ justifyContent: 'flex-start', padding: '14px 18px' }}>
              📋 View My Applications
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/attendance')} style={{ justifyContent: 'flex-start', padding: '14px 18px' }}>
              ✅ View Attendance
            </button>
            {['faculty', 'hod', 'principal', 'admin'].includes(user.role) && (
              <button className="btn" onClick={() => navigate('/pending-leaves')}
                style={{ justifyContent: 'flex-start', padding: '14px 18px', background: '#fffbeb', color: '#d97706', border: '1.5px solid #fde68a' }}>
                ⏳ Pending Approvals {pendingCount > 0 && <span style={{ background: '#d97706', color: 'white', borderRadius: 50, padding: '2px 8px', fontSize: 11, marginLeft: 4 }}>{pendingCount}</span>}
              </button>
            )}
            {['admin', 'principal', 'hod'].includes(user.role) && (
              <button className="btn btn-outline" onClick={() => navigate('/reports')} style={{ justifyContent: 'flex-start', padding: '14px 18px' }}>
                📈 View Reports
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
