import { useState, useRef, useEffect, useCallback } from "react";
import PairSelectField from "@/components/common/PairSelectField";
import SwitchIcon from "@/assets/switch.svg?react";
import { searchDestination, type AirportResult } from "@/api/flightApi";

/* ── 타입 ── */
export interface Airport {
  id: string; // "ICN.AIRPORT" — searchFlights에 사용
  code: string; // "ICN"
  name: string;
  cityName: string;
  countryName: string;
}

function toAirport(r: AirportResult): Airport {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    cityName: r.cityName,
    countryName: r.countryName,
  };
}

interface AirportSearchDropdownProps {
  departure: Airport | null;
  arrival: Airport | null;
  activePanel: string | null;
  onOpenDep: () => void;
  onOpenArr: () => void;
  onSelectDep: (airport: Airport) => void;
  onSelectArr: (airport: Airport) => void;
  onSwap: () => void;
  onClose: () => void;
  className?: string;
}

export default function AirportSearchDropdown({
  departure,
  arrival,
  activePanel,
  onOpenDep,
  onOpenArr,
  onSelectDep,
  onSelectArr,
  onSwap,
  onClose,
  className = "",
}: AirportSearchDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDepOpen = activePanel === "dep";
  const isArrOpen = activePanel === "arr";
  const isOpen = isDepOpen || isArrOpen;

  /* 외부 클릭 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  /* 열릴 때 포커스 + 쿼리 초기화 */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* 디바운스 검색 */
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

  const currentLabel = isDepOpen ? "출발지" : "도착지";

  return (
    <div
      ref={ref}
      className={["relative flex-[2] min-w-0", className].join(" ")}
    >
      {/* 트리거: PairSelectField */}
      <PairSelectField
        bg="gray"
        leftValue={
          departure ? `${departure.cityName} (${departure.code})` : undefined
        }
        leftPlaceholder="출발지"
        rightValue={
          arrival ? `${arrival.cityName} (${arrival.code})` : undefined
        }
        rightPlaceholder="도착지"
        centerIcon={<SwitchIcon />}
        onLeftClick={onOpenDep}
        onRightClick={onOpenArr}
        onCenterClick={onSwap}
        isOpen={isOpen}
      />

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div
          className={[
            "absolute top-full left-0 mt-2 w-full min-w-[360px] z-50",
            "bg-white border border-gray-300 rounded-xl",
            "shadow-[0_8px_30px_0_rgba(0,0,0,0.1)]",
          ].join(" ")}
        >
          {/* 검색 입력 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
            <svg
              width="16"
              height="16"
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
              placeholder={`${currentLabel} 검색 (공항명, 도시, 국가)`}
              className={[
                "flex-1 border-none outline-none bg-transparent",
                "font-pretendard text-body2 text-gray-900",
                "placeholder:text-gray-500",
              ].join(" ")}
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className={[
                  "shrink-0 w-5 h-5 rounded-full bg-gray-300",
                  "text-gray-600 flex items-center justify-center",
                  "border-none cursor-pointer hover:bg-gray-400",
                  "transition-colors text-[12px] leading-none",
                ].join(" ")}
              >
                ✕
              </button>
            )}
          </div>

          {/* 결과 목록 */}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {!query.trim() ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-gray-500">
                공항명, 도시명 또는 국가를 입력하세요
              </p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                <p className="font-pretendard text-body3 text-gray-500">
                  검색 중...
                </p>
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-red-500">
                {error}
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-gray-500">
                검색 결과가 없습니다
              </p>
            ) : (
              results.map((airport) => {
                const selected = isDepOpen
                  ? departure?.id === airport.id
                  : arrival?.id === airport.id;
                return (
                  <button
                    key={airport.id}
                    type="button"
                    onClick={() => {
                      if (isDepOpen) onSelectDep(airport);
                      else onSelectArr(airport);
                    }}
                    className={[
                      "flex items-center gap-3 w-full px-4 py-3",
                      "bg-transparent border-none cursor-pointer",
                      "hover:bg-gray-100 transition-colors text-left",
                      selected ? "bg-gray-50" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-5 h-5 rounded shrink-0 border-2",
                        "flex items-center justify-center",
                        selected
                          ? "bg-primary border-primary"
                          : "bg-transparent border-gray-400",
                      ].join(" ")}
                    >
                      {selected && (
                        <svg
                          width="12"
                          height="10"
                          viewBox="0 0 12 10"
                          fill="none"
                        >
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
      )}
    </div>
  );
}
