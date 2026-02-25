# Finmate Frontend

[![Live](https://img.shields.io/badge/Live-finmate.website-00C853?style=for-the-badge&logo=googlechrome)](https://finmate.website)
![Build](https://github.com/hienn12454/Finmate-FE/actions/workflows/azure-static-web-apps.yml/badge.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite)
![Azure](https://img.shields.io/badge/Azure-Static%20Web%20Apps-0078D4?style=for-the-badge&logo=microsoftazure)
![Status](https://img.shields.io/badge/Status-Production-2E7D32?style=for-the-badge)



Ứng dụng quản lý tài chính cá nhân với React + TypeScript + Vite

## 🎨 Thiết kế

- **Chủ đề màu sắc**: Xanh dương nhạt (#a8d8ea) và Hồng (#ffaaa7)
- **Logo**: Finmate với gradient màu
- **UI/UX**: Thiết kế hiện đại, thân thiện với người dùng

## 🚀 Công nghệ sử dụng

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **React Router** - Routing
- **Clerk** - Authentication
- **Axios** - HTTP Client

## 📋 Tính năng

### 1. Homepage
- Trang giới thiệu về dự án Finmate
- Hiển thị các tính năng chính
- Nút đăng nhập ở góc trên bên trái

### 2. Authentication Flow với Clerk
```
Admin mở FE
  ↓
Clerk Login (Google / Email / Password)
  ↓
Clerk cấp session + JWT
  ↓
FE lấy Clerk token
  ↓
POST /api/auth/verify
  ↓
BE verify token với Clerk
  ↓
BE trả JWT nội bộ (hoặc dùng luôn Clerk userId)
  ↓
FE vào dashboard
```

### 3. Dashboard
- Hiển thị thống kê tài chính
- Quản lý giao dịch
- Biểu đồ chi tiêu
- Mục tiêu tiết kiệm

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd Finmate-FE
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường:

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Backend API URL (tùy chọn, mặc định sử dụng URL Azure)
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### 4. Lấy Clerk Publishable Key

1. Đăng ký/Đăng nhập tại [Clerk.com](https://clerk.com)
2. Tạo một application mới
3. Trong Dashboard > API Keys, copy **Publishable key**
4. Dán vào file `.env`

### 5. Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## 📁 Cấu trúc thư mục

```
src/
├── api/                    # API clients và endpoints
│   ├── auth.api.ts        # Authentication API
│   ├── accountType.api.ts # Account Type API
│   └── axiosClient.ts     # Axios configuration
├── assets/                # Static assets
├── hooks/                 # Custom React hooks
│   └── useAuth.ts         # Authentication hook
├── pages/                 # Page components
│   ├── Homepage.tsx       # Landing page
│   ├── Homepage.module.css
│   ├── Login.tsx          # Login page
│   ├── Login.module.css
│   ├── Dashboard.tsx      # Dashboard page
│   └── Dashboard.module.css
├── routes/                # Routing configuration
│   ├── AppRoutes.tsx      # Main routes
│   └── PrivateRoute.tsx   # Protected route wrapper
├── App.tsx               # Main App component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## 🔐 Authentication Flow Chi tiết

### 1. Public Routes
- `/` - Homepage (trang giới thiệu)
- `/login` - Login page (Clerk SignIn component)

### 2. Protected Routes
- `/dashboard` - Dashboard (yêu cầu authentication)

### 3. Flow Đăng nhập

1. **User clicks "Đăng nhập"** → Navigate to `/login`

2. **Clerk SignIn Component**
   - Hiển thị form đăng nhập
   - Hỗ trợ Google OAuth, Email/Password
   - Clerk xử lý authentication

3. **After Clerk Success**
   - Clerk cung cấp session và JWT token
   - Redirect to `/dashboard`

4. **Dashboard Component Mount**
   - Get Clerk token: `await getToken()`
   - Verify with backend: `POST /api/auth/verify`
   - Backend verify token với Clerk API
   - Backend trả về JWT nội bộ (optional)
   - Store token in localStorage
   - Show dashboard content

5. **Subsequent Requests**
   - Axios interceptor tự động gắn token
   - `Authorization: Bearer <token>`

## 🔧 API Integration

### Axios Client Configuration

File: `src/api/axiosClient.ts`

```typescript
// Auto-attach token to all requests
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (token expired)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Authentication API

File: `src/api/auth.api.ts`

```typescript
export const authApi = {
  // Verify Clerk token with backend
  verify: (data: { token: string }) =>
    axiosClient.post("/auth/verify", data),
  
  // Get current user info
  me: () => axiosClient.get("/auth/me"),
  
  // Sync user data
  sync: (data: SyncUserRequest) =>
    axiosClient.post("/auth/sync", data),
};
```

## 🎨 Styling

### CSS Modules
- Mỗi component có file CSS module riêng
- Tránh conflicts và dễ maintain
- Example: `Homepage.module.css`

### Global Styles
- File: `src/index.css`
- Định nghĩa CSS variables cho theme
- Responsive breakpoints

### Theme Colors

```css
--primary-blue: #a8d8ea;    /* Xanh dương nhạt */
--primary-pink: #ffaaa7;    /* Hồng */
--dark-blue: #5d9caf;       /* Xanh đậm */
--dark-pink: #ff8a85;       /* Hồng đậm */
--bg-light: #f8f9fa;        /* Background */
--text-dark: #2c3e50;       /* Text chính */
```

## 📝 Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🔒 Security Best Practices

1. **Environment Variables**
   - Không commit file `.env`
   - Sử dụng `.env.example` làm template

2. **Token Storage**
   - JWT tokens lưu trong localStorage
   - Auto-clear on 401 errors

3. **Protected Routes**
   - Sử dụng `PrivateRoute` wrapper
   - Check auth status trước khi render

4. **API Security**
   - All requests qua HTTPS
   - Token trong Authorization header
   - Backend verify mọi request

## 🐛 Troubleshooting

### Lỗi: "Clerk Publishable Key not found"
- Check file `.env` đã tạo và có key đúng
- Restart dev server sau khi update `.env`

### Lỗi: "Failed to verify token"
- Check backend API có running không
- Check network connection
- Verify Clerk token chưa expired

### Lỗi: 401 Unauthorized
- Token có thể đã expired
- Clear localStorage và login lại
- Check backend authentication middleware

## 📚 Documentation Links

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [React Router Documentation](https://reactrouter.com)

## 👥 Team

Dự án Finmate - 2026

## 📄 License

Private Project

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
