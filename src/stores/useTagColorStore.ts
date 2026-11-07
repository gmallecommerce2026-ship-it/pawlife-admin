'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TagColorState {
  // Bảng ánh xạ: tên tag (viết thường) -> mã màu
  tagColors: Record<string, string>;
  setTagColor: (tagName: string, color: string) => void;
  getTagColor: (tagName: string) => string | undefined;
  removeTagColor: (tagName: string) => void;
}

const normalizeKey = (name: string) => name.trim().toLowerCase();

export const useTagColorStore = create<TagColorState>()(
  persist(
    (set, get) => ({
      tagColors: {},

      // Lưu / cập nhật màu cho 1 tag (theo tên)
      setTagColor: (tagName, color) => {
        if (!tagName || !color) return;
        const key = normalizeKey(tagName);
        const current = get().tagColors[key];
        if (current === color) return; // Tránh set trùng gây render thừa
        set((state) => ({
          tagColors: { ...state.tagColors, [key]: color },
        }));
      },

      // Lấy màu đã lưu cho 1 tag (nếu có)
      getTagColor: (tagName) => {
        if (!tagName) return undefined;
        return get().tagColors[normalizeKey(tagName)];
      },

      removeTagColor: (tagName) => {
        set((state) => {
          const next = { ...state.tagColors };
          delete next[normalizeKey(tagName)];
          return { tagColors: next };
        });
      },
    }),
    {
      name: 'shelter-tag-color-store', // key lưu trong localStorage
    }
  )
);