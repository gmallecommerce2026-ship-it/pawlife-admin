// Dữ liệu demo cho FE mock. Thời gian tương đối so với hiện tại để luôn có dữ liệu "mới".
type Row = Record<string, any>;

export function seedStore(): Record<string, Row[]> {
  const now = Date.now();
  const DAY = 86400_000;
  const ago = (n: number) => new Date(now - n * DAY);
  const ahead = (n: number) => new Date(now + n * DAY);

  // ---- Người dùng ----
  const users: Row[] = [
    { id: "u_admin", userName: "admin@pawly.local", fullName: "Quản trị viên", role: "ADMIN", phoneNumber: "0901000001", createdAt: ago(200), lastActiveAt: ago(0) },
    { id: "u_support", userName: "support@pawly.local", fullName: "Nguyễn Hỗ Trợ", role: "ADMIN", phoneNumber: "0901000002", createdAt: ago(120), lastActiveAt: ago(1) },
    { id: "u_owner1", userName: "linh.shelter@pawly.local", fullName: "Trần Thu Linh", role: "SHELTER_ADMIN", phoneNumber: "0902000001", createdAt: ago(150), lastActiveAt: ago(0) },
    { id: "u_owner2", userName: "minh.shelter@pawly.local", fullName: "Lê Quang Minh", role: "SHELTER_ADMIN", phoneNumber: "0902000002", createdAt: ago(140), lastActiveAt: ago(3) },
    { id: "u_c1", userName: "an.nguyen@gmail.com", fullName: "Nguyễn Văn An", role: "CUSTOMER", phoneNumber: "0913111222", createdAt: ago(90), lastActiveAt: ago(0) },
    { id: "u_c2", userName: "binh.tran@gmail.com", fullName: "Trần Bình", role: "CUSTOMER", phoneNumber: "0987654321", createdAt: ago(80), lastActiveAt: ago(2) },
    { id: "u_c3", userName: "chi.le@gmail.com", fullName: "Lê Chi", role: "CUSTOMER", phoneNumber: "0977112233", createdAt: ago(60), lastActiveAt: ago(5), lockedUntil: ahead(5), lockedPermanently: false, lockReason: "Spam đánh giá" },
    { id: "u_c4", userName: "dung.pham@gmail.com", fullName: "Phạm Dũng", role: "CUSTOMER", phoneNumber: "0966445566", createdAt: ago(50), lastActiveAt: ago(1) },
    { id: "u_c5", userName: "ha.vo@gmail.com", fullName: "Võ Hà", role: "CUSTOMER", phoneNumber: "0988776655", createdAt: ago(40), lastActiveAt: ago(4) },
    { id: "u_c6", userName: "khoa.ngo@gmail.com", fullName: "Ngô Khoa", role: "CUSTOMER", phoneNumber: "0933221100", createdAt: ago(30), lastActiveAt: ago(10) },
  ];

  const adminRoles: Row[] = [
    { id: "ar_1", userId: "u_admin", role: "SUPER_ADMIN", createdAt: ago(200) },
    { id: "ar_2", userId: "u_support", role: "SUPPORT", createdAt: ago(120) },
  ];

  // ---- Shelter ----
  const shelters: Row[] = [
    { id: "sh_1", name: "Mái Ấm Bốn Chân", email: "contact@maiam4chan.vn", phone: "0281234567", address: "Quận 3, TP.HCM", lat: 10.7836, lng: 106.6862, description: "Cứu hộ và tìm nhà cho chó mèo bị bỏ rơi.", imageUrl: null, status: "APPROVED", statusNote: null, ownerId: "u_owner1", createdAt: ago(120) },
    { id: "sh_2", name: "Nhà Chó Mèo Hạnh Phúc", email: "hello@hanhphuc.vn", phone: "0287654321", address: "Quận Bình Thạnh, TP.HCM", lat: 10.8031, lng: 106.7071, description: "Shelter mới đăng ký.", imageUrl: null, status: "PENDING", statusNote: null, ownerId: "u_owner2", createdAt: ago(3) },
    { id: "sh_3", name: "Cứu Hộ Thú Cưng Bình Dương", email: "cuuho@bd-pet.vn", phone: "0274111222", address: "Thủ Dầu Một, Bình Dương", lat: 10.9804, lng: 106.6519, description: "Chăm sóc và nhận nuôi.", imageUrl: null, status: "APPROVED", statusNote: null, ownerId: "u_owner1", createdAt: ago(95) },
    { id: "sh_4", name: "Trạm Cứu Trợ Đà Nẵng", email: "tram@danang-rescue.vn", phone: "0236333444", address: "Hải Châu, Đà Nẵng", lat: 16.0544, lng: 108.2022, description: "Cứu trợ động vật vùng bão lũ.", imageUrl: null, status: "PENDING", statusNote: null, ownerId: "u_owner2", createdAt: ago(1) },
    { id: "sh_5", name: "Cộng Đồng Yêu Mèo Hà Nội", email: "meo@hanoi-cat.vn", phone: "0241555666", address: "Cầu Giấy, Hà Nội", lat: 21.0285, lng: 105.7964, description: "Chăm sóc mèo hoang.", imageUrl: null, status: "SUSPENDED", statusNote: "Vi phạm: đăng nội dung không phù hợp", ownerId: "u_owner2", createdAt: ago(200) },
    { id: "sh_6", name: "Shelter Thử Nghiệm", email: "test@example.com", phone: null, address: "Hà Nội", lat: 21.02, lng: 105.8, description: null, imageUrl: null, status: "REJECTED", statusNote: "Thiếu giấy phép hoạt động", ownerId: "u_owner1", createdAt: ago(25) },
  ];

  const pets: Row[] = [
    { id: "pet_1", shelterId: "sh_1", name: "Mít", species: "Chó", breed: "Golden", status: "AVAILABLE", createdAt: ago(60) },
    { id: "pet_2", shelterId: "sh_1", name: "Bông", species: "Mèo", breed: "Mèo ta", status: "RESERVED", createdAt: ago(40) },
    { id: "pet_3", shelterId: "sh_3", name: "Lu", species: "Chó", breed: "Phốc sóc", status: "ADOPTED", createdAt: ago(70) },
    { id: "pet_4", shelterId: "sh_3", name: "Mực", species: "Mèo", breed: "Mèo ta", status: "AVAILABLE", createdAt: ago(10) },
    { id: "pet_5", shelterId: "sh_1", name: "Đậu", species: "Chó", breed: "Corgi", status: "HIDDEN", createdAt: ago(15) },
  ];

  const applications: Row[] = [
    { id: "app_1", shelterId: "sh_1", petId: "pet_1", applicantId: "u_c1", status: "NEW", note: "Có sân vườn rộng", createdAt: ago(2), updatedAt: ago(2) },
    { id: "app_2", shelterId: "sh_1", petId: "pet_2", applicantId: "u_c2", status: "IN_REVIEW", note: null, createdAt: ago(6), updatedAt: ago(5) },
    { id: "app_3", shelterId: "sh_3", petId: "pet_3", applicantId: "u_c4", status: "APPROVED", note: null, createdAt: ago(30), updatedAt: ago(20) },
  ];

  const shelterStaff: Row[] = [
    { id: "ss_1", shelterId: "sh_1", userId: "u_owner1", role: "MANAGER", createdAt: ago(120) },
    { id: "ss_2", shelterId: "sh_1", userId: "u_c5", role: "STAFF", createdAt: ago(50) },
  ];

  // ---- Organizer & sự kiện ----
  const organizers: Row[] = [
    { id: "org_1", handle: "pawlycommunity", name: "Pawly Community", bio: "Cộng đồng yêu thú cưng.", avatarUrl: null, coverUrl: null, isVerified: true, createdAt: ago(200) },
    { id: "org_2", handle: "yeuchohcm", name: "Hội Yêu Chó HCM", bio: "Tổ chức đi dạo, huấn luyện.", avatarUrl: null, coverUrl: null, isVerified: false, createdAt: ago(100) },
    { id: "org_3", handle: "meophov", name: "Mèo Phố", bio: "Triển lãm và chăm sóc mèo.", avatarUrl: null, coverUrl: null, isVerified: true, createdAt: ago(80) },
  ];

  const events: Row[] = [
    { id: "ev_1", titleVi: "Ngày hội nhận nuôi cuối tuần", titleEn: "Weekend adoption fair", descriptionVi: "Gặp gỡ các bé đang chờ nhà mới.", descriptionEn: "Meet pets looking for a new home.", status: "PUBLISHED", pinned: true, startsAt: ahead(3), endsAt: ahead(3.2), area: "TP.HCM", locationName: "Công viên Lê Văn Tám", lat: 10.7917, lng: 106.6912, coverUrl: null, galleryUrls: null, organizerId: "org_1", shelterId: "sh_1", createdAt: ago(10), updatedAt: ago(2) },
    { id: "ev_2", titleVi: "Dạo bộ cùng chó", titleEn: "Dog walk", descriptionVi: "Đi bộ quanh hồ.", descriptionEn: "Walk around the lake.", status: "PUBLISHED", pinned: false, startsAt: ahead(10), endsAt: null, area: "Hà Nội", locationName: "Hồ Tây", lat: 21.0583, lng: 105.8232, coverUrl: null, galleryUrls: null, organizerId: "org_2", shelterId: null, createdAt: ago(8), updatedAt: ago(8) },
    { id: "ev_3", titleVi: "Khóa học sơ cứu thú cưng", titleEn: "Pet first-aid course", descriptionVi: "Kiến thức sơ cứu cơ bản.", descriptionEn: "Basic first aid.", status: "DRAFT", pinned: false, startsAt: ahead(20), endsAt: null, area: "TP.HCM", locationName: null, lat: null, lng: null, coverUrl: null, galleryUrls: null, organizerId: "org_1", shelterId: null, createdAt: ago(1), updatedAt: ago(1) },
    { id: "ev_4", titleVi: "Triển lãm mèo Đà Nẵng", titleEn: "Da Nang cat show", descriptionVi: "Triển lãm mèo quốc tế.", descriptionEn: "International cat show.", status: "HIDDEN", pinned: false, startsAt: ahead(6), endsAt: null, area: "Đà Nẵng", locationName: "Trung tâm triển lãm", lat: 16.0399, lng: 108.2466, coverUrl: null, galleryUrls: null, organizerId: "org_3", shelterId: null, statusNote: "Chờ xác minh địa điểm", createdAt: ago(12), updatedAt: ago(4) },
    { id: "ev_5", titleVi: "Chạy bộ vì động vật", titleEn: "Run for animals", descriptionVi: "Chạy gây quỹ.", descriptionEn: "Charity run.", status: "CANCELLED", pinned: false, startsAt: ahead(2), endsAt: null, area: "TP.HCM", locationName: "Thảo Cầm Viên", lat: 10.7878, lng: 106.7052, coverUrl: null, galleryUrls: null, organizerId: "org_2", shelterId: null, statusNote: "Thời tiết xấu", createdAt: ago(20), updatedAt: ago(1) },
    { id: "ev_6", titleVi: "Buổi tiệc năm ngoái", titleEn: "Last year's party", descriptionVi: "Đã kết thúc.", descriptionEn: "Finished.", status: "ARCHIVED", pinned: false, startsAt: ago(60), endsAt: null, area: "TP.HCM", locationName: null, lat: null, lng: null, coverUrl: null, galleryUrls: null, organizerId: "org_1", shelterId: null, createdAt: ago(90), updatedAt: ago(60) },
  ];

  const eventInterests: Row[] = [
    { id: "ei_1", eventId: "ev_1", userId: "u_c1", createdAt: ago(5) },
    { id: "ei_2", eventId: "ev_1", userId: "u_c2", createdAt: ago(4) },
    { id: "ei_3", eventId: "ev_1", userId: "u_c4", createdAt: ago(3) },
    { id: "ei_4", eventId: "ev_2", userId: "u_c1", createdAt: ago(2) },
    { id: "ei_5", eventId: "ev_5", userId: "u_c2", createdAt: ago(3) },
  ];
  const eventHides: Row[] = [{ id: "eh_1", eventId: "ev_1", userId: "u_c5", createdAt: ago(2) }];

  // ---- Pawly Place ----
  const placeCategories: Row[] = [
    { id: "pc_1", name: "Cà phê", isVisible: true, sortOrder: 1 },
    { id: "pc_2", name: "Khách sạn thú cưng", isVisible: true, sortOrder: 2 },
    { id: "pc_3", name: "Công viên", isVisible: true, sortOrder: 3 },
    { id: "pc_4", name: "Thú y", isVisible: true, sortOrder: 4 },
    { id: "pc_5", name: "Spa", isVisible: false, sortOrder: 5 },
  ];
  const amenities: Row[] = [
    { id: "am_1", name: "Wifi", isVisible: true },
    { id: "am_2", name: "Chỗ ngồi ngoài trời", isVisible: true },
    { id: "am_3", name: "Chỗ để xe", isVisible: true },
    { id: "am_4", name: "Khu vui chơi", isVisible: true },
    { id: "am_5", name: "Bãi tắm", isVisible: false },
  ];

  const places: Row[] = [
    { id: "pl_1", name: "Cà Phê Chó Vàng", category: "Cà phê", city: "TP.HCM", address: "8 Nguyễn Huệ, Q1, TP.HCM", lat: 10.7741, lng: 106.7028, phone: "0283000111", description: "Quán cà phê thân thiện thú cưng.", openingHours: "07:00-22:00", amenities: "Wifi,Chỗ ngồi ngoài trời", menuText: "Cà phê sữa - 35000", coverUrl: null, imageUrls: null, rating: 0, reviewCount: 0, isHidden: false, hiddenReason: null, createdAt: ago(60) },
    { id: "pl_2", name: "Pet Hotel Sài Gòn", category: "Khách sạn thú cưng", city: "TP.HCM", address: "22 Điện Biên Phủ, Q3", lat: 10.7872, lng: 106.6905, phone: "0283999888", description: "Lưu trú cho thú cưng.", openingHours: "08:00-20:00", amenities: "Chỗ để xe", menuText: null, coverUrl: null, imageUrls: null, rating: 0, reviewCount: 0, isHidden: false, hiddenReason: null, createdAt: ago(45) },
    { id: "pl_3", name: "Hồ Bơi Chó Đà Nẵng", category: "Công viên", city: "Đà Nẵng", address: "Mỹ Khê, Đà Nẵng", lat: 16.0603, lng: 108.2470, phone: null, description: "Hồ bơi cho chó.", openingHours: null, amenities: "Bãi tắm", menuText: null, coverUrl: null, imageUrls: null, rating: 0, reviewCount: 0, isHidden: true, hiddenReason: "Đang kiểm tra an toàn", createdAt: ago(30) },
    { id: "pl_4", name: "Cà Phê Chó Vàng Chi nhánh 2", category: "Cà phê", city: "TP.HCM", address: "10 Nguyễn Huệ, Q1, TP.HCM", lat: 10.7742, lng: 106.7029, phone: null, description: "Chi nhánh mới.", openingHours: null, amenities: null, menuText: null, coverUrl: null, imageUrls: null, rating: 0, reviewCount: 0, isHidden: false, hiddenReason: null, createdAt: ago(5) },
    { id: "pl_5", name: "Phòng Khám Thú Y Bình Minh", category: "Thú y", city: "Hà Nội", address: "5 Tràng Tiền, Hoàn Kiếm", lat: 21.0245, lng: 105.8540, phone: "0243888777", description: "Khám và chăm sóc thú cưng.", openingHours: "08:00-18:00", amenities: "Chỗ để xe,Wifi", menuText: null, coverUrl: null, imageUrls: null, rating: 0, reviewCount: 0, isHidden: false, hiddenReason: null, createdAt: ago(90) },
  ];

  const placePets: Row[] = [
    { id: "pp_pet_1", placeId: "pl_1", name: "Mochi", species: "Mèo", imageUrl: null, isActive: true, createdAt: ago(20) },
    { id: "pp_pet_2", placeId: "pl_1", name: "Gấu", species: "Chó", imageUrl: null, isActive: true, createdAt: ago(18) },
  ];

  const placeReviews: Row[] = [
    { id: "pr_1", placeId: "pl_1", authorId: "u_c1", rating: 5, content: "Quán rất thoáng, bé Mochi dễ thương.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(15) },
    { id: "pr_2", placeId: "pl_1", authorId: "u_c2", rating: 4, content: "Cà phê ngon, chỗ ngồi thoải mái.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(12) },
    { id: "pr_3", placeId: "pl_1", authorId: "u_c3", rating: 1, content: "Mua tour giá rẻ tại link này, liên hệ ngay!!!", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(3) },
    { id: "pr_4", placeId: "pl_2", authorId: "u_c4", rating: 4, content: "Nhân viên chăm sóc rất kỹ.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(9) },
    { id: "pr_5", placeId: "pl_2", authorId: "u_c5", rating: 4, content: "Giá hợp lý.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(7) },
    { id: "pr_6", placeId: "pl_3", authorId: "u_c3", rating: 2, content: "Nước hơi bẩn.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(6) },
    { id: "pr_7", placeId: "pl_4", authorId: "u_c6", rating: 4, content: "Không gian mới, đẹp.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(2) },
    { id: "pr_8", placeId: "pl_5", authorId: "u_c1", rating: 5, content: "Bác sĩ tận tâm.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(40) },
    { id: "pr_9", placeId: "pl_5", authorId: "u_c2", rating: 5, content: "Phòng khám sạch sẽ.", imageUrls: null, isRemoved: false, removedReason: null, createdAt: ago(35) },
  ];
  // Điểm đánh giá tính từ các đánh giá chưa bị gỡ (giống recalcPlaceRating)
  for (const p of places) {
    const rs = placeReviews.filter((r) => r.placeId === p.id && !r.isRemoved);
    p.reviewCount = rs.length;
    p.rating = rs.length ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10 : 0;
  }

  const proposals: Row[] = [
    { id: "pp_1", submitterId: "u_c1", name: "Cà phê Mèo Nâu", category: "Cà phê", address: "12 Nguyễn Huệ, Q1, TP.HCM", lat: 10.7745, lng: 106.7030, phone: "0909123456", website: null, description: "Quán có mèo thân thiện.", status: "PENDING", rejectReason: null, infoRequest: null, placeId: null, createdAt: ago(5), updatedAt: ago(5) },
    { id: "pp_2", submitterId: "u_c2", name: "Pet Spa Hoa Sen", category: "Spa", address: "45 Lê Lợi, Q1, TP.HCM", lat: 10.7735, lng: 106.7024, phone: "0908111222", website: "https://hoasen.example", description: "Tắm, cắt tỉa lông cho chó mèo.", status: "PENDING", rejectReason: null, infoRequest: null, placeId: null, createdAt: ago(2), updatedAt: ago(2) },
    { id: "pp_3", submitterId: "u_c4", name: "Công viên Thú Cưng Thủ Thiêm", category: "Công viên", address: "Thủ Thiêm, TP.Thủ Đức", lat: 10.7833, lng: 106.7214, phone: null, website: null, description: "Khu vui chơi rộng.", status: "NEEDS_INFO", rejectReason: null, infoRequest: "Cần bổ sung ảnh và giờ mở cửa", placeId: null, createdAt: ago(9), updatedAt: ago(7) },
    { id: "pp_4", submitterId: "u_c6", name: "Quán Bar Chó Điên", category: "Cà phê", address: "Q7, TP.HCM", lat: 10.73, lng: 106.72, phone: null, website: null, description: null, status: "REJECTED", rejectReason: "Không liên quan đến thú cưng", infoRequest: null, placeId: null, createdAt: ago(15), updatedAt: ago(14) },
  ];

  // ---- Báo cáo ----
  const reports: Row[] = [
    { id: "rp_1", targetType: "EVENT", targetId: "ev_2", reporterId: "u_c1", reason: "Thu phí tham gia không rõ ràng", status: "NEW", createdAt: ago(1), updatedAt: ago(1) },
    { id: "rp_2", targetType: "PLACE_REVIEW", targetId: "pr_3", reporterId: "u_c1", reason: "Spam quảng cáo", status: "NEW", createdAt: ago(2), updatedAt: ago(2) },
    { id: "rp_3", targetType: "PLACE_REVIEW", targetId: "pr_3", reporterId: "u_c2", reason: "Ngôn từ không phù hợp", status: "NEW", createdAt: ago(1), updatedAt: ago(1) },
    { id: "rp_4", targetType: "PLACE_REVIEW", targetId: "pr_3", reporterId: "u_c4", reason: "Spam", status: "IN_PROGRESS", createdAt: ago(3), updatedAt: ago(2) },
    { id: "rp_5", targetType: "PLACE_REVIEW", targetId: "pr_6", reporterId: "u_c5", reason: "Đánh giá giả", status: "NEW", createdAt: ago(4), updatedAt: ago(4) },
    { id: "rp_6", targetType: "PET_CONTENT", targetId: "pet_5", reporterId: "u_c6", reason: "Ảnh thú cưng không phù hợp", status: "NEW", createdAt: ago(2), updatedAt: ago(2) },
    { id: "rp_7", targetType: "SHELTER", targetId: "sh_2", reporterId: "u_c2", reason: "Thông tin liên hệ có vẻ sai", status: "NEW", createdAt: ago(5), updatedAt: ago(5) },
    { id: "rp_8", targetType: "PLACE", targetId: "pl_4", reporterId: "u_c3", reason: "Trùng với địa điểm khác", status: "NEW", createdAt: ago(6), updatedAt: ago(6) },
    { id: "rp_9", targetType: "QR_TAG_SCAN", targetId: "tag_xyz", reporterId: "u_c4", reason: "Tag bị quét bất thường", status: "RESOLVED", createdAt: ago(10), updatedAt: ago(9) },
    { id: "rp_10", targetType: "GENERAL_REVIEW", targetId: "gr_1", reporterId: "u_c5", reason: "Đánh giá xúc phạm", status: "DISMISSED", createdAt: ago(12), updatedAt: ago(11) },
  ];

  // ---- Nhật ký thao tác ----
  const auditLogs: Row[] = [
    { id: "al_1", adminId: "u_admin", action: "SHELTER_APPROVE", targetType: "SHELTER", targetId: "sh_1", before: JSON.stringify({ status: "PENDING" }), after: JSON.stringify({ status: "APPROVED" }), note: "Hồ sơ đầy đủ", ip: "203.0.113.10", outcome: "SUCCESS", createdAt: ago(20) },
    { id: "al_2", adminId: "u_support", action: "SUPPORT_START", targetType: "SHELTER", targetId: "sh_1", before: null, after: null, note: "Kiểm tra đơn nhận nuôi", ip: "203.0.113.11", outcome: "SUCCESS", createdAt: ago(3) },
    { id: "al_3", adminId: "u_support", action: "ACCESS_DENIED", targetType: "PERMISSION", targetId: "admins.manage", before: null, after: null, note: "Truy cập bị từ chối (thiếu quyền)", ip: "203.0.113.11", outcome: "DENIED", createdAt: ago(1) },
    { id: "al_4", adminId: "u_admin", action: "EVENT_PIN_TOGGLE", targetType: "EVENT", targetId: "ev_1", before: JSON.stringify({ pinned: false }), after: JSON.stringify({ pinned: true }), note: "Sự kiện nổi bật", ip: "203.0.113.10", outcome: "SUCCESS", createdAt: ago(4) },
    { id: "al_5", adminId: "u_admin", action: "USER_LOCK_7D", targetType: "USER", targetId: "u_c3", before: JSON.stringify({ lockedUntil: null }), after: JSON.stringify({ lockedUntil: ahead(5).toISOString() }), note: "Spam đánh giá", ip: "203.0.113.10", outcome: "SUCCESS", createdAt: ago(2) },
  ];

  const notifications: Row[] = [
    { id: "nt_1", userId: "u_owner1", title: "Shelter đã được duyệt", body: "Hồ sơ shelter của bạn đã được duyệt.", readAt: null, createdAt: ago(20) },
    { id: "nt_2", userId: "u_c4", title: "Cần bổ sung thông tin đề xuất", body: "Công viên Thú Cưng Thủ Thiêm: cần bổ sung ảnh và giờ mở cửa.", readAt: null, createdAt: ago(7) },
  ];

  // ---- Thống kê cài đặt app (dữ liệu giả, sinh ngẫu nhiên có seed) ----
  let s = 42;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const installs: Row[] = [];
  for (let i = 0; i < 180; i++) {
    const installedDaysAgo = Math.floor(rnd() * 60);
    const installedAt = ago(installedDaysAgo + rnd());
    const uninstalled = rnd() < 0.12;
    const lastSeenDays = uninstalled ? installedDaysAgo * rnd() : rnd() * Math.min(installedDaysAgo, 30);
    installs.push({
      id: `ins_${i}`,
      deviceId: `device_${i}`,
      userId: null,
      platform: rnd() < 0.6 ? "iOS" : "Android",
      installedAt,
      uninstalledAt: uninstalled ? ago(Math.max(0, lastSeenDays)) : null,
      lastSeenAt: ago(Math.max(0, lastSeenDays)),
    });
  }
  // Vài thiết bị đang online
  for (let i = 0; i < 9; i++) installs[i].lastSeenAt = new Date(now - rnd() * 4 * 60_000);
  for (let i = 9; i < 40; i++) installs[i].lastSeenAt = new Date(now - rnd() * 20 * 3600_000);
  installs.forEach((r) => { if (r.uninstalledAt) r.lastSeenAt = r.uninstalledAt; });

  return {
    User: users,
    AdminRoleAssignment: adminRoles,
    Shelter: shelters,
    Pet: pets,
    AdoptionApplication: applications,
    ShelterStaff: shelterStaff,
    Organizer: organizers,
    Event: events,
    EventInterest: eventInterests,
    EventHide: eventHides,
    PlaceCategory: placeCategories,
    Amenity: amenities,
    Place: places,
    PlacePet: placePets,
    PlaceReview: placeReviews,
    PlaceProposal: proposals,
    Report: reports,
    AuditLog: auditLogs,
    Notification: notifications,
    AppInstall: installs,
  };
}
