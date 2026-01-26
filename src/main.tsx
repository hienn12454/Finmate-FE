import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
