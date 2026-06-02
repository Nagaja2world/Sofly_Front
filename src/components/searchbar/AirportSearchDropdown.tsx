import { useState, useRef, useEffect, useCallback } from "react";
import PairSelectField from "@/components/common/PairSelectField";
import SwitchIcon from "@/assets/switch.svg?react";
import { resolveAirportId } from "@/api/flightApi";
import {
  loadAirports,
  searchAirports,
  type AirportEntry,
} from "@/utils/airportSearch";

/* ── 타입 ── */
export interface Airport {
  id: string; // "ICN.AIRPORT" — searchFlights에 사용
  code: string; // "ICN"
  name: string; // 한글 공항명 (표시용)
  cityName: string; // 한글 도시명 (표시용)
  countryName: string; // 한글 국가명
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
  const [results, setResults] = useState<AirportEntry[]>([]);
  const [airportsData, setAirportsData] = useState<AirportEntry[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [resolvingCode, setResolvingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  /* 열릴 때: 포커스 + 입력 초기화 */
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen, activePanel]);

  /* 최초 1회: airports.json lazy 로드 (열림 여부와 무관하게 한 번만) */
  useEffect(() => {
    if (airportsData || isLoadingData) return;
    setIsLoadingData(true);
    loadAirports()
      .then((data) => setAirportsData(data))
      .catch(() => setError("공항 데이터를 불러오지 못했습니다"))
      .finally(() => setIsLoadingData(false));
    // 첫 마운트에 바로 로드. "열릴 때만" 원하면 deps에 isOpen 넣고 상단에 if(!isOpen) return 추가
  }, [airportsData, isLoadingData]);

  /* 입력 시 로컬 검색 (네트워크 호출 없음, 디바운스 불필요) */
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setError(null);

      if (!value.trim() || !airportsData) {
        setResults([]);
        return;
      }
      setResults(searchAirports(airportsData, value.trim()));
    },
    [airportsData],
  );

  /* 공항 선택: IATA 코드로 API의 정식 id 조회 후 부모에 전달 */
  const handleSelect = useCallback(
    async (entry: AirportEntry) => {
      setResolvingCode(entry.code);
      setError(null);
      try {
        const resolved = await resolveAirportId(entry.code);
        const airport: Airport = {
          // API가 준 정식 id 사용. 못 받으면 코드 기반 폴백
          id: resolved?.id ?? `${entry.code}.AIRPORT`,
          code: entry.code,
          name: entry.koName, // 한글 표시명 유지
          cityName: entry.koCity,
          countryName: entry.koCountry,
        };
        if (isDepOpen) onSelectDep(airport);
        else onSelectArr(airport);
      } catch {
        setError("공항 정보를 가져오지 못했습니다. 다시 시도해주세요");
      } finally {
        setResolvingCode(null);
      }
    },
    [isDepOpen, onSelectDep, onSelectArr],
  );

  const currentLabel = isDepOpen ? "출발지" : "도착지";

  return (
    <div
      ref={ref}
      className={["relative flex-[2] min-w-0", className].join(" ")}
    >
      {/* 트리거: PairSelectField — 한글 도시명 표시 */}
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
              placeholder={`${currentLabel} 검색 (공항명, 도시, 코드)`}
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
            {isLoadingData ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                <p className="font-pretendard text-body3 text-gray-500">
                  공항 데이터 로딩 중...
                </p>
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-red-500">
                {error}
              </p>
            ) : !query.trim() ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-gray-500">
                공항명, 도시명 또는 코드를 입력하세요
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-gray-500">
                검색 결과가 없습니다
              </p>
            ) : (
              results.map((entry) => {
                const selected = isDepOpen
                  ? departure?.code === entry.code
                  : arrival?.code === entry.code;
                const isResolving = resolvingCode === entry.code;
                return (
                  <button
                    key={entry.code}
                    type="button"
                    disabled={resolvingCode !== null}
                    onClick={() => handleSelect(entry)}
                    className={[
                      "flex items-center gap-3 w-full px-4 py-3",
                      "bg-transparent border-none cursor-pointer",
                      "hover:bg-gray-100 transition-colors text-left",
                      "disabled:opacity-60 disabled:cursor-wait",
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
                        {entry.koName}{" "}
                        <span className="text-gray-500">({entry.code})</span>
                      </p>
                      <p className="font-pretendard text-body4 text-gray-500 m-0 mt-0.5">
                        {entry.koCity} · {entry.koCountry}
                      </p>
                    </div>
                    {isResolving && (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin shrink-0" />
                    )}
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
