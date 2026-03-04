import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { authApi } from "../api/auth.api";

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: string;
  userRole?: string;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const clerk = useClerk();
  // isLoaded: Clerk đã khởi tạo xong chưa (tránh race condition)
  // isSignedIn: user có session Clerk hợp lệ không
  const { isLoaded: clerkIsLoaded, isSignedIn, getToken } = useClerkAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Giữ isLoading = true cho đến khi Clerk khởi tạo xong
    // Tránh PrivateRoute redirect sai khi Clerk chưa load
    if (!clerkIsLoaded) return;

    const syncAuthState = async () => {
      if (isSignedIn) {
        try {
          // Lấy Clerk JWT mới nhất → lưu localStorage cho axiosClient
          const token = await getToken();
          if (token) {
            localStorage.setItem("access_token", token);
          }
          // Gọi backend để lấy/tạo user profile
          await refreshUserInternal();
        } catch (err) {
          console.error("Auth sync failed:", err);
          localStorage.removeItem("access_token");
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clerk đã load xong nhưng không có session
        localStorage.removeItem("access_token");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    syncAuthState();
  }, [clerkIsLoaded, isSignedIn]);

  const refreshUserInternal = async () => {
    const response = await authApi.me();
    const userData = response.data?.user || response.data?.data?.user || response.data;
    if (userData && userData.id) {
      setUser(userData as User);
      setIsAuthenticated(true);
      setError(null);
    }
  };

  const refreshUser = async () => {
    try {
      // Đảm bảo token còn mới trước khi fetch
      if (isSignedIn) {
        const token = await getToken();
        if (token) localStorage.setItem("access_token", token);
      }
      await refreshUserInternal();
    } catch (err: any) {
      console.error("Failed to refresh user:", err);
      localStorage.removeItem("access_token");
      setIsAuthenticated(false);
      setUser(null);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      if (clerk?.signOut) await clerk.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
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
    signOut,
    refreshUser,
  };
};
