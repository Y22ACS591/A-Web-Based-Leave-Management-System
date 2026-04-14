import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, toggleUserStatus, getDepartments } from '../utils/api';
import toast from 'react-hot-toast';

const ROLES = ['student', 'faculty', 'hod', 'principal', 'admin'];

const defaultForm = { name: '', email: '', password: '', role: 'student', department: '', rollNo: '', employeeId: '', semester: '', phone: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [uRes, dRes] = await Promise.all([getAllUsers(roleFilter ? { role: roleFilter } : {}), getDepartments()]);
      setUsers(uRes.data.users);
      setDepartments(dRes.data.departments);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const openCreate = () => { setEditUser(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department?._id || '', rollNo: u.rollNo || '', employeeId: u.employeeId || '', semester: u.semester || '', phone: u.phone || '' });
    setShowModal(true);
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        const { password, ...rest } = form;
        await updateUser(editUser._id, rest);
        toast.success('User updated');
      } else {
        await createUser(form);
        toast.success('User created');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleUserStatus(id);
      toast.success(res.data.message);
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.rollNo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} total users</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="form-control" style={{ flex: 1, minWidth: 200 }} placeholder="🔍 Search by name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>ID / Roll No</th><th>Department</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {u.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td className="text-sm">{u.email}</td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td className="text-sm text-muted">{u.rollNo || u.employeeId || '—'}</td>
                    <td className="text-sm">{u.department?.name || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-rejected'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>Edit</button>
                        <button className={`btn btn-sm ${u.isActive ? 'btn-warning' : 'btn-success'}`} onClick={() => handleToggle(u._id)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editUser ? 'Edit User' : 'Create New User'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password {editUser ? '(leave blank to keep)' : '*'}</label>
                    <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required={!editUser} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="form-control" name="role" value={form.role} onChange={handleChange}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-control" name="department" value={form.department} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>
                {form.role === 'student' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Roll Number</label>
                      <input className="form-control" name="rollNo" value={form.rollNo} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <input className="form-control" type="number" name="semester" value={form.semester} onChange={handleChange} min={1} max={8} />
                    </div>
                  </div>
                )}
                {['faculty','hod','principal'].includes(form.role) && (
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input className="form-control" name="employeeId" value={form.employeeId} onChange={handleChange} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" /> Saving...</> : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
