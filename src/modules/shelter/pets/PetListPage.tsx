'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePetList, usePetFilter, usePetActions } from '@/stores/usePetStore';
import { PetCard } from './components/PetCard';
import { PetPageHeader } from './components/PetPageHeader';
import { Pet, PetViewMode } from '@/types/pet';
import PetTable from '@/components/PetTable';
import Link from 'next/link';

export const PetListPage = () => {
  const router = useRouter();
  const { items, total, isLoading } = usePetList();
  const { filter, setFilter } = usePetFilter();
  const { fetchPets, deletePet } = usePetActions() as ReturnType<typeof usePetActions> & {
    deletePet?: (id: string) => Promise<boolean | void>;
  };
  const [viewMode, setViewMode] = useState<PetViewMode>('list'); // mặc định dạng bảng giống ảnh mẫu
  const [searchInput, setSearchInput] = useState(filter.search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filter.search) setFilter({ search: searchInput });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    fetchPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / filter.pageSize));

  const handleView = (pet: Pet) => router.push(`/shelter/pets/${pet.id}`);
  const handleEdit = (pet: Pet) => router.push(`/shelter/pets/${pet.id}/edit`);

  const handleDelete = async (pet: Pet) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xoá hồ sơ của "${pet.name}"? Hành động này không thể hoàn tác.`,
    );
    if (!confirmed) return;

    try {
      if (deletePet) {
        await deletePet(pet.id);
      }
      await fetchPets();
    } catch (err) {
      console.error('[PetListPage] Xoá pet thất bại:', err);
      alert('Không thể xoá pet lúc này, vui lòng thử lại.');
    }
  };

  return (
    <div className="w-full">
      <PetPageHeader
        filter={filter}
        onFilterChange={setFilter}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 sm:h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 mb-4">Chưa có pet nào khớp với bộ lọc hiện tại.</p>
          <Link href="/shelter/pets/create" className="text-[#E89B5A] font-medium hover:underline">
            + Thêm pet đầu tiên
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              viewMode="grid"
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <PetTable pets={items} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {!isLoading && totalPages > 1 && (
        <div className="no-scrollbar -mx-4 mt-6 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-8 sm:justify-center">
          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setFilter({ page })}
                className={`h-11 w-11 shrink-0 sm:h-9 sm:w-9 rounded-lg text-sm font-medium transition-colors ${page === filter.page
                  ? 'bg-[#E89B5A] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#E89B5A]'
                  }`}
              >
                {page}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PetListPage;