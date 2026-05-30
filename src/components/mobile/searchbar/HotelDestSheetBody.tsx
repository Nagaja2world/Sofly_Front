import { useState, useRef, useEffect } from "react";
import { useHotelDestinations } from "@/hooks/useHotelDestinations";
import { type HotelDestination } from "@/api/hotelApi";

/* ══════════════════════════════════════════
   HotelDestSheetBody
   ══════════════════════════════════════════
   BottomSheet 안에 들어가는 호텔 목적지 검색 본문.
   HotelSearchBar의 자동완성 로직(useHotelDestinations)을 재사용. */

interface HotelDestSheetBodyProps {
  /** 초기 입력값 (선택돼 있던 목적지명) */
  initialQuery?: string;
  onSelect: (dest: HotelDestination) => void;
}

export default function HotelDestSheetBody({
  initialQuery = "",
  onSelect,
}: HotelDestSheetBodyProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const { results, isLoading } = useHotelDestinations(query);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 bg-white px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-gray-500"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="목적지 또는 호텔 이름"
            className={[
              "flex-1 min-w-0 border-none outline-none bg-transparent",
              "font-pretendard text-body2 text-gray-900 placeholder:text-gray-500",
            ].join(" ")}
          />
          {isLoading && (
            <span className="font-pretendard text-body5 text-gray-400 shrink-0">
              검색 중…
            </span>
          )}
        </div>
      </div>

      <div className="py-1">
        {query.trim().length < 2 ? (
          <p className="px-5 py-10 text-center font-pretendard text-body3 text-gray-500">
            도시 또는 호텔 이름을 두 글자 이상 입력하세요
          </p>
        ) : results.length === 0 && !isLoading ? (
          <p className="px-5 py-10 text-center font-pretendard text-body3 text-gray-500">
            검색 결과가 없습니다
          </p>
        ) : (
          results.slice(0, 12).map((dest) => (
            <button
              key={dest.destId}
              type="button"
              onClick={() => onSelect(dest)}
              className={[
                "flex items-center gap-3 w-full px-5 py-3.5",
                "bg-transparent border-none cursor-pointer text-left",
                "active:bg-gray-100 transition-colors",
                "border-b border-gray-100 last:border-0",
              ].join(" ")}
            >
              <span className="shrink-0 text-gray-400 text-body2">📍</span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-pretendard text-body2 font-semibold text-gray-900 truncate">
                  {dest.name}
                </span>
                <span className="font-pretendard text-body4 text-gray-400 truncate">
                  {dest.label}
                </span>
              </div>
              {dest.hotels > 0 && (
                <span className="font-pretendard text-body5 text-gray-400 shrink-0">
                  호텔 {dest.hotels.toLocaleString()}개
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
