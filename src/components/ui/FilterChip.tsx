import React from "react";

// Tách ra từ Component10, 12, 15, 17
const FilterChip = ({ prop216, prop229, prop224 }: any) => (
  <div
    className="h-[52px] flex flex-row justify-center items-center gap-[10px] px-[26px] py-[16px] border border-brand-gray-border rounded-[40px]"
    style={{
      minWidth: prop216,
    }}
  >
    <div
      className="font-sans text-[18px] whitespace-nowrap text-brand-gray leading-[140%] font-normal"
      style={{
        minWidth: prop224,
      }}
    >
      {prop229}
    </div>
  </div>
);

export default FilterChip;