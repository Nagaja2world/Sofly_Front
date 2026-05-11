const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message ?? '알 수 없는 오류');
  return json.data;
}

export interface UserSearchResult {
  userId: number;
  nickname: string;
  email: string;
}

/** 이메일로 사용자 검색 (최대 10명) */
export async function searchUsers(email: string): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({ email });
  const res = await fetch(`${API_BASE}/api/users/search?${params}`, {
    headers: authHeaders(),
  });
  return unwrap<UserSearchResult[]>(res);
}
