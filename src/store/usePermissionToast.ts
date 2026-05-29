import { create } from "zustand";

interface PermissionToastStore {
  message: string | null;
  show: (message?: string) => void;
  hide: () => void;
}

export const usePermissionToast = create<PermissionToastStore>((set) => ({
  message: null,
  show: (message = "수정 권한이 없습니다.") => {
    set({ message });
    setTimeout(() => set({ message: null }), 3000);
  },
  hide: () => set({ message: null }),
}));
