import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import LoginModal from "../components/LoginModal";
import homeStyles from "./Homepage.module.css";
import styles from "./Guides.module.css";
import { getGuideBySlug } from "./guidesData";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function GuideArticle() {
  const { slug } = useParams();
  const guide = useMemo(() => (slug ? getGuideBySlug(slug) : undefined), [slug]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const navigate = useNavigate();
  const tocColRef = useRef<HTMLElement | null>(null);
  const tocPanelRef = useRef<HTMLDivElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  const handleLogin = () => setIsLoginModalOpen(true);
  const goHomeAndScroll = (scrollTo: string) => navigate("/", { state: { scrollTo } });

  if (!guide) return <Navigate to="/guides" replace />;

  useEffect(() => {
    // Default active: section đầu tiên
    const first = guide.sections[0]?.id;
    if (first) setActiveId(first);

    let raf = 0;
    const headerOffset = 120; // khớp scroll-margin-top
    const sectionIds = guide.sections.map((s) => s.id);

    const updateActive = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Scroll-spy theo "heading đã đi qua dưới header"
        // - Ở đầu trang: chọn section đầu tiên
        // - Khi cuộn xuống: chọn section cuối cùng có top <= headerOffset
        const threshold = headerOffset + 1;
        let currentId = sectionIds[0] ?? "";

        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();

          if (rect.top <= threshold) currentId = id;
          else break;
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
  }, [guide.sections]);

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
  }, [guide.title]);

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
          <Link to="/guides" className={styles.breadcrumbLink}>
            Hướng dẫn
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{guide.title}</span>
        </div>

        <div className={styles.articleGrid}>
          <aside ref={tocColRef} className={styles.tocCol}>
            <div ref={tocPanelRef} className={styles.toc}>
              <div className={styles.tocHeader}>Mục lục</div>
              <div className={styles.tocList}>
                {guide.sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    data-toc-id={s.id}
                    className={`${styles.tocItem} ${activeId === s.id ? styles.tocItemActive : ""}`}
                    onClick={() => {
                      setActiveId(s.id);
                      scrollToId(s.id);
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <article ref={articleRef} className={styles.postCard}>
            <div className={styles.cardMeta}>{guide.readingMinutes} phút đọc</div>
            <h1 className={styles.postTitle}>{guide.title}</h1>

            <div className={styles.postContent}>
              {guide.sections.map((s) => (
                <section key={s.id} id={s.id} className={styles.section}>
                  <h2>{s.title}</h2>
                  {s.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </section>
              ))}
            </div>

            <div className={styles.postActions}>
              <Link to="/guides" className={styles.actionLink}>
                ← Quay lại danh sách
              </Link>
              <Link to="/support" className={styles.actionLink}>
                Trung tâm Hỗ trợ →
              </Link>
            </div>
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

