const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface Workspace {
  id: number;
  title: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  headcount: number;
  coverImageUrl: string;
  ownerId: number;
  memberCount: number;
}

export interface CreateWorkspacePayload {
  title: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  headcount: number;
  coverImageUrl: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message ?? '알 수 없는 오류');
  return json.data;
}

/** 워크스페이스 목록 조회 */
export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await fetch(`${API_BASE}/api/workspaces`, {
    headers: authHeaders(),
  });
  return unwrap<Workspace[]>(res);
}

/** 워크스페이스 생성 */
export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return unwrap<Workspace>(res);
}

/* ── coverImageUrl이 실제 URL이 아닐 때 대체할 Mock 이미지 목록 ── */
const MOCK_COVER_IMAGES = [
  'https://picsum.photos/seed/travel1/400/300',
  'https://picsum.photos/seed/travel2/400/300',
  'https://picsum.photos/seed/travel3/400/300',
  'https://picsum.photos/seed/travel4/400/300',
  'https://picsum.photos/seed/travel5/400/300',
  'https://picsum.photos/seed/travel6/400/300',
];

/** coverImageUrl이 "string"이거나 http로 시작하지 않으면 Mock 이미지 반환 */
export function resolveCoverImage(url: string, id: number): string {
  if (url && url !== 'string' && (url.startsWith('http') || url.startsWith('/'))) {
    return url;
  }
  return MOCK_COVER_IMAGES[id % MOCK_COVER_IMAGES.length];
}

/* ── 워크스페이스 항공편 ── */

export interface WorkspaceFlight {
  id: number;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  flightType: 'OUTBOUND' | 'INBOUND';
}

export interface SaveFlightPayload {
  flightNumber: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  flightType: 'OUTBOUND' | 'INBOUND';
}

/** 워크스페이스에 항공편 저장 */
export async function saveFlightToWorkspace(
  workspaceId: number,
  payload: SaveFlightPayload,
): Promise<WorkspaceFlight> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/flights`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return unwrap<WorkspaceFlight>(res);
}

/** 워크스페이스 항공편 목록 조회 */
export async function fetchWorkspaceFlights(workspaceId: number): Promise<WorkspaceFlight[]> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/flights`, {
    headers: authHeaders(),
  });
  return unwrap<WorkspaceFlight[]>(res);
}

/** 새 워크스페이스 생성 시 사용할 더미 데이터 */
export function buildDummyWorkspacePayload(): CreateWorkspacePayload {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return {
    title: '새 워크스페이스',
    destination: '미정',
    countryCode: 'KR',
    startDate: fmt(today),
    endDate: fmt(nextWeek),
    headcount: 1,
    coverImageUrl: 'string',
  };
}
