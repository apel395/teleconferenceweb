import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  api,
  getUser,
  setSession,
  clearSession,
  isAuthenticated,
  watchSessionExpiration,
  type AuthSession,
  type User,
} from '../lib/api';

export type TravelRegistrationInput = {email:string;password:string;name:string;company_name:string;nib:string;office_address:string};

type AuthContextValue = {
  user: User | null;
  isAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerTravel: (input: TravelRegistrationInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuth: false,
  login: async () => {},
  logout: () => {},
  registerTravel: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
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

  const registerTravel = useCallback(async (input: TravelRegistrationInput) => {
    const session = await api<AuthSession>('/auth/register-travel', {method:'POST',body:input});
    setSession(session);
    setUser(session.user);
    setIsAuth(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsAuth(false);
  }, []);

  useEffect(() => {
    const forceLogout = () => {
      logout();
      navigate('/masuk?sesi=berakhir', { replace: true });
    };
    window.addEventListener('kemenhaj-session-expired', forceLogout);
    const stop = watchSessionExpiration(() => {
      setUser(isAuthenticated() ? getUser() : null);
      setIsAuth(isAuthenticated());
    }, forceLogout);
    return () => {
      stop();
      window.removeEventListener('kemenhaj-session-expired', forceLogout);
    };
  }, [isAuth, logout, navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuth, login, logout, registerTravel }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
