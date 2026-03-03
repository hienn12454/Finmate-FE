import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || 
  "https://finmatecontroller20260116165929-dvckfkfvgqendpbk.eastasia-01.azurewebsites.net/api";

const axiosClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Các endpoint public không cần và không nên gửi Authorization header
const PUBLIC_PATHS = ["basic-auth/login", "basic-auth/register"];

// Request interceptor: Attach token from localStorage (trừ các endpoint public)
axiosClient.interceptors.request.use(
  (config) => {
    const url = (config.url || "").toLowerCase();
    const isPublicPath = PUBLIC_PATHS.some((p) => url.includes(p));
    if (isPublicPath) {
      // Không gửi token cho register/login - tránh 401 khi có token cũ/hết hạn
      return config;
    }
    const token = localStorage.getItem("access_token");
    if (token) {
      // Token trả về từ backend là JWT, dùng scheme Bearer
      const trimmed = token.trim();
      const hasScheme = /^(Bearer|Basic)\s+/i.test(trimmed);
      config.headers.Authorization = hasScheme ? trimmed : `Bearer ${trimmed}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 sẽ được xử lý tuỳ ngữ cảnh (ví dụ trong useAuth.refreshUser).
    // Ở đây chỉ đơn giản trả lỗi ra ngoài.
    return Promise.reject(error);
  }
);

export default axiosClient;
