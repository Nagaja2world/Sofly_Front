import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import PlusIcon from "@/assets/plus.svg?react";
import NarrowRight2Icon from "@/assets/narrow-right2.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface ChatInputProps {
  /** placeholder 텍스트 */
  placeholder?: string;
  /** 전송 콜백 — 빈 문자열은 전송되지 않음 */
  onSend?: (text: string) => void;
  /** 전송 비활성화 (예: AI 응답 대기 중) */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * AI 채팅 입력창 (Image 1)
 *
 * 구성:
 * - 좌측: 보라 사각형 아이콘 (plus.svg)
 * - 가운데: textarea (자동 높이 조절, Enter 전송 / Shift+Enter 줄바꿈)
 * - 우측: 원형 전송 버튼 (narrow-right2.svg)
 */
export default function ChatInput({
  placeholder = "원하시는 일정을 말씀해주세요!",
  onSend,
  disabled = false,
  className = "",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /** textarea 자동 높이 (1~5줄) */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend?.(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 단독: 전송 / Shift+Enter: 줄바꿈
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <div
      className={[
        "flex items-end gap-2",
        "bg-white rounded-xl border border-gray-300",
        "px-3 py-2.5",
        "focus-within:border-gray-700 transition-colors",
        className,
      ].join(" ")}
    >
      {/* 좌측 plus 아이콘 */}
      <div className="shrink-0 pb-0.5">
        <PlusIcon className="w-6 h-6" />
      </div>

      {/* 가운데 textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="AI 채팅 입력"
        className={[
          "flex-1 min-w-0 resize-none",
          "bg-transparent border-none outline-none",
          "font-pretendard text-body3 text-gray-900",
          "placeholder:text-gray-500",
          "leading-6 max-h-[120px] py-1",
          "disabled:cursor-not-allowed disabled:text-gray-500",
        ].join(" ")}
      />

      {/* 우측 전송 버튼 */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="메시지 전송"
        className={[
          "shrink-0 w-8 h-8 rounded-full",
          "inline-flex items-center justify-center",
          "transition-all duration-150",
          "border-none cursor-pointer",
          canSend
            ? "bg-gray-900 text-white hover:bg-gray-700 active:scale-95"
            : "bg-gray-300 text-gray-500 cursor-not-allowed",
        ].join(" ")}
      >
        <NarrowRight2Icon className="w-4 h-4" />
      </button>
    </div>
  );
}
