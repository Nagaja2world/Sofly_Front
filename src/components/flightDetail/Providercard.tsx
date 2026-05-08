import RightIcon from "@/assets/right.svg?react";

/** 가격 포맷 "₩984,000" */
function formatPrice(price: number): string {
  return `₩${price.toLocaleString("ko-KR")}`;
}

/** fareTag → 한국어 배지 라벨 */
function fareTagLabel(fareTag: string): string {
  if (fareTag === "BAGGAGE") return "수하물 포함";
  if (fareTag === "COMFORT") return "비즈니스";
  if (fareTag === "REFUNDABLE") return "환불 가능";
  return fareTag;
}

interface BrandedFareCardProps {
  /** 운임 토큰 (선택 시 콜백 인자) */
  token: string;
  /** 운임 이름 "ECONOMY SAVER" */
  fareName: string;
  /** 좌석 등급 "ECONOMY" | "BUSINESS" */
  cabinClass: string;
  /** 운임 태그 "BAGGAGE" | "COMFORT" | "REFUNDABLE" */
  fareTag?: string;
  /** INCLUDED 기능 레이블 목록 */
  includedFeatures: string[];
  /** 가격 (KRW, 숫자) */
  price: number;
  /** 현재 선택된 운임 여부 */
  isSelected?: boolean;
  /** 카드 클릭 시 (token 전달) */
  onClick?: (token: string) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 브랜디드 운임 카드
 * - 상단: 운임 이름 + fareTag 배지 | 우측 가격
 * - 하단: INCLUDED 기능 레이블 칩 (최대 3개)
 */
export default function BrandedFareCard({
  token,
  fareName,
  fareTag,
  includedFeatures,
  price,
  isSelected = false,
  onClick,
  className = "",
}: BrandedFareCardProps) {
  const visibleFeatures = includedFeatures.slice(0, 3);

  return (
    <article
      onClick={() => onClick?.(token)}
      className={[
        "bg-white rounded-xl border",
        isSelected ? "border-blue-500 ring-1 ring-blue-400" : "border-gray-300",
        "px-5 py-4",
        "flex items-center justify-between gap-4",
        "transition-all duration-200",
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
          : "",
        className,
      ].join(" ")}
    >
      {/* ── 좌측: 운임명 + fareTag + 기능 칩 ── */}
      <div className="flex flex-col gap-2 min-w-0">
        {/* 상단 줄: 운임명 + 태그 배지 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
            {fareName}
          </span>
          {fareTag && (
            <span
              className={[
                "px-1.5 py-0.5 rounded font-pretendard text-body5 font-medium shrink-0",
                fareTag === "COMFORT"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-primary text-gray-900",
              ].join(" ")}
            >
              {fareTagLabel(fareTag)}
            </span>
          )}
        </div>

        {/* 기능 칩 목록 */}
        {visibleFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleFeatures.map((label, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-gray-100 font-pretendard text-body5 text-gray-600 whitespace-nowrap"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 우측: 가격 + 화살표 ── */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-pretendard text-body2 font-semibold text-gray-900 whitespace-nowrap">
          {formatPrice(price)}
        </span>
        <RightIcon className="shrink-0" aria-hidden="true" />
      </div>
    </article>
  );
}
