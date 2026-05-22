import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './authContext';
import type { User } from '../types';
import { login as loginRequest } from '../services/auth.service';
import { TOKEN_KEY, USER_KEY } from '../services/api';

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const signIn = useCallback(async (userName: string, passWord: string) => {
    const { user: loggedUser, access_token } = await loginRequest(userName, passWord);
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, signIn, signOut }),
    [user, token, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
