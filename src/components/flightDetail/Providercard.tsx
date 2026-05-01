import RightIcon from "@/assets/right.svg?react";

interface ProviderCardProps {
  /** 판매처 고유 id (선택 시 콜백 인자) */
  id: string;
  /** 판매처 이름 (예: "Myrealtrip") */
  name: string;
  /** 판매처 로고 URL */
  logoUrl?: string;
  /** 서브 텍스트 (예: "서브 텍스트입니다") */
  description?: string;
  /** 가격 (KRW, 숫자) */
  price: number;
  /** 카드 클릭 시 (외부 사이트 이동 등) */
  onClick?: (id: string) => void;
  /** 추가 클래스 */
  className?: string;
}

/** 가격 포맷 "₩984,000" */
function formatPrice(price: number): string {
  return `₩${price.toLocaleString("ko-KR")}`;
}

/**
 * 판매처(공급사) 카드
 * - 좌측: 로고 + 서브 텍스트
 * - 우측: 가격 + 이동 화살표 (right.svg)
 * - 카드 전체 클릭 가능 (호버 시 살짝 들림)
 */
export default function ProviderCard({
  id,
  name,
  logoUrl,
  description,
  price,
  onClick,
  className = "",
}: ProviderCardProps) {
  return (
    <article
      onClick={() => onClick?.(id)}
      className={[
        "bg-white rounded-xl border border-gray-300",
        "px-5 py-4",
        "flex items-center justify-between gap-4",
        "transition-all duration-200",
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
          : "",
        className,
      ].join(" ")}
    >
      {/* ── 좌측: 로고 + 서브 텍스트 ── */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* 로고 */}
        <div className="h-6 flex items-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="max-h-6 w-auto object-contain"
            />
          ) : (
            <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
              {name}
            </span>
          )}
        </div>

        {/* 서브 텍스트 */}
        {description && (
          <p className="font-pretendard text-body4 text-gray-500 m-0 truncate">
            {description}
          </p>
        )}
      </div>

      {/* ── 우측: 가격 + 화살표 (right.svg) ── */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-pretendard text-body2 font-semibold text-gray-900 whitespace-nowrap">
          {formatPrice(price)}
        </span>

        <RightIcon className="shrink-0" aria-hidden="true" />
      </div>
    </article>
  );
}
