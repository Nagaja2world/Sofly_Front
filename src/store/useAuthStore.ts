import { create } from "zustand";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const OAUTH_URLS = {
  kakao: `${API_BASE}/oauth2/authorization/kakao`,
  google: `${API_BASE}/oauth2/authorization/google`,
  naver: `${API_BASE}/oauth2/authorization/naver`,
} as const;

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  ageGroup: string | null;
  city: string | null;
  preferCompanionType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferThemes: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isProfileLoading: boolean;
  isLoggedIn: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  fetchUserProfile: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: null,
  isProfileLoading: false,
  isLoggedIn: !!localStorage.getItem("accessToken"),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ accessToken, refreshToken, isLoggedIn: true });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    const { accessToken, refreshToken } = get();

    // 서버에 로그아웃 요청 (실패해도 로컬 정리는 진행)
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // 네트워크 오류 등 무시하고 로컬 정리 진행
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false });
  },

  refreshTokens: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const json = await res.json();
      const data = json.data ?? json;
      const newAccessToken: string = data.accessToken;
      const newRefreshToken: string = data.refreshToken ?? refreshToken;

      if (!newAccessToken) return false;

      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      set({ accessToken: newAccessToken, refreshToken: newRefreshToken, isLoggedIn: true });
      return true;
    } catch {
      return false;
    }
  },

  fetchUserProfile: async () => {
    const { accessToken, refreshTokens, logout } = get();
    if (!accessToken) return;

    set({ isProfileLoading: true });

    try {
      let res = await fetch(`${API_BASE}/api/users/me/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // 401 → 토큰 재발급 후 재시도
      if (res.status === 401) {
        const ok = await refreshTokens();
        if (!ok) {
          await logout();
          return;
        }
        const newToken = get().accessToken;
        res = await fetch(`${API_BASE}/api/users/me/profile`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
      }

      if (!res.ok) throw new Error("프로필 조회 실패");

      const json = await res.json();
      if (json.success && json.data) {
        set({ user: json.data });
      } else {
        throw new Error(json.message || "프로필 데이터 없음");
      }
    } catch (error) {
      console.error("프로필 조회 에러:", error);
      throw error;
    } finally {
      set({ isProfileLoading: false });
    }
  },
}));

export default useAuthStore;
