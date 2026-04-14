import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../utils/api';
import { getDepartments } from '../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', rollNo: '', employeeId: '', semester: '', phone: '' });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getDepartments().then(res => setDepartments(res.data.departments)).catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 520 }}>
        <div className="login-logo">
          <div className="logo-icon">🎓</div>
          <h1>Create Account</h1>
          <p>Register for the College Leave System</p>
        </div>

        {error && <div className="alert alert-danger mb-4">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" name="role" value={form.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="hod">HOD</option>
                <option value="principal">Principal</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
  className="form-control"
  name="department"
  value={form.department}
  onChange={handleChange}
  required
>
  <option value="">Select Department</option>
  {departments.map(d => (
    <option key={d._id} value={d._id}>{d.name}</option>
  ))}
</select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
            </div>
          </div>
          {form.role === 'student' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input className="form-control" name="rollNo" value={form.rollNo} onChange={handleChange} placeholder="e.g. CS001" />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input className="form-control" type="number" name="semester" value={form.semester} onChange={handleChange} placeholder="1-8" min="1" max="8" />
              </div>
            </div>
          )}
          {['faculty','hod','principal'].includes(form.role) && (
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-control" name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="Employee ID" />
            </div>
          )}
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><div className="spinner" /> Registering...</> : '✅ Create Account'}
          </button>
        </form>

        <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
