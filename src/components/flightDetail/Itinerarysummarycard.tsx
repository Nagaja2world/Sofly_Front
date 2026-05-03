import { type ReactNode } from "react";
import DownIcon from "@/assets/down.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 경유 정보 (leg와 leg 사이) */
export interface LayoverInfo {
  /** 경유 횟수 (보통 1) */
  count?: number;
  /** 대기 시간 텍스트 "1시간 20분" */
  waitDuration: string;
}

/** 부가 정보 칩 (좌석 배열, 기내식, 좌석 간격 등) */
export interface FlightBadge {
  /** 좌측 아이콘 (svg컴포넌트 등) — 없으면 텍스트만 */
  icon?: ReactNode;
  /** 라벨 텍스트 "좌석 배열 3-3" */
  label: string;
}

/** 한 leg(법적 항공편 1편) 상세 */
export interface ItineraryLegDetail {
  /** 항공사 이름 "대한항공" */
  airline: string;
  /** 항공사 로고 URL */
  airlineLogo?: string;
  /** 출발 시각 표시 (ex: "오전 11:10") */
  departTimeLabel: string;
  /** 출발 공항 코드 "ICN" */
  departCode: string;
  /** 출발 공항 이름 "인천국제공항" */
  departAirport: string;
  /** 도착 시각 표시 (ex: "오후 12:30") */
  arriveTimeLabel: string;
  /** 도착 공항 코드 "PEK" */
  arriveCode: string;
  /** 도착 공항 이름 "베이징 캐피탈" */
  arriveAirport: string;
  /** 비행시간 텍스트 "2시간 20분" */
  duration: string;
  /** 부가 정보 (좌석 배열, 기내식, 좌석 간격 등) */
  badges?: FlightBadge[];
  /** 이 leg 다음의 경유 정보 (마지막 leg는 undefined) */
  layoverAfter?: LayoverInfo;
}

