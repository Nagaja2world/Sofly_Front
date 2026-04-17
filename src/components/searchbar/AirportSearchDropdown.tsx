import { useState, useRef, useEffect } from "react";
import PairSelectField from "@/components/common/PairSelectField";
import SwitchIcon from "@/assets/switch.svg?react";

/* ── 타입 ── */
export interface Airport {
  code: string;
  name: string;
  country: string;
}

/* ── 공항 데이터 (추후 백엔드 연동) ── */
const AIRPORTS: Airport[] = [
  { code: "ICN", name: "인천국제공항", country: "대한민국" },
  { code: "GMP", name: "김포국제공항", country: "대한민국" },
  { code: "NRT", name: "나리타국제공항", country: "일본" },
  { code: "HND", name: "하네다공항", country: "일본" },
  { code: "KIX", name: "간사이국제공항", country: "일본" },
  { code: "PVG", name: "푸둥국제공항", country: "중국" },
  { code: "PEK", name: "베이징캐피탈", country: "중국" },
  { code: "BKK", name: "수완나품공항", country: "태국" },
  { code: "SIN", name: "창이공항", country: "싱가포르" },
  { code: "HKG", name: "홍콩국제공항", country: "홍콩" },
  { code: "FRA", name: "프랑크푸르트암마인", country: "독일" },
  { code: "CDG", name: "샤를드골공항", country: "프랑스" },
  { code: "LHR", name: "히드로공항", country: "영국" },
  { code: "LAX", name: "로스앤젤레스공항", country: "미국" },
  { code: "JFK", name: "존에프케네디공항", country: "미국" },
];

interface AirportSearchDropdownProps {
  /** 선택된 출발 공항 */
  departure: Airport | null;
  /** 선택된 도착 공항 */
  arrival: Airport | null;
  /** 현재 열린 패널: "dep" | "arr" | null */
  activePanel: string | null;
  /** 출발지 클릭 */
  onOpenDep: () => void;
  /** 도착지 클릭 */
  onOpenArr: () => void;
  /** 출발 공항 선택 */
  onSelectDep: (airport: Airport) => void;
  /** 도착 공항 선택 */
  onSelectArr: (airport: Airport) => void;
  /** 출발↔도착 스왑 */
  onSwap: () => void;
  /** 드롭다운 닫기 */
  onClose: () => void;
  /** 추가 클래스 */
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

  /* 열릴 때 포커스 */
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const filtered = query.trim()
    ? AIRPORTS.filter(
        (a) =>
          a.name.includes(query) ||
          a.code.toLowerCase().includes(query.toLowerCase()) ||
          a.country.includes(query),
      )
    : [];

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
          departure ? `${departure.name} (${departure.code})` : undefined
        }
        leftPlaceholder="출발지"
        rightValue={arrival ? `${arrival.name} (${arrival.code})` : undefined}
        rightPlaceholder="도착지"
        centerIcon={<SwitchIcon />}
        onLeftClick={() => {
          setQuery("");
          onOpenDep();
        }}
        onRightClick={() => {
          setQuery("");
          onOpenArr();
        }}
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
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0 text-gray-500"
            >
              <path
                d="M17.5 10L11.25 3.75V7.5L5 10L11.25 12.5V16.25L17.5 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 10H5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${currentLabel} 검색`}
              className={[
                "flex-1 border-none outline-none bg-transparent",
                "font-pretendard text-body2 text-gray-900",
                "placeholder:text-gray-500",
              ].join(" ")}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
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

          {/* 검색 결과 */}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {query.trim() === "" ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-gray-500">
                공항명, 도시명 또는 공항 코드를 입력하세요
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center font-pretendard text-body3 text-gray-500">
                검색 결과가 없습니다
              </p>
            ) : (
              filtered.map((airport) => {
                const selected = isDepOpen
                  ? departure?.code === airport.code
                  : arrival?.code === airport.code;
                return (
                  <button
                    key={airport.code}
                    type="button"
                    onClick={() => {
                      if (isDepOpen) onSelectDep(airport);
                      else onSelectArr(airport);
                    }}
                    className={[
                      "flex items-center gap-3 w-full px-4 py-3",
                      "bg-transparent border-none cursor-pointer",
                      "hover:bg-gray-100 transition-colors text-left",
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
                      <p className="font-pretendard text-body2 text-gray-900 m-0">
                        {airport.name}{" "}
                        <span className="text-gray-600">({airport.code})</span>
                      </p>
                      <p className="font-pretendard text-body4 text-gray-500 m-0 mt-0.5">
                        {airport.country}
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
