import useAuthStore from "@/store/useAuthStore";

/**
 * 인증이 필요한 API 호출 래퍼.
 * - Authorization 헤더 자동 주입
 * - 401 응답 시 refreshTokens() 호출 후 1회 재시도
 * - 재발급 실패 시 logout() 호출
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const { accessToken, refreshTokens, logout } = useAuthStore.getState();

  const withAuth = (token: string | null): RequestInit => ({
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const res = await fetch(url, withAuth(accessToken));
  if (res.status !== 401) return res;

  // 토큰 재발급 시도
  const ok = await refreshTokens();
  if (!ok) {
    await logout();
    return res;
  }

  // 새 토큰으로 재시도
  const newToken = useAuthStore.getState().accessToken;
  return fetch(url, withAuth(newToken));
}
