// src/components/ui/FilterPriceInput.tsx
import React from "react";

const FilterPriceInput = () => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Từ"
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange"
      />
      <span className="text-gray-400">-</span>
      <input
        type="text"
        placeholder="Đến"
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-orange focus:ring-brand-orange"
      />
    </div>
  );
};

export default FilterPriceInput;