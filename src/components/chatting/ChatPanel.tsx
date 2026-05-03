import { useEffect, useRef } from "react";
import LayoutLeftIcon from "@/assets/layout_left.svg?react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SaveItineraryButton from "./SaveItineraryButton";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 한 채팅 메시지 데이터 */
export interface ChatMessageData {
  id: string;
  role: "user" | "ai";
  text: string;
  /** AI 메시지인 경우, 일정 제안인지 여부 (true면 하단에 "이 일정 저장하기" 버튼 표시) */
  isItinerarySuggestion?: boolean;
  /** user 메시지: 같은 질문에 대한 N번째 응답 인덱스 (페이지네이션) */
  pageIndex?: number;
  pageTotal?: number;
}

interface ChatPanelProps {
  /** 메시지 목록 (오래된 → 최신 순) */
  messages: ChatMessageData[];
  /** 메시지 전송 콜백 */
  onSend?: (text: string) => void;
  /** "이 일정 저장하기" 클릭 콜백 (어떤 메시지에 대한 저장인지 id 전달) */
  onSaveItinerary?: (messageId: string) => void;
  /** user 메시지 편집 */
  onEditMessage?: (messageId: string) => void;
  /** user 메시지 복사 */
  onCopyMessage?: (messageId: string) => void;
  /** user 메시지의 이전/다음 응답 페이지 이동 */
  onPrevPage?: (messageId: string) => void;
  onNextPage?: (messageId: string) => void;
  /** AI 응답 대기 중 여부 (입력창 비활성화 + 로딩 인디케이터) */
  isThinking?: boolean;
  /** 입력창 placeholder */
  inputPlaceholder?: string;
  /** 패널 접기 버튼 클릭 콜백 (헤더 우측 아이콘) */
  onCollapse?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/** AI 응답 대기 중 인디케이터 (점 3개 애니메이션) */
function ThinkingIndicator() {
  return (
    <div className="flex items-start">
      <div
        className={[
          "bg-gray-100 rounded-2xl rounded-tl-sm",
          "px-4 py-3 inline-flex items-center gap-1",
        ].join(" ")}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지 우측에 위치하는 AI 채팅 패널
 *
 * 구조 (위→아래)
 * 1. 헤더: "AI 채팅" 라벨 (선택)
 * 2. 메시지 영역 (스크롤): user/ai 메시지 + AI 메시지 중 일정 제안이면 하단에 "이 일정 저장하기" 버튼
 * 3. 하단: ChatInput (sticky)
 *
 * 부모에서 높이를 지정해야 메시지 영역의 스크롤이 정상 동작 (보통 h-screen 또는 calc 사용).
 */
export default function ChatPanel({
  messages,
  onSend,
  onSaveItinerary,
  onEditMessage,
  onCopyMessage,
  onPrevPage,
  onNextPage,
  isThinking = false,
  inputPlaceholder,
  onCollapse,
  className = "",
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /** 새 메시지가 추가되거나 thinking 상태가 바뀌면 자동으로 맨 아래로 스크롤 */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

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
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
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
            {/* layout_left 아이콘을 좌우 반전하여 "오른쪽 패널 접기" 의미 표현 */}
            <LayoutLeftIcon className="w-4 h-4 -scale-x-100" />
          </button>
        )}
      </header>

      {/* ── 메시지 영역 (스크롤) ── */}
      <div
        ref={scrollRef}
        className={[
          "flex-1 min-h-0 overflow-y-auto",
          "px-4 py-4",
          "flex flex-col gap-3",
        ].join(" ")}
      >
        {messages.length === 0 && !isThinking ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-pretendard text-body3 text-gray-500 text-center m-0">
              원하시는 여행 일정을 자유롭게 말씀해주세요.
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
                  onEdit={
                    m.role === "user" && onEditMessage
                      ? () => onEditMessage(m.id)
                      : undefined
                  }
                  onCopy={
                    m.role === "user" && onCopyMessage
                      ? () => onCopyMessage(m.id)
                      : undefined
                  }
                  onPrevPage={
                    m.role === "user" && onPrevPage
                      ? () => onPrevPage(m.id)
                      : undefined
                  }
                  onNextPage={
                    m.role === "user" && onNextPage
                      ? () => onNextPage(m.id)
                      : undefined
                  }
                />

                {/* AI 메시지 + 일정 제안인 경우, 하단에 "이 일정 저장하기" 버튼 */}
                {m.role === "ai" && m.isItinerarySuggestion && (
                  <div className="flex items-start">
                    <SaveItineraryButton
                      onClick={() => onSaveItinerary?.(m.id)}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* AI 응답 대기 중 인디케이터 */}
            {isThinking && <ThinkingIndicator />}
          </>
        )}
      </div>

      {/* ── 하단 입력창 ── */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <ChatInput
          placeholder={inputPlaceholder}
          onSend={onSend}
          disabled={isThinking}
        />
      </div>
    </section>
  );
}
