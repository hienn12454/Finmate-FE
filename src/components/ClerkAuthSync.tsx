/**
 * Đồng bộ Clerk session với auth state của app.
 * Khi user đăng nhập qua Clerk (Google, etc.), lấy JWT lưu vào localStorage
 * và báo cho useAuth để gọi /auth/me.
 */
import { useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

export const CLERK_TOKEN_SYNC_EVENT = "clerk-token-synced";

export default function ClerkAuthSync() {
  const { isSignedIn, getToken } = useClerkAuth();

  useEffect(() => {
    if (isSignedIn) {
      getToken()
        .then((token) => {
          if (token) {
            localStorage.setItem("access_token", token);
            window.dispatchEvent(new CustomEvent(CLERK_TOKEN_SYNC_EVENT));
          }
        })
        .catch((err) => console.error("Clerk getToken error:", err));
    } else {
      localStorage.removeItem("access_token");
      window.dispatchEvent(new CustomEvent("clerk-signed-out"));
    }
  }, [isSignedIn, getToken]);

  return null;
}
