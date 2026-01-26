import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";

interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email?: string, firstName?: string, lastName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Custom hook to manage authentication flow
 * Handles username/password authentication
 */
export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          await refreshUser();
        } catch (err) {
          // Token invalid, clear it
          localStorage.removeItem("access_token");
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      if (response.data) {
        setUser(response.data as User);
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to get user info:", err);
      localStorage.removeItem("access_token");
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.login({ username, password });
      
      if (response.data?.token) {
        localStorage.setItem("access_token", response.data.token);
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          await refreshUser();
        }
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Đăng nhập thất bại");
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    password: string,
    email?: string,
    firstName?: string,
    lastName?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.register({
        username,
        password,
        email,
        firstName,
        lastName,
      });
      
      if (response.data?.token) {
        localStorage.setItem("access_token", response.data.token);
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          await refreshUser();
        }
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Đăng ký thất bại");
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate("/");
    }
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    register,
    signOut,
    refreshUser,
  };
};
