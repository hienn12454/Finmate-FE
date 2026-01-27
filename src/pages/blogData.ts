export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO-like string
  tags: string[];
  readingMinutes: number;
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "meo-ghi-chep-thu-chi-5-phut-moi-ngay",
    title: "Mẹo ghi chép thu chi 5 phút mỗi ngày (không bị nản)",
    excerpt:
      "Một quy trình siêu ngắn giúp bạn duy trì thói quen ghi thu chi: bắt đầu nhỏ, tự động hoá, và đánh giá theo tuần.",
    date: "2026-01-10",
    tags: ["Thói quen", "Thu chi", "Mẹo nhanh"],
    readingMinutes: 6,
    content: [
      "Nếu bạn từng bắt đầu ghi chép thu chi rồi bỏ giữa chừng, vấn đề thường không nằm ở công cụ mà ở quy trình.",
      "Trong Finmate, hãy thiết lập 3 danh mục chi tiêu chính trước: Ăn uống, Di chuyển, Mua sắm. Đừng tạo quá nhiều.",
      "Mỗi ngày chỉ cần 2 lần: 1 lần sau bữa trưa và 1 lần trước khi ngủ. Mỗi lần tối đa 2 phút.",
      "Cuối tuần, mở báo cáo theo danh mục để xem khoản nào vượt ngân sách và đặt giới hạn tuần sau.",
    ],
  },
  {
    slug: "tu-dong-hoa-giao-dich-ngan-hang",
    title: "Tự động hoá giao dịch ngân hàng trong Finmate (ý tưởng demo)",
    excerpt:
      "Mô phỏng quy trình đồng bộ giao dịch từ ngân hàng vào Finmate, phân loại tự động và cảnh báo vượt hạn mức.",
    date: "2026-01-22",
    tags: ["Tự động hoá", "Ngân hàng", "Thu chi"],
    readingMinutes: 6,
    content: [
      "Thiết lập kết nối ngân hàng (giả lập) và phân quyền đọc giao dịch.",
      "Định nghĩa quy tắc phân loại theo nội dung mô tả giao dịch (ví dụ: 'Grab' → Di chuyển).",
      "Cảnh báo khi một danh mục vượt 80% ngân sách tháng.",
      "Báo cáo nhanh mỗi tuần gửi về email (demo).",
    ],
  },
  {
    slug: "toi-uu-dong-tien-cho-freelancer",
    title: "Tối ưu dòng tiền cho freelancer: chia 4 quỹ trong Finmate",
    excerpt:
      "Cách chia thu nhập không đều của freelancer thành 4 quỹ: Thuế, Chi phí, Tiết kiệm, Cá nhân để không bị hụt tiền.",
    date: "2026-01-24",
    tags: ["Freelancer", "Quản lý thu nhập", "Ngân sách"],
    readingMinutes: 7,
    content: [
      "Thiết lập 4 danh mục lớn: Thuế, Chi phí công việc, Tiết kiệm, Cá nhân.",
      "Mỗi lần nhận tiền, tự động phân bổ % vào từng quỹ; đặt nhắc nhở nộp thuế.",
      "Dùng báo cáo theo tháng để xem quỹ nào lệch, điều chỉnh tỷ lệ phân bổ.",
      "Giữ một quỹ dự phòng 1-2 tháng chi phí để tránh thiếu hụt.",
    ],
  },
  {
    slug: "roadmap-tinh-nang-2026",
    title: "Roadmap tính năng Finmate 2026 (bản demo)",
    excerpt:
      "Lộ trình demo: đồng bộ ngân hàng, nhắc nợ thông minh, AI gợi ý ngân sách, dashboard doanh thu/doanh số cho SME.",
    date: "2026-01-26",
    tags: ["Roadmap", "Tính năng mới", "AI"],
    readingMinutes: 5,
    content: [
      "Q1: Cải thiện trải nghiệm nhập giao dịch nhanh, thêm preset danh mục và mẫu ngân sách.",
      "Q2: Đồng bộ ngân hàng (giả lập), cảnh báo giao dịch bất thường, nhắc nợ/thanh toán hoá đơn.",
      "Q3: AI gợi ý ngân sách và tối ưu chi tiêu theo hành vi thực tế.",
      "Q4: Dashboard doanh thu/doanh số cho nhóm khách SME, filter theo ngày/tháng/năm với biểu đồ tổng quan năm.",
    ],
  },
  {
    slug: "ngan-sach-50-30-20-cho-nguoi-moi",
    title: "Ngân sách 50/30/20 cho người mới: áp dụng thế nào cho hợp lý?",
    excerpt:
      "Không phải ai cũng fit với 50/30/20. Bài này giúp bạn tinh chỉnh theo thu nhập, nợ và mục tiêu.",
    date: "2026-01-14",
    tags: ["Ngân sách", "Tài chính cá nhân"],
    readingMinutes: 7,
    content: [
      "50/30/20 là khung tham chiếu: 50% nhu cầu, 30% mong muốn, 20% tiết kiệm/đầu tư.",
      "Nếu bạn đang có nợ, 20% nên ưu tiên trả nợ trước, sau đó mới đến tiết kiệm.",
      "Finmate giúp bạn đặt ngân sách theo danh mục và cảnh báo khi vượt mức, thay vì chỉ nhìn tổng.",
      "Hãy bắt đầu bằng việc theo dõi 2 tuần, sau đó mới quyết định tỷ lệ phù hợp.",
    ],
  },
  {
    slug: "bao-mat-tai-khoan-3-lop",
    title: "Bảo mật tài khoản Finmate: 3 lớp đơn giản nhưng hiệu quả",
    excerpt:
      "Mật khẩu mạnh, thói quen đăng xuất đúng cách, và cách nhận biết hành vi đăng nhập bất thường.",
    date: "2026-01-20",
    tags: ["Bảo mật", "Tài khoản"],
    readingMinutes: 5,
    content: [
      "Lớp 1: Mật khẩu dài (12+ ký tự) và không dùng lại giữa các dịch vụ.",
      "Lớp 2: Không lưu mật khẩu trên thiết bị công cộng; luôn đăng xuất sau khi dùng.",
      "Lớp 3: Kiểm tra lịch sử đăng nhập (khi có) và đổi mật khẩu ngay khi nghi ngờ rò rỉ.",
      "Trong Finmate, bạn có thể đăng xuất nhanh từ Dashboard để đảm bảo an toàn.",
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

