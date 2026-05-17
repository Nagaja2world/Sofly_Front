import { type FlightItem, type FlightLegData } from "@/types/flightType";

interface FlightCardProps {
  flight: FlightItem;
  /** 카드 클릭 (상세 이동) */
  onClick?: (id: string) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 가격 포맷 "₩ 920,000"
 */
function formatPrice(price: number): string {
  return `₩ ${price.toLocaleString("ko-KR")}~`;
}

/**
 * 한 구간을 표시하는 행
 *
 *  09:30 ─── ⓘ 13시간 15분 ─── 16:45
 *   ICN          직항            BCN
 */
function FlightLegRow({ leg }: { leg: FlightLegData }) {
  const stopLabel =
    leg.stops === 0
      ? "직항"
      : `경유 ${leg.stops}회${
          leg.stopCodes && leg.stopCodes.length > 0
            ? ` ${leg.stopCodes.join(", ")}`
            : ""
        }`;

  return (
    <div className="flex items-center gap-6">
      {/* 출발 */}
      <div className="shrink-0 w-14 text-center">
        <p className="font-pretendard text-body2 font-semibold text-gray-900 m-0">
          {leg.departTime}
        </p>
        <p className="font-pretendard text-body4 text-gray-500 m-0 mt-0.5">
          {leg.departCode}
        </p>
      </div>

      {/* 중앙 경로 */}
      <div className="flex-1 min-w-0 flex flex-col items-center">
        <p className="font-pretendard text-body4 text-gray-600 m-0 mb-1 whitespace-nowrap">
          {leg.duration}
        </p>
        <div className="relative w-full h-[2px] bg-gray-300">
          <span className="absolute left-0 -top-[3px] w-2 h-2 rounded-full bg-gray-400" />
          <span className="absolute right-0 -top-[3px] w-2 h-2 rounded-full bg-gray-400" />
        </div>
        <p
          className={[
            "font-pretendard text-body4 m-0 mt-1 whitespace-nowrap",
            leg.stops === 0 ? "text-gray-600" : "text-primary-hover",
          ].join(" ")}
        >
          {stopLabel}
        </p>
      </div>

      {/* 도착 */}
      <div className="shrink-0 w-14 text-center">
        <p className="font-pretendard text-body2 font-semibold text-gray-900 m-0">
          {leg.arriveTime}
        </p>
        <p className="font-pretendard text-body4 text-gray-500 m-0 mt-0.5">
          {leg.arriveCode}
        </p>
      </div>
    </div>
  );
}

/**
 * 항공사 영역 - 로고 + 이름
 */
function AirlineBadge({ flight }: { flight: FlightItem }) {
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div
        className={[
          "w-12 h-12 shrink-0 rounded-lg bg-gray-100 border border-gray-300",
          "flex items-center justify-center overflow-hidden",
        ].join(" ")}
      >
        {flight.airlineLogo ? (
          <img
            src={flight.airlineLogo}
            alt={flight.airline}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="font-pretendard text-body5 font-semibold text-gray-500">
            {flight.airline.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-pretendard text-body3 text-gray-800 m-0 truncate">
          {flight.airline}
        </p>
        {flight.airlineLabel && (
          <p className="font-pretendard text-body5 text-gray-500 m-0 mt-0.5 truncate">
            {flight.airlineLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export default function FlightCard({
  flight,
  onClick,
  className = "",
}: FlightCardProps) {
  return (
    <article
      onClick={() => onClick?.(flight.id)}
      className={[
        "bg-white rounded-xl border border-gray-300",
        "px-6 py-5",
        "transition-all duration-200",
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
          : "",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-6">
        {/* ── 좌측: 레그 정보 ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* 가는편 */}
          <div className="flex items-center gap-4">
            <AirlineBadge flight={flight} />
            <div className="flex-1 min-w-0">
              <FlightLegRow leg={flight.outbound} />
            </div>
          </div>

          {/* 오는편 (있을 때만) */}
          {flight.inbound && (
            <>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center gap-4">
                <AirlineBadge flight={flight} />
                <div className="flex-1 min-w-0">
                  <FlightLegRow leg={flight.inbound} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 우측: 가격 ── */}
        <div className="shrink-0 pl-6 border-l border-gray-200 min-w-[140px] text-right">
          <p className="font-pretendard text-body5 text-gray-500 m-0 mb-1">
            성인 1인
          </p>
          <p className="font-montserrat text-[20px] font-bold text-gray-900 m-0 whitespace-nowrap">
            {formatPrice(flight.price)}
          </p>
        </div>
      </div>
    </article>
  );
}
