import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ClerkAuthSync from "./components/ClerkAuthSync";
import "./index.css";

// Clerk key - bắt buộc để dùng đăng nhập Google. Lấy từ https://dashboard.clerk.com
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #a8d8ea 0%, #ffaaa7 100%)",
      color: "white",
    }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        border: "4px solid rgba(255, 255, 255, 0.3)",
        borderTop: "4px solid white",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "1rem",
      }}
    />
    <p style={{ fontSize: "1.2rem" }}>Đang tải ứng dụng...</p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

const AppWithProviders = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <ClerkProvider
          publishableKey={clerkKey || "pk_test_placeholder"}
          signInUrl="/sign-in-clerk"
          signUpUrl="/sign-up-clerk"
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        >
          <ClerkAuthSync />
          <App />
        </ClerkProvider>
      </Suspense>
    </BrowserRouter>
  </ErrorBoundary>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);
