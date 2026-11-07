// components/IphoneScreenUI.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    MoreHorizontal,
    ChevronRight,
    MapPin,
    IdCard,
    CheckCircle2,
    XCircle,
    Syringe,
    Stethoscope,
    Lock,
    ChevronUp,
    ChevronDown,
    Heart,
} from 'lucide-react';

const getAge = (pet?: any) => {
    if (pet?.dob) {
        const dob = new Date(pet.dob);
        const today = new Date();
        let years = today.getFullYear() - dob.getFullYear();
        let months = today.getMonth() - dob.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
            years--;
            months += 12;
        }
        if (years > 0) return `${years} tuổi`;
        if (months > 0) return `${months} tháng`;
        return 'Mới sinh';
    }
    if (pet?.age) return `${pet.age} tuổi`;
    return 'Không rõ';
};

const formatCapitalize = (str?: string) => {
    if (!str) return 'Unknown';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
const getVaccinationLabel = (pet?: any) => {
    // Ưu tiên vaccinationStatus mới; fallback về isVaccinated boolean cho pet cũ
    const status = pet?.vaccinationStatus
        ?? (pet?.isVaccinated === false ? 'NOT_VACCINATED' : 'VACCINATED');

    if (status === 'IN_PROGRESS') return { text: 'Đang tiêm', color: '#E8A53C' };
    if (status === 'NOT_VACCINATED') return { text: 'Thiếu', color: '#EF4444' };
    return { text: 'Đầy đủ', color: '#77C852' };
};
const getGenderLabel = (gender?: string) => {
    const g = gender?.toUpperCase();
    if (g === 'MALE') return 'Đực';
    if (g === 'FEMALE') return 'Cái';
    return 'Không rõ';
};

const localize = (val: any) => {
    if (!val) return '';
    if (typeof val === 'object') return val.vi || val.en || '';
    return val;
};

type DragHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function IphoneScreenUI({
    pet,
    sheetTop,
    isSheetDragging,
    onScreenEnter,
    onScreenLeave,
    handleDrag,
    scrollDrag,
}: {
    pet: any;
    sheetTop: number;
    isSheetDragging: boolean;
    onScreenEnter?: () => void;
    onScreenLeave?: () => void;
    handleDrag: DragHandlers;
    scrollDrag: DragHandlers;
}) {
    const [isFavourite, setIsFavourite] = useState(false);
    const [showHistory, setShowHistory] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const displayImages = useMemo(() => {
        if (!pet) return [];
        return pet?.images?.length > 0
            ? pet.images.map((img: any) => (typeof img === 'string' ? img : img.url))
            : [pet?.avatarUrl || 'https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?q=80&w=800&auto=format&fit=crop'];
    }, [pet]);

    if (!pet) {
        return (
            <div
                className="w-[360px] h-[770px] bg-black rounded-[52px] flex items-center justify-center border-[6px] border-[#1c1c1e]"
                onPointerEnter={onScreenEnter}
                onPointerLeave={onScreenLeave}
            >
                <span className="text-white/40 text-xs">Loading...</span>
            </div>
        );
    }

    const isFemale = pet?.gender?.toUpperCase() === 'FEMALE';

    return (
        <div className="w-[360px] h-[770px] bg-black rounded-[52px] overflow-hidden relative shadow-2xl border-[6px] border-[#1c1c1e] font-sans select-none">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[24px] bg-black rounded-full z-50" />

            <div className="relative w-full" style={{ height: '48%' }}>
                <img
                    src={displayImages[activeIndex]}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                />
                <div className="absolute left-4 z-20" style={{ top: 44 }}>
                    <div className="w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow">
                        <ChevronLeft size={18} className="text-black" />
                    </div>
                </div>
                {displayImages.length > 1 && (
                    <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-1.5">
                        {displayImages.map((_: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                className={`h-1.5 rounded-full transition-all ${activeIndex === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div
                className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[30px] overflow-hidden flex flex-col"
                style={{
                    top: sheetTop,
                    transition: isSheetDragging ? 'none' : 'top 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
            >
                {/* Vùng tay cầm — gắn handleDrag trực tiếp */}
                <div
                    data-sheet-handle
                    className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={handleDrag.onPointerDown}
                    onPointerMove={handleDrag.onPointerMove}
                    onPointerUp={handleDrag.onPointerUp}
                    onPointerCancel={handleDrag.onPointerCancel}
                >
                    <div className="w-12 h-1.5 bg-[#E5E5EA] rounded-full mx-auto mt-2.5 mb-3" />

                    <div className="px-6 pb-4">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-baseline flex-1 mr-2 min-w-0">
                                <span className="text-[22px] font-semibold text-black truncate">{pet.name}</span>
                                <span className="text-[13px] text-[#8E8E93] ml-2 shrink-0">
                                    ({localize(pet.breed) || 'Chưa rõ'})
                                </span>
                            </div>
                            <button className="p-1">
                                <MoreHorizontal size={18} className="text-gray-700" />
                            </button>
                        </div>

                        <div className="flex items-center mt-1.5 gap-2.5">
                            <div className="flex items-center gap-1 min-w-0">
                                <MapPin size={13} className="text-[#8E8E93] shrink-0" />
                                <span className="text-[11px] text-[#8E8E93] truncate max-w-[160px]">
                                    {pet?.shelter?.address || 'Chưa cập nhật địa chỉ'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <IdCard size={13} className="text-[#8E8E93]" />
                                <span className="text-[11px] text-[#8E8E93]">
                                    {pet?.idSetByShelter ? pet.id?.slice(0, 8) : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vùng nội dung — gắn scrollDrag trực tiếp */}
                <div
                    data-sheet-scroll
                    className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 touch-none"
                    style={{ paddingBottom: 96 }}
                    onPointerDown={scrollDrag.onPointerDown}
                    onPointerMove={scrollDrag.onPointerMove}
                    onPointerUp={scrollDrag.onPointerUp}
                    onPointerCancel={scrollDrag.onPointerCancel}
                >
                    <div className="flex justify-between gap-2.5">
                        <div className={`flex-1 py-3 rounded-2xl text-center ${isFemale ? 'bg-[#FAE8ED]' : 'bg-[#EAF4FB]'}`}>
                            <div className="text-[11px] text-[#8E8E93] mb-1">Giới tính</div>
                            <div className="text-[13px] font-semibold text-black">{getGenderLabel(pet?.gender)}</div>
                        </div>
                        <div className="flex-1 py-3 rounded-2xl text-center bg-[#FCF8D6]">
                            <div className="text-[11px] text-[#8E8E93] mb-1">Tuổi</div>
                            <div className="text-[13px] font-semibold text-black">{getAge(pet)}</div>
                        </div>
                        <div className="flex-1 py-3 rounded-2xl text-center bg-[#E8F9E6]">
                            <div className="text-[11px] text-[#8E8E93] mb-1">Cân nặng</div>
                            <div className="text-[13px] font-semibold text-black">
                                {pet?.weight ? `${pet.weight} kg` : pet?.size ? formatCapitalize(pet.size) : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center my-5">
                        <img
                            src={pet.shelter?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3592/3592182.png'}
                            className="w-[42px] h-[42px] rounded-full border border-gray-200 object-cover bg-white"
                        />
                        <div className="flex-1 mx-3 min-w-0">
                            <div className="text-[13px] font-medium text-black truncate">
                                {pet?.shelter?.name || 'Pawlife Shelter'}
                            </div>
                            <div className="text-[11px] text-[#8E8E93] truncate">
                                {pet?.shelter?.shelterType || 'Trạm cứu hộ động vật'}
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-[#8E8E93]" />
                    </div>

                    <div>
                        <div className="text-[15px] font-medium text-black mb-1.5">Về {pet.name}</div>
                        <p className="text-[13px] text-[#8E8E93] leading-[19px]">
                            {localize(pet?.description) || 'Chưa có thông tin mô tả chi tiết cho bé.'}
                        </p>
                    </div>

                    <div className="mt-5">
                        <div className="text-[15px] font-medium text-black mb-3">Chăm sóc sức khỏe</div>
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-[#F7F7F7] rounded-full h-[46px] px-1.5">
                                <div className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center shrink-0">
                                    <Syringe size={16} style={{ color: getVaccinationLabel(pet).color }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] text-[#8E8E93] truncate">Tiêm chủng</div>
                                    <div
                                        className="text-[12px] font-medium truncate"
                                        style={{ color: getVaccinationLabel(pet).color }}
                                    >
                                        {getVaccinationLabel(pet).text}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center gap-2 bg-[#F7F7F7] rounded-full h-[46px] px-1.5">
                                <div className="w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center shrink-0">
                                    <Stethoscope size={16} className="text-[#5A90DA]" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[10px] text-[#8E8E93] truncate">Trạng thái</div>
                                    <div className="text-[12px] font-medium text-black truncate">
                                        {pet?.isSpayedNeutered ? 'Đã triệt sản' : 'Chưa triệt sản'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="text-[15px] font-medium text-black mb-2.5">Tính cách của {pet.name}</div>
                        {pet?.goodWith || pet?.badWith ? (
                            <div className="space-y-1.5">
                                {pet?.goodWith && (
                                    <div className="flex items-start gap-1.5">
                                        <CheckCircle2 size={13} className="text-[#77C852] mt-[2px] shrink-0" />
                                        <span className="text-[12.5px] text-[#8E8E93] leading-[19px]">
                                            <span className="text-[#77C852] font-medium">Thân thiện: </span>
                                            {Array.isArray(pet.goodWith) ? pet.goodWith.join(', ') : pet.goodWith}
                                        </span>
                                    </div>
                                )}
                                {pet?.badWith && (
                                    <div className="flex items-start gap-1.5">
                                        <XCircle size={13} className="text-[#FE7D66] mt-[2px] shrink-0" />
                                        <span className="text-[12.5px] text-[#8E8E93] leading-[19px]">
                                            <span className="text-[#FE7D66] font-medium">Nên cân nhắc: </span>
                                            {Array.isArray(pet.badWith) ? pet.badWith.join(', ') : pet.badWith}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-[12.5px] text-[#8E8E93] italic">
                                Thông tin hành vi chưa được cập nhật.
                            </p>
                        )}
                    </div>

                    <div className="mt-5 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[15px] font-medium text-black">Lịch sử hoạt động</span>
                            <button
                                onClick={() => setShowHistory((v) => !v)}
                                className="flex items-center gap-1 text-[#F2A465]"
                            >
                                <span className="text-[12px] font-medium">{showHistory ? 'Ẩn' : 'Xem'}</span>
                                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        {showHistory && (
                            <div className="border border-[#E5E5EA] rounded-2xl p-3.5">
                                {(pet?.pawHistory || []).length === 0 ? (
                                    <p className="text-center text-[#8E8E93] text-[12px] italic py-3">
                                        Chưa có lịch sử hoạt động.
                                    </p>
                                ) : (
                                    pet.pawHistory.slice(0, 4).map((item: any, i: number) => (
                                        <div key={item.id ?? i} className="flex gap-2.5 mb-3 last:mb-0">
                                            <div className="w-[26px] h-[26px] rounded-full bg-[#EAE7FB] flex items-center justify-center shrink-0 text-[11px]">
                                                •
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[12.5px] font-medium text-black truncate">
                                                    {item.title}
                                                </div>
                                                <div className="text-[11px] text-[#9B9B9B] leading-[15px]">
                                                    {item.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div className="flex items-center justify-center gap-1.5 mt-2 bg-[#F5F5F5] rounded-lg py-2">
                                    <Lock size={11} className="text-[#8E8E93]" />
                                    <span className="text-[11px] text-[#8E8E93]">
                                        Hành trình không thể bị xoá hay chỉnh sửa.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-3.5 pb-5 flex items-center gap-3 z-30">
                <button
                    onClick={() => setIsFavourite((v) => !v)}
                    className={`w-[50px] h-[50px] rounded-full border-2 flex items-center justify-center bg-white shrink-0 ${isFavourite ? 'border-[#E89B5A]/50' : 'border-[#E5E5EA]'}`}
                >
                    <Heart
                        size={20}
                        className={isFavourite ? 'text-[#E89B5A]' : 'text-[#C7C7CC]'}
                        fill={isFavourite ? '#E89B5A' : 'none'}
                    />
                </button>
                <button className="flex-1 bg-[#F2A465] h-[50px] rounded-full text-white text-[14px] font-bold">
                    Đăng ký nhận nuôi
                </button>
            </div>
        </div>
    );
}