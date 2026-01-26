# 🚀 Quick Start Guide - Finmate Frontend

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Cấu hình Clerk

### 2.1. Tạo Clerk Account
1. Truy cập https://clerk.com và đăng ký tài khoản
2. Tạo một Application mới
3. Chọn các providers muốn sử dụng:
   - Email/Password
   - Google OAuth
   - GitHub (tùy chọn)

### 2.2. Lấy API Keys
1. Trong Clerk Dashboard, vào **API Keys**
2. Copy **Publishable key** (bắt đầu với `pk_test_...`)

### 2.3. Cấu hình Environment Variables
```bash
# Copy file template
cp .env.example .env

# Mở file .env và cập nhật
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

## Bước 3: Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt và truy cập: http://localhost:5173

## 🎯 Flow Test

### 1. Test Homepage
- Vào http://localhost:5173
- Xem trang giới thiệu với theme xanh/hồng
- Logo "Finmate" hiển thị
- Click "Đăng nhập" hoặc "Bắt đầu ngay"

### 2. Test Login
- Redirect đến trang Login
- Thử đăng nhập với:
  - Google OAuth
  - Email/Password
- Clerk sẽ xử lý authentication

### 3. Test Dashboard (cần Backend running)
- Sau khi login thành công
- Redirect đến `/dashboard`
- Hệ thống sẽ:
  1. Lấy Clerk token
  2. Gửi POST `/api/auth/verify` đến backend
  3. Backend verify với Clerk
  4. Nhận JWT từ backend
  5. Hiển thị dashboard content

### 4. Test Protected Route
- Thử truy cập `/dashboard` khi chưa login
- Hệ thống tự động redirect về `/login`

## 🔧 Backend Integration

Backend cần có endpoint:

```typescript
POST /api/auth/verify
Body: { token: string }
Response: { 
  success: boolean,
  token?: string,  // Internal JWT (optional)
  userId?: string
}
```

Backend phải verify Clerk token bằng cách:
1. Lấy Clerk Secret Key
2. Verify JWT signature
3. Decode user info
4. Tạo session trong database
5. Trả về internal JWT (hoặc dùng luôn Clerk userId)

## 📝 Common Issues

### Lỗi: Clerk key not found
```bash
# Check file .env tồn tại
ls -la .env

# Restart dev server
npm run dev
```

### Lỗi: Backend verification failed
- Check backend có running không
- Check CORS settings
- Check network logs trong DevTools

### Lỗi: Token expired
- Clear localStorage
- Login lại

```javascript
// Open DevTools Console
localStorage.clear()
location.reload()
```

## 📱 Responsive Testing

Test trên các kích thước màn hình:
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

## 🎨 Theme Colors Reference

```css
--primary-blue: #a8d8ea;
--primary-pink: #ffaaa7;
--dark-blue: #5d9caf;
--dark-pink: #ff8a85;
```

## ✅ Checklist Before Deploy

- [ ] File `.env` không commit vào Git
- [ ] Backend URL production đã update
- [ ] Clerk production keys đã cấu hình
- [ ] Test tất cả flows
- [ ] Check responsive design
- [ ] Test trên nhiều browsers
- [ ] Build production: `npm run build`
- [ ] Test production build: `npm run preview`

## 🆘 Need Help?

- Clerk Documentation: https://clerk.com/docs
- React Router: https://reactrouter.com
- Vite: https://vitejs.dev

---

Happy coding! 🎉
