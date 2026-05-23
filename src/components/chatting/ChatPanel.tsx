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
  deleteChatRoom,
  updateChatRoomTitle,
  isScheduleConfirmed,
  type ChatRoom,
  type ChatMessageApi,
} from "@/api/chatApi";

export interface ChatMessageData {
  id: string;
  role: "user" | "ai";
  text: string;
  isItinerarySuggestion?: boolean;
  pageIndex?: number;
  pageTotal?: number;
}

interface ChatPanelProps {
  workspaceId: number;
  onScheduleSaved?: () => void;
  onCollapse?: () => void;
  onRoomCountChange?: (count: number) => void;
  className?: string;
}

function apiMessageToData(m: ChatMessageApi, index: number): ChatMessageData {
  return {
    id: `hist-${index}`,
    role: m.role === "USER" ? "user" : "ai",
    text: m.content,
    isItinerarySuggestion:
      m.role === "ASSISTANT" && isScheduleConfirmed(m.content),
  };
}

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

export default function ChatPanel({
  workspaceId,
  onScheduleSaved,
  onCollapse,
  onRoomCountChange,
  className = "",
}: ChatPanelProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRoomListOpen, setIsRoomListOpen] = useState(false);

  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText, isStreaming]);

  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchChatRooms(workspaceId);
      setRooms(data);
      onRoomCountChange?.(data.length);
      if (data.length > 0 && selectedRoomId === null) {
        setSelectedRoomId(data[0].roomId);
      }
    } catch (err) {
      console.warn("[ChatPanel] 채팅방 목록 로드 실패:", err);
    }
  }, [workspaceId, selectedRoomId, onRoomCountChange]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

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

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const newRoom = await createChatRoom(workspaceId);
      setRooms((prev) => {
        const next = [newRoom, ...prev];
        onRoomCountChange?.(next.length);
        return next;
      });
      setSelectedRoomId(newRoom.roomId);
    } catch (err) {
      console.warn("[ChatPanel] 채팅방 생성 실패:", err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await deleteChatRoom(roomId);
      setRooms((prev) => {
        const next = prev.filter((r) => r.roomId !== roomId);
        onRoomCountChange?.(next.length);
        return next;
      });
      if (selectedRoomId === roomId) {
        const remaining = rooms.filter((r) => r.roomId !== roomId);
        setSelectedRoomId(remaining.length > 0 ? remaining[0].roomId : null);
        setMessages([]);
      }
    } catch (err) {
      console.warn("[ChatPanel] 채팅방 삭제 실패:", err);
    }
  };

  const handleRenameStart = (room: ChatRoom) => {
    setEditingRoomId(room.roomId);
    setEditingTitle(room.title || "새 채팅");
  };

  const handleRenameConfirm = async (roomId: number) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingRoomId(null);
      return;
    }
    try {
      await updateChatRoomTitle(roomId, trimmed);
      setRooms((prev) =>
        prev.map((r) => (r.roomId === roomId ? { ...r, title: trimmed } : r)),
      );
    } catch (err) {
      console.warn("[ChatPanel] 제목 수정 실패:", err);
    } finally {
      setEditingRoomId(null);
    }
  };

  const handleSend = async (text: string) => {
    if (!selectedRoomId || isStreaming) return;

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

      const confirmed = isScheduleConfirmed(fullText);
      const aiMsg: ChatMessageData = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: fullText,
        isItinerarySuggestion: confirmed,
      };
      setMessages((prev) => [...prev, aiMsg]);

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

  const handleSaveSchedule = async (messageId: string) => {
    if (!selectedRoomId || isSavingSchedule) return;
    setIsSavingSchedule(true);
    try {
      await saveChatSchedule(selectedRoomId, workspaceId);
      onScheduleSaved?.();
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

  const currentRoom = rooms.find((r) => r.roomId === selectedRoomId);

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
      {/* 헤더 */}
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-pretendard text-body2 font-semibold text-gray-900 m-0">
            AI 채팅
          </h3>
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreatingRoom}
            aria-label="새 채팅방 만들기"
            className={[
              "p-1 rounded",
              "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
              "transition-colors border-none bg-transparent shrink-0",
              "inline-flex items-center justify-center",
              isCreatingRoom ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
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

      {/* 현재 채팅방 선택바 (클릭 시 아래로 목록 펼침) */}
      <div className="shrink-0 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setIsRoomListOpen((v) => !v)}
          className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors cursor-pointer border-none bg-white"
        >
          <span className="font-pretendard text-body4 font-medium text-gray-900 truncate">
            {currentRoom?.title || (rooms.length === 0 ? "채팅방 없음" : "채팅방 선택")}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {currentRoom && (
              <span className="font-pretendard text-body5 text-gray-400">현재 채팅</span>
            )}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className={`transition-transform duration-200 ${isRoomListOpen ? "rotate-180" : ""}`}
            >
              <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {/* 드롭다운 채팅방 목록 */}
        {isRoomListOpen && (
          <div className="max-h-72 overflow-y-auto border-t border-gray-100 bg-[#f9f9f6]">
            {rooms.length === 0 ? (
              <p className="font-pretendard text-body5 text-gray-400 text-center py-3 px-4">
                채팅방이 없어요
              </p>
            ) : (
              <div className="py-1 flex flex-col">
                {rooms.map((room) => {
                  const isActive = room.roomId === selectedRoomId;
                  const isEditing = editingRoomId === room.roomId;

                  return (
                    <div key={room.roomId} className="group relative px-2">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleRenameConfirm(room.roomId)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameConfirm(room.roomId);
                            if (e.key === "Escape") setEditingRoomId(null);
                          }}
                          className="w-full px-3 py-2 text-sm border border-blue-400 rounded-lg outline-none font-pretendard my-0.5"
                        />
                      ) : (
                        <div
                          className={[
                            "w-full px-3 py-2 rounded-lg my-0.5",
                            "font-pretendard text-body4 transition-colors",
                            "group flex items-center gap-2",
                            isActive
                              ? "bg-white text-gray-900 shadow-sm"
                              : "bg-transparent text-gray-600 hover:bg-white/70",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(room.roomId);
                              setIsRoomListOpen(false);
                            }}
                            className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer p-0 truncate font-pretendard text-body4"
                          >
                            {room.title || "새 채팅"}
                          </button>
                          <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameStart(room);
                              }}
                              aria-label="채팅방 이름 수정"
                              className="p-0 bg-transparent border-none cursor-pointer text-gray-400 hover:text-blue-500"
                            >
                              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                                <path
                                  d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5zM8.5 3.5l2 2"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoom(room.roomId);
                              }}
                              aria-label="채팅방 삭제"
                              className="p-0 bg-transparent border-none cursor-pointer text-gray-400 hover:text-red-500"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                                <path
                                  d="M2 3.5h10M5.5 3.5V2.5h3v1M5.5 6v4M8.5 6v4M3 3.5l.5 7.5h7l.5-7.5"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 메시지 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-3"
      >
        {selectedRoomId === null ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-pretendard text-body4 text-gray-400 text-center m-0 px-4">
              위에서 채팅방을 선택하거나
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
                      label={isSavingSchedule ? "저장 중..." : "이 일정 저장하기"}
                    />
                  </div>
                )}
              </div>
            ))}

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
    </section>
  );
}
