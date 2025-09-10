'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getAuthToken, setAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getAuthToken();
    if (savedToken) {
      setToken(savedToken);
      
      // Try to fetch user data with the saved token
      const fetchUserData = async () => {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, clear it
            setAuthToken(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthToken(null);
          setToken(null);
        }
      };
      
      fetchUserData();
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      const response = await authAPI.login(email, password);
      console.log('AuthContext: Login response received:', { 
        user: response.user ? 'user data received' : 'no user data',
        token: response.token ? 'token received' : 'no token' 
      });
      
      const { user, token } = response;
      setUser(user);
      setToken(token);
      setAuthToken(token); // Save token to localStorage
      console.log('AuthContext: Login successful, user and token set');
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      console.log('AuthContext: Attempting registration for:', userData.email);
      const response = await authAPI.register(userData);
      console.log('AuthContext: Registration response received:', response);
      
      if (!response || !response.user || !response.token) {
        throw new Error('Invalid response format from registration');
      }
      
      const { user, token } = response;
      console.log('AuthContext: Setting user and token...');
      
      setUser(user);
      setToken(token);
      setAuthToken(token); // Save token to localStorage
      
      console.log('AuthContext: Registration successful, user and token set');
    } catch (error) {
      console.error('AuthContext: Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}