import { useState } from "react";
import TakeoffIcon from "@/assets/takeoff.svg?react";
import CalendarCheckIcon from "@/assets/calendar-check.svg?react";
import ListNumIcon from "@/assets/list-num.svg?react";
import { type FlightLegInfo } from "@/components/workspace/FlightInfoCard";

/* ══════════════════════════════════════════
   CompactFlightCard
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 항공 일정 카드 — 가는편 / 오는편 한 장.

   데스크톱 FlightInfoCard와의 차이:
   - FlightInfoCard 본문은 이미 모바일 대응(flex-col 기본 / md:grid 분기)이지만
     "더보기 / 접기" 토글이 없음.
   - 이 컴포넌트는 항상 세로 1컬럼이며, 하단에 토글 버튼을 둠.
       · 접힘(기본): 헤더 + leg 목록만 표시, 예약처/예약번호 숨김  → "더보기 ⌄"
       · 펼침      : + 예약처/예약번호 표시                        → "접기 ⌃"
   - 토글 상태는 카드 내부 state. 가는편/오는편 카드는 각각 독립적으로 토글됨
     (부모가 카드를 2개 렌더하면 state도 2개 → 독립).

   leg / 예약정보 렌더링 마크업은 검증된 FlightInfoCard 로직을 그대로 가져옴.
*/

interface CompactFlightCardProps {
  /** "가는편" | "오는편" */
  direction: "가는편" | "오는편";
  /** 날짜 텍스트 "2026년 3월 11일" */
  date: string;
  /** leg 목록 (직항이면 1개, 경유면 여러 개) */
  legs: FlightLegInfo[];
  /** 예약처 URL (외부 사이트 링크) */
  bookingUrl?: string;
  /** 예약 번호 */
  bookingNumber?: string;
  /** 수정 콜백 (있으면 수정 버튼 표시) */
  onEdit?: () => void;
  /** 삭제 콜백 (있으면 삭제 버튼 표시) */
  onDelete?: () => void;
  /** 카드 클릭 콜백 (있으면 클릭 가능한 카드로 표시) */
  onClick?: () => void;
  /** 처음부터 펼친 상태로 시작할지 (기본 false = 접힘) */
  defaultExpanded?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/* ──────────────────────────────────────────
   서브 컴포넌트 — FlightInfoCard에서 가져온 검증된 렌더링 로직
   ────────────────────────────────────────── */

/** 항공사 로고 (있으면 이미지, 없으면 회색 원 placeholder) */
function AirlineLogo({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-4 h-4 rounded-full object-contain shrink-0"
      />
    );
  }
  return (
    <span
      className="w-4 h-4 rounded-full bg-gray-300 inline-block shrink-0"
      aria-hidden="true"
    />
  );
}

