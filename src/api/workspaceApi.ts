const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export type WorkspaceVisibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';

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
  visibility?: WorkspaceVisibility;
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

/** 워크스페이스 단건 조회 */
export async function fetchWorkspaceById(id: number): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces/${id}`, {
    headers: authHeaders(),
  });
  return unwrap<Workspace>(res);
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

/** 워크스페이스 삭제 */
export async function deleteWorkspace(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workspaces/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
}

/** 워크스페이스 커버 이미지 업로드 */
export async function uploadCoverImage(workspaceId: number, file: File): Promise<Workspace> {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/cover-image`, {
    method: 'PATCH',
    // Content-Type 헤더를 직접 설정하지 않음 → 브라우저가 boundary 포함해서 자동 설정
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return unwrap<Workspace>(res);
}

/** 워크스페이스 수정 */
export async function updateWorkspace(
  id: number,
  payload: Partial<CreateWorkspacePayload> & { visibility?: WorkspaceVisibility },
): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return unwrap<Workspace>(res);
}

/** 워크스페이스 공개 범위만 변경 */
export async function updateVisibility(id: number, visibility: WorkspaceVisibility): Promise<Workspace> {
  const res = await fetch(`${API_BASE}/api/workspaces/${id}/visibility`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ visibility }),
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

/* ── 워크스페이스 멤버 ── */

export interface WorkspaceMemberApi {
  memberId: number;
  userId: number;
  nickname: string;
  userEmail: string;
  profileImageUrl: string | null;
  role: 'OWNER' | 'VIEWER';
}

/** 워크스페이스 멤버 목록 조회 */
export async function fetchWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberApi[]> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members`, {
    headers: authHeaders(),
  });
  return unwrap<WorkspaceMemberApi[]>(res);
}

/** 워크스페이스 나가기 (탈퇴) */
export async function leaveWorkspace(workspaceId: number, memberId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
}

/** 워크스페이스 멤버 초대 */
export async function inviteMember(workspaceId: number, userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
}

/* ── 워크스페이스 항공편 ── */

export interface WorkspaceFlight {
  id: number;
  flightNumber: string;
  airline: string;
  airlineLogo: string | null;
  planeType: string | null;
  cabinClass: string | null;
  departureAirport: string;
  departureCity: string | null;
  departureCountry: string | null;
  departureTerminal: string | null;
  arrivalAirport: string;
  arrivalCity: string | null;
  arrivalCountry: string | null;
  arrivalTerminal: string | null;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number | null;
  totalPrice: number | null;
  baseFare: number | null;
  tax: number | null;
  platformFee: number | null;
  currencyCode: string | null;
  checkedBaggageKg: number | null;
  checkedBaggagePiece: number | null;
  cabinBaggageKg: number | null;
  personalItemIncluded: boolean | null;
  bookingToken: string | null;
  offerReference: string | null;
  flightType: 'OUTBOUND' | 'RETURN';
}

export interface SaveFlightPayload {
  flightNumber: string;
  airline: string;
  airlineLogo?: string | null;
  planeType?: string | null;
  cabinClass?: string | null;
  departureAirport: string;
  departureCity?: string | null;
  departureCountry?: string | null;
  departureTerminal?: string | null;
  arrivalAirport: string;
  arrivalCity?: string | null;
  arrivalCountry?: string | null;
  arrivalTerminal?: string | null;
  departureTime: string;
  arrivalTime: string;
  durationMinutes?: number | null;
  totalPrice?: number | null;
  baseFare?: number | null;
  tax?: number | null;
  platformFee?: number | null;
  currencyCode?: string | null;
  checkedBaggageKg?: number | null;
  checkedBaggagePiece?: number | null;
  cabinBaggageKg?: number | null;
  personalItemIncluded?: boolean | null;
  bookingToken?: string | null;
  offerReference?: string | null;
  flightType: 'OUTBOUND' | 'RETURN';
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

/** 워크스페이스 항공편 삭제 */
export async function deleteFlightFromWorkspace(
  workspaceId: number,
  flightId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/flights/${flightId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
}

/** 새 워크스페이스 생성 시 사용할 더미 데이터 */
export function buildDummyWorkspacePayload(): CreateWorkspacePayload {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return {
    title: '새 워크스페이스',
    destination: '목적지를 설정해주세요',
    countryCode: 'KR',
    startDate: fmt(today),
    endDate: fmt(nextWeek),
    headcount: 1,
    coverImageUrl: 'string',
  };
}
