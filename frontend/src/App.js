import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import LoginPage from './pages/LoginPage';
//import RegisterPage from './pages/RegisterPage';
import Layout from './components/Common/Layout';
import Dashboard from './pages/Dashboard';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import PendingLeaves from './pages/PendingLeaves';
import AllLeaves from './pages/AllLeaves';
import AttendancePage from './pages/AttendancePage';
import UsersPage from './pages/UsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import LeaveDetailPage from './pages/LeaveDetailPage';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner spinner-dark" /><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner spinner-dark" /></div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="apply-leave" element={<ApplyLeave />} />
        <Route path="my-leaves" element={<MyLeaves />} />
        <Route path="leaves/:id" element={<LeaveDetailPage />} />
        <Route path="pending-leaves" element={<PrivateRoute roles={['faculty','hod','principal','admin']}><PendingLeaves /></PrivateRoute>} />
        <Route path="all-leaves" element={<PrivateRoute roles={['admin','principal','hod']}><AllLeaves /></PrivateRoute>} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="users" element={<PrivateRoute roles={['admin','principal','hod']}><UsersPage /></PrivateRoute>} />
        <Route path="departments" element={<PrivateRoute roles={['admin']}><DepartmentsPage /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute roles={['admin','principal','hod']}><ReportsPage /></PrivateRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