/** 한 leg(항공편) 표시 — 좌측 타임라인(점+점선) + 우측 정보 2행 */
function LegRow({ leg, isLast }: { leg: FlightLegInfo; isLast: boolean }) {
  return (
    <div className="grid grid-cols-[8px_minmax(0,1fr)] gap-x-3 items-stretch">
      {/* 좌측: 타임라인 (점 + 점선) */}
      <div className="flex flex-col items-center">
        <span
          className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"
          aria-hidden="true"
        />
        {!isLast && (
          <span
            className="flex-1 w-px mt-1 border-l border-dashed border-gray-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* 우측: 정보 */}
      <div
        className={["flex flex-col gap-1.5 min-w-0", isLast ? "" : "pb-5"].join(
          " ",
        )}
      >
        {/* 1행: 오전 11:10  ICN 인천국제공항 — 공항이름만 truncate */}
        <div className="flex items-baseline gap-2 min-w-0 whitespace-nowrap">
          <span className="font-pretendard text-body3 text-gray-700 shrink-0">
            {leg.meridiem}
          </span>
          <span className="font-pretendard text-body2 font-semibold text-gray-900 shrink-0">
            {leg.time}
          </span>
          <span className="font-pretendard text-body2 font-semibold text-gray-900 ml-3 shrink-0">
            {leg.airportCode}
          </span>
          <span
            className="font-pretendard text-body2 text-gray-900 truncate min-w-0"
            title={leg.airportName}
          >
            {leg.airportName}
          </span>
        </div>

        {/* 2행: 비행시간 │ 항공사 │ 편명 — 항공사명만 truncate */}
        <div className="flex items-center gap-2 min-w-0 font-pretendard text-body4 text-gray-600 whitespace-nowrap">
          <span className="shrink-0">{leg.duration}</span>
          <span className="w-px h-3 bg-gray-300 shrink-0" aria-hidden="true" />
          <span className="inline-flex items-center gap-1 min-w-0">
            <AirlineLogo src={leg.airlineLogo} alt={leg.airline} />
            <span className="truncate min-w-0" title={leg.airline}>
              {leg.airline}
            </span>
          </span>
          <span className="w-px h-3 bg-gray-300 shrink-0" aria-hidden="true" />
          <span className="shrink-0">{leg.flightNo}</span>
        </div>
      </div>
    </div>
  );
}

/** 예약 정보 영역 (예약처 / 예약번호) — 둘 다 있으면 가로 구분선으로 나뉨 */
function BookingInfo({
  bookingUrl,
  bookingNumber,
}: {
  bookingUrl?: string;
  bookingNumber?: string;
}) {
  const hasBoth = !!bookingUrl && !!bookingNumber;

  return (
    <div className="flex flex-col min-w-0">
      {bookingUrl && (
        <div
          className={[
            "flex flex-col gap-1.5 min-w-0",
            hasBoth ? "pb-4" : "",
          ].join(" ")}
        >
          <div className="flex items-center gap-1.5">
            <CalendarCheckIcon className="w-4 h-4 shrink-0" />
            <span className="font-pretendard text-body4 font-semibold text-gray-700">
              예약처
            </span>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={bookingUrl}
            onClick={(e) => e.stopPropagation()}
            className="block font-pretendard text-body4 text-secondary hover:underline truncate min-w-0"
          >
            {bookingUrl}
          </a>
        </div>
      )}

      {hasBoth && <div className="border-t border-gray-200" />}

      {bookingNumber && (
        <div
          className={[
            "flex flex-col gap-1.5 min-w-0",
            hasBoth ? "pt-4" : "",
          ].join(" ")}
        >
          <div className="flex items-center gap-1.5">
            <ListNumIcon className="w-4 h-4 shrink-0" />
            <span className="font-pretendard text-body4 font-semibold text-gray-700">
              예약번호
            </span>
          </div>
          <span className="font-pretendard text-body4 text-gray-700 break-all">
            {bookingNumber}
          </span>
        </div>
      )}
    </div>
  );
}

/** 더보기 / 접기 토글 셰브론 (▽ / △ 모양) */
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={[
        "shrink-0 transition-transform duration-200",
        expanded ? "rotate-180" : "",
      ].join(" ")}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function CompactFlightCard({
  direction,
  date,
  legs,
  bookingUrl,
  bookingNumber,
  onEdit,
  onDelete,
  onClick,
  defaultExpanded = false,
  className = "",
}: CompactFlightCardProps) {
  /* 카드별 독립 토글 상태 — 가는편/오는편 카드는 각각 별도 인스턴스라 자동 독립 */
  const [expanded, setExpanded] = useState(defaultExpanded);

  /* 예약 정보가 하나라도 있어야 토글이 의미 있음.
     둘 다 없으면 토글 버튼 자체를 숨김(펼쳐도 보여줄 게 없으므로). */
  const hasBooking = !!bookingUrl || !!bookingNumber;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); /* 카드 onClick과 분리 */
    setExpanded((v) => !v);
  };

  return (
    <article
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={[
        "bg-white rounded-xl border border-gray-200 overflow-hidden",
        onClick
          ? "cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
          : "",
        className,
      ].join(" ")}
    >
      {/* ── 헤더: ✈ 가는편 ········ 날짜 (삭제) ── */}
      <header className="flex items-center gap-2 px-5 pt-4 pb-4">
        <TakeoffIcon className="w-5 h-5 shrink-0" />
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {direction}
        </span>
        <span className="font-pretendard text-body4 text-gray-500 ml-auto">
          {date}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              aria-label="항공편 수정"
              className={[
                "p-1.5 rounded-lg border-none bg-transparent",
                "text-gray-400 hover:text-blue-500 hover:bg-blue-50",
                "cursor-pointer transition-colors",
              ].join(" ")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.667 14H2v-2.667L11.333 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="항공편 삭제"
              className={[
                "p-1.5 rounded-lg border-none bg-transparent",
                "text-gray-400 hover:text-red-500 hover:bg-red-50",
                "cursor-pointer transition-colors",
              ].join(" ")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4h9.334Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="border-t border-gray-200" />

      {/* ── 본문: leg 목록 (항상 표시) ── */}
      <div className="px-5 py-5 flex flex-col">
        {legs.map((leg, i) => (
          <LegRow key={i} leg={leg} isLast={i === legs.length - 1} />
        ))}

        {/* ── 펼침 시: 예약 정보 (가로 구분선으로 leg와 분리) ── */}
        {expanded && hasBooking && (
          <>
            <div className="border-t border-gray-200 mt-1 mb-4" />
            <BookingInfo
              bookingUrl={bookingUrl}
              bookingNumber={bookingNumber}
            />
          </>
        )}
      </div>

      {/* ── 토글 버튼: 더보기 ⌄ / 접기 ⌃ ──
          예약 정보가 아예 없으면 토글을 숨김(펼칠 내용이 없으므로). */}
      {hasBooking && (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `${direction} 예약 정보 접기`
              : `${direction} 예약 정보 더보기`
          }
          className={[
            "w-full px-5 pb-4 -mt-1",
            "flex items-center justify-center gap-1",
            "bg-transparent border-none cursor-pointer",
            "font-pretendard text-body4 text-gray-500",
            "hover:text-gray-700 transition-colors",
          ].join(" ")}
        >
          {expanded ? "접기" : "더보기"}
          <Chevron expanded={expanded} />
        </button>
      )}
    </article>
  );
}
