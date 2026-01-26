import { useState } from "react";
import LoginModal from "../components/LoginModal";
import styles from "./Homepage.module.css";

export default function Homepage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Finmate</span>
        </div>
        <button onClick={handleLogin} className={styles.loginButton}>
          Đăng nhập
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.logoLarge}>
            <span className={styles.logoLargeText}>Finmate</span>
          </div>
          <h1 className={styles.title}>Chào mừng đến với Finmate</h1>
          <p className={styles.description}>
            Finmate - Ứng dụng quản lý tài chính cá nhân thông minh giúp bạn kiểm soát chi tiêu, 
            lập kế hoạch ngân sách, theo dõi thu nhập và đạt được các mục tiêu tài chính của mình. 
            Bắt đầu hành trình tự do tài chính ngay hôm nay!
          </p>
          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Quản lý chi tiêu thông minh</h3>
              <p>Ghi nhận và phân loại mọi khoản chi tiêu tự động. Nhận cảnh báo khi vượt ngân sách. Phân tích xu hướng chi tiêu theo thời gian.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Báo cáo & Phân tích</h3>
              <p>Biểu đồ trực quan hóa dòng tiền. Thống kê chi tiết theo danh mục. Dự báo tài chính dựa trên dữ liệu lịch sử.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Mục tiêu & Tiết kiệm</h3>
              <p>Đặt mục tiêu tiết kiệm cụ thể. Theo dõi tiến độ hàng ngày. Nhận gợi ý cách tiết kiệm hiệu quả.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏦</div>
              <h3>Quản lý tài khoản</h3>
              <p>Kết nối nhiều tài khoản ngân hàng. Đồng bộ giao dịch tự động. Quản lý thẻ tín dụng và nợ.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💳</div>
              <h3>Ngân sách thông minh</h3>
              <p>Lập kế hoạch chi tiêu hàng tháng. Phân bổ ngân sách theo danh mục. Điều chỉnh linh hoạt khi cần.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔔</div>
              <h3>Nhắc nhở & Cảnh báo</h3>
              <p>Nhắc thanh toán hóa đơn đúng hạn. Cảnh báo chi tiêu bất thường. Thông báo khi đạt mục tiêu.</p>
            </div>
          </div>
          <button onClick={handleLogin} className={styles.ctaButton}>
            Bắt đầu ngay - Miễn phí
          </button>
        </div>

        <div className={styles.whySection}>
          <h2 className={styles.sectionTitle}>Tại sao chọn Finmate?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>01</span>
              <h4>Dễ sử dụng</h4>
              <p>Giao diện thân thiện, đơn giản. Chỉ 5 phút là bạn đã có thể bắt đầu quản lý tài chính hiệu quả.</p>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>02</span>
              <h4>Bảo mật tuyệt đối</h4>
              <p>Dữ liệu được mã hóa cao cấp. Tuân thủ chuẩn bảo mật quốc tế. Quyền riêng tư của bạn là ưu tiên hàng đầu.</p>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>03</span>
              <h4>Đồng bộ mọi nơi</h4>
              <p>Truy cập trên web, mobile, tablet. Dữ liệu tự động đồng bộ real-time. Quản lý tài chính mọi lúc mọi nơi.</p>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>04</span>
              <h4>AI thông minh</h4>
              <p>Phân tích chi tiêu tự động. Gợi ý tiết kiệm thông minh. Dự báo tài chính chính xác.</p>
            </div>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <h3>10,000+</h3>
            <p>Người dùng tin tưởng</p>
          </div>
          <div className={styles.statItem}>
            <h3>50M+</h3>
            <p>Giao dịch được quản lý</p>
          </div>
          <div className={styles.statItem}>
            <h3>4.8/5</h3>
            <p>Đánh giá trung bình</p>
          </div>
          <div className={styles.statItem}>
            <h3>24/7</h3>
            <p>Hỗ trợ khách hàng</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2026 Finmate. All rights reserved.</p>
      </footer>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}
