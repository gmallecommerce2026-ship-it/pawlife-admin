// src/stores/usePetStore.ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api/ApiClient';
import axiosClient from '@/lib/api/axiosClient';
import { toast } from 'react-hot-toast';
import {
  Pet,
  PetFilter,
  PetFormValues,
  defaultPetFilter,
} from '@/types/pet';
import { useMemo } from 'react';


// ... (Các hàm sanitizePayload, normalizeEnums, mapAdoptionRequirements, preparePayload, uploadOne giữ nguyên) ...

// GIỮ NGUYÊN CÁC HÀM SANITIZE VÀ UPLOAD CỦA BẠN Ở ĐÂY
function sanitizePayload<T extends Record<string, any>>(values: T): T {
  const cleaned: Record<string, any> = {};
  Object.entries(values).forEach(([key, val]) => {
    if (val === '' || val === null) return;
    cleaned[key] = val;
  });
  return cleaned as T;
}

const ENUM_FIELDS = ['size', 'gender', 'status'] as const;
function normalizeEnums<T extends Record<string, any>>(values: T): T {
  const result: Record<string, any> = { ...values };
  ENUM_FIELDS.forEach((field) => {
    if (typeof result[field] === 'string' && result[field] !== '') {
      result[field] = result[field].toUpperCase();
    }
  });
  return result as T;
}

function mapAdoptionRequirements<T extends Record<string, any>>(values: T): T {
  const { adoptionRequirements, ...rest } = values as any;
  if (Array.isArray(adoptionRequirements)) {
    return {
      ...rest,
      adoptionRequirementKeys: adoptionRequirements
        .map((r: any) => r.key ?? r.iconKey)
        .filter(Boolean),
    };
  }
  return values;
}

function preparePayload<T extends Record<string, any>>(values: T): T {
  return normalizeEnums(mapAdoptionRequirements(sanitizePayload(values)));
}

async function uploadOne(file: File, folder: string): Promise<string> {
  const { data } = await axiosClient.post('/storage/presigned-url', {
    fileName: file.name,
    fileType: file.type || 'image/jpeg',
    folder,
  });
  const res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  return data.fileUrl;
}

interface PetState {
  rawItems: Pet[]; 
  filter: PetFilter;
  isLoading: boolean;
  isSubmitting: boolean;
}

interface PetActions {
  fetchPets: (override?: Partial<PetFilter>) => Promise<void>;
  setFilter: (patch: Partial<PetFilter>) => void;
  getPetById: (id: string) => Promise<Pet | null>;
  createPet: (values: PetFormValues, images: File[]) => Promise<boolean>;
  updatePet: (id: string, values: PetFormValues, newImages: File[], keepImageUrls: string[]) => Promise<boolean>;
  deletePet: (id: string) => Promise<boolean>;
}
const FE_FETCH_SIZE = 500; // đủ lớn để lấy hết pet của 1 shelter, tự search/paginate ở FE

function normalizeText(v: unknown): string {
  return String(v ?? '').toLowerCase().trim();
}

function getBreedText(breed: Pet['breed']): string {
  if (!breed) return '';
  if (typeof breed === 'string') return breed;
  return `${breed.vi ?? ''} ${breed.en ?? ''}`;
}

function matchesSearch(pet: Pet, rawSearch: string): boolean {
  const q = normalizeText(rawSearch);
  if (!q) return true;
  const haystacks = [pet.name, pet.shelterInternalId, getBreedText(pet.breed)];
  return haystacks.some((h) => normalizeText(h).includes(q));
}

