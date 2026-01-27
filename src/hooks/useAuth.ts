import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";

interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<boolean>;
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
      // Handle different response structures: { user: {...} } or { data: { user: {...} } } or direct user object
      const userData = response.data?.user || response.data?.data?.user || response.data;
      if (userData && userData.id) {
        setUser(userData as User);
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.login({ email, password });
      
      // Handle different response structures
      const token = response.data?.token || response.data?.data?.token;
      const userData = response.data?.user || response.data?.data?.user;
      
      if (token) {
        localStorage.setItem("access_token", token);
        if (userData && userData.id) {
          setUser(userData as User);
        } else {
          await refreshUser();
        }
        setIsAuthenticated(true);
        return true;
      }
      setError("Không nhận được token từ server");
      return false;
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Đăng nhập thất bại";
      setError(errorMessage);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.register({
        email,
        password,
        fullName,
        phoneNumber,
      });
      
      // Handle different response structures
      const token = response.data?.token || response.data?.data?.token;
      const userData = response.data?.user || response.data?.data?.user;
      
      if (token) {
        localStorage.setItem("access_token", token);
        if (userData && userData.id) {
          setUser(userData as User);
        } else {
          await refreshUser();
        }
        setIsAuthenticated(true);
        return true;
      }
      setError("Không nhận được token từ server");
      return false;
    } catch (err: any) {
      console.error("Register error:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Đăng ký thất bại";
      setError(errorMessage);
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
