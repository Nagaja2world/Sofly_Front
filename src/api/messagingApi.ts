const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export type ChatRoomType = 'DIRECT' | 'GROUP' | 'WORKSPACE';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE';

export interface MessagingRoom {
  roomId: number;
  type: ChatRoomType;
  name: string | null;
  workspaceId: number | null;
}

export interface MessagingMessage {
  id: string;
  messagingRoomId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  type: ChatMessageType;
  createdAt: string;
}

export async function fetchMessagingRooms(): Promise<MessagingRoom[]> {
  const res = await fetch(`${API_BASE}/api/v1/messaging/rooms`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`채팅방 목록 조회 실패: ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function createMessagingRoom(req: {
  type: ChatRoomType;
  name?: string;
  workspaceId?: number;
  memberIds: number[];
}): Promise<MessagingRoom> {
  const res = await fetch(`${API_BASE}/api/v1/messaging/rooms`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`채팅방 생성 실패: ${res.status}`);
  const json = await res.json();
  const data = json.data ?? json;
  return {
    roomId: data.id ?? data.roomId,
    type: data.type,
    name: data.name ?? null,
    workspaceId: data.workspaceId ?? null,
  };
}

export async function addRoomMembers(roomId: number, memberIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/messaging/rooms/${roomId}/members`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ memberIds }),
  });
  if (!res.ok) throw new Error(`채팅방 멤버 추가 실패: ${res.status}`);
}

export async function fetchMessageHistory(
  roomId: number,
  page = 0,
  size = 30,
): Promise<MessagingMessage[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/messaging/rooms/${roomId}/messages?page=${page}&size=${size}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`메시지 히스토리 조회 실패: ${res.status}`);
  const json = await res.json();
  const paged = json.data ?? json;
  const content: MessagingMessage[] = paged.content ?? paged;
  return [...content].reverse();
}
