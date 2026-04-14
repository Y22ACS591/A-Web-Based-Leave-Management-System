import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   if (token) {
  //     getMe()
  //       .then(res => setUser(res.data.user))
  //       .catch(() => localStorage.removeItem('token'))
  //       .finally(() => setLoading(false));
  //   } else {
  //     setLoading(false);
  //   }
  // }, []);
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    getMe()
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  } else {
    setUser(null);
    setLoading(false);
  }
}, []);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
