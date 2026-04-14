import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyLeaves, cancelLeave } from '../utils/api';
import toast from 'react-hot-toast';

const getBadge = (status) => <span className={`badge badge-${status}`}>{status}</span>;

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await getMyLeaves();
      setLeaves(res.data.leaves);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave application?')) return;
    try {
      await cancelLeave(id);
      toast.success('Leave cancelled');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">My Leave Applications</h1>
          <p className="page-subtitle">Track all your leave requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/apply-leave')}>+ Apply Leave</button>
      </div>

      <div className="tabs">
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
          <button key={s} className={`tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'pending' && leaves.filter(l => l.status === 'pending').length > 0 &&
              <span style={{ marginLeft: 6, background: '#d97706', color: 'white', borderRadius: 50, padding: '1px 7px', fontSize: 10 }}>{leaves.filter(l => l.status === 'pending').length}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="icon">📋</div>
          <h3>No {filter !== 'all' ? filter : ''} leave applications</h3>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/apply-leave')}>Apply for Leave</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Applied On</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l._id}>
                    <td><span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l.leaveType}</span></td>
                    <td>{new Date(l.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(l.toDate).toLocaleDateString()}</td>
                    <td><strong>{l.numberOfDays}</strong></td>
                    <td style={{ maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</span></td>
                    <td>{getBadge(l.status)}</td>
                    <td className="text-muted text-sm">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/leaves/${l._id}`)}>View</button>
                        {l.status === 'pending' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleCancel(l._id)}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
