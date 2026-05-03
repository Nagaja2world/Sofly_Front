import EditIcon from "@/assets/edit.svg?react";
import CopyIcon from "@/assets/copy.svg?react";
import LeftIcon from "@/assets/left.svg?react";
import RightIcon from "@/assets/right.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

export type ChatRole = "user" | "ai";

interface ChatMessageProps {
  /** 메시지 발신자 */
  role: ChatRole;
  /** 메시지 텍스트 */
  text: string;
  /** 페이지네이션 인덱스 (예: 1 / 1) — user 메시지에만 표시 */
  pageIndex?: number;
  /** 페이지네이션 전체 개수 */
  pageTotal?: number;
  /** 편집 버튼 클릭 (user 메시지) */
  onEdit?: () => void;
  /** 복사 버튼 클릭 (user 메시지) */
  onCopy?: () => void;
  /** 이전 페이지 (user 메시지) */
  onPrevPage?: () => void;
  /** 다음 페이지 (user 메시지) */
  onNextPage?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/** 메시지 하단 액션 바 (편집 / 복사 / 페이지네이션) — user 메시지 전용 */
function UserMessageActions({
  pageIndex,
  pageTotal,
  onEdit,
  onCopy,
  onPrevPage,
  onNextPage,
}: {
  pageIndex?: number;
  pageTotal?: number;
  onEdit?: () => void;
  onCopy?: () => void;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}) {
  const showPagination =
    pageIndex !== undefined && pageTotal !== undefined && pageTotal > 0;

  // 표시할 액션이 하나도 없으면 렌더링 X
  if (!onEdit && !onCopy && !showPagination) return null;

  const iconBtnClass = [
    "p-1 rounded",
    "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
    "transition-colors cursor-pointer",
    "border-none bg-transparent",
    "inline-flex items-center justify-center",
  ].join(" ");

  return (
    <div className="flex items-center gap-1 mt-1.5 self-end">
      {/* 편집 */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="메시지 편집"
          className={iconBtnClass}
        >
          <EditIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 복사 */}
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label="메시지 복사"
          className={iconBtnClass}
        >
          <CopyIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 페이지네이션 ‹ N/M › */}
      {showPagination && (
        <div className="inline-flex items-center gap-0.5 ml-0.5">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={!onPrevPage || pageIndex! <= 1}
            aria-label="이전 응답"
            className={[
              iconBtnClass,
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <LeftIcon className="w-3.5 h-3.5" />
          </button>
          <span className="font-pretendard text-body5 text-gray-600 px-1 tabular-nums">
            {pageIndex}/{pageTotal}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={!onNextPage || pageIndex! >= pageTotal!}
            aria-label="다음 응답"
            className={[
              iconBtnClass,
              "disabled:opacity-40 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <RightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * AI 채팅 메시지 버블 (Image 2)
 *
 * - user: 우측 정렬, 노란 primary 배경 버블, 하단에 편집/복사/페이지네이션
 * - ai:   좌측 정렬, 회색 버블
 */
export default function ChatMessage({
  role,
  text,
  pageIndex,
  pageTotal,
  onEdit,
  onCopy,
  onPrevPage,
  onNextPage,
  className = "",
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={[
        "flex flex-col w-full",
        isUser ? "items-end" : "items-start",
        className,
      ].join(" ")}
    >
      {/* 메시지 버블 */}
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          "font-pretendard text-body3 leading-relaxed",
          "whitespace-pre-line break-words",
          isUser
            ? "bg-primary text-gray-900 rounded-tr-sm"
            : "bg-gray-100 text-gray-900 rounded-tl-sm",
        ].join(" ")}
      >
        {text}
      </div>

      {/* user 메시지 하단 액션 (편집/복사/페이지네이션) */}
      {isUser && (
        <UserMessageActions
          pageIndex={pageIndex}
          pageTotal={pageTotal}
          onEdit={onEdit}
          onCopy={onCopy}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
        />
      )}
    </div>
  );
}
