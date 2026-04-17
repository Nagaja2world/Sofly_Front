import { create } from "zustand";

/* ── API 기본 URL ── */
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ── 소셜 로그인 시작 URL ── */
export const OAUTH_URLS = {
  kakao: `${API_BASE}/oauth2/authorization/kakao`,
  google: `${API_BASE}/oauth2/authorization/google`,
} as const;

/* ── 유저 프로필 타입 (GET /api/users/me/profile 응답 기준) ── */
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

/* ── 스토어 상태 ── */
interface AuthState {
  /* 토큰 */
  accessToken: string | null;
  refreshToken: string | null;

  /* 유저 프로필 */
  user: UserProfile | null;

  /* 로그인 여부 */
  isLoggedIn: boolean;

  /* 액션 */
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: null,
  isLoggedIn: !!localStorage.getItem("accessToken"),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ accessToken, refreshToken, isLoggedIn: true });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoggedIn: false,
    });
  },

  fetchUserProfile: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    try {
      const res = await fetch(`${API_BASE}/api/users/me/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error("프로필 조회 실패");

      const json = await res.json();
      // 백엔드 응답: { success, code, message, data: { ... } }
      if (json.success && json.data) {
        set({ user: json.data });
      }
    } catch (error) {
      console.error("프로필 조회 에러:", error);
    }
  },
}));

export default useAuthStore;
