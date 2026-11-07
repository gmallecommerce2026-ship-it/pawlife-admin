import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '@/lib/api/ApiClient';
import { toast } from 'react-hot-toast';
import {
  AdoptionApplication,
  ApplicationStatus,
  ApplicationFilter,
  defaultApplicationFilter,
  KANBAN_COLUMNS,
  ApplicationNoteType,
  DateRangePreset,
} from '@/types/application';

const KANBAN_STATUSES = [...KANBAN_COLUMNS.map((c) => c.status), 'ADOPTION_COMPLETED'];

interface ApplicationState {
  items: AdoptionApplication[];
  filter: ApplicationFilter;
  isLoading: boolean;
  movingIds: string[];
}

interface ApplicationActions {
  fetchApplications: () => Promise<void>;
  setFilter: (patch: Partial<ApplicationFilter>) => void;
  moveApplication: (id: string, status: ApplicationStatus, reviewNote?: string) => Promise<boolean>;
}

const useApplicationStoreBase = create<ApplicationState & ApplicationActions>()((set, get) => ({
  items: [],
  filter: defaultApplicationFilter,
  isLoading: false,
  movingIds: [],

  setFilter: (patch) => set({ filter: { ...get().filter, ...patch } }),

  fetchApplications: async () => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      params.set('statuses', KANBAN_STATUSES.join(','));
      const res = await apiClient.get(`/shelter-dashboard/applications?${params.toString()}`);
      const apiItems: AdoptionApplication[] = res.items ?? res ?? [];
      set({ items: apiItems });
    } catch (error) {
      console.warn('API fetch error:', error);
      toast.error('Không thể tải danh sách đơn nhận nuôi');
    } finally {
      set({ isLoading: false });
    }
  },

  moveApplication: async (id, status, reviewNote) => {
    const prevItems = get().items;
    if (!prevItems.find((a) => a.id === id)) return false;

    // Optimistic UI Update
    set({
      items: prevItems.map((a) => (a.id === id ? { ...a, status, reviewNote: reviewNote ?? a.reviewNote } : a)),
      movingIds: [...get().movingIds, id],
    });

    try {
      await apiClient.patch(`/shelter-dashboard/applications/${id}/status`, { status, reviewNote });
      toast.success('Cập nhật trạng thái thành công!');
      return true;
    } catch (error) {
      console.error('Move application error:', error);
      toast.error('Cập nhật trạng thái thất bại.');
      set({ items: prevItems }); // Rollback nếu lỗi
      return false;
    } finally {
      set({ movingIds: get().movingIds.filter((mid) => mid !== id) });
    }
  },
}));
function getDateThreshold(preset: DateRangePreset): Date | null {
  if (preset === 'ALL') return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // đầu ngày hôm nay
  if (preset === 'TODAY') return start;
  if (preset === 'LAST_7_DAYS') {
    start.setDate(start.getDate() - 6); // gồm cả hôm nay = 7 ngày
    return start;
  }
  if (preset === 'LAST_30_DAYS') {
    start.setDate(start.getDate() - 29);
    return start;
  }
  return null;
}
export const selectFilteredApplications = (
  items: AdoptionApplication[],
  search: string,
  noteTypes: ApplicationNoteType[] = [],
  datePreset: DateRangePreset = 'ALL',
) => {
  const q = search.trim().toLowerCase();

  let result = items;
  if (q) {
    result = result.filter((a) =>
      a.fullName?.toLowerCase().includes(q) ||
      a.phone?.toLowerCase().includes(q) ||
      (a.pet?.name || '').toLowerCase().includes(q) ||
      (a.user?.email || '').toLowerCase().includes(q)
    );
  }

  if (noteTypes.length > 0) {
    result = result.filter((a: any) =>
      (a.notes || []).some((n: any) => noteTypes.includes(n.type)),
    );
  }

  const threshold = getDateThreshold(datePreset);
  if (threshold) {
    result = result.filter((a) => {
      const created = new Date(a.createdAt);
      return !Number.isNaN(created.getTime()) && created >= threshold;
    });
  }
  

  return result;
};

export const useApplicationList = () =>
  useApplicationStoreBase(useShallow((s) => ({ items: s.items, isLoading: s.isLoading, movingIds: s.movingIds })));

export const useApplicationFilter = () =>
  useApplicationStoreBase(useShallow((s) => ({ filter: s.filter, setFilter: s.setFilter })));

export const useApplicationActions = () =>
  useApplicationStoreBase(useShallow((s) => ({ fetchApplications: s.fetchApplications, moveApplication: s.moveApplication })));

export const useApplicationStore = useApplicationStoreBase;