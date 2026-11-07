# Pawly Admin Dashboard

## CHẾ ĐỘ FE MOCK (chạy ngay, không cần backend hay database)

```bash
npm install
npx prisma generate     # chỉ sinh type, KHÔNG cần database
npm run dev
```

`.env.local` đã có `NEXT_PUBLIC_MOCK=1`. Vào `http://localhost:3000/login` và bấm **Đăng nhập demo (Quản trị viên)**.

- Dữ liệu giả nằm trong bộ nhớ (`src/lib/mock/seed.ts`), có shelter, sự kiện, organizer, đề xuất địa điểm, địa điểm, đánh giá, báo cáo, nhật ký, lượt cài app.
- Thống kê app nằm trong Tổng quan, tách riêng **App Store** (platform `iOS`) và **Google Play** (platform `Android`).
- Mọi thao tác (duyệt, sửa, ẩn, khóa, tạo...) có hiệu lực ngay trong phiên. Khởi động lại server sẽ đặt lại dữ liệu demo.
- Ảnh tải lên chỉ xem trước cục bộ, không upload.
- Các trang `/shelter/*` của shelter vẫn gọi backend nên sẽ không có dữ liệu trong chế độ mock.

Để chuyển sang backend thật: xóa `.env.local` (hoặc đặt `NEXT_PUBLIC_MOCK=0`), cấu hình `DATABASE_URL`, rồi làm theo các mục bên dưới.

# Hướng dẫn với backend thật

Khu quản trị nằm tại `/admin/*`. `role = ADMIN` là cấp nền tảng cao nhất: quản lý toàn bộ app và mọi shelter, đồng thời vào được dashboard shelter (`/shelter/*`) như một shelter admin.

## 1. Cài đặt

```bash
npm install
# Đặt DATABASE_URL trong .env (MySQL theo schema.prisma)
npx prisma migrate dev --name admin_dashboard   # tạo bảng mới
npx prisma generate
```

## 2. Tạo quản trị cao nhất đầu tiên

Đăng ký một tài khoản bình thường trên web, sau đó:

```bash
npm run admin:grant -- email@cuaban.com
```

Đăng nhập rồi vào `/admin/dashboard`. Quản trị cao nhất có thể thêm admin khác tại `/admin/admins`.

### Tài khoản dev nhanh

```bash
npm run seed:admin
```

Tạo tài khoản quản trị cao nhất: **admin@pawly.local / Admin@2026** (đổi bằng `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Script từ chối chạy khi `NODE_ENV=production`. Đăng nhập tại `/login` rồi vào `/admin/dashboard`.

## 3. Vai trò và quyền

| Vai trò | Quyền chính |
|---|---|
| Quản trị cao nhất (`SUPER_ADMIN`) | Tất cả, gồm nhật ký, quản lý admin, bật chế độ sửa khi hỗ trợ shelter, xuất CSV |
| Duyệt shelter (`SHELTER_APPROVER`) | Duyệt, từ chối, đình chỉ, sửa hồ sơ shelter; vào hỗ trợ (chỉ xem) |
| Duyệt địa điểm (`PLACE_APPROVER`) | Duyệt đề xuất, sửa/ẩn/gộp địa điểm, thú cưng tại quán |
| Quản lý sự kiện (`EVENT_MANAGER`) | Sự kiện, organizer |
| Kiểm duyệt nội dung (`CONTENT_MODERATOR`) | Hàng đợi báo cáo, đánh giá, khóa người dùng |
| Hỗ trợ (`SUPPORT`) | Chỉ xem: shelter, sự kiện, địa điểm, báo cáo, người dùng, thống kê |

Mọi trang và action đều kiểm tra quyền ở phía server (`requirePermission` trong `src/lib/admin/guard.ts`). Ma trận quyền nằm trong `src/lib/admin/permissions.ts`.

## 4. Cấu trúc code

- `src/app/(admin)/admin/*`: các trang
- `src/actions/admin/*`: server actions (mỗi thao tác bắt buộc ghi chú nội bộ và ghi audit trước/sau)
- `src/lib/admin/*`: quyền, audit, bộ lọc, format, rating, phiên hỗ trợ
- `src/components/admin/*`: UI dùng chung, form, bản đồ Leaflet, biểu đồ
- `prisma/schema.prisma`: các model mới (Shelter, Pet, Event, Organizer, PlaceProposal, Place, PlaceReview, Report, AuditLog, Notification, AppInstall, ...)

## 5. Phần chưa hoàn thiện (cần làm tiếp)

- **2FA (mã TOTP) cho admin** và **tự hết phiên khi không hoạt động**: chưa triển khai. Cần thêm thư viện TOTP (ví dụ `otplib`) và cấu hình `session.maxAge`/cơ chế idle timeout.
- **Thống kê app** (mục Thống kê trong Tổng quan): đọc bảng `AppInstall`, phân loại theo `platform` (`iOS` = App Store, `Android` = Google Play). App cần gọi API để ghi `installedAt`, cập nhật `lastSeenAt` khi mở, và `uninstalledAt` khi gỡ.
- **Khóa người dùng** có hiệu lực ở lần đăng nhập tiếp theo. Chưa thu hồi phiên JWT đang hoạt động.
- **Tải ảnh** dùng `uploadFileToR2` (cần backend `/storage/presigned-url`).
- **Shelter được thông báo**: thông báo được ghi vào bảng `Notification`; app shelter/người dùng cần đọc bảng này để hiển thị.
- **Đề xuất địa điểm được gửi lại sau khi bổ sung**: phía app người dùng cần gọi lại để chuyển trạng thái về `PENDING`.
- Các model coffee cũ (`Order`, `Product`, `Category`, `StoreSetting`) vẫn còn trong schema vì code staff/store đang dùng. Có thể xóa nếu không cần.

## 6. Ghi chú về các thay đổi so với dự án gốc

- Đã xóa khu admin coffee cũ (`src/app/(admin)`, `src/layout/admin`, `src/app/admin`) và `src/middleware.ts` (xung đột với `middleware.ts` ở gốc dự án).
- `src/routes.ts`: thêm `DEFAULT_ADMIN_REDIRECT` và `DEFAULT_STAFF_REDIRECT` (file `actions/login.ts` đã import nhưng chưa được khai báo).
- `src/auth.ts`: tài khoản bị khóa không đăng nhập được.
- `src/auth.config.ts`: `/admin` chỉ cho ADMIN; `/shelter` cho SHELTER_ADMIN và ADMIN.
