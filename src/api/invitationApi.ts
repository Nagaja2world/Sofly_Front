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

export interface Invitation {
  invitationId: number;
  workspaceId: number;
  workspaceTitle: string;
  inviterNickname: string;
  inviterEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  expiresAt: string;
  createdAt: string;
}

export interface AcceptedMember {
  memberId: number;
  userId: number;
  nickname: string;
  userEmail: string;
  role: 'OWNER' | 'VIEWER';
}

/** 내 PENDING 초대 목록 조회 */
export async function fetchInvitations(): Promise<Invitation[]> {
  const res = await fetch(`${API_BASE}/api/invitations`, {
    headers: authHeaders(),
  });
  return unwrap<Invitation[]>(res);
}

/** 초대 수락 */
export async function acceptInvitation(invitationId: number): Promise<AcceptedMember> {
  const res = await fetch(`${API_BASE}/api/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return unwrap<AcceptedMember>(res);
}

/** 초대 거절 */
export async function rejectInvitation(invitationId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/invitations/${invitationId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
}
