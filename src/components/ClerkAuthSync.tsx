/**
 * Giữ Clerk JWT trong localStorage luôn mới.
 * Clerk session token hết hạn mỗi ~60s → refresh mỗi 55s
 * để axiosClient luôn có token hợp lệ khi gọi API.
 */
import { useEffect, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

// Export để giữ backward-compat nếu có code cũ tham chiếu
export const CLERK_TOKEN_SYNC_EVENT = "clerk-token-synced";

const TOKEN_REFRESH_INTERVAL = 55 * 1000;

export default function ClerkAuthSync() {
  const { isSignedIn, getToken } = useClerkAuth();

  const refreshToken = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        localStorage.setItem("access_token", token);
      }
    } catch (err) {
      console.error("Clerk token refresh error:", err);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn) return;

    // Refresh định kỳ để localStorage luôn có token hợp lệ
    const interval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isSignedIn, refreshToken]);

  return null;
}
