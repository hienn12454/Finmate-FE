/**
 * Trang đăng ký Clerk - quy trình chính thức của Clerk.
 */
import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

export default function SignUpClerk() {
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
          <SignUp
            forceRedirectUrl={`${baseUrl}/dashboard`}
            fallbackRedirectUrl={`${baseUrl}/dashboard`}
            signInUrl="/sign-in-clerk"
            signInForceRedirectUrl={`${baseUrl}/dashboard`}
          />
        </div>
      </div>
    </div>
  );
}