function filterAndPaginate(rawItems: Pet[], filter: PetFilter) {
  const filtered = rawItems.filter((p) => matchesSearch(p, filter.search));
  const total = filtered.length;
  const start = (filter.page - 1) * filter.pageSize;
  const items = filtered.slice(start, start + filter.pageSize);
  return { items, total };
}
const usePetStoreBase = create<PetState & PetActions>()((set, get) => ({
  rawItems: [],
  filter: defaultPetFilter,
  isLoading: false,
  isSubmitting: false,

  setFilter: (patch) => {
    const nextFilter = { ...get().filter, ...patch };
    if (!('page' in patch)) nextFilter.page = 1;
    set({ filter: nextFilter });

    // Chỉ gọi lại BE khi filter theo species/status đổi (cần dữ liệu mới từ BE).
    // Search & page chỉ cần lọc/paginate lại trên rawItems đã có -> tức thì, không loading.
    const needsRefetch = 'species' in patch || 'status' in patch || get().rawItems.length === 0;
    if (needsRefetch) {
      get().fetchPets(nextFilter);
    }
  },

  fetchPets: async (override) => {
    const filter = { ...get().filter, ...override };
    set({ isLoading: true, filter });
    try {
      const params = new URLSearchParams();
      if (filter.species !== 'ALL') params.set('type', filter.species);
      if (filter.status && filter.status !== 'ALL') params.set('status', filter.status);
      // ⚠️ Không gửi `search` lên BE nữa vì BE chưa hỗ trợ search theo shelterInternalId.
      // Lấy hết danh sách rồi search/paginate thuần FE.
      params.set('page', '1');
      params.set('pageSize', String(FE_FETCH_SIZE));

      const res = await apiClient.get(`/pets/shelter/manage?${params.toString()}`);
      set({ rawItems: res.data ?? [] });
    } catch (error) {
      console.error('[usePetStore] fetchPets error:', error);
      toast.error('Không thể tải danh sách pet. Vui lòng thử lại.');
      set({ rawItems: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  getPetById: async (id) => {
    try {
      const res = await apiClient.get(`/shelter-dashboard/pets/${id}`); // ✅ đổi từ /pets/${id}
      return (res as Pet) ?? null;
    } catch (error) {
      console.error('[usePetStore] getPetById error:', error);
      toast.error('Không thể tải thông tin pet này.');
      return null;
    }
  },

  createPet: async (values, images) => {
    set({ isSubmitting: true });
    try {
      const imageUrls = await Promise.all(images.map((file) => uploadOne(file, 'pet-images')));
      const newPet = await apiClient.post('/shelter-dashboard/pets', {
        ...preparePayload(values),
        images: imageUrls,
      });
      if (values.tagId) {
        await apiClient.post(`/pets/${newPet.id}/link-qr`, { tagId: values.tagId });
      }
      toast.success('Thêm pet mới thành công!');
      await get().fetchPets({ page: 1 });
      return true;
    } catch (error) {
      console.error('Create pet error:', error);
      toast.error('Thêm pet thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updatePet: async (id, values, newImages, keepImageUrls) => {
    set({ isSubmitting: true });
    try {
      const newImageUrls = await Promise.all(newImages.map((file) => uploadOne(file, 'pet-images')));
      const images = [...keepImageUrls, ...newImageUrls];
      await apiClient.patch(`/shelter-dashboard/pets/${id}`, {
        ...preparePayload(values),
        images,
      });
      if (values.tagId) {
        await apiClient.patch(`/pets/${id}/replace-qr`, { newTagId: values.tagId });
      }
      toast.success('Cập nhật thông tin pet thành công!');
      await get().fetchPets();
      return true;
    } catch (error) {
      console.error('Update pet error:', error);
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  deletePet: async (id) => {
    const prevRawItems = get().rawItems;
    set({ rawItems: prevRawItems.filter((p) => p.id !== id) });
    try {
      await apiClient.delete(`/pets/${id}`);
      toast.success('Đã xóa pet.');
      return true;
    } catch (error) {
      console.error('Delete pet error:', error);
      set({ rawItems: prevRawItems });
      toast.error('Xóa thất bại. Vui lòng thử lại.');
      return false;
    }
  },
}));

export const usePetList = () => {
  const rawItems = usePetStoreBase((state) => state.rawItems);
  const filter = usePetStoreBase((state) => state.filter);
  const isLoading = usePetStoreBase((state) => state.isLoading);

  const { items, total } = useMemo(
    () => filterAndPaginate(rawItems, filter),
    [rawItems, filter],
  );

  return { items, total, isLoading };
};

export const usePetFilter = () =>
  usePetStoreBase(useShallow((state) => ({
    filter: state.filter,
    setFilter: state.setFilter,
  })));

export const usePetActions = () =>
  usePetStoreBase(useShallow((state) => ({
    fetchPets: state.fetchPets,
    getPetById: state.getPetById,
    createPet: state.createPet,
    updatePet: state.updatePet,
    deletePet: state.deletePet,
    isSubmitting: state.isSubmitting,
  })));

export const usePetStore = usePetStoreBase;