// src/services/applicationService.ts
import { apiClient } from '@/lib/api/ApiClient';
import type { ApplicationNoteType, ApplicantProfileResponse } from '@/types/application';
// LƯU Ý: apiClient.request() đã tự động parse res.json() và trả về
// TRỰC TIẾP body JSON, không phải axios response { data: ... }.
// Backend luôn trả { success: true, data }, nên res CHÍNH LÀ { success, data }
// => chỉ cần đọc res.data một lớp duy nhất, KHÔNG BAO GIỜ res.data.data.
const unwrapList = <T = any>(res: any): T[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data; // phòng hờ nếu 1 endpoint nào đó lỡ bọc thêm lớp
  return [];
};

const unwrapItem = <T = any>(res: any): T => {
  if (res?.data !== undefined) return res.data;
  return res;
};

export const applicationService = {
  // Lấy danh sách đơn của Shelter
  getShelterApplications: async (shelterId: string, status?: string) => {
    const res = await apiClient.get(`/applications/shelter/${shelterId}`, {
      params: { status },
    });
    return unwrapList(res);
  },

  // Thêm Ghi chú nội bộ
  addNote: async (applicationId: string, content: string, type: ApplicationNoteType) => {
    const res = await apiClient.post(`/applications/${applicationId}/notes`, { content, type });
    return unwrapItem(res);
  },
  // Cập nhật Ghi chú nội bộ
  updateNote: async (
    applicationId: string,
    noteId: string,
    content: string,
    type: ApplicationNoteType,
  ) => {
    const res = await apiClient.patch(`/applications/${applicationId}/notes/${noteId}`, {
      content,
      type,
    });
    return unwrapItem(res);
  },

  // Xoá Ghi chú nội bộ
  deleteNote: async (applicationId: string, noteId: string) => {
    const res = await apiClient.delete(`/applications/${applicationId}/notes/${noteId}`);
    return unwrapItem(res);
  },
  getReplacementPets: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/replacement-pets`);
    return unwrapList(res);
  },

  replacePet: async (applicationId: string, petId: string) => {
    const res = await apiClient.patch(`/applications/${applicationId}/replace-pet`, { petId });
    return unwrapItem(res);
  },
  // Gán Tag cho đơn
  addTag: async (applicationId: string, payload: { tagId?: string; name?: string }) => {
    const res = await apiClient.post(`/applications/${applicationId}/tags`, payload);
    return unwrapItem(res);
  },

  // Gỡ Tag khỏi đơn
  removeTag: async (applicationId: string, tagId: string) => {
    const res = await apiClient.delete(`/applications/${applicationId}/tags/${tagId}`);
    return unwrapItem(res);
  },

  // Cập nhật trạng thái đơn (Duyệt, Từ chối, Yêu cầu bổ sung)
  updateStatus: async (
    applicationId: string,
    status: string,
    rejectionReason?: string,
  ) => {
    const res = await apiClient.patch(`/applications/${applicationId}/status`, {
      status,
      rejectionReason,
    });
    return unwrapItem(res);
  },

  // Đặt lịch hẹn phỏng vấn
  scheduleAppointment: async (applicationId: string, dto: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/appointments`, dto);
    return unwrapItem(res); // hoặc return res.data;
  },

  getApplicantProfile: async (applicationId: string): Promise<ApplicantProfileResponse> => {
    const res = await apiClient.get(`/applications/${applicationId}/applicant-profile`);
    return unwrapItem(res);
  },

  // ==========================================
  // TÀI LIỆU BỔ SUNG (REQUIRED DOCUMENTS)
  // ==========================================

  // Lấy danh sách tài liệu của 1 đơn (dùng chung adopter/shelter).
  // Gộp chung getApplicationDocuments + getDocuments cũ (2 hàm trùng nhau) thành 1.
  getDocuments: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/documents`);
    return unwrapList(res); // FIX: trước đây res.data.data -> luôn undefined
  },

  // Shelter yêu cầu bổ sung tài liệu (1 hoặc nhiều loại cùng lúc)
  requestDocuments: async (
    applicationId: string,
    documents: { key: string; label: string; description: string }[],
  ) => {
    const res = await apiClient.post(`/applications/${applicationId}/documents`, {
      documents,
    });
    return unwrapList(res); // trả về mảng ApplicationDocument vừa tạo
  },

  // Applicant nộp tài liệu (chỉ chủ đơn mới gọi được — backend check userId)
  submitDocument: async (
    applicationId: string,
    docId: string,
    payload: { fileUrl: string; fileName?: string; fileSizeLabel?: string },
  ) => {
    const res = await apiClient.post(
      `/applications/${applicationId}/documents/${docId}/submit`,
      payload,
    );
    return unwrapItem(res);
  },

  // Shelter duyệt (accept/reject) 1 tài liệu đã nộp
  reviewDocument: async (
    applicationId: string,
    docId: string,
    payload: { status: 'ACCEPTED' | 'REJECTED'; reason?: string },
  ) => {
    const res = await apiClient.patch(
      `/applications/${applicationId}/documents/${docId}/review`,
      payload,
    );
    return unwrapItem(res);
  },

  // Shelter gỡ 1 yêu cầu tài liệu (chỉ khi status vẫn PENDING_SUBMISSION)
  removeDocument: async (applicationId: string, docId: string) => {
    const res = await apiClient.delete(`/applications/${applicationId}/documents/${docId}`);
    return unwrapItem(res);
  },

  flagApplicant: async (applicationId: string, data: { reason: string; note?: string }) => {
    const res = await apiClient.post(`/applications/${applicationId}/applicant-flag`, data);
    return unwrapItem(res);
  },

  unflagApplicant: async (applicationId: string) => {
    const res = await apiClient.delete(`/applications/${applicationId}/applicant-flag`);
    return unwrapItem(res);
  },

  async deleteApplication(applicationId: string) {
    return apiClient.delete(`/applications/${applicationId}`); // đổi `api` cho khớp với updateStatus
  },
};