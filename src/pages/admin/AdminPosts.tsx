import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../api/admin.api";
import type { Post } from "../../api/admin.api";
import styles from "./AdminLayout.module.css";

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "blog" | "guide">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    type: "blog" as "blog" | "guide",
    tags: "",
    readingMinutes: 5,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 10;

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getPosts({
        page,
        limit,
        type: filterType || undefined,
        search: search || undefined,
      });
      const data = (res.data as any)?.data || res.data;
      if (data?.posts) {
        setPosts(data.posts);
        setTotal(data.total || data.posts.length);
      } else {
        setPosts(getFallbackPosts());
        setTotal(8);
      }
    } catch {
      setPosts(getFallbackPosts());
      setTotal(8);
      setError("Không thể kết nối API — đang hiển thị dữ liệu mẫu.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  /* ── Modal ── */
  const openCreate = () => {
    setEditingPost(null);
    setForm({
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      type: "blog",
      tags: "",
      readingMinutes: 5,
    });
    setShowModal(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content.join("\n\n"),
      type: post.type,
      tags: post.tags?.join(", ") || "",
      readingMinutes: post.readingMinutes || 5,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      alert("Vui lòng nhập tiêu đề và slug");
      return;
    }
    try {
      setActionLoading(true);
      const payload = {
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content.split("\n\n").filter(Boolean),
        type: form.type,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        readingMinutes: form.readingMinutes,
      };

      if (editingPost) {
        await adminApi.updatePost(editingPost.id, payload);
      } else {
        await adminApi.createPost(payload);
      }
      setShowModal(false);
      loadPosts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await adminApi.deletePost(id);
      loadPosts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      await adminApi.updatePost(post.id, { isPublished: !post.isPublished });
      loadPosts();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Quản lý bài viết</h1>
        <p className={styles.pageSubtitle}>
          Quản lý Blog & Hướng dẫn trên trang chủ — Tổng: {total} bài viết
        </p>
      </div>

      {error && (
        <div className={styles.card} style={{ borderColor: "rgba(234,179,8,0.3)" }}>
          <p style={{ color: "#fde047", fontSize: "0.85rem" }}>⚠️ {error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: 400 }}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Tìm
          </button>
        </form>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            className={styles.dateInput}
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setPage(1);
            }}
            style={{ width: "auto" }}
          >
            <option value="">Tất cả</option>
            <option value="blog">Blog</option>
            <option value="guide">Hướng dẫn</option>
          </select>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
            + Tạo bài viết
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Đang tải...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <p className={styles.emptyText}>Chưa có bài viết nào</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Loại</th>
                    <th>Tags</th>
                    <th>Thời gian đọc</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: "white", marginBottom: "0.2rem" }}>
                            {post.title.length > 50 ? post.title.slice(0, 50) + "..." : post.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                            /{post.slug}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${post.type === "blog" ? styles.badgeBlue : styles.badgePurple}`}>
                          {post.type === "blog" ? "Blog" : "Hướng dẫn"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {(post.tags || []).slice(0, 3).map((tag, i) => (
                            <span key={i} style={{
                              background: "rgba(255,255,255,0.06)",
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              color: "rgba(255,255,255,0.5)",
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{post.readingMinutes || "—"} phút</td>
                      <td>
                        <span className={`${styles.badge} ${post.isPublished ? styles.badgeGreen : styles.badgeYellow}`}>
                          {post.isPublished ? "Đã đăng" : "Nháp"}
                        </span>
                      </td>
                      <td>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString("vi-VN")
                          : post.date || "—"}
                      </td>
                      <td>
                        <div className={styles.btnGroup}>
                          <button
                            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                            onClick={() => openEdit(post)}
                          >
                            ✏️
                          </button>
                          <button
                            className={`${styles.btn} ${
                              post.isPublished ? styles.btnDanger : styles.btnSuccess
                            } ${styles.btnSmall}`}
                            onClick={() => handleTogglePublish(post)}
                          >
                            {post.isPublished ? "Ẩn" : "Đăng"}
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => handleDelete(post.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ← Trước
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.active : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════ POST MODAL ════════════════════ */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h2 className={styles.modalTitle}>
              {editingPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </h2>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tiêu đề *</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Tiêu đề bài viết"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Slug *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="url-friendly-slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-")
                        .replace(/-+/g, "-"),
                    })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Loại</label>
                <select
                  className={styles.formSelect}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="blog">Blog</option>
                  <option value="guide">Hướng dẫn</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mô tả ngắn</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Mô tả ngắn gọn cho bài viết"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nội dung (mỗi đoạn cách nhau bằng dòng trống)</label>
              <textarea
                className={styles.formTextarea}
                rows={8}
                placeholder="Nội dung bài viết..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tags (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Tag1, Tag2, Tag3"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Thời gian đọc (phút)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  min={1}
                  value={form.readingMinutes}
                  onChange={(e) => setForm({ ...form, readingMinutes: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSave}
                disabled={actionLoading || !form.title.trim() || !form.slug.trim()}
              >
                {actionLoading ? "Đang lưu..." : editingPost ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fallback data ── */
function getFallbackPosts(): Post[] {
  return [
    {
      id: "post1",
      slug: "meo-ghi-chep-thu-chi-5-phut-moi-ngay",
      title: "Mẹo ghi chép thu chi 5 phút mỗi ngày (không bị nản)",
      excerpt: "Một quy trình siêu ngắn giúp bạn duy trì thói quen ghi thu chi.",
      content: ["Nếu bạn từng bắt đầu ghi chép thu chi rồi bỏ giữa chừng..."],
      type: "blog",
      tags: ["Thói quen", "Thu chi", "Mẹo nhanh"],
      readingMinutes: 6,
      date: "2026-01-10",
      isPublished: true,
      createdAt: "2026-01-10T08:00:00Z",
    },
    {
      id: "post2",
      slug: "tu-dong-hoa-giao-dich-ngan-hang",
      title: "Tự động hoá giao dịch ngân hàng trong Finmate",
      excerpt: "Mô phỏng quy trình đồng bộ giao dịch từ ngân hàng.",
      content: ["Thiết lập kết nối ngân hàng (giả lập) và phân quyền..."],
      type: "blog",
      tags: ["Tự động hoá", "Ngân hàng"],
      readingMinutes: 6,
      date: "2026-01-22",
      isPublished: true,
      createdAt: "2026-01-22T08:00:00Z",
    },
    {
      id: "post3",
      slug: "toi-uu-dong-tien-cho-freelancer",
      title: "Tối ưu dòng tiền cho freelancer: chia 4 quỹ",
      excerpt: "Cách chia thu nhập không đều thành 4 quỹ.",
      content: ["Thiết lập 4 danh mục lớn: Thuế, Chi phí, Tiết kiệm, Cá nhân."],
      type: "blog",
      tags: ["Freelancer", "Quản lý thu nhập"],
      readingMinutes: 7,
      date: "2026-01-24",
      isPublished: true,
      createdAt: "2026-01-24T08:00:00Z",
    },
    {
      id: "post4",
      slug: "bat-dau-voi-finmate",
      title: "Bắt đầu với Finmate — Hướng dẫn từng bước",
      excerpt: "Hướng dẫn cơ bản cho người mới bắt đầu.",
      content: ["Đăng ký tài khoản và đăng nhập...", "Thêm nguồn tiền đầu tiên..."],
      type: "guide",
      tags: ["Hướng dẫn", "Bắt đầu"],
      readingMinutes: 8,
      isPublished: true,
      createdAt: "2025-12-01T08:00:00Z",
    },
    {
      id: "post5",
      slug: "ngan-sach-50-30-20",
      title: "Ngân sách 50/30/20 — Áp dụng trong Finmate",
      excerpt: "Phương pháp phân bổ ngân sách phổ biến nhất.",
      content: ["50% cho nhu cầu thiết yếu...", "30% cho mong muốn...", "20% cho tiết kiệm..."],
      type: "guide",
      tags: ["Ngân sách", "50/30/20"],
      readingMinutes: 6,
      isPublished: true,
      createdAt: "2025-12-15T08:00:00Z",
    },
    {
      id: "post6",
      slug: "bao-mat-tai-khoan",
      title: "Bảo mật tài khoản Finmate",
      excerpt: "Các bước bảo vệ tài khoản của bạn.",
      content: ["Sử dụng mật khẩu mạnh...", "Không chia sẻ thông tin đăng nhập..."],
      type: "guide",
      tags: ["Bảo mật"],
      readingMinutes: 5,
      isPublished: false,
      createdAt: "2026-02-01T08:00:00Z",
    },
  ];
}
