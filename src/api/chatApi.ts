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

/* ══════════════════════════════════════════
   타입 정의
   ══════════════════════════════════════════ */

export interface ChatRoom {
  roomId: number;
  title: string;
  lastMessage: string | null;
}

export interface ChatMessageApi {
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: string;
}

export interface ChatHistoryResponse {
  roomId: number;
  messages: ChatMessageApi[];
}

export interface SendMessageResponse {
  roomId: number;
  message: string;
  role: 'ASSISTANT';
  createdAt: string;
}

/* ══════════════════════════════════════════
   채팅방 API
   ══════════════════════════════════════════ */

/** 채팅방 목록 조회 */
export async function fetchChatRooms(workspaceId: number): Promise<ChatRoom[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/chat/workspaces/${workspaceId}/rooms`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`채팅방 목록 조회 실패: ${res.status}`);
  return res.json();
}

/** 채팅방 생성 */
export async function createChatRoom(
  workspaceId: number,
  title?: string,
): Promise<ChatRoom> {
  const res = await fetch(`${API_BASE}/api/v1/chat/rooms`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ workspaceId, title }),
  });
  if (!res.ok) throw new Error(`채팅방 생성 실패: ${res.status}`);
  return res.json();
}

/** 메시지 히스토리 조회 */
export async function fetchChatHistory(
  roomId: number,
): Promise<ChatHistoryResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/rooms/${roomId}/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`메시지 히스토리 조회 실패: ${res.status}`);
  return res.json();
}

/** 메시지 전송 (비스트리밍) */
export async function sendMessage(
  roomId: number,
  message: string,
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/rooms/${roomId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`메시지 전송 실패: ${res.status}`);
  return res.json();
}

/** 메시지 전송 (SSE 스트리밍)
 *  - onChunk: 텍스트 청크 수신 시 호출
 *  - onError: SSE error 이벤트 수신 시 호출
 */
export async function sendMessageStream(
  roomId: number,
  message: string,
  onChunk: (text: string) => void,
  onError?: (msg: string) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/chat/rooms/${roomId}/stream`, {
    method: 'POST',
    headers: authHeaders({ Accept: 'text/event-stream' }),
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error(`스트리밍 요청 실패: ${res.status}`);
  if (!res.body) throw new Error('응답 body가 없습니다');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (!data) continue;
        if (currentEvent === 'error') {
          onError?.(data);
          currentEvent = '';
        } else {
          onChunk(data);
        }
      } else if (line === '') {
        currentEvent = '';
      }
      // ': keep-alive' 라인 무시
    }
  }
}

/** 채팅방 삭제 */
export async function deleteChatRoom(roomId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/chat/rooms/${roomId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(`채팅방 삭제 실패: ${res.status}`);
}

/** 채팅방 제목 수정 */
export async function updateChatRoomTitle(roomId: number, title: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/chat/rooms/${roomId}/title`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`채팅방 제목 수정 실패: ${res.status}`);
}

/** AI 확정 일정 저장 */
export async function saveChatSchedule(
  roomId: number,
  workspaceId: number,
): Promise<unknown> {
  const res = await fetch(
    `${API_BASE}/api/v1/chat/rooms/${roomId}/save-schedule?workspaceId=${workspaceId}`,
    { method: 'POST', headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`일정 저장 실패: ${res.status}`);
  return res.json();
}

/* ══════════════════════════════════════════
   유틸리티
   ══════════════════════════════════════════ */

/** AI 응답이 확정된 일정을 포함하는지 감지 */
export function isScheduleConfirmed(aiResponse: string): boolean {
  return aiResponse.includes('"days"') && aiResponse.includes('"items"');
}
