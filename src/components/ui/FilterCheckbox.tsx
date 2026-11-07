// Frontend/components/ui/FilterCheckbox.tsx
import React from "react";

interface FilterCheckboxProps {
  label: string;
  onClick?: () => void; // <--- THÊM DÒNG NÀY (Dấu ? nghĩa là không bắt buộc)
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, onClick }) => {
  return (
    <label 
      className="flex items-center gap-3 cursor-pointer group"
      onClick={onClick} // <--- Gắn sự kiện vào đây
    >
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-gray-400 text-brand-orange focus:ring-brand-orange focus:ring-2 focus:ring-offset-0"
      />
      <span className="font-sans text-base text-gray-700 group-hover:text-brand-orange">
        {label}
      </span>
    </label>
  );
};

export default FilterCheckbox;