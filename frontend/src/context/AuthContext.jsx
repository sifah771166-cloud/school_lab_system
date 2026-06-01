import { createContext, useState } from 'react';
import api from '../config/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        // Corrupted data – clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return null;
  });

  const [loading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: userData } = data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    // After registration, we could log them in automatically,
    // but for simplicity we just return the message and let them login.
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setUser(updatedUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;