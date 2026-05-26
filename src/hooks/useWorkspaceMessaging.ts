import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import {
  fetchMessagingRooms,
  createMessagingRoom,
  fetchMessageHistory,
  type MessagingRoom,
  type MessagingMessage,
} from '@/api/messagingApi';

const HTTP_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
// http → ws, https → wss
const WS_BASE = HTTP_BASE.replace(/^https/, 'wss').replace(/^http/, 'ws');

export function useWorkspaceMessaging(
  workspaceId: number,
  memberUserIds: number[],
  enabled: boolean,
) {
  const [room, setRoom] = useState<MessagingRoom | null>(null);
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const memberIdsRef = useRef(memberUserIds);

  const connect = useCallback((roomId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const client = new Client({
      // SockJS CJS/ESM 호환 이슈를 피해 네이티브 WebSocket 직접 사용.
      // Spring Boot SockJS 엔드포인트는 ws:// 직접 연결도 지원.
      brokerURL: `${WS_BASE}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(
          `/sub/chat/${roomId}`,
          (frame) => {
            try {
              const msg: MessagingMessage = JSON.parse(frame.body);
              setMessages((prev) => [...prev, msg]);
            } catch {
              // ignore malformed frames
            }
          },
          { Authorization: `Bearer ${token}` },
        );
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) =>
        console.warn('[WorkspaceChat] STOMP 에러:', frame.headers['message']),
      onWebSocketError: (evt) =>
        console.warn('[WorkspaceChat] WebSocket 연결 실패:', evt),
    });

    client.activate();
    clientRef.current = client;
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current?.connected || !room) return;
      const token = localStorage.getItem('accessToken');
      clientRef.current.publish({
        destination: `/pub/chat.message.${room.roomId}`,
        headers: { Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ content, type: 'TEXT' }),
      });
    },
    [room],
  );

  // membersLoaded: 멤버 목록이 실제로 로드됐는지 여부.
  // enabled이 true여도 멤버가 없으면 방 생성 시 memberIds: []로 생성돼
  // 다른 유저가 그 방의 멤버가 아니라 각자 별도의 방을 만들게 되는 버그 방지.
  const membersLoaded = memberUserIds.length > 0;

  useEffect(() => {
    if (!enabled || !workspaceId || !membersLoaded) return;

    // 이 시점에 확정된 멤버 목록을 ref에 동기화
    memberIdsRef.current = memberUserIds;

    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        const rooms = await fetchMessagingRooms();
        let target = rooms.find(
          (r) => r.type === 'WORKSPACE' && r.workspaceId === workspaceId,
        );

        if (!target) {
          target = await createMessagingRoom({
            type: 'WORKSPACE',
            workspaceId,
            memberIds: memberIdsRef.current,
          });
        }

        if (cancelled) return;
        setRoom(target);

        const history = await fetchMessageHistory(target.roomId);
        if (cancelled) return;
        setMessages(history);

        connect(target.roomId);
      } catch (err) {
        console.warn('[WorkspaceChat] 초기화 실패:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      disconnect();
      setRoom(null);
      setMessages([]);
    };
    // membersLoaded: false→true 전환 시 한 번만 실행되므로 length 체크만으로 충분
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, workspaceId, membersLoaded]);

  return { room, messages, isConnected, isLoading, sendMessage };
}
