import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  configureAuthStorage,
  observeAuth,
  login,
  register,
  logout,
  resetPassword,
  isFirebaseConfigured,
} from '../api/authApi';
import type { AuthUser } from '../api/authApi';
import { authStorage } from '../storage';
import { errorMessage } from '../utils/errors';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  configured: boolean;
  login: typeof login;
  register: typeof register;
  logout: typeof logout;
  resetPassword: typeof resetPassword;
};
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    configureAuthStorage(authStorage);
    let live = true;
    let stop: (() => void) | undefined;
    try {
      stop = observeAuth(
        value => {
          if (live) {
            setUser(value);
            setLoading(false);
            setError('');
          }
        },
        reason => {
          if (live) {
            setUser(null);
            setError(errorMessage(reason));
            setLoading(false);
          }
        },
      );
    } catch (reason) {
      setError(errorMessage(reason));
      setLoading(false);
    }
    return () => {
      live = false;
      stop?.();
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        configured: isFirebaseConfigured(),
        login,
        register,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthProvider is missing.');
  }
  return context;
}
