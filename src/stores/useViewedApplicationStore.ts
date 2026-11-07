import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewedState {
  viewed: Record<string, true>;
  markViewed: (id: string) => void;
}

export const useViewedApplicationStore = create<ViewedState>()(
  persist(
    (set, get) => ({
      viewed: {},
      markViewed: (id) => {
        if (get().viewed[id]) return;
        set((s) => ({ viewed: { ...s.viewed, [id]: true } }));
      },
    }),
    { name: 'pawlife-viewed-applications' }
  )
);