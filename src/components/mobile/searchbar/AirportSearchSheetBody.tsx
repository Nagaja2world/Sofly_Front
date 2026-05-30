import { useState, useRef, useEffect, useCallback } from "react";
import { searchDestination, type AirportResult } from "@/api/flightApi";
import { type Airport } from "@/components/searchbar/AirportSearchDropdown";

/* ══════════════════════════════════════════
   AirportSearchSheetBody
   ══════════════════════════════════════════
   BottomSheet 안에 들어가는 공항 검색 본문.
   데스크톱 AirportSearchDropdown의 디바운스 검색 로직을 그대로 가져오되,
   드롭다운 패널 대신 시트 본문 레이아웃으로 표현.

   onSelect 후 닫기/다음 단계 이동은 부모(MobileSearchBar)가 결정. */

function toAirport(r: AirportResult): Airport {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    cityName: r.cityName,
    countryName: r.countryName,
  };
}

interface AirportSearchSheetBodyProps {
  /** 현재 선택값 (체크 표시용) */
  selected: Airport | null;
  /** 항목 선택 */
  onSelect: (airport: Airport) => void;
  /** placeholder에 쓸 라벨 ("출발지" | "도착지") */
  label: string;
}

export default function AirportSearchSheetBody({
  selected,
  onSelect,
  label,
}: AirportSearchSheetBodyProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 마운트 시 자동 포커스 */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchDestination(value.trim());
        setResults(data.map(toAirport));
      } catch {
        setError("검색 중 오류가 발생했습니다");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }, []);

  return (
    <div className="flex flex-col">
      {/* 검색 입력 (sticky) */}
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
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={`${label} 검색 (공항, 도시, 국가)`}
            className={[
              "flex-1 min-w-0 border-none outline-none bg-transparent",
              "font-pretendard text-body2 text-gray-900",
              "placeholder:text-gray-500",
            ].join(" ")}
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              aria-label="입력 지우기"
              className={[
                "shrink-0 w-5 h-5 rounded-full bg-gray-300",
                "text-gray-600 flex items-center justify-center",
                "border-none cursor-pointer text-[12px] leading-none",
              ].join(" ")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="py-1">
        {!query.trim() ? (
          <p className="px-5 py-10 text-center font-pretendard text-body3 text-gray-500">
            공항명, 도시명 또는 국가를 입력하세요
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            <p className="font-pretendard text-body3 text-gray-500">
              검색 중...
            </p>
          </div>
        ) : error ? (
          <p className="px-5 py-10 text-center font-pretendard text-body3 text-red-500">
            {error}
          </p>
        ) : results.length === 0 ? (
          <p className="px-5 py-10 text-center font-pretendard text-body3 text-gray-500">
            검색 결과가 없습니다
          </p>
        ) : (
          results.map((airport) => {
            const isSel = selected?.id === airport.id;
            return (
              <button
                key={airport.id}
                type="button"
                onClick={() => onSelect(airport)}
                className={[
                  "flex items-center gap-3 w-full px-5 py-3.5",
                  "bg-transparent border-none cursor-pointer text-left",
                  "active:bg-gray-100 transition-colors",
                  isSel ? "bg-gray-50" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-5 h-5 rounded shrink-0 border-2",
                    "flex items-center justify-center",
                    isSel
                      ? "bg-primary border-primary"
                      : "bg-transparent border-gray-400",
                  ].join(" ")}
                >
                  {isSel && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path
                        d="M1 5L4.5 8.5L11 1.5"
                        stroke="#2b2b2b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-pretendard text-body2 text-gray-900 m-0 truncate">
                    {airport.name}{" "}
                    <span className="text-gray-500">({airport.code})</span>
                  </p>
                  <p className="font-pretendard text-body4 text-gray-500 m-0 mt-0.5">
                    {airport.cityName} · {airport.countryName}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
