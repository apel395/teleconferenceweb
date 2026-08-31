import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  api,
  getUser,
  setSession,
  clearSession,
  isAuthenticated,
  type AuthSession,
  type User,
} from '../lib/api';

type AuthContextValue = {
  user: User | null;
  isAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuth: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser());
  const [isAuth, setIsAuth] = useState<boolean>(() => isAuthenticated());

  const login = useCallback(async (email: string, password: string) => {
    const session = await api<AuthSession>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setSession(session);
    setUser(session.user);
    setIsAuth(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsAuth(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
