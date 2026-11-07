// src/store/useUserStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  user: any | null;
  setUser: (u: any) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // Tên key sẽ lưu trong localStorage
      storage: createJSONStorage(() => localStorage), // Mặc định là localStorage
    }
  )
);