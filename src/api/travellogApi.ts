const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/* ── 인증 헤더 ── */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authToken(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `API 오류: ${res.status}`);
  return json.data;
}

/* ── 타입 ── */

export type WeatherApi = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY';

export interface PhotoResponse {
  id: number;
  url: string;
  uploadedById: number;
  uploadedByNickname: string;
  takenAt: string | null;
  latitude: number | null;
  longitude: number | null;
  matchedDay: number | null;
  createdAt: string;
}

export interface TravellogSummaryResponse {
  id: number;
  day: number | null;
  travelDate: string | null;
  title: string;
  weather: WeatherApi | null;
  photoCount: number;
  createdAt: string;
}

export interface TravellogResponse {
  id: number;
  day: number | null;
  travelDate: string | null;
  title: string;
  content: string;
  weather: WeatherApi | null;
  workspaceId: number;
  authorId: number;
  authorNickname: string;
  photos: PhotoResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTravellogPayload {
  title: string;
  content: string;
  day?: number;
  travelDate?: string;
  weather?: WeatherApi;
}

export interface UpdateTravellogPayload {
  title?: string | null;
  content?: string | null;
  day?: number | null;
  travelDate?: string | null;
  weather?: WeatherApi | null;
}

/* ── API 함수 ── */

/** 여행기 목록 조회 */
export async function fetchTravellogs(workspaceId: number): Promise<TravellogSummaryResponse[]> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/travellogs`, {
    headers: authHeaders(),
  });
  return unwrap<TravellogSummaryResponse[]>(res);
}

/** 여행기 단건 조회 */
export async function fetchTravellog(workspaceId: number, logId: number): Promise<TravellogResponse> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/travellogs/${logId}`, {
    headers: authHeaders(),
  });
  return unwrap<TravellogResponse>(res);
}

/** 여행기 생성 */
export async function createTravellog(
  workspaceId: number,
  payload: CreateTravellogPayload,
): Promise<TravellogResponse> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/travellogs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return unwrap<TravellogResponse>(res);
}

/** 여행기 수정 */
export async function updateTravellog(
  workspaceId: number,
  logId: number,
  payload: UpdateTravellogPayload,
): Promise<TravellogResponse> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/travellogs/${logId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return unwrap<TravellogResponse>(res);
}

/** 여행기 삭제 */
export async function deleteTravellog(workspaceId: number, logId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/travellogs/${logId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await unwrap<void>(res);
}

/** 새 사진 업로드 후 첨부 */
export async function uploadTravellogPhotos(
  workspaceId: number,
  logId: number,
  files: File[],
): Promise<TravellogResponse> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/travellogs/${logId}/photos/upload`,
    { method: 'POST', headers: authToken(), body: formData },
  );
  return unwrap<TravellogResponse>(res);
}

/** 앨범 사진 첨부 */
export async function attachAlbumPhotos(
  workspaceId: number,
  logId: number,
  photoIds: number[],
): Promise<TravellogResponse> {
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/travellogs/${logId}/photos`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ photoIds }),
    },
  );
  return unwrap<TravellogResponse>(res);
}

/** 사진 첨부 해제 */
export async function detachPhotos(
  workspaceId: number,
  logId: number,
  photoIds: number[],
): Promise<TravellogResponse> {
  const res = await fetch(
    `${API_BASE}/api/workspaces/${workspaceId}/travellogs/${logId}/photos`,
    {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ photoIds }),
    },
  );
  return unwrap<TravellogResponse>(res);
}
