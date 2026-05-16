import { useEffect, useRef, useState, useCallback } from "react";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SaveItineraryButton from "./SaveItineraryButton";
import {
  fetchChatRooms,
  createChatRoom,
  fetchChatHistory,
  sendMessageStream,
  saveChatSchedule,
  isScheduleConfirmed,
  type ChatRoom,
  type ChatMessageApi,
} from "@/api/chatApi";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 화면 렌더링용 메시지 */
export interface ChatMessageData {
  id: string;
  role: "user" | "ai";
  text: string;
  isItinerarySuggestion?: boolean;
  pageIndex?: number;
  pageTotal?: number;
}

interface ChatPanelProps {
  /** 워크스페이스 ID — 채팅방 목록 조회 및 일정 저장에 사용 */
  workspaceId: number;
  /** 일정 저장 완료 콜백 (워크스페이스 일정 섹션 갱신용) */
  onScheduleSaved?: () => void;
  /** 패널 접기 버튼 클릭 콜백 */
  onCollapse?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   헬퍼
   ══════════════════════════════════════════ */

function apiMessageToData(m: ChatMessageApi, index: number): ChatMessageData {
  return {
    id: `hist-${index}`,
    role: m.role === "USER" ? "user" : "ai",
    text: m.content,
    isItinerarySuggestion:
      m.role === "ASSISTANT" && isScheduleConfirmed(m.content),
  };
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

function ThinkingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 우측 AI 채팅 패널
 *
 * 레이아웃 (두 컬럼)
 * ┌────────────┬────────────────────────────┐
 * │ 채팅방 목록 │ 메시지 영역                 │
 * │ (110px)   │ (flex-1)                   │
 * │            │                            │
 * │  [방 1]    │  [user bubble]             │
 * │  [방 2] ✓  │  [ai bubble]              │
 * │            ├────────────────────────────┤
 * │  [+]       │  [input]                   │
 * └────────────┴────────────────────────────┘
 */
export default function ChatPanel({
  workspaceId,
  onScheduleSaved,
  onCollapse,
  className = "",
}: ChatPanelProps) {
  /* ── 채팅방 상태 ── */
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  /* ── 메시지 상태 ── */
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* ── 스크롤 자동 이동 ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText, isStreaming]);

