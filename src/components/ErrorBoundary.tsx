import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #a8d8ea 0%, #ffaaa7 100%)",
            padding: "2rem",
            color: "white",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Đã xảy ra lỗi
          </h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
            {this.state.error?.message || "Có lỗi không xác định"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "0.75rem 1.5rem",
              background: "white",
              color: "#5d9caf",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tải lại trang
          </button>
          <details style={{ marginTop: "2rem", maxWidth: "800px" }}>
            <summary style={{ cursor: "pointer", marginBottom: "1rem" }}>
              Chi tiết lỗi
            </summary>
            <pre
              style={{
                background: "rgba(0,0,0,0.2)",
                padding: "1rem",
                borderRadius: "8px",
                overflow: "auto",
                textAlign: "left",
              }}
            >
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
