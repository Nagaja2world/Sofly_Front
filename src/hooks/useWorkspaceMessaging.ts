import { useState, useEffect, useRef, useCallback } from 'react';
import { Stomp, type CompatClient } from '@stomp/stompjs';
// CJS entry(lib/entry.js) 대신 브라우저용 UMD 빌드를 직접 사용.
// CDN 테스트 페이지(sockjs-client/1.6.1/sockjs.min.js)와 동일한 파일.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — UMD 빌드는 타입 선언 없음
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
  const [room, setRoom] = useState<MessagingRoom | null>(null);
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<CompatClient | null>(null);
  const memberIdsRef = useRef(memberUserIds);

  // 테스트 페이지와 동일한 접근법: Stomp.over(socket) + connect()
  const connect = useCallback((roomId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = new (SockJS as any)(`${HTTP_BASE}/ws`);
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {}; // 콘솔 스팸 제거

    stompClient.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        setIsConnected(true);
        // 테스트 페이지와 동일: subscribe에 Authorization 헤더 없음
        stompClient.subscribe(`/sub/chat/${roomId}`, (frame) => {
          try {
            const msg: MessagingMessage = JSON.parse(frame.body);
            setMessages((prev) => [...prev, msg]);
          } catch {
            // ignore malformed frames
          }
        });
      },
      (err: unknown) => {
        console.warn('[WorkspaceChat] 연결 실패:', err);
        setIsConnected(false);
      },
    );

    clientRef.current = stompClient;
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current?.connected) {
      clientRef.current.disconnect();
    }
    clientRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!clientRef.current?.connected || !room) return;
      const token = localStorage.getItem('accessToken');
      // 테스트 페이지와 동일: stompClient.send()
      clientRef.current.send(
        `/pub/chat.message.${room.roomId}`,
        { Authorization: `Bearer ${token ?? ''}` },
        JSON.stringify({ content, type: 'TEXT' }),
      );
    },
    [room],
  );

  const membersLoaded = memberUserIds.length > 0;

  useEffect(() => {
    if (!enabled || !workspaceId || !membersLoaded) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, workspaceId, membersLoaded]);

  return { room, messages, isConnected, isLoading, sendMessage };
}
