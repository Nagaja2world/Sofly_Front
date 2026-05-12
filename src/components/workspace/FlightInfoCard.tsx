import TakeoffIcon from "@/assets/takeoff.svg?react";
import CalendarCheckIcon from "@/assets/calendar-check.svg?react";
import ListNumIcon from "@/assets/list-num.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 한 leg(법적 항공편 1편) 정보 - 워크스페이스 항공 일정용 (간소화 버전) */
export interface FlightLegInfo {
  /** "오전" | "오후" 등 시각 라벨 prefix */
  meridiem: "오전" | "오후";
  /** 시각 텍스트 "11:10" */
  time: string;
  /** 공항 코드 "ICN" */
  airportCode: string;
  /** 공항 이름 "인천국제공항" */
  airportName: string;
  /** 비행 시간 "2시간 20분" */
  duration: string;
  /** 항공사 이름 "대한항공" */
  airline: string;
  /** 항공사 로고 URL (없으면 회색 원 placeholder) */
  airlineLogo?: string;
  /** 편명 "FN0312" */
  flightNo: string;
}

interface FlightInfoCardProps {
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
  /** 삭제 콜백 (있으면 삭제 버튼 표시) */
  onDelete?: () => void;
  /** 카드 클릭 콜백 (있으면 클릭 가능한 카드로 표시) */
  onClick?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

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

/** 한 leg(항공편) 표시
 *  - 좌측 타임라인 컬럼: 노란 점 + (마지막 leg가 아니면) 점선
 *  - 우측 정보 컬럼:
 *    1행: [오전 11:10  ICN 인천국제공항]
 *         · 한 줄에 모두 표시 시도 (피그마 기본형)
 *         · 카드 폭이 좁아지면 공항이름이 truncate ("인천국제공항" → "인천국제...")
 *         · "오전 11:10"과 공항코드는 항상 풀로 보임 (shrink-0)
 *    2행: [2시간 20분 │ ⊙ 대한항공 │ FN0312]
 *         · 좁아지면 항공사명이 truncate ("대한항공" → "대한...")
 *         · 비행시간/편명/구분선/로고는 항상 풀로 보임 (shrink-0)
 */
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
        {/* 1행: 오전 11:10  ICN 인천국제공항
            - 한 줄 유지 (whitespace-nowrap)
            - 컨테이너 가로 초과 시 airportName만 truncate */}
        <div className="flex items-baseline gap-2 min-w-0 whitespace-nowrap">
          <span className="font-pretendard text-body3 text-gray-700 shrink-0">
            {leg.meridiem}
          </span>
          <span className="font-pretendard text-body2 font-semibold text-gray-900 shrink-0">
            {leg.time}
          </span>
          {/* 시간↔공항코드 큰 여백 */}
          <span className="font-pretendard text-body2 font-semibold text-gray-900 ml-3 shrink-0">
            {leg.airportCode}
          </span>
          {/* 공항이름만 truncate 대상 */}
          <span
            className="font-pretendard text-body2 text-gray-900 truncate min-w-0"
            title={leg.airportName}
          >
            {leg.airportName}
          </span>
        </div>

        {/* 2행: 비행시간 │ 항공사 │ 편명
            - 한 줄 유지
            - 컨테이너 가로 초과 시 항공사명만 truncate
            - 비행시간/구분선/로고/편명은 항상 보임 */}
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

/** 우측 예약 정보 영역 (예약처 / 예약번호)
 *  - 두 블록이 모두 있을 때 가로 구분선으로 나뉨
 */
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

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지의 항공 일정 카드 (가는편 / 오는편)
 *
 * 구조:
 * - 헤더: ✈ 아이콘(takeoff.svg) + "가는편" / 날짜
 * - 가로 구분선
 * - 본문:
 *   · md 이상: 3컬럼 그리드 [leg목록 | 세로 구분선 | 예약처/예약번호]
 *     - leg : booking = 1.7 : 1 비율 (구분선 1px, gap 24px)
 *     - 좌측은 각 leg가 점선으로 연결, 우측은 예약처/번호 사이 가로 구분선
 *   · md 미만: 세로 적층 (leg → 가로 구분선 → booking)
 *
 * 폭 적응 (좁아질 때 우선순위):
 * - 1행(시각·공항): "오전 11:10" + 공항코드는 항상 보존, `airportName`만 ellipsis
 *   ("인천국제공항" → "인천국제...")
 * - 2행(편명): 비행시간·편명·구분선·로고는 항상 보존, 항공사명만 ellipsis
 *   ("대한항공" → "대한...")
 * - 예약처 URL: ellipsis로 잘림 (호버 시 title로 전체 노출)
 * - 예약번호: 좁으면 자연스럽게 줄바꿈(`break-all`)
 * - minmax(0, ...)로 grid 트랙이 자식 콘텐츠에 의해 부풀려지는 것을 방지
 */
export default function FlightInfoCard({
  direction,
  date,
  legs,
  bookingUrl,
  bookingNumber,
  onDelete,
  onClick,
  className = "",
}: FlightInfoCardProps) {
  return (
    <article
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={[
        "bg-white rounded-xl border border-gray-200 overflow-hidden",
        onClick ? "cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all" : "",
        className,
      ].join(" ")}
    >
      {/* ── 헤더 ── */}
      <header className="flex items-center gap-2 px-6 pt-4 pb-4">
        <TakeoffIcon className="w-5 h-5 shrink-0" />
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {direction}
        </span>
        <span className="font-pretendard text-body3 text-gray-600 ml-1">
          {date}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="항공편 삭제"
            className={[
              "ml-auto p-1.5 rounded-lg border-none bg-transparent",
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
      </header>

      <div className="border-t border-gray-200" />

      {/* ── 본문 ──
          md 이상: 3컬럼 (leg 1.7fr | 1px | booking 1fr)
          md 미만: 세로 적층 */}
      <div
        className={[
          "px-6 py-5",
          // md 미만: 세로 적층
          "flex flex-col gap-4",
          // md 이상: 3컬럼 그리드, leg : booking = 1.7 : 1 (leg 정보 보호 우선)
          "md:grid md:grid-cols-[minmax(0,1.7fr)_1px_minmax(0,1fr)]",
          "md:gap-x-6 md:gap-y-0",
          "md:items-stretch",
        ].join(" ")}
      >
        {/* 좌측: leg 목록 */}
        <div className="flex flex-col min-w-0">
          {legs.map((leg, i) => (
            <LegRow key={i} leg={leg} isLast={i === legs.length - 1} />
          ))}
        </div>

        {/* 가운데: 구분선
            md 이상: 세로 구분선 (full-height)
            md 미만: 가로 구분선 */}
        <div className="border-t border-gray-200 md:border-t-0 md:w-px md:self-stretch md:bg-gray-200" />

        {/* 우측: 예약 정보 */}
        <div className="md:pl-2">
          <BookingInfo bookingUrl={bookingUrl} bookingNumber={bookingNumber} />
        </div>
      </div>
    </article>
  );
}
