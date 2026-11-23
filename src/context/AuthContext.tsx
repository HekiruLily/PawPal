import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {login as loginApi} from '../api/authApi';
import {clearSession, readUser, writeUser} from '../storage';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readUser().then(setUser).finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(username, password, role) {
      await loginApi(username, password);
      const next = {username, role};
      await writeUser(next);
      setUser(next);
    },
    async logout() {
      await clearSession();
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
