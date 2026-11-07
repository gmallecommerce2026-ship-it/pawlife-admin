// src/app/(admin)/admin/dashboard/components/DashboardFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYesterday, endOfYesterday } from "date-fns";

export default function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = searchParams.get("label") || "Hôm nay";

  const handleSelect = (range: string, label: string) => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (range) {
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday":
        from = startOfYesterday();
        to = endOfYesterday();
        break;
      case "7days":
        from = subDays(today, 7);
        to = endOfDay(today);
        break;
      case "30days":
        from = subDays(today, 30);
        to = endOfDay(today);
        break;
      case "thisMonth":
        from = startOfMonth(today);
        to = endOfDay(today);
        break;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from.toISOString());
    params.set("to", to.toISOString());
    params.set("label", label);
    
    // scroll: false giúp giữ vị trí trang
    router.push(`?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
      >
        <CalendarIcon size={16} />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`}/>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-40 animate-in fade-in zoom-in-95 duration-200">
            {[
              { key: "today", label: "Hôm nay" },
              { key: "yesterday", label: "Hôm qua" },
              { key: "7days", label: "7 ngày qua" },
              { key: "30days", label: "30 ngày qua" },
              { key: "thisMonth", label: "Tháng này" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key, item.label)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  currentLabel === item.label ? "text-[#c49b63] font-medium bg-orange-50/50" : "text-gray-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}