import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('bookleaf_access_token');
    const savedUser = localStorage.getItem('bookleaf_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('bookleaf_access_token');
        localStorage.removeItem('bookleaf_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const response = await authApi.login(credentials);
    const { access_token, refresh_token, user: loggedUser } = response;

    localStorage.setItem('bookleaf_access_token', access_token);
    localStorage.setItem('bookleaf_refresh_token', refresh_token);
    localStorage.setItem('bookleaf_user', JSON.stringify(loggedUser));

    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('bookleaf_access_token');
      localStorage.removeItem('bookleaf_refresh_token');
      localStorage.removeItem('bookleaf_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
