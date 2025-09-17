import { useEffect, useState } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { AuthService } from '../services/authService';

export interface User {
  name?: string;
  email?: string;
  id?: string;
}

export interface UseAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [authService] = useState(() => new AuthService(instance));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const userInfo = authService.getUserInfo();
      setUser(userInfo);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [isAuthenticated, authService]);

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.login();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string> => {
    try {
      setError(null);
      return await authService.getAccessToken();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get access token');
      throw err;
    }
  };

  return {
    isAuthenticated,
    user,
    login,
    logout,
    getAccessToken,
    isLoading,
    error,
  };
};