  /* ── 채팅방 목록 로드 ── */
  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchChatRooms(workspaceId);
      setRooms(data);
      if (data.length > 0 && selectedRoomId === null) {
        setSelectedRoomId(data[0].roomId);
      }
    } catch (err) {
      console.warn("[ChatPanel] 채팅방 목록 로드 실패:", err);
    }
  }, [workspaceId, selectedRoomId]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  /* ── 메시지 히스토리 로드 ── */
  useEffect(() => {
    if (selectedRoomId === null) return;
    setMessages([]);
    setStreamingText(null);

    fetchChatHistory(selectedRoomId)
      .then((hist) => {
        setMessages(hist.messages.map(apiMessageToData));
      })
      .catch((err) => {
        console.warn("[ChatPanel] 히스토리 로드 실패:", err);
      });
  }, [selectedRoomId]);

  /* ── 새 채팅방 생성 ── */
  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const newRoom = await createChatRoom(workspaceId);
      setRooms((prev) => [newRoom, ...prev]);
      setSelectedRoomId(newRoom.roomId);
    } catch (err) {
      console.warn("[ChatPanel] 채팅방 생성 실패:", err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  /* ── 메시지 전송 (SSE 스트리밍) ── */
  const handleSend = async (text: string) => {
    if (!selectedRoomId || isStreaming) return;

    // 낙관적 UI: 유저 메시지 즉시 추가
    const userMsg: ChatMessageData = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      pageIndex: 1,
      pageTotal: 1,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    let fullText = "";
    try {
      await sendMessageStream(
        selectedRoomId,
        text,
        (chunk) => {
          fullText += chunk;
          setStreamingText(fullText);
        },
        (errMsg) => {
          console.warn("[ChatPanel] SSE error:", errMsg);
        },
      );

      // 스트리밍 완료 → 메시지 목록에 추가
      const confirmed = isScheduleConfirmed(fullText);
      const aiMsg: ChatMessageData = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: fullText,
        isItinerarySuggestion: confirmed,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 채팅방 lastMessage 갱신
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === selectedRoomId
            ? { ...r, lastMessage: fullText.slice(0, 100) }
            : r,
        ),
      );
    } catch (err) {
      console.warn("[ChatPanel] 스트리밍 오류:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "ai",
          text: "오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      setStreamingText(null);
      setIsStreaming(false);
    }
  };

  /* ── 일정 저장 ── */
  const handleSaveSchedule = async (messageId: string) => {
    if (!selectedRoomId || isSavingSchedule) return;
    setIsSavingSchedule(true);
    try {
      await saveChatSchedule(selectedRoomId, workspaceId);
      onScheduleSaved?.();
      // 저장 완료 후 버튼 숨기기
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isItinerarySuggestion: false } : m,
        ),
      );
    } catch (err) {
      console.warn("[ChatPanel] 일정 저장 실패:", err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  /* ── 렌더 ── */
  return (
    <section
      className={[
        "flex flex-col h-full",
        "bg-white border border-gray-300 rounded-xl",
        "overflow-hidden",
        className,
      ].join(" ")}
      aria-label="AI 채팅"
    >
      {/* ── 헤더 ── */}
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
        <h3 className="font-pretendard text-body2 font-semibold text-gray-900 m-0">
          AI 채팅
        </h3>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="채팅 패널 접기"
            className={[
              "p-1 rounded",
              "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
              "transition-colors cursor-pointer",
              "border-none bg-transparent shrink-0",
              "inline-flex items-center justify-center",
            ].join(" ")}
          >
            <LayoutLeftIcon className="w-4 h-4 -scale-x-100" />
          </button>
        )}
      </header>

      {/* ── 2컬럼 본문 ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── 채팅방 목록 사이드바 ── */}
        <aside className="w-[110px] shrink-0 border-r border-gray-200 flex flex-col bg-background overflow-hidden">
          {/* 방 목록 */}
          <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1 px-1.5">
            {rooms.length === 0 ? (
              <p className="font-pretendard text-body5 text-gray-400 text-center mt-4 px-1">
                채팅방이 없어요
              </p>
            ) : (
              rooms.map((room) => {
                const isActive = room.roomId === selectedRoomId;
                return (
                  <button
                    key={room.roomId}
                    type="button"
                    onClick={() => setSelectedRoomId(room.roomId)}
                    className={[
                      "w-full text-left px-2 py-2 rounded-lg",
                      "font-pretendard text-body5 transition-colors cursor-pointer",
                      "border-none group flex items-start gap-1",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "bg-transparent text-gray-600 hover:bg-white/70",
                    ].join(" ")}
                  >
                    <span className="flex-1 min-w-0 truncate leading-snug">
                      {room.title || "새 채팅"}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className={[
                        "shrink-0 mt-0.5 text-gray-400",
                        "opacity-0 group-hover:opacity-60",
                        "transition-opacity",
                      ].join(" ")}
                      aria-hidden
                    >
                      <path
                        d="M2 3.5h10M5.5 3.5V2.5h3v1M5.5 6v4M8.5 6v4M3 3.5l.5 7.5h7l.5-7.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })
            )}
          </div>

          {/* 새 채팅방 추가 버튼 */}
          <div className="px-1.5 py-2 border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              aria-label="새 채팅방 만들기"
              className={[
                "w-full flex items-center justify-center gap-1",
                "py-1.5 rounded-lg",
                "font-pretendard text-body5 text-gray-500",
                "border border-dashed border-gray-300",
                "bg-transparent transition-colors",
                isCreatingRoom
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-gray-500 hover:text-gray-700 hover:bg-white cursor-pointer",
              ].join(" ")}
            >
              <PlusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>새 채팅</span>
            </button>
          </div>
        </aside>

        {/* ── 채팅 영역 ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* 메시지 스크롤 영역 */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-3"
          >
            {selectedRoomId === null ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="font-pretendard text-body4 text-gray-400 text-center m-0 px-4">
                  왼쪽에서 채팅방을 선택하거나
                  <br />새 채팅을 시작해보세요.
                </p>
              </div>
            ) : messages.length === 0 && !isStreaming ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="font-pretendard text-body4 text-gray-400 text-center m-0 px-4">
                  원하시는 여행 일정을
                  <br />
                  자유롭게 말씀해주세요.
                </p>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2">
                    <ChatMessage
                      role={m.role}
                      text={m.text}
                      pageIndex={m.role === "user" ? m.pageIndex : undefined}
                      pageTotal={m.role === "user" ? m.pageTotal : undefined}
                    />
                    {m.role === "ai" && m.isItinerarySuggestion && (
                      <div className="flex items-start">
                        <SaveItineraryButton
                          onClick={() => handleSaveSchedule(m.id)}
                          disabled={isSavingSchedule}
                          label={
                            isSavingSchedule ? "저장 중..." : "이 일정 저장하기"
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* 스트리밍 중: 실시간 AI 버블 */}
                {isStreaming && (
                  <div className="flex flex-col gap-2">
                    {streamingText ? (
                      <ChatMessage role="ai" text={streamingText} />
                    ) : (
                      <ThinkingIndicator />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 입력창 */}
          <div className="px-3 py-3 border-t border-gray-200 bg-white shrink-0">
            <ChatInput
              placeholder="원하시는 일정을 말씀해주세요!"
              onSend={handleSend}
              disabled={isStreaming || selectedRoomId === null}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
