// src/lib/admin/constants.ts  (file thường, không phải "use server" nên được import tự do)
export const PROPOSAL_REJECT_REASONS = [
  "Địa điểm không có thật hoặc không đúng địa chỉ",
  "Địa điểm đã đóng cửa",
  "Không liên quan đến thú cưng",
  "Thông tin thiếu hoặc không rõ ràng",
  "Địa điểm đã tồn tại trên hệ thống",
];

export const REPORT_TARGET_LABELS: Record<string, string> = {
  EVENT: "Sự kiện",
  PLACE_REVIEW: "Đánh giá địa điểm",
  GENERAL_REVIEW: "Đánh giá chung",
  PET_CONTENT: "Nội dung thú cưng",
  SHELTER: "Shelter",
  PLACE: "Pawly Place",
  QR_TAG_SCAN: "Báo cáo quét tag",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Đã bỏ qua",
};

export const SHELTER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  SUSPENDED: "Bị đình chỉ",
  REJECTED: "Bị từ chối",
};
