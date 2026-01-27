import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import LoginModal from "../components/LoginModal";
import homeStyles from "./Homepage.module.css";
import styles from "./Blog.module.css";
import { getBlogPostBySlug } from "./blogData";

export default function BlogPost() {
  const { slug } = useParams();
  const post = useMemo(() => (slug ? getBlogPostBySlug(slug) : undefined), [slug]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const handleLogin = () => setIsLoginModalOpen(true);
  const goHomeAndScroll = (scrollTo: string) => navigate("/", { state: { scrollTo } });

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className={homeStyles.container}>
      <div className={homeStyles.waterGradient} />

      <header className={homeStyles.header}>
        <div className={homeStyles.headerLeft}>
          <Link to="/" className={homeStyles.logo}>
            <span className={homeStyles.logoMark}>F</span>
            <div className={homeStyles.brand}>
              <span className={homeStyles.logoText}>Finmate</span>
              <span className={homeStyles.tagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân</span>
            </div>
          </Link>
        </div>

        <nav className={homeStyles.nav}>
          <Link to="/" className={homeStyles.navLink}>
            TRANG CHỦ
          </Link>
          <button type="button" onClick={() => goHomeAndScroll("tinh-nang")} className={homeStyles.navLink}>
            TÍNH NĂNG
          </button>
          <button type="button" onClick={() => goHomeAndScroll("tien-ich")} className={homeStyles.navLink}>
            TIỆN ÍCH
          </button>
          <Link to="/support" className={homeStyles.navLink}>
            HỖ TRỢ
          </Link>
        </nav>

        <div className={homeStyles.headerRight}>
          <button type="button" onClick={handleLogin} className={homeStyles.upgradeButton}>
            <span className={homeStyles.buttonText}>Nâng cấp tài khoản</span>
          </button>
          <button type="button" onClick={handleLogin} className={homeStyles.loginButton}>
            <span className={homeStyles.buttonText}>Đăng nhập</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.breadcrumbs}>
          <Link to="/blog" className={styles.breadcrumbLink}>
            Blog
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{post.title}</span>
        </div>

        <div className={styles.postCard}>
          <div className={styles.meta}>
            <span>{new Date(post.date).toLocaleDateString("vi-VN")}</span>
            <span>•</span>
            <span>{post.readingMinutes} phút đọc</span>
          </div>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <div className={styles.tags}>
            {post.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>

          <div className={styles.postContent}>
            {post.content.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className={styles.postActions}>
            <Link to="/blog" className={styles.actionLink}>
              ← Quay lại Blog
            </Link>
            <Link to="/guides" className={styles.actionLink}>
              Xem Hướng dẫn →
            </Link>
          </div>
        </div>
      </main>

      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerGrid}>
          <div className={homeStyles.footerCol}>
            <div className={homeStyles.footerBrand}>
              <span className={homeStyles.logoMark}>F</span>
              <span className={homeStyles.footerLogoText}>Finmate</span>
            </div>
            <p className={homeStyles.footerTagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân</p>
            <p className={homeStyles.footerContact}>
              © 2026 <span className={homeStyles.finmateText}>Finmate</span>. All rights reserved.
            </p>
          </div>
          <div className={homeStyles.footerCol}>
            <h4>Khám phá</h4>
            <Link to="/" className={homeStyles.footerLink}>
              Trang chủ
            </Link>
            <button type="button" onClick={() => goHomeAndScroll("tinh-nang")} className={homeStyles.footerLink}>
              Tính năng
            </button>
            <button type="button" onClick={handleLogin} className={homeStyles.footerLink}>
              Đăng nhập
            </button>
          </div>
          <div className={homeStyles.footerCol}>
            <h4>Tài nguyên</h4>
            <Link to="/support" className={homeStyles.footerLink}>
              Hỗ trợ
            </Link>
            <Link to="/guides" className={homeStyles.footerLink}>
              Hướng dẫn
            </Link>
            <Link to="/blog" className={homeStyles.footerLink}>
              Blog
            </Link>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

