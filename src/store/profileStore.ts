// src/store/profileStore.ts
// (선택) zustand 스토어 — 프로필을 글로벌하게 공유할 때.
// 사용 안 하면 이 파일은 무시하세요.

import { create } from 'zustand';
import type { UserProfile, UserProfilePatch } from '../types/profile';
import { fetchMyProfile, updateMyProfile } from '../api/profile';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
  update: (patch: UserProfilePatch) => Promise<UserProfile>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  reload: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await fetchMyProfile();
      set({ profile, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  },
  update: async (patch) => {
    const next = await updateMyProfile(patch);
    set({ profile: next });
    return next;
  },
}));
