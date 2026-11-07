'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  PawPrint,
} from 'lucide-react';
import { useUserAdoptionStore, AdoptionRequestItem } from '@/stores/useUserAdoptionStore';
import { APPLICATION_STATUS_LABEL } from '@/types/application';

import EditAdoptionProfileModal from './components/EditAdoptionProfileModal';
import ApplicationDetailModal from './components/ApplicationDetailModal';
import RequestStatusModal from './components/RequestStatusModal';
import AppointmentBookingModal from './components/AppointmentBookingModal';

export const AdoptionProfilePage = () => {
  const { profile, requests, isLoading, fetchProfile, fetchRequests } = useUserAdoptionStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStatusRequest, setSelectedStatusRequest] = useState<AdoptionRequestItem | null>(null);
  const [selectedAppointmentRequest, setSelectedAppointmentRequest] = useState<AdoptionRequestItem | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, [fetchProfile, fetchRequests]);

  if (isLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E89B5A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500 font-medium">Đang tải hồ sơ nhận nuôi...</p>
      </div>
    );
  }

  const isComplete = profile && profile.fullName && profile.phone;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans space-y-8">
      {/* 1. Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-[#E89B5A] flex items-center justify-center font-bold text-2xl shrink-0">
              {profile?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.fullName || 'Chưa khởi tạo hồ sơ'}</h1>
              <p className="text-sm text-gray-500">Hồ sơ người đăng ký nhận nuôi</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E89B5A] text-white font-bold text-sm hover:bg-[#D68B4E] transition-colors self-start md:self-auto shadow-sm"
          >
            <Edit2 size={16} />
            {profile ? 'Chỉnh sửa hồ sơ' : 'Tạo hồ sơ nhận nuôi'}
          </button>
        </div>

        {isComplete ? (
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-[#E89B5A] shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                <p className="text-sm font-semibold text-gray-800">{profile.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-[#E89B5A] shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Zalo / Email</p>
                <p className="text-sm font-semibold text-gray-800">{profile.zalo || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[#E89B5A] shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Khu vực / Địa chỉ</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{profile.location || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="md:col-span-3 flex items-center justify-between pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                <CheckCircle2 size={14} /> Hồ sơ mẫu sẵn sàng gửi
              </div>

              <button
                onClick={() => setIsDetailOpen(true)}
                className="text-xs font-bold text-[#E89B5A] hover:underline flex items-center gap-1"
              >
                Xem chi tiết đơn đã lưu <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
            <AlertCircle size={20} className="shrink-0 text-amber-600" />
            <p>Bạn chưa hoàn thiện hồ sơ nhận nuôi. Hãy điền đầy đủ thông tin để bắt đầu gửi yêu cầu nhận nuôi bé.</p>
          </div>
        )}
      </div>

      {/* 2. Adoption Requests Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Danh sách yêu cầu nhận nuôi ({requests.length})</h2>

        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
            <PawPrint size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Bạn chưa gửi yêu cầu nhận nuôi thú cưng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((item) => {
              const petImage = item.pet?.images?.[0]?.url || 'https://via.placeholder.com/150';
              const statusLabel = APPLICATION_STATUS_LABEL[item.status] || item.status;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={petImage}
                      alt={item.pet?.name || 'Pet'}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{item.pet?.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{item.pet?.shelter?.name || 'Trạm cứu hộ'}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Ngày gửi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedStatusRequest(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-[#E89B5A] border border-orange-200 rounded-full text-xs font-bold"
                    >
                      {statusLabel}
                    </button>

                    {item.status === 'APPROVED' || item.status === 'INTERVIEW_SCHEDULED' ? (
                      <button
                        onClick={() => setSelectedAppointmentRequest(item)}
                        className="px-4 py-2 bg-[#E89B5A] text-white rounded-xl text-xs font-bold hover:bg-[#D68B4E] transition-colors"
                      >
                        Đặt lịch hẹn
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Sub-Popups Modals */}
      {isEditOpen && (
        <EditAdoptionProfileModal
          isOpen={isEditOpen}
          initialData={profile}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      {isDetailOpen && profile && (
        <ApplicationDetailModal
          application={profile}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      {selectedStatusRequest && (
        <RequestStatusModal
          request={selectedStatusRequest}
          onClose={() => setSelectedStatusRequest(null)}
        />
      )}

      {selectedAppointmentRequest && (
        <AppointmentBookingModal
          request={selectedAppointmentRequest}
          onClose={() => setSelectedAppointmentRequest(null)}
        />
      )}
    </div>
  );
};