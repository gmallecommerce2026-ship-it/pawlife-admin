// src/components/layout/Header/constants.ts

export const HOT_KEYWORDS = [
  { id: 1, text: "Son môi MAC", isHot: true },
  { id: 2, text: "Iphone 15 Pro Max", isHot: true },
  { id: 3, text: "Quà tặng 20/10", isHot: true },
  { id: 4, text: "Giày Adidas Samba", isHot: false },
  { id: 5, text: "Túi xách local brand", isHot: false },
];

export const SUGGESTED_PRODUCTS = [
  { id: 101, name: "Set Quà L'Occitane", price: "1.250.000₫", image: "https://images.unsplash.com/photo-1556228720-19875c4b8542?auto=format&fit=crop&q=80&w=200", discount: "-10%" },
  { id: 102, name: "Nến Thơm Yankee", price: "450.000₫", image: "https://images.unsplash.com/photo-1602143407151-011141950038?auto=format&fit=crop&q=80&w=200", discount: null },
  { id: 103, name: "Gấu Bông Jellycat", price: "890.000₫", image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&q=80&w=200", discount: "-15%" },
];

export const SEARCH_BANNERS = [
  "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600",
];

// Helper tạo sub-items cho Mega Menu
const createSubItems = (prefix: string, count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}-sub-${i}`,
    name: `${prefix} Loại ${i + 1}`,
    slug: `${prefix}-loai-${i + 1}`,
    children: Array.from({ length: 8 }).map((_, j) => ({
      id: `${prefix}-item-${i}-${j}`,
      name: `${prefix} Sản phẩm ${j + 1}`,
      slug: `${prefix}-san-pham-${j + 1}`,
    })),
  }));
};

export const FULL_CATEGORIES = [
  { id: 'dt', name: 'Điện thoại & Phụ kiện', slug: 'dien-thoai', children: createSubItems('Điện thoại', 12) },
  { id: 'mt', name: 'Máy tính & Laptop', slug: 'may-tinh', children: createSubItems('Laptop', 10) },
  { id: 'tt-nam', name: 'Thời Trang Nam', slug: 'thoi-trang-nam', children: createSubItems('Nam', 15) },
  { id: 'tt-nu', name: 'Thời Trang Nữ', slug: 'thoi-trang-nu', children: createSubItems('Nữ', 15) },
  { id: 'me-be', name: 'Mẹ & Bé', slug: 'me-be', children: createSubItems('Mẹ Bé', 12) },
  { id: 'nha-cua', name: 'Nhà Cửa & Đời Sống', slug: 'nha-cua', children: createSubItems('Nhà cửa', 10) },
  { id: 'my-pham', name: 'Sắc Đẹp & Mỹ Phẩm', slug: 'sac-dep', children: createSubItems('Mỹ phẩm', 12) },
  { id: 'sk', name: 'Sức Khỏe', slug: 'suc-khoe', children: createSubItems('Thuốc', 8) },
  { id: 'giay-dep', name: 'Giày Dép Nam/Nữ', slug: 'giay-dep', children: createSubItems('Giày', 10) },
  { id: 'tui-vi', name: 'Túi Ví Thời Trang', slug: 'tui-vi', children: createSubItems('Túi', 10) },
  { id: 'dong-ho', name: 'Đồng Hồ & Trang Sức', slug: 'dong-ho', children: createSubItems('Đồng hồ', 8) },
  { id: 'the-thao', name: 'Thể Thao & Du Lịch', slug: 'the-thao', children: createSubItems('Sport', 10) },
  { id: 'oto', name: 'Ô Tô & Xe Máy', slug: 'oto-xe-may', children: createSubItems('Xe', 8) },
  { id: 'sach', name: 'Nhà Sách Online', slug: 'nha-sach', children: createSubItems('Sách', 12) },
  { id: 'voucher', name: 'Voucher & Dịch Vụ', slug: 'voucher', children: createSubItems('Voucher', 4) },
];

export const RECIPIENT_DATA = [
  {
    groupName: "Cho Phụ Nữ",
    items: [
      {
        title: "Mẹ & Bà",
        links: ["Quà tặng Mẹ", "Quà tặng Bà", "Mẹ chồng/Mẹ vợ", "Phụ nữ trung niên"],
      },
      {
        title: "Người Yêu & Vợ",
        links: ["Bạn gái mới quen", "Vợ yêu", "Vợ bầu", "Cầu hôn & Tỏ tình"],
      },
      {
        title: "Chị Em & Bạn Bè",
        links: ["Chị gái/Em gái", "Bạn thân nữ", "Đồng nghiệp nữ", "Sếp nữ"],
      },
    ],
  },
  {
    groupName: "Cho Nam Giới",
    items: [
      {
        title: "Bố & Ông",
        links: ["Quà tặng Bố", "Quà tặng Ông", "Bố chồng/Bố vợ", "Đàn ông trung niên"],
      },
      {
        title: "Người Yêu & Chồng",
        links: ["Bạn trai", "Chồng yêu", "Quà kỷ niệm", "Đồ công nghệ"],
      },
      {
        title: "Anh Em & Bạn Bè",
        links: ["Anh trai/Em trai", "Bạn thân nam", "Đồng nghiệp nam", "Sếp nam"],
      },
    ],
  },
  {
    groupName: "Mẹ & Bé",
    items: [
      {
        title: "Mẹ Bầu",
        links: ["Chuẩn bị mang thai", "3 tháng đầu", "3 tháng giữa", "Sắp sinh (3 tháng cuối)", "Combo đi sinh"],
      },
      {
        title: "Mẹ Sau Sinh",
        links: ["Ở cữ", "Chăm sóc da sau sinh", "Lợi sữa & Dinh dưỡng", "Lấy lại vóc dáng"],
      },
      {
        title: "Trẻ Em",
        links: ["Trẻ sơ sinh (0-12m)", "Bé tập đi (1-3y)", "Mẫu giáo (3-5y)", "Tiểu học (6-10y)", "Đồ chơi thông minh"],
      },
    ],
  },
];

// --- 2. DATA CHO MENU "NGÀY LỄ - NHÂN DỊP" ---
export const OCCASION_DATA = [
  {
    groupName: "Ngày Lễ Trong Năm",
    items: [
      {
        title: "Dịp Đầu Năm",
        links: ["Tết Nguyên Đán", "Tết Dương Lịch", "Lễ Tình Nhân (14/2)", "Ngày Thần Tài"],
      },
      {
        title: "Dịp Quốc Tế & Phụ Nữ",
        links: ["Quốc tế Phụ nữ (8/3)", "Quốc tế Hạnh phúc (20/3)", "Ngày của Mẹ (Mother's Day)", "Phụ nữ Việt Nam (20/10)"],
      },
      {
        title: "Dịp Cuối Năm",
        links: ["Ngày của Cha (Father's Day)", "Quốc tế Thiếu nhi (1/6)", "Trung Thu", "Giáng Sinh (Noel)", "Ngày Nhà giáo (20/11)"],
      },
    ],
  },
  {
    groupName: "Sự Kiện Đời Sống",
    items: [
      {
        title: "Sinh Nhật",
        links: ["Sinh nhật Nàng", "Sinh nhật Chàng", "Sinh nhật Bé", "Sinh nhật Bố Mẹ", "Tiệc thôi nôi (1 tuổi)"],
      },
      {
        title: "Kỷ Niệm Tình Yêu",
        links: ["Kỷ niệm 1 năm yêu", "Kỷ niệm ngày cưới", "Hâm nóng tình cảm", "Xin lỗi người yêu"],
      },
      {
        title: "Cột Mốc Quan Trọng",
        links: ["Lễ Tốt Nghiệp", "Ngày tựu trường", "Nhận việc làm mới", "Thăng chức", "Nghỉ hưu"],
      },
    ],
  },
  {
    groupName: "Chúc Mừng & Thăm Hỏi",
    items: [
      {
        title: "Chúc Mừng",
        links: ["Tân gia nhà mới", "Khai trương cửa hàng", "Khởi công xây dựng", "Ra mắt sản phẩm"],
      },
      {
        title: "Sức Khỏe & Thăm Hỏi",
        links: ["Thăm người ốm", "Mừng thọ", "Quà tặng sức khỏe", "Chia buồn"],
      },
    ],
  },
];

// --- 3. DATA CHO MENU "BUSINESS GIFTS" ---
export const BUSINESS_GIFT_DATA = [
  {
    groupName: "Quà Tặng Vinh Danh",
    items: [
      {
        title: "Biểu Trưng Vinh Danh",
        links: ["Cúp pha lê", "Cúp kim loại", "Bảng vinh danh gỗ đồng", "Đĩa lưu niệm", "Huy chương"],
      },
      {
        title: "Khen Thưởng Nhân Sự",
        links: ["Kỷ niệm chương thâm niên", "Nhân viên xuất sắc tháng", "Top Sales", "Quà tặng Cống hiến"],
      },
    ],
  },
  {
    groupName: "Quà Tặng Quảng Cáo",
    items: [
      {
        title: "Vật Phẩm POSM",
        links: ["Mũ bảo hiểm in logo", "Áo mưa quảng cáo", "Ô dù cầm tay", "Túi vải Canvas"],
      },
      {
        title: "Đồ Dùng Văn Phòng",
        links: ["Bút ký cao cấp", "Sổ tay da", "Dây đeo thẻ", "Bình giữ nhiệt", "Cốc sứ in hình"],
      },
    ],
  },
  {
    groupName: "Quà Tặng Sự Kiện",
    items: [
      {
        title: "Hội Nghị & Hội Thảo",
        links: ["Bộ Giftset sổ bút", "Túi đựng tài liệu", "Pin sạc dự phòng", "USB quà tặng"],
      },
      {
        title: "Khuyến Mại & Tri Ân",
        links: ["Quà tặng khách hàng VIP", "Quà tết doanh nghiệp", "Set quà bánh kẹo", "Voucher dịch vụ"],
      },
    ],
  },
];