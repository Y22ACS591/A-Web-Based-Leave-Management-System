import React, { useState, useEffect } from 'react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getAllUsers } from '../utils/api';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', hod: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [dRes, uRes] = await Promise.all([getDepartments(), getAllUsers({ role: 'hod' })]);
      setDepartments(dRes.data.departments);
      setHods(uRes.data.users);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditDept(null); setForm({ name: '', code: '', description: '', hod: '' }); setShowModal(true); };
  const openEdit = (d) => { setEditDept(d); setForm({ name: d.name, code: d.code, description: d.description || '', hod: d.hod?._id || '' }); setShowModal(true); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editDept) { await updateDepartment(editDept._id, form); toast.success('Department updated'); }
      else { await createDepartment(form); toast.success('Department created'); }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await deleteDepartment(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments.length} departments configured</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Department</button>
      </div>

      <div className="grid-2">
        {departments.map(d => (
          <div key={d._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏛️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div>
                  <div className="text-sm text-muted">Code: <strong>{d.code}</strong></div>
                  {d.hod && <div className="text-sm text-muted">HOD: <strong>{d.hod.name}</strong></div>}
                  {d.description && <div className="text-sm text-muted" style={{ marginTop: 4 }}>{d.description}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={() => openEdit(d)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(d._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editDept ? 'Edit Department' : 'Add Department'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department Name *</label>
                    <input className="form-control" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Computer Science" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code *</label>
                    <input className="form-control" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. CSE" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Head of Department</label>
                  <select className="form-control" name="hod" value={form.hod} onChange={handleChange}>
                    <option value="">Select HOD</option>
                    {hods.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" /> Saving...</> : editDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
