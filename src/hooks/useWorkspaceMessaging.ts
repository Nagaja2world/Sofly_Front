import { useState, useEffect, useRef, useCallback } from 'react';
import { Stomp, type CompatClient } from '@stomp/stompjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import {
  fetchMessagingRooms,
  createMessagingRoom,
  fetchMessageHistory,
  type MessagingRoom,
  type MessagingMessage,
} from '@/api/messagingApi';

const HTTP_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export function useWorkspaceMessaging(
  workspaceId: number,
  memberUserIds: number[],
  enabled: boolean,
) {
  const [rooms, setRooms] = useState<MessagingRoom[]>([]);
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<CompatClient | null>(null);
  const memberIdsRef = useRef(memberUserIds);
  // 중복 메시지 방지용 수신 ID 세트
  const receivedIdsRef = useRef<Set<string>>(new Set());

  const addMessage = useCallback((msg: MessagingMessage) => {
    // id가 없는 메시지(WebSocket 포맷 다를 때)는 createdAt+senderId로 임시 키
    const key = msg.id ?? `${msg.senderId}-${msg.createdAt}`;
    if (receivedIdsRef.current.has(key)) return;
    receivedIdsRef.current.add(key);
    setMessages((prev) => [...prev, msg]);
  }, []);

  const connect = useCallback((wsRooms: MessagingRoom[]) => {
    const token = localStorage.getItem('accessToken');
    if (!token || wsRooms.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stompClient = Stomp.over(() => new (SockJS as any)(`${HTTP_BASE}/ws`));
    stompClient.debug = () => {};

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        setIsConnected(true);
        // 워크스페이스의 모든 방을 구독 — DB에 중복 방이 있어도
        // 어느 방에서 온 메시지든 수신 가능
        wsRooms.forEach((r) => {
          console.log(`[팀채팅] 구독: /sub/chat/${r.roomId}`);
          stompClient.subscribe(`/sub/chat/${r.roomId}`, (frame) => {
            try {
              const msg: MessagingMessage = JSON.parse(frame.body);
              addMessage(msg);
            } catch (e) {
              console.error('[팀채팅] 파싱 실패:', e);
            }
          });
        });
      },
      (err: unknown) => {
        console.warn('[팀채팅] 연결 실패:', err);
        setIsConnected(false);
      },
    );

    clientRef.current = stompClient;
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.disconnect();
    }
    clientRef.current = null;
    setIsConnected(false);
  }, []);

  // 가장 오래된 방(낮은 ID)으로 전송 — 모두가 같은 채널을 쓰도록 유도
  const primaryRoom = rooms.length > 0
    ? rooms.reduce((min, r) => r.roomId < min.roomId ? r : min)
    : null;

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current?.connected || !primaryRoom) return;
      const token = localStorage.getItem('accessToken');
      clientRef.current.send(
        `/pub/chat.message.${primaryRoom.roomId}`,
        { Authorization: `Bearer ${token ?? ''}` },
        JSON.stringify({ content, type: 'TEXT' }),
      );
    },
    [primaryRoom],
  );

  const membersLoaded = memberUserIds.length > 0;

  useEffect(() => {
    if (!enabled || !workspaceId || !membersLoaded) return;

    memberIdsRef.current = memberUserIds;
    receivedIdsRef.current = new Set();
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        const allRooms = await fetchMessagingRooms();

        // 이 워크스페이스에 속한 모든 방 수집
        const wsRooms = allRooms
          .filter((r) => r.type === 'WORKSPACE' && Number(r.workspaceId) === Number(workspaceId))
          .sort((a, b) => a.roomId - b.roomId);

        console.log(`[팀채팅] workspace=${workspaceId} 방 목록:`, wsRooms.map(r => r.roomId));

        let targetRooms = wsRooms;

        if (targetRooms.length === 0) {
          const created = await createMessagingRoom({
            type: 'WORKSPACE',
            workspaceId,
            memberIds: memberIdsRef.current,
          });
          targetRooms = [created];
          console.log('[팀채팅] 새 방 생성 roomId=', created.roomId);
        }

        if (cancelled) return;
        setRooms(targetRooms);

        // 가장 오래된 방(primary)의 히스토리를 로드
        const primary = targetRooms[0];
        const history = await fetchMessageHistory(primary.roomId);
        if (cancelled) return;

        // 히스토리 메시지를 receivedIds에 등록해 WebSocket 중복 수신 방지
        history.forEach((m) => {
          const key = m.id ?? `${m.senderId}-${m.createdAt}`;
          receivedIdsRef.current.add(key);
        });
        setMessages(history);

        connect(targetRooms);
      } catch (err) {
        console.warn('[팀채팅] 초기화 실패:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      disconnect();
      setRooms([]);
      setMessages([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, workspaceId, membersLoaded]);

  return { messages, isConnected, isLoading, sendMessage };
}
