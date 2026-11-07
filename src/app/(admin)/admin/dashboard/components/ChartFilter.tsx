// src/app/(admin)/admin/dashboard/components/ChartFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Filter, Calendar } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

export default function ChartFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Helper chuyển ISO string (từ URL) -> "YYYY-MM-DD" (cho input)
  const formatDateForInput = (isoString: string | null) => {
    if (!isoString) return "";
    try {
        const date = parseISO(isoString);
        return isValid(date) ? format(date, "yyyy-MM-dd") : "";
    } catch {
        return "";
    }
  };

  const [dateRange, setDateRange] = useState({
    from: formatDateForInput(searchParams.get("chartFrom")),
    to: formatDateForInput(searchParams.get("chartTo"))
  });

  useEffect(() => {
    setDateRange({
      from: formatDateForInput(searchParams.get("chartFrom")),
      to: formatDateForInput(searchParams.get("chartTo"))
    });
  }, [searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Gửi lên URL dưới dạng YYYY-MM-DD (server sẽ parseISO xử lý được)
    if (dateRange.from) params.set("chartFrom", dateRange.from);
    else params.delete("chartFrom");

    if (dateRange.to) params.set("chartTo", dateRange.to);
    else params.delete("chartTo");
    
    // scroll: false để tránh giật trang
    router.push(`?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const handleClear = () => {
     const params = new URLSearchParams(searchParams.toString());
     params.delete("chartFrom");
     params.delete("chartTo");
     
     setDateRange({ from: "", to: "" });
     router.push(`?${params.toString()}`, { scroll: false });
     setIsOpen(false);
  }

  return (
    <div className="relative inline-block text-left z-20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium shadow-sm transition-all ${
            dateRange.from || dateRange.to 
            ? "bg-orange-50 border-[#c49b63] text-[#c49b63]" 
            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Calendar size={14} />
        <span>{dateRange.from ? "Đã lọc" : "Tuỳ chọn ngày"}</span>
        <Filter size={12} className={dateRange.from ? "text-[#c49b63]" : "text-gray-400"}/>
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-20">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Lọc thời gian biểu đồ</h4>
                
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                        <input 
                            type="date" 
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                        <input 
                            type="date" 
                            value={dateRange.to}
                            min={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c49b63]/20 focus:border-[#c49b63]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <button 
                        onClick={handleClear}
                        className="flex-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Mặc định
                    </button>
                    <button 
                        onClick={handleApply}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#1d150b] hover:bg-[#1d150b]/90 rounded-lg transition-colors shadow-lg shadow-[#1d150b]/20"
                    >
                        Áp dụng
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}