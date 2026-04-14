// AllLeaves.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLeaves, getDepartments } from '../utils/api';
import toast from 'react-hot-toast';

const getBadge = (status) => <span className={`badge badge-${status}`}>{status}</span>;

export default function AllLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', department: '', leaveType: '', fromDate: '', toDate: '' });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, dRes] = await Promise.all([getAllLeaves(filters), getDepartments()]);
      setLeaves(lRes.data.leaves);
      setDepartments(dRes.data.departments);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFilter = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Leave Applications</h1>
        <p className="page-subtitle">{leaves.length} total applications</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <select className="form-control" name="status" value={filters.status} onChange={handleFilter}>
            <option value="">All Status</option>
            {['pending','approved','rejected','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control" name="department" value={filters.department} onChange={handleFilter}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="form-control" name="leaveType" value={filters.leaveType} onChange={handleFilter}>
            <option value="">All Types</option>
            {['casual','medical','earned','emergency','maternity','other'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="form-control" type="date" name="fromDate" value={filters.fromDate} onChange={handleFilter} placeholder="From Date" />
          <input className="form-control" type="date" name="toDate" value={filters.toDate} onChange={handleFilter} placeholder="To Date" />
          <button className="btn btn-primary" onClick={load}>🔍 Filter</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Applicant</th><th>Role</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Applied</th><th></th></tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leaves found</td></tr>
                ) : leaves.map(l => (
                  <tr key={l._id}>
                    <td><strong>{l.applicant?.name}</strong><br /><span className="text-xs text-muted">{l.applicant?.rollNo || l.applicant?.employeeId}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{l.applicant?.role}</td>
                    <td style={{ textTransform: 'capitalize' }}>{l.leaveType}</td>
                    <td>{new Date(l.fromDate).toLocaleDateString()}</td>
                    <td>{new Date(l.toDate).toLocaleDateString()}</td>
                    <td><strong>{l.numberOfDays}</strong></td>
                    <td>{getBadge(l.status)}</td>
                    <td className="text-sm text-muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={() => navigate(`/leaves/${l._id}`)}>View</button></td>
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
