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
      const { data } = await authApi.login({ email, password });
      const anyData: any = data;
      
      // Handle different response structures
      const token = anyData.token || anyData.data?.token;
      const userData = anyData.user || anyData.data?.user;
      
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
      const { data } = await authApi.register({
        email,
        password,
        fullName,
        phoneNumber,
      });
      
      // Handle different response structures
      const anyData: any = data;
      const token = anyData.token || anyData.data?.token;
      const userData = anyData.user || anyData.data?.user;
      
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

      // Nhiều backend chỉ trả về user (không kèm token) sau khi đăng ký
      // -> coi là đăng ký thành công, chuyển người dùng sang màn đăng nhập
      if (anyData?.id || anyData?.email) {
        setError(null);
        return true;
      }

      setError("Đăng ký thành công nhưng phản hồi không hợp lệ (thiếu thông tin).");
      return false;
    } catch (err: any) {
      console.error("Register error:", err);
      const raw = err.response?.data;
      const errorMessage =
        raw?.message ||
        raw?.error ||
        (typeof raw === "string" && raw.includes("409") ? "Email đã tồn tại" : undefined) ||
        err.message ||
        "Đăng ký thất bại";
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
