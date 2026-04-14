import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingLeaves, updateLeaveStatus } from '../utils/api';
import toast from 'react-hot-toast';

export default function PendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLeave, setActionLeave] = useState(null);
  const [actionType, setActionType] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await getPendingLeaves();
      setLeaves(res.data.leaves);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async () => {
    setSubmitting(true);
    try {
      await updateLeaveStatus(actionLeave._id, { status: actionType, comment });
      toast.success(`Leave ${actionType} successfully`);
      setActionLeave(null);
      setComment('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-subtitle">{leaves.length} leave(s) awaiting your action</p>
      </div>

      {leaves.length === 0 ? (
        <div className="card empty-state">
          <div className="icon">✅</div>
          <h3>No pending approvals</h3>
          <p>All leave applications have been processed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {leaves.map(l => (
            <div key={l._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 15 }}>
                      {l.applicant?.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{l.applicant?.name}</div>
                      <div className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>{l.applicant?.role} · {l.applicant?.rollNo || l.applicant?.employeeId}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14 }}>
                    <span><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{l.leaveType}</span></span>
                    <span><strong>From:</strong> {new Date(l.fromDate).toLocaleDateString()}</span>
                    <span><strong>To:</strong> {new Date(l.toDate).toLocaleDateString()}</span>
                    <span><strong>Days:</strong> {l.numberOfDays}</span>
                    <span><strong>Applied:</strong> {new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 14 }}>
                    <strong>Reason:</strong> <span className="text-muted">{l.reason}</span>
                  </div>
                  {l.approvalChain?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      {l.approvalChain.map((a, i) => (
                        <span key={i} className={`badge badge-${a.status}`} style={{ textTransform: 'capitalize' }}>
                          {a.role}: {a.status}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => navigate(`/leaves/${l._id}`)}>View</button>
                  <button className="btn btn-sm btn-success" onClick={() => { setActionLeave(l); setActionType('approved'); }}>✓ Approve</button>
                  <button className="btn btn-sm btn-danger" onClick={() => { setActionLeave(l); setActionType('rejected'); }}>✗ Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionLeave && (
        <div className="modal-overlay" onClick={() => setActionLeave(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{actionType === 'approved' ? '✅ Approve' : '❌ Reject'} Leave</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setActionLeave(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
                You are about to <strong>{actionType}</strong> the {actionLeave.leaveType} leave application from <strong>{actionLeave.applicant?.name}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">Remarks {actionType === 'rejected' ? '(Required)' : '(Optional)'}</label>
                <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Add a comment or reason..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setActionLeave(null)}>Cancel</button>
              <button
                className={`btn ${actionType === 'approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleAction} disabled={submitting || (actionType === 'rejected' && !comment.trim())}>
                {submitting ? <><div className="spinner" /> Processing...</> : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
