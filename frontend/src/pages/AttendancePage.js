import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyAttendance, getDeptAttendance, getAllUsers, markAttendance } from '../utils/api';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [markData, setMarkData] = useState({});
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);

  const loadMyAttendance = async () => {
    try {
      const res = await getMyAttendance({ month, year });
      setRecords(res.data.records);
      setStats(res.data.stats);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const loadStudents = async () => {
    try {
      const res = await getAllUsers({ role: 'student', department: user?.department?._id });
      setStudents(res.data.users);
      const init = {};
      res.data.users.forEach(s => { init[s._id] = 'present'; });
      setMarkData(init);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isStudent) loadMyAttendance();
    else loadStudents();
  }, [month, year]);

  const handleMark = async () => {
    setMarking(true);
    try {
      const records = Object.entries(markData).map(([student, status]) => ({ student, status }));
      await markAttendance({ records, date: markDate });
      toast.success('Attendance marked successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to mark'); }
    finally { setMarking(false); }
  };

  const getStatusColor = (status) => ({
    present: '#16a34a', absent: '#dc2626', on_leave: '#2563eb', holiday: '#d97706'
  }[status] || '#64748b');

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>;

  if (isStudent) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Track your attendance record</p>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Days', value: stats.total, icon: '📅', bg: '#eff6ff', color: '#2563eb' },
            { label: 'Present', value: stats.present, icon: '✅', bg: '#f0fdf4', color: '#16a34a' },
            { label: 'On Leave', value: stats.onLeave, icon: '📋', bg: '#ecfeff', color: '#0891b2' },
            { label: 'Absent', value: stats.absent, icon: '❌', bg: '#fef2f2', color: '#dc2626' },
            { label: 'Attendance %', value: `${stats.percentage}%`, icon: '📊', bg: '#f5f3ff', color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Attendance Record</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-control" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-control" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Calendar-style view */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 16 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
          ))}
          {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const rec = records.find(r => r.date?.startsWith(dateStr));
            const color = rec ? getStatusColor(rec.status) : '#e2e8f0';
            return (
              <div key={day} style={{
                textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                background: color + '22', border: `1px solid ${color}44`, fontSize: 12, fontWeight: 600, color
              }}>
                {day}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[['#16a34a','Present'],['#dc2626','Absent'],['#2563eb','On Leave'],['#d97706','Holiday']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Mark attendance for your students</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label">Date</label>
            <input className="form-control" type="date" value={markDate} onChange={e => setMarkDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
              onClick={() => { const d = {}; students.forEach(s => { d[s._id] = 'present'; }); setMarkData(d); }}>
              Mark All Present
            </button>
            <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
              onClick={() => { const d = {}; students.forEach(s => { d[s._id] = 'absent'; }); setMarkData(d); }}>
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="card empty-state"><div className="icon">👥</div><h3>No students found in your department</h3></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Roll No</th><th>Name</th><th>Attendance Status</th></tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td className="text-muted text-sm">{i + 1}</td>
                    <td><strong>{s.rollNo || 'N/A'}</strong></td>
                    <td>{s.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['present','absent','on_leave','holiday'].map(st => (
                          <button key={st} onClick={() => setMarkData(d => ({ ...d, [s._id]: st }))}
                            className="btn btn-sm"
                            style={{
                              background: markData[s._id] === st ? getStatusColor(st) : 'transparent',
                              color: markData[s._id] === st ? 'white' : getStatusColor(st),
                              border: `1.5px solid ${getStatusColor(st)}`,
                              textTransform: 'capitalize', fontSize: 11
                            }}>
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={handleMark} disabled={marking}>
              {marking ? <><div className="spinner" /> Saving...</> : '✅ Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
