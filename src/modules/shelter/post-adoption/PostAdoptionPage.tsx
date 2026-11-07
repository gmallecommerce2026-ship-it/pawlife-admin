'use client';

import React, { useState } from 'react';
import { PetPageHeader } from '@/modules/shelter/pets/components/PetPageHeader';
import { MOCK_POST_ADOPTION_RECORDS } from '@/types/postAdoption';
import { defaultPetFilter } from '@/types/pet';
import PostAdoptionTable from './components/PostAdoptionTable';

export const PostAdoptionPage = () => {
  // NOTE: filter species/status ở đây đang dùng chung shape với PetFilter chỉ
  // để tái sử dụng PetPageHeader — nếu Post-Adoption cần bộ filter riêng
  // (theo followUpStatus, theo tháng...), nên tách type riêng.
  const [filter, setFilter] = useState(defaultPetFilter);
  const [searchInput, setSearchInput] = useState('');

  // ⚠️ Đang dùng MOCK_POST_ADOPTION_RECORDS để test UI — thay bằng dữ liệu
  // fetch thật (ví dụ từ `usePostAdoptionStore` hoặc API `/adoptions`) khi có.
  const records = MOCK_POST_ADOPTION_RECORDS;

  return (
    <div className="w-full">
      <PetPageHeader
        title="Đã nhận nuôi"
        showNewPetButton={false}
        filter={filter}
        onFilterChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
      />
      <PostAdoptionTable records={records} />
    </div>
  );
};

export default PostAdoptionPage;