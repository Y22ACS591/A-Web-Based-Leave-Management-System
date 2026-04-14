import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeaveById, updateLeaveStatus } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const getBadge = (status) => <span className={`badge badge-${status}`}>{status}</span>;

export default function LeaveDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAction, setShowAction] = useState(false);
  const [actionType, setActionType] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await getLeaveById(id);
      setLeave(res.data.leave);
    } catch { toast.error('Failed to load leave details'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async () => {
    setSubmitting(true);
    try {
      await updateLeaveStatus(id, { status: actionType, comment });
      toast.success(`Leave ${actionType}`);
      setShowAction(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setSubmitting(false); }
  };

  const canApprove = ['faculty', 'hod', 'principal', 'admin'].includes(user?.role)
    && leave?.status === 'pending'
    && leave?.approvalChain?.some(a => a.role === user?.role && a.status === 'pending');

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;
  if (!leave) return <div className="card empty-state"><h3>Leave not found</h3></div>;

  return (
    <div>
      <div className="page-header flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1 className="page-title">Leave Application Details</h1>
          <p className="page-subtitle">Application ID: {leave._id}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Applicant Information</div>
              {getBadge(leave.status)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 20, borderRadius: 14 }}>
                {leave.applicant?.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{leave.applicant?.name}</div>
                <div className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>{leave.applicant?.role}</div>
                <div className="text-sm text-muted">{leave.applicant?.email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Roll/Employee ID', leave.applicant?.rollNo || leave.applicant?.employeeId || 'N/A'],
                ['Department', leave.department?.name || 'N/A'],
                ['Phone', leave.applicant?.phone || 'N/A'],
                ['Applied On', new Date(leave.createdAt).toLocaleDateString()],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Leave Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Leave Type', leave.leaveType],
                ['Duration', `${leave.numberOfDays} day(s)`],
                ['From', new Date(leave.fromDate).toLocaleDateString()],
                ['To', new Date(leave.toDate).toLocaleDateString()],
                ['Half Day', leave.isHalfDay ? `Yes (${leave.halfDayType})` : 'No'],
                ['Emergency Contact', leave.emergencyContact || 'N/A'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
                  <div className="text-xs text-muted">{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2, textTransform: 'capitalize' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 8 }}>
              <div className="text-xs text-muted">Reason</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{leave.reason}</div>
            </div>
            {leave.substituteName && (
              <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, marginTop: 12 }}>
                <div className="text-xs text-muted">Substitute</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{leave.substituteName}</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Approval Progress</div>
            {leave.approvalChain?.length === 0 ? (
              <p className="text-sm text-muted">No approval chain required</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {leave.approvalChain?.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: step.status === 'approved' ? 'var(--success-light)' : step.status === 'rejected' ? 'var(--danger-light)' : 'var(--warning-light)',
                      color: step.status === 'approved' ? 'var(--success)' : step.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16
                    }}>
                      {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✗' : '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{step.role}</div>
                      {step.approver && <div className="text-sm text-muted">{step.approver?.name}</div>}
                      {step.comment && <div className="text-sm" style={{ marginTop: 4, color: 'var(--text-primary)' }}>"{step.comment}"</div>}
                      {step.actionDate && <div className="text-xs text-muted">{new Date(step.actionDate).toLocaleString()}</div>}
                    </div>
                    <div style={{ marginLeft: 'auto' }}>{getBadge(step.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canApprove && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Take Action</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setActionType('approved'); setShowAction(true); }}>✓ Approve</button>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setActionType('rejected'); setShowAction(true); }}>✗ Reject</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAction && (
        <div className="modal-overlay" onClick={() => setShowAction(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{actionType === 'approved' ? '✅ Approve' : '❌ Reject'} Leave</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowAction(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Remarks {actionType === 'rejected' ? '(Required)' : '(Optional)'}</label>
                <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Add your remarks..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAction(false)}>Cancel</button>
              <button className={`btn ${actionType === 'approved' ? 'btn-success' : 'btn-danger'}`}
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
