interface ReadGuideBoxProps {
  /** 박스 타이틀 (기본: "읽어보기") */
  title?: string;
  /** 안내 본문 */
  description?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 항공편 상세 페이지 상단 안내 박스
 * - 좌측 상단에 📃 아이콘 + 타이틀
 * - 하단에 안내 문구
 */
export default function ReadGuideBox({
  title = "읽어보기",
  description = "예약하기 전에 판매사 사이트에서 항공권 세부 정보와 가격을 빠짐없이 확인하세요.",
  className = "",
}: ReadGuideBoxProps) {
  return (
    <div
      className={[
        "bg-white rounded-xl border border-gray-300",
        "px-5 py-4",
        className,
      ].join(" ")}
    >
      {/* 타이틀 */}
      <div className="flex items-center gap-1.5">
        {/* 📃 아이콘 (svg로 대체 가능) */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 text-gray-700"
        >
          <rect
            x="3"
            y="2"
            width="10"
            height="12"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M5.5 6H10.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M5.5 8.5H10.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M5.5 11H8.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-pretendard text-body3 font-semibold text-gray-900">
          {title}
        </span>
      </div>

      {/* 본문 */}
      <p className="font-pretendard text-body4 text-gray-600 m-0 mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
