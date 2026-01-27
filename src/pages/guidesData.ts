export type Guide = {
  slug: string;
  title: string;
  summary: string;
  readingMinutes: number;
  sections: { id: string; title: string; content: string[] }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "getting-started",
    title: "Bắt đầu sử dụng Finmate",
    summary: "Thiết lập tài khoản, tạo danh mục, nhập giao dịch đầu tiên và xem báo cáo cơ bản.",
    readingMinutes: 8,
    sections: [
      {
        id: "tao-tai-khoan",
        title: "1. Tạo tài khoản",
        content: [
          "Mở Finmate và chọn Đăng ký. Điền đầy đủ thông tin và xác nhận.",
          "Sau khi đăng ký, bạn có thể đăng nhập ngay bằng email và mật khẩu.",
        ],
      },
      {
        id: "tao-danh-muc",
        title: "2. Tạo danh mục thu/chi",
        content: [
          "Hãy bắt đầu với ít danh mục để dễ duy trì: Ăn uống, Di chuyển, Hóa đơn, Mua sắm.",
          "Bạn có thể tinh chỉnh dần sau 1–2 tuần sử dụng.",
        ],
      },
      {
        id: "nhap-giao-dich",
        title: "3. Nhập giao dịch đầu tiên",
        content: [
          "Ghi nhanh khoản chi ngay sau khi phát sinh để tránh quên.",
          "Nếu cần, bạn có thể nhập theo ngày khi tổng hợp cuối ngày.",
        ],
      },
      {
        id: "xem-bao-cao",
        title: "4. Xem báo cáo",
        content: [
          "Mở phần Báo cáo để xem tổng thu/chi và phân bổ theo danh mục.",
          "Mẹo: theo dõi theo tuần trước khi chuyển sang theo tháng.",
        ],
      },
    ],
  },
  {
    slug: "bank-sync-demo",
    title: "Đồng bộ ngân hàng (demo) và phân loại tự động",
    summary: "Mô phỏng kết nối ngân hàng, đọc giao dịch và gán danh mục tự động trong Finmate.",
    readingMinutes: 6,
    sections: [
      {
        id: "ket-noi",
        title: "1. Kết nối tài khoản",
        content: [
          "Chọn ngân hàng (demo) và cấp quyền đọc giao dịch.",
          "Finmate không lưu thông tin đăng nhập, chỉ đọc lịch sử giao dịch (mô phỏng).",
        ],
      },
      {
        id: "phan-loai",
        title: "2. Phân loại tự động",
        content: [
          "Định nghĩa quy tắc: từ khóa 'Grab' → Di chuyển; 'Coffee' → Ăn uống.",
          "Nếu không khớp quy tắc, giao dịch sẽ nằm trong danh sách chờ duyệt.",
        ],
      },
      {
        id: "bao-cao",
        title: "3. Báo cáo & cảnh báo",
        content: [
          "Xem báo cáo theo ngày/tháng/năm, lọc theo danh mục.",
          "Nhận cảnh báo khi một danh mục vượt 80% ngân sách tháng.",
        ],
      },
    ],
  },
  {
    slug: "budget-50-30-20",
    title: "Áp dụng khung 50/30/20 trong Finmate",
    summary: "Thiết lập ngân sách với 3 nhóm lớn: Nhu cầu, Mong muốn, Tiết kiệm/Đầu tư.",
    readingMinutes: 5,
    sections: [
      {
        id: "nhom",
        title: "1. Tạo 3 nhóm chính",
        content: [
          "Nhu cầu (50%): tiền nhà, điện nước, ăn uống cần thiết.",
          "Mong muốn (30%): giải trí, mua sắm, du lịch.",
          "Tiết kiệm/Đầu tư (20%): gửi tiết kiệm, quỹ đầu tư, trả nợ.",
        ],
      },
      {
        id: "phan-bo",
        title: "2. Phân bổ và theo dõi",
        content: [
          "Đặt ngân sách tháng cho từng nhóm, chia nhỏ thành danh mục con.",
          "Theo dõi % sử dụng và nhận cảnh báo khi vượt hạn mức.",
        ],
      },
      {
        id: "dieu-chinh",
        title: "3. Điều chỉnh linh hoạt",
        content: [
          "Nếu thu nhập thay đổi, cập nhật tỷ lệ phù hợp (ví dụ 60/25/15).",
          "Xem báo cáo xu hướng để quyết định cắt giảm danh mục nào.",
        ],
      },
    ],
  },
  {
    slug: "sme-dashboard-demo",
    title: "Dashboard doanh thu/doanh số cho SME (demo)",
    summary: "Biểu đồ doanh thu và user với filter theo ngày/tháng/năm, có biểu đồ tổng quan 12 tháng.",
    readingMinutes: 7,
    sections: [
      {
        id: "tong-quan",
        title: "1. Tổng quan dashboard",
        content: [
          "Biểu đồ doanh thu 12 tháng: đường hoặc cột, hiển thị tổng từng tháng.",
          "Biểu đồ user 12 tháng: số user mới, active, churn (demo).",
        ],
      },
      {
        id: "filter",
        title: "2. Bộ lọc ngày/tháng/năm",
        content: [
          "Chọn nhanh: hôm nay, 7 ngày, tháng này, năm nay.",
          "Chọn custom range để xem chi tiết.",
          "Biểu đồ tự cập nhật theo filter.",
        ],
      },
      {
        id: "api-demo",
        title: "3. API giả lập",
        content: [
          "Endpoints demo cho user, staff, revenue, user chart.",
          "Dữ liệu dummy, trả JSON, đủ cho frontend hiển thị và filter.",
        ],
      },
    ],
  },
  {
    slug: "account-security",
    title: "Bảo mật tài khoản Finmate",
    summary: "Mật khẩu mạnh, thói quen an toàn và cách xử lý khi nghi ngờ bị lộ tài khoản.",
    readingMinutes: 6,
    sections: [
      {
        id: "mat-khau",
        title: "1. Mật khẩu mạnh",
        content: [
          "Dùng mật khẩu dài (12+ ký tự), có chữ hoa/thường, số và ký tự đặc biệt.",
          "Không dùng lại mật khẩu giữa các dịch vụ.",
        ],
      },
      {
        id: "thiet-bi",
        title: "2. Thiết bị đăng nhập",
        content: [
          "Không đăng nhập Finmate trên thiết bị công cộng.",
          "Luôn đăng xuất sau khi dùng máy lạ hoặc máy dùng chung.",
        ],
      },
      {
        id: "xu-ly",
        title: "3. Khi nghi ngờ bị lộ",
        content: [
          "Đổi mật khẩu ngay lập tức.",
          "Kiểm tra hoạt động đăng nhập gần đây (khi có) và đăng xuất khỏi các thiết bị không nhận ra.",
        ],
      },
    ],
  },
  {
    slug: "backup-and-sync",
    title: "Sao lưu & đồng bộ",
    summary: "Nguyên tắc sao lưu dữ liệu và cách đảm bảo dữ liệu không bị mất khi đổi thiết bị.",
    readingMinutes: 7,
    sections: [
      {
        id: "vi-sao",
        title: "1. Vì sao cần sao lưu?",
        content: [
          "Thiết bị có thể hỏng hoặc mất, vì vậy sao lưu giúp bạn khôi phục dữ liệu.",
          "Đồng bộ giúp bạn xem dữ liệu trên nhiều thiết bị một cách nhất quán.",
        ],
      },
      {
        id: "nguyen-tac",
        title: "2. Nguyên tắc sao lưu",
        content: [
          "Sao lưu định kỳ theo tuần/tháng.",
          "Đặt nhắc nhở để tránh quên và kiểm tra file sao lưu có mở được hay không.",
        ],
      },
      {
        id: "meo",
        title: "3. Mẹo khi đổi thiết bị",
        content: [
          "Đăng xuất ở thiết bị cũ trước khi chuyển sang thiết bị mới.",
          "Đăng nhập lại và xác thực (khi có) để đảm bảo an toàn.",
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}

