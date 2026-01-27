import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../hooks/useAuth";
import homeStyles from "./Homepage.module.css";
import styles from "./Support.module.css";

const toc = [
  { id: "tong-quan", label: "1. Tổng quan" },
  { id: "cai-dat", label: "2. Cài đặt trên iOS/Android" },
  { id: "dang-nhap", label: "3. Đăng nhập & tạo tài khoản" },
  { id: "bao-mat", label: "4. Bảo mật & quyền riêng tư" },
  { id: "lien-he", label: "5. Liên hệ hỗ trợ" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Support() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");
  const navigate = useNavigate();
  const tocColRef = useRef<HTMLElement | null>(null);
  const tocPanelRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  const handleLogin = () => setIsLoginModalOpen(true);
  const goHomeAndScroll = (scrollTo: string) => navigate("/", { state: { scrollTo } });

  const { isAuthenticated, user, signOut } = useAuth();
  const displayName = user?.fullName || user?.email?.split("@")[0] || "bạn";

  const sectionIds = useMemo(() => toc.map((t) => t.id), []);

  useEffect(() => {
    let raf = 0;
    const headerOffset = 120; // khớp scroll-margin-top

    const updateActive = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Scroll-spy theo "heading đã đi qua dưới header"
        // - Ở đầu trang: chưa section nào đi qua -> chọn section đầu tiên
        // - Khi cuộn xuống: chọn section cuối cùng có top <= headerOffset
        const threshold = headerOffset + 1;
        let currentId = sectionIds[0] ?? "";

        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();

          if (rect.top <= threshold) currentId = id;
          else break; // sections theo DOM order
        }

        // Nếu đã cuộn tới gần cuối trang thì luôn chọn section cuối cùng
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportBottom = scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const isAtBottom = viewportBottom >= docHeight - 2;

        if (isAtBottom && sectionIds.length > 0) {
          currentId = sectionIds[sectionIds.length - 1];
        }

        if (currentId) setActiveId(currentId);
      });
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [sectionIds]);

  useEffect(() => {
    // TOC bám theo scroll nhưng dừng ở mép dưới khối content
    let raf = 0;
    const TOP = 150; // khoảng cách dưới header (px)

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const tocCol = tocColRef.current;
        const panel = tocPanelRef.current;
        const article = articleRef.current;
        if (!tocCol || !panel || !article) return;

        const scrollY = window.scrollY || window.pageYOffset;

        const colRect = tocCol.getBoundingClientRect();
        const colTop = colRect.top + scrollY;
        const colLeft = colRect.left;
        const colWidth = colRect.width;

        const articleRect = article.getBoundingClientRect();
        const articleBottom = articleRect.bottom + scrollY;

        const panelHeight = panel.offsetHeight;
        const minY = colTop;
        const maxY = Math.max(minY, articleBottom - panelHeight);
        const desiredY = Math.min(Math.max(scrollY + TOP, minY), maxY);

        // 3 trạng thái: ở trên -> absolute top 0, giữa -> fixed, ở dưới -> absolute đáy
        if (scrollY + TOP <= minY) {
          panel.style.position = "absolute";
          panel.style.top = "0px";
          panel.style.left = "0px";
          panel.style.width = "100%";
        } else if (scrollY + TOP >= maxY) {
          panel.style.position = "absolute";
          panel.style.top = `${desiredY - colTop}px`;
          panel.style.left = "0px";
          panel.style.width = "100%";
        } else {
          panel.style.position = "fixed";
          panel.style.top = `${TOP}px`;
          panel.style.left = `${colLeft}px`;
          panel.style.width = `${colWidth}px`;
        }
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

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

        {isAuthenticated ? (
          <div className={homeStyles.headerRightAuth}>
            <div className={homeStyles.avatarSmall}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className={homeStyles.userGreeting}>Xin chào, {displayName}</span>
            <button
              type="button"
              className={homeStyles.loginButton}
              onClick={() => navigate("/dashboard")}
            >
              <span className={homeStyles.buttonText}>Dashboard</span>
            </button>
            <button
              type="button"
              className={homeStyles.upgradeButton}
              onClick={() => signOut()}
            >
              <span className={homeStyles.buttonText}>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className={homeStyles.headerRight}>
            <button type="button" onClick={handleLogin} className={homeStyles.upgradeButton}>
              <span className={homeStyles.buttonText}>Nâng cấp tài khoản</span>
            </button>
            <button type="button" onClick={handleLogin} className={homeStyles.loginButton}>
              <span className={homeStyles.buttonText}>Đăng nhập</span>
            </button>
          </div>
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            Trung tâm <span className={homeStyles.finmateText}>Finmate</span> Support
          </h1>
          <p className={styles.subtitle}>
            Hướng dẫn cài đặt, sử dụng và xử lý sự cố nhanh. Nếu bạn cần hỗ trợ chuyên sâu, hãy xem mục lục bên dưới hoặc đọc các
            bài hướng dẫn chi tiết.
          </p>
        </div>

        <div className={styles.grid}>
          <aside ref={tocColRef} className={styles.tocCol}>
            <div ref={tocPanelRef} className={styles.toc}>
              <div className={styles.tocHeader}>Mục lục</div>
              <div className={styles.tocList}>
                {toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-toc-id={item.id}
                    className={`${styles.tocItem} ${activeId === item.id ? styles.tocItemActive : ""}`}
                    onClick={() => {
                      setActiveId(item.id);
                      scrollToId(item.id);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className={styles.quickLinks}>
                <div className={styles.quickTitle}>Hướng dẫn nhanh</div>
                <Link className={styles.quickLink} to="/guides/getting-started">
                  Bắt đầu sử dụng Finmate
                </Link>
                <Link className={styles.quickLink} to="/guides/account-security">
                  Bảo mật tài khoản
                </Link>
                <Link className={styles.quickLink} to="/guides/backup-and-sync">
                  Sao lưu & đồng bộ
                </Link>
              </div>
            </div>
          </aside>

          <article ref={articleRef} className={styles.article}>
            <section id="tong-quan" className={styles.section}>
              <h2>Tổng quan</h2>
              <p>
                Finmate giúp bạn theo dõi thu chi, lập ngân sách, quản lý mục tiêu và xem báo cáo tài chính trực quan. Giao diện tối
                ưu để sử dụng trên web và sẵn sàng mở rộng sang mobile.
              </p>
              <div className={styles.callout}>
                Mẹo: Nếu bạn đang ở trang khác và muốn quay về phần “Tính năng” ở Trang chủ, chỉ cần bấm “TÍNH NĂNG” trên header.
              </div>
            </section>

            <section id="cai-dat" className={styles.section}>
              <h2>Cài đặt trên iOS & Android</h2>
              <p>
                Dưới đây là hình minh hoạ màn hình ứng dụng Finmate trên iOS và Android (mockup). Khi có ảnh thật, chỉ cần thay phần
                minh hoạ này bằng screenshot.
              </p>

              <div className={styles.deviceRow}>
                <div className={styles.deviceCard}>
                  <div className={styles.deviceTitle}>Finmate trên iOS</div>
                  <div className={styles.phoneMock} aria-label="Minh hoạ iOS">
                    <div className={styles.phoneTop} />
                    <div className={styles.phoneScreen}>
                      <div className={styles.screenBadge}>iOS</div>
                      <div className={styles.screenTitle}>Tổng quan</div>
                      <div className={styles.screenLine} />
                      <div className={styles.screenLine} />
                      <div className={styles.screenLineShort} />
                      <div className={styles.screenCardGrid}>
                        <div className={styles.screenCard} />
                        <div className={styles.screenCard} />
                        <div className={styles.screenCard} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.deviceCard}>
                  <div className={styles.deviceTitle}>Finmate trên Android</div>
                  <div className={styles.phoneMock} aria-label="Minh hoạ Android">
                    <div className={styles.phoneTop} />
                    <div className={styles.phoneScreen}>
                      <div className={styles.screenBadgeAlt}>Android</div>
                      <div className={styles.screenTitle}>Ngân sách</div>
                      <div className={styles.screenLine} />
                      <div className={styles.screenLine} />
                      <div className={styles.screenLineShort} />
                      <div className={styles.screenChart} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="dang-nhap" className={styles.section}>
              <h2>Đăng nhập & tạo tài khoản</h2>
              <p>
                Bạn có thể đăng nhập bằng email/mật khẩu. Nếu quên mật khẩu, hãy xem bài hướng dẫn bên dưới để khôi phục và tăng
                cường bảo mật.
              </p>
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} to="/guides/getting-started">
                  Xem hướng dẫn bắt đầu
                </Link>
                <Link className={styles.actionLink} to="/guides/account-security">
                  Xem hướng dẫn bảo mật
                </Link>
              </div>
            </section>

            <section id="bao-mat" className={styles.section}>
              <h2>Bảo mật & quyền riêng tư</h2>
              <p>
                Finmate ưu tiên quyền riêng tư. Bạn nên dùng mật khẩu mạnh, bật xác thực bổ sung (khi có), và thường xuyên kiểm tra
                thiết bị đăng nhập.
              </p>
              <div className={styles.callout}>
                Nếu bạn dùng extension “duyệt web chế độ tối”, Finmate đã được tối ưu để chữ và gradient vẫn luôn hiển thị rõ.
              </div>
            </section>

            <section id="lien-he" className={styles.section}>
              <h2>Liên hệ hỗ trợ</h2>
              <p>
                Nếu cần hỗ trợ, bạn có thể gửi email hoặc xem các bài viết trong Blog để cập nhật tính năng mới và các mẹo sử dụng.
              </p>
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} to="/blog">
                  Đi tới Blog
                </Link>
                <a className={styles.actionLink} href="mailto:support@finmate.app">
                  support@finmate.app
                </a>
              </div>
            </section>
          </article>
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

