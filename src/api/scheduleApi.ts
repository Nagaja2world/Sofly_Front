const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `API 오류: ${res.status}`);
  }
  // 일부 엔드포인트는 { success, data } 래퍼 사용
  if (typeof json === 'object' && json !== null && 'success' in json && 'data' in json) {
    if (!json.success) throw new Error(json.message ?? '알 수 없는 오류');
    return json.data as T;
  }
  return json as T;
}

/* ══════════════════════════════════════════
   타입 정의
   ══════════════════════════════════════════ */

export type ScheduleCategory =
  | 'ACCOMMODATION'
  | 'RESTAURANT'
  | 'CAFE'
  | 'ATTRACTION'
  | 'TRANSPORT';

export interface ScheduleItem {
  id: number;
  day: number;
  orderIndex: number;
  visitTime: string | null;
  category: ScheduleCategory;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  photoReference: string | null;
  memo: string | null;
  deepLinkUrl: string | null;
  estimatedCost: number | null;
  deepLinkClickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDetail {
  id: number;
  workspaceId: number;
  title: string;
  version: number;
  itemsByDay: Record<string, ScheduleItem[]>;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSummary {
  id: number;
  title: string;
  version: number;
  itemCount: number;
  createdAt: string;
}

export interface CreateScheduleItemPayload {
  day: number;
  orderIndex: number;
  visitTime?: string;
  category: ScheduleCategory;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  photoReference?: string;
  memo?: string;
  deepLinkUrl?: string;
  estimatedCost?: number;
}

export interface UpdateScheduleItemPayload {
  category: ScheduleCategory;
  name?: string;
  visitTime?: string;
  memo?: string;
  address?: string;
  estimatedCost?: number;
  placeId?: string;
  photoReference?: string;
  latitude?: number;
  longitude?: number;
}

export interface MapPin {
  scheduleItemId: number;
  name: string;
  category: ScheduleCategory;
  latitude: number;
  longitude: number;
  placeId: string | null;
  photoReference: string | null;
  visitTime: string | null;
}

export interface MapPinsResponse {
  days: { day: number; pins: MapPin[] }[];
}

/* ══════════════════════════════════════════
   일정 (Schedule) API
   ══════════════════════════════════════════ */

/** 워크스페이스의 모든 일정 버전 목록 조회 */
export async function fetchScheduleList(workspaceId: number): Promise<ScheduleSummary[]> {
  const res = await fetch(`${API_BASE}/api/v1/schedules?workspaceId=${workspaceId}`, {
    headers: authHeaders(),
  });
  return handleResponse<ScheduleSummary[]>(res);
}

/** 일정 상세 조회 (아이템 포함) */
export async function fetchScheduleById(scheduleId: number): Promise<ScheduleDetail> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}`, {
    headers: authHeaders(),
  });
  return handleResponse<ScheduleDetail>(res);
}

/** 최신 일정 조회 (없으면 null 반환) */
export async function fetchLatestSchedule(workspaceId: number): Promise<ScheduleDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/latest?workspaceId=${workspaceId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  return handleResponse<ScheduleDetail>(res);
}

/** 새 일정 생성 */
export async function createSchedule(payload: {
  workspaceId: number;
  title?: string;
  items: CreateScheduleItemPayload[];
}): Promise<ScheduleDetail> {
  const res = await fetch(`${API_BASE}/api/v1/schedules`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ScheduleDetail>(res);
}

/** 일정 포크 (복사본 생성) */
export async function forkSchedule(scheduleId: number, title?: string): Promise<ScheduleDetail> {
  const query = title ? `?title=${encodeURIComponent(title)}` : '';
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}/fork${query}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<ScheduleDetail>(res);
}

/** 일정 제목 수정 */
export async function updateScheduleTitle(scheduleId: number, title: string): Promise<ScheduleDetail> {
  const res = await fetch(
    `${API_BASE}/api/v1/schedules/${scheduleId}/title?title=${encodeURIComponent(title)}`,
    { method: 'PATCH', headers: authHeaders() },
  );
  return handleResponse<ScheduleDetail>(res);
}

/** 일정 삭제 */
export async function deleteSchedule(scheduleId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`API 오류: ${res.status}`);
}

/** 지도 핀 조회 */
export async function fetchMapPins(scheduleId: number): Promise<MapPinsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}/map`, {
    headers: authHeaders(),
  });
  return handleResponse<MapPinsResponse>(res);
}

/* ══════════════════════════════════════════
   일정 아이템 API
   ══════════════════════════════════════════ */

/** 아이템 추가 */
export async function addScheduleItem(
  scheduleId: number,
  payload: CreateScheduleItemPayload,
): Promise<ScheduleItem> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ScheduleItem>(res);
}

/** 아이템 수정 */
export async function updateScheduleItem(
  scheduleId: number,
  itemId: number,
  payload: UpdateScheduleItemPayload,
): Promise<ScheduleItem> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}/items/${itemId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<ScheduleItem>(res);
}

/** 아이템 위치 이동 (드래그 앤 드롭) */
export async function moveScheduleItem(
  scheduleId: number,
  itemId: number,
  targetDay: number,
  targetOrderIndex: number,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v1/schedules/${scheduleId}/items/${itemId}/position`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ targetDay, targetOrderIndex }),
    },
  );
  if (!res.ok && res.status !== 204) throw new Error(`API 오류: ${res.status}`);
}

/** 아이템 삭제 */
export async function deleteScheduleItem(scheduleId: number, itemId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/schedules/${scheduleId}/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`API 오류: ${res.status}`);
}

/** 딥링크 클릭 추적 */
export async function trackDeepLinkClick(scheduleId: number, itemId: number): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v1/schedules/${scheduleId}/items/${itemId}/deeplink-click`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!res.ok && res.status !== 204) throw new Error(`API 오류: ${res.status}`);
}

/* ══════════════════════════════════════════
   유틸리티
   ══════════════════════════════════════════ */

/** 카테고리 한국어 표시 */
export const CATEGORY_LABEL: Record<ScheduleCategory, string> = {
  ACCOMMODATION: '숙소',
  RESTAURANT: '식당',
  CAFE: '카페',
  ATTRACTION: '관광지',
  TRANSPORT: '교통',
};

/* ══════════════════════════════════════════
   장소 검색 API
   ══════════════════════════════════════════ */

export interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

export interface PlaceResult {
  id: string;
  displayName: { text: string; languageCode: string };
  primaryType: string;
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: PlacePhoto[];
}

/** 장소 검색 */
export async function searchPlaces(text: string): Promise<PlaceResult[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/places?text=${encodeURIComponent(text)}`,
    { headers: authHeaders() },
  );
  const data = await handleResponse<{ places: PlaceResult[] }>(res);
  return data?.places ?? [];
}

/** 장소 사진 URI 조회 — { success, data: { photoUri } } 응답에서 photoUri 반환 */
export async function fetchPlacePhotoUri(
  photoName: string,
  maxWidthPx = 800,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/api/v1/places/photo?name=${encodeURIComponent(photoName)}&maxWidthPx=${maxWidthPx}`,
    { headers: authHeaders() },
  );
  const data = await handleResponse<{ photoUri: string; name: string }>(res);
  return data.photoUri;
}