interface ItinerarySummaryCardProps {
  /** "가는편" / "오는편" */
  direction: "가는편" | "오는편";
  /** 날짜 텍스트 "2026.03.11 (수)" */
  date: string;
  /** 우측 경로 요약 텍스트 ["인천", "베이징", "프랑크푸르트"] */
  routePath: string[];
  /** leg 목록 (최소 1개, 경유면 여러 개) */
  legs: ItineraryLegDetail[];
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/** 타임라인 dot (출발/도착 라인 좌측에 위치) */
function TimelineDot() {
  return (
    <span
      className={["w-2 h-2 rounded-full bg-gray-500", "shrink-0"].join(" ")}
      aria-hidden="true"
    />
  );
}

/** 출발/도착 라인 (시각 + 칩 + 공항코드 + 공항명) */
function StopRow({
  type,
  timeLabel,
  code,
  airportName,
}: {
  type: "출발" | "도착";
  timeLabel: string;
  code: string;
  airportName: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-pretendard text-body2 font-regular text-gray-900 whitespace-nowrap">
        {timeLabel}
      </span>
      {/* 출발/도착 모두 primary 노란색 칩 */}
      <span
        className={[
          "px-1.5 py-0.5 rounded font-pretendard text-body5 font-medium",
          "shrink-0 bg-primary text-gray-900",
        ].join(" ")}
      >
        {type}
      </span>
      <span className="font-pretendard text-body2 font-regular text-gray-900">
        {code}
      </span>
      <span className="font-pretendard text-body2 text-gray-900 truncate">
        {airportName}
      </span>
    </div>
  );
}

/** 부가정보 칩 1개 (아이콘 + 라벨) */
function Badge({ badge }: { badge: FlightBadge }) {
  return (
    <span className="inline-flex items-center gap-1 font-pretendard text-body4 text-gray-700">
      {badge.icon && (
        <span className="inline-flex shrink-0 text-gray-700">{badge.icon}</span>
      )}
      <span className="whitespace-nowrap">{badge.label}</span>
    </span>
  );
}

/** 항공사 로고 + 이름 라인 */
function AirlineLine({
  airline,
  airlineLogo,
}: {
  airline: string;
  airlineLogo?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {airlineLogo ? (
        <img
          src={airlineLogo}
          alt={airline}
          className="w-5 h-5 object-contain rounded-full"
        />
      ) : (
        <span
          className="w-5 h-5 rounded-full bg-gray-200 inline-block"
          aria-hidden="true"
        />
      )}
      <span className="font-pretendard text-body3 text-gray-700">
        {airline}
      </span>
    </div>
  );
}

/** 비행시간 칩 (시계 아이콘 + 텍스트) - 부가정보 박스의 첫 칩 */
function DurationBadge({ duration }: { duration: string }) {
  return (
    <Badge
      badge={{
        label: duration,
        icon: (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M7 4V7L9 8.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      }}
    />
  );
}

/** 부가정보 박스 (회색 배경, 칩들 + 우측 펼치기 화살표 down.svg) */
function InfoBox({
  duration,
  badges,
}: {
  duration: string;
  badges?: FlightBadge[];
}) {
  return (
    <div
      className={[
        "bg-gray-100 rounded-lg",
        "px-4 py-3",
        "flex items-start justify-between gap-3",
      ].join(" ")}
    >
      {/* 칩 영역: 가로 wrap */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 flex-1 min-w-0">
        <DurationBadge duration={duration} />
        {badges?.map((b, i) => (
          <Badge key={i} badge={b} />
        ))}
      </div>

      {/* 우측 펼치기 화살표 (현재는 시각적 표시만, 추후 토글 기능 가능) */}
      <button
        type="button"
        className={[
          "shrink-0 p-0 bg-transparent border-none cursor-pointer",
          "text-gray-700 hover:text-gray-900 transition-colors",
          "inline-flex items-center justify-center",
        ].join(" ")}
        aria-label="펼치기"
      >
        <DownIcon />
      </button>
    </div>
  );
}

/** 경유 박스 (회색 배경, 1회 경유 + 대기시간) */
function LayoverBox({ layover }: { layover: LayoverInfo }) {
  return (
    <div
      className={[
        "bg-gray-200 rounded-lg",
        "px-4 py-3",
        "flex items-center gap-2",
      ].join(" ")}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-gray-700"
      >
        <path
          d="M3 5H10L8 3"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 9H4L6 11"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-pretendard text-body4 text-gray-700">
        {layover.count ?? 1}회 경유 ({layover.waitDuration} 대기)
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   leg 본문 블록
   ══════════════════════════════════════════ */

/**
 * 한 leg = 항공사 + (타임라인 dot + 출발) + 부가정보 박스 + (타임라인 dot + 도착)
 *
 * 좌측 점선 타임라인: 출발 dot ~ 도착 dot 사이를 세로 점선으로 연결
 * - 좌측 컬럼 (w-3): dot 2개 + 그 사이 점선
 * - 우측 컬럼 (flex-1): 출발 row + 부가정보 박스 + 도착 row
 *
 * grid-template-rows: auto 1fr auto 로 가운데 영역(부가정보 박스)이
 * 늘어나도록 하고, 좌측 점선이 그만큼 자동으로 늘어남
 */
function LegBlock({ leg }: { leg: ItineraryLegDetail }) {
  return (
    <div className="flex flex-col">
      {/* 항공사 (타임라인 바깥) */}
      <AirlineLine airline={leg.airline} airlineLogo={leg.airlineLogo} />

      {/* ── 타임라인 영역: 좌측 dot/점선 + 우측 컨텐츠 ── */}
      <div className="grid grid-cols-[12px_1fr] gap-x-3">
        {/* row 1: 출발 dot + 출발 row */}
        <div className="flex items-center justify-center pt-1">
          <TimelineDot />
        </div>
        <div className="pt-0.5">
          <StopRow
            type="출발"
            timeLabel={leg.departTimeLabel}
            code={leg.departCode}
            airportName={leg.departAirport}
          />
        </div>

        {/* row 2: 점선 + 부가정보 박스 */}
        <div className="flex justify-center">
          <div className="w-px border-l border-dashed border-gray-400 my-1" />
        </div>
        <div className="py-2">
          <InfoBox duration={leg.duration} badges={leg.badges} />
        </div>

        {/* row 3: 도착 dot + 도착 row */}
        <div className="flex items-center justify-center pb-1">
          <TimelineDot />
        </div>
        <div className="pb-0.5">
          <StopRow
            type="도착"
            timeLabel={leg.arriveTimeLabel}
            code={leg.arriveCode}
            airportName={leg.arriveAirport}
          />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 항공편 상세 페이지의 한 방향(가는편 또는 오는편) 일정 카드
 * - 헤더(bg-gray-200): "가는편 / 2026.03.11 (수)" + 우측 경로 "인천 → (베이징) → 프랑크푸르트"
 * - 본문(bg-white): 각 leg마다 항공사 + 좌측 타임라인(dot+점선) + 출발 + 부가정보박스 + 도착
 * - leg 사이엔 경유 박스
 *
 * 카드 자체는 가로 padding 없이 overflow-hidden으로 감싸서
 * 헤더의 회색 배경이 좌우 끝까지 채워지도록 함
 */
export default function ItinerarySummaryCard({
  direction,
  date,
  routePath,
  legs,
  className = "",
}: ItinerarySummaryCardProps) {
  /** 경로 표시: 출발 → (경유1) → (경유2) → 도착
   *  routePath = [출발, 경유..., 도착]
   *  중간(경유) 도시는 괄호로 감싸서 표시 */
  const renderRoutePath = () => {
    const last = routePath.length - 1;
    return routePath.map((city, i) => {
      const isMiddle = i > 0 && i < last;
      return (
        <span key={i} className="inline-flex items-center">
          <span className="whitespace-nowrap">
            {isMiddle ? `(${city})` : city}
          </span>
          {i < last && <span className="mx-1 text-gray-500">→</span>}
        </span>
      );
    });
  };

  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
        className,
      ].join(" ")}
    >
      {/* ── 헤더 (회색 배경, 카드 전폭) ── */}
      <header
        className={[
          "bg-gray-200",
          "flex items-center justify-between gap-3 flex-wrap",
          "px-5 py-4",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <span className="font-pretendard text-body3 font-semibold text-gray-700">
            {direction}
          </span>
          <span className="font-pretendard text-body3 text-gray-700">
            {date}
          </span>
        </div>

        <div className="flex items-center font-pretendard text-body4 text-gray-700 flex-wrap">
          {renderRoutePath()}
        </div>
      </header>

      {/* ── leg 본문 ── */}
      <div className="px-5 py-5 flex flex-col gap-3">
        {legs.map((leg, i) => (
          <div key={i} className="flex flex-col gap-3">
            <LegBlock leg={leg} />
            {/* 경유 박스: 마지막 leg가 아니면 표시 */}
            {leg.layoverAfter && <LayoverBox layover={leg.layoverAfter} />}
          </div>
        ))}
      </div>
    </article>
  );
}
