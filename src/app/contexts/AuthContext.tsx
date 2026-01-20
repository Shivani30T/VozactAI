import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, tokenManager, ProfileResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  updateUserCredits: (amount: number) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert API profile response to User type
  const profileToUser = (profile: ProfileResponse): User => {
    return {
      id: profile.user.id,
      email: profile.user.email,
      full_name: profile.user.full_name,
      credits: profile.credits,
      username: profile.user.email.split('@')[0], // Use email prefix as username
      role: 'user', // Default role, can be extended based on API
    };
  };

  // Check for existing session on mount
  const checkExistingSession = useCallback(async () => {
    if (tokenManager.isTokenValid()) {
      try {
        const profile = await api.auth.getProfile();
        const userData = profileToUser(profile);
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } catch (err) {
        // Token might be invalid, clear it
        tokenManager.clearToken();
        localStorage.removeItem('currentUser');
      }
    } else {
      // Try to restore from localStorage for offline usage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser && tokenManager.getToken()) {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      // Call the login API
      await api.auth.login({ username, password });
      
      // Fetch user profile after successful login
      const profile = await api.auth.getProfile();
      const userData = profileToUser(profile);
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string, fullName?: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      // Call the register API
      await api.auth.register({ 
        username, 
        password,
        full_name: fullName 
      });
      
      // Fetch user profile after successful registration
      const profile = await api.auth.getProfile();
      const userData = profileToUser(profile);
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await api.auth.logout();
    } catch (err) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', err);
    } finally {
      // Always clear local state
      setUser(null);
      tokenManager.clearToken();
      localStorage.removeItem('currentUser');
    }
  };

  const updateUserCredits = (amount: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        credits: (user.credits || 0) + amount,
      };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const refreshProfile = async () => {
    if (!tokenManager.isTokenValid()) return;
    
    try {
      const profile = await api.auth.getProfile();
      const userData = profileToUser(profile);
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
        error,
        updateUserCredits,
        refreshProfile,
      }}
    >
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