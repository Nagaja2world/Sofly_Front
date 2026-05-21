import { useState } from "react";
import type { TrendingDestination } from "@/types/snsType";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface SnsSidebarProps {
  /** 요즘 뜨는 여행지 1~10위 */
  trending: TrendingDestination[];
  /** 검색어 변경/검색 실행 시 호출 */
  onSearch?: (keyword: string) => void;
  /** 트렌딩 항목 클릭 시 호출 (필터링용) */
  onSelectTrending?: (destination: TrendingDestination) => void;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * SNS 페이지 좌측 사이드바
 *
 * - 상단: "나라 / 도시 / 공항" 검색 인풋 + 돋보기 버튼
 * - 하단: "요즘 뜨는 여행지" 1~10위 리스트
 *
 * 와이어프레임 기준:
 * - 검색창: 한 줄짜리 outlined 인풋 + 우측 돋보기 아이콘 버튼
 * - 트렌딩 리스트: 1. ___ / 2. ___ / ... 10. ___ 형태로 세로 나열,
 *   각 항목은 hover 시 강조되는 텍스트 버튼
 */
export default function SnsSidebar({
  trending,
  onSearch,
  onSelectTrending,
}: SnsSidebarProps) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch?.(keyword.trim());
  };

  return (
    <aside
      className={[
        "w-[220px] shrink-0",
        "flex flex-col gap-8",
        "sticky top-6 self-start",
      ].join(" ")}
      aria-label="SNS 사이드바"
    >
      {/* ── 검색 ── */}
      <form onSubmit={handleSubmit} className="w-full">
        <label htmlFor="sns-search" className="sr-only">
          나라/도시/공항 검색
        </label>
        <div
          className={[
            "flex items-center gap-2",
            "px-3 py-2 rounded-lg",
            "bg-white border border-gray-300",
            "focus-within:border-gray-700 transition-colors",
          ].join(" ")}
        >
          <input
            id="sns-search"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="나라 / 도시 / 공항"
            className={[
              "flex-1 bg-transparent border-none outline-none",
              "font-pretendard text-body3 text-gray-900",
              "placeholder:text-gray-400",
              "min-w-0",
            ].join(" ")}
          />
          <button
            type="submit"
            aria-label="검색"
            className={[
              "shrink-0 inline-flex items-center justify-center",
              "w-6 h-6 rounded-full",
              "text-gray-600 hover:text-gray-900",
              "bg-transparent border-none cursor-pointer",
              "transition-colors",
            ].join(" ")}
          >
            {/* 돋보기 아이콘 (inline SVG) */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="7"
                cy="7"
                r="5.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 11L14 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* ── 요즘 뜨는 여행지 ── */}
      <section className="w-full" aria-labelledby="trending-heading">
        <h2
          id="trending-heading"
          className={[
            "font-pretendard text-body1 font-semibold text-gray-900",
            "m-0 mb-4 pb-3",
            "border-b-2 border-gray-900",
          ].join(" ")}
        >
          요즘 뜨는 여행지
        </h2>

        <ol className="flex flex-col gap-1 m-0 p-0 list-none">
          {trending.map((dest) => (
            <li key={dest.rank}>
              <button
                type="button"
                onClick={() => onSelectTrending?.(dest)}
                className={[
                  "w-full flex items-baseline gap-3",
                  "px-2 py-2 rounded-md",
                  "text-left bg-transparent border-none cursor-pointer",
                  "hover:bg-gray-100 transition-colors",
                  "group",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-montserrat text-body2 font-semibold tabular-nums",
                    /* 1~3위만 primary 색으로 강조 */
                    dest.rank <= 3 ? "text-[#D4B23E]" : "text-gray-400",
                    "shrink-0 w-5 text-right",
                  ].join(" ")}
                >
                  {dest.rank}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={[
                      "block font-pretendard text-body2 text-gray-900",
                      "group-hover:font-semibold transition-all",
                      "truncate",
                    ].join(" ")}
                  >
                    {dest.city}
                  </span>
                  {dest.country && (
                    <span className="block font-pretendard text-body5 text-gray-500 mt-0.5 truncate">
                      {dest.country}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
