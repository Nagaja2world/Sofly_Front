import EditIcon from "@/assets/edit.svg?react";
import CopyIcon from "@/assets/copy.svg?react";
import LeftIcon from "@/assets/left.svg?react";
import RightIcon from "@/assets/right.svg?react";

/* ══════════════════════════════════════════
   일정 JSON 파싱 & 렌더링
   ══════════════════════════════════════════ */

interface ItineraryItem {
  orderIndex: number;
  name: string;
  category: string;
  visitTime?: string;
  estimatedCost?: number;
  memo?: string;
}

interface ItineraryDay {
  day: number;
  items: ItineraryItem[];
}

interface ItineraryData {
  days: ItineraryDay[];
}

const CATEGORY_LABEL: Record<string, string> = {
  TRANSPORT: "이동",
  MEAL: "식사",
  ACCOMMODATION: "숙박",
  ATTRACTION: "관광",
  SHOPPING: "쇼핑",
  ACTIVITY: "활동",
  OTHER: "기타",
};

const CATEGORY_COLOR: Record<string, string> = {
  TRANSPORT: "bg-blue-100 text-blue-700",
  MEAL: "bg-orange-100 text-orange-700",
  ACCOMMODATION: "bg-indigo-100 text-indigo-700",
  ATTRACTION: "bg-green-100 text-green-700",
  SHOPPING: "bg-pink-100 text-pink-700",
  ACTIVITY: "bg-cyan-100 text-cyan-700",
  OTHER: "bg-gray-100 text-gray-600",
};

function formatCost(cost: number): string {
  if (cost === 0) return "무료";
  return cost.toLocaleString("ko-KR") + "원";
}

function ItineraryPreview({ jsonStr }: { jsonStr: string }) {
  let data: ItineraryData;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return (
      <pre className="text-xs text-gray-500 whitespace-pre-wrap break-all bg-gray-50 rounded-lg p-3 font-mono">
        {jsonStr}
      </pre>
    );
  }

  if (!Array.isArray(data?.days)) {
    return (
      <pre className="text-xs text-gray-500 whitespace-pre-wrap break-all bg-gray-50 rounded-lg p-3 font-mono">
        {jsonStr}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {data.days.map((day) => (
        <div
          key={day.day}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* 일차 헤더 */}
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <span className="font-pretendard text-body4 font-semibold text-gray-800">
              {day.day}일차
            </span>
          </div>

          {/* 일정 아이템들 */}
          <div className="divide-y divide-gray-100">
            {(day.items ?? []).map((item, i) => {
              const catLabel = CATEGORY_LABEL[item.category] ?? item.category;
              const catColor = CATEGORY_COLOR[item.category] ?? "bg-gray-100 text-gray-600";
              return (
                <div key={i} className="px-3 py-2.5 flex flex-col gap-1">
                  <div className="flex items-start gap-2 min-w-0">
                    {item.visitTime && (
                      <span className="font-pretendard text-body5 text-gray-500 shrink-0 mt-0.5 w-10">
                        {item.visitTime}
                      </span>
                    )}
                    <span
                      className={[
                        "font-pretendard text-body5 font-medium px-1.5 py-0.5 rounded shrink-0",
                        catColor,
                      ].join(" ")}
                    >
                      {catLabel}
                    </span>
                    <span className="font-pretendard text-body4 text-gray-900 min-w-0 leading-snug">
                      {item.name}
                    </span>
                  </div>

                  {item.memo && (
                    <p className="font-pretendard text-body5 text-gray-500 m-0 ml-12 leading-snug">
                      {item.memo}
                    </p>
                  )}

                  {item.estimatedCost != null && item.estimatedCost > 0 && (
                    <p className="font-pretendard text-body5 text-gray-400 m-0 ml-12 text-right">
                      {formatCost(item.estimatedCost)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

type MessagePart =
  | { type: "text"; content: string }
  | { type: "json"; content: string };

function parseMessageParts(text: string): MessagePart[] {
  const parts: MessagePart[] = [];
  const re = /```json\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "json", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

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
  const parts = isUser ? null : parseMessageParts(text);
  const hasJsonBlock = parts?.some((p) => p.type === "json") ?? false;

  return (
    <div
      className={[
        "flex flex-col w-full",
        isUser ? "items-end" : "items-start",
        className,
      ].join(" ")}
    >
      {isUser ? (
        /* ── 유저 메시지: 단순 버블 ── */
        <div
          className={[
            "max-w-[85%] rounded-2xl px-4 py-2.5",
            "font-pretendard text-body3 leading-relaxed",
            "whitespace-pre-line break-words",
            "bg-primary text-gray-900 rounded-tr-sm",
          ].join(" ")}
        >
          {text}
        </div>
      ) : hasJsonBlock ? (
        /* ── AI 메시지: JSON 블록 포함 → 파트별 렌더링 ── */
        <div className="flex flex-col gap-2 max-w-[95%]">
          {parts!.map((part, i) =>
            part.type === "json" ? (
              <ItineraryPreview key={i} jsonStr={part.content} />
            ) : part.content.trim() ? (
              <div
                key={i}
                className={[
                  "rounded-2xl px-4 py-2.5",
                  "font-pretendard text-body3 leading-relaxed",
                  "whitespace-pre-line break-words",
                  "bg-gray-100 text-gray-900 rounded-tl-sm",
                ].join(" ")}
              >
                {part.content.trim()}
              </div>
            ) : null,
          )}
        </div>
      ) : (
        /* ── AI 메시지: 일반 텍스트 ── */
        <div
          className={[
            "max-w-[85%] rounded-2xl px-4 py-2.5",
            "font-pretendard text-body3 leading-relaxed",
            "whitespace-pre-line break-words",
            "bg-gray-100 text-gray-900 rounded-tl-sm",
          ].join(" ")}
        >
          {text}
        </div>
      )}

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
