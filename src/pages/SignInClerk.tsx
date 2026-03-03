/**
 * Trang đăng nhập Clerk - quy trình chính thức của Clerk.
 * Hiển thị SignIn component với Google, Email, etc. theo cấu hình Dashboard.
 */
import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

export default function SignInClerk() {
  const navigate = useNavigate();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo} onClick={() => navigate("/")}>
          <span className={styles.logoMark}>F</span>
          <span className={styles.logoText}>Finmate</span>
        </div>
      </div>
      <div className={styles.loginContainer}>
        <div className={styles.clerkSignInWrapper}>
          <SignIn
            forceRedirectUrl={`${baseUrl}/dashboard`}
            fallbackRedirectUrl={`${baseUrl}/dashboard`}
            signUpUrl="/sign-up-clerk"
            signUpForceRedirectUrl={`${baseUrl}/dashboard`}
          />
        </div>
      </div>
    </div>
  );
}
