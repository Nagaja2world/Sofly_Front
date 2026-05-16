import { useState } from "react";
import SearchBar, { type SearchBarInitialValues } from "./SearchBar";
import HotelSearchBar from "./HotelSearchBar";
import TakeoffIcon from "@/assets/takeoff.svg?react";
import { type FlightSearchParams } from "@/utils/flightSearchQuery";

type SearchMode = "flight" | "hotel";

interface SearchModeBarProps {
  onFlightSearch: (params: FlightSearchParams) => void;
  initialValues?: SearchBarInitialValues;
  /** SearchBar 강제 리마운트용 key (FlightSearchPage에서 URL 변경 시 활용) */
  searchBarKey?: string | number;
  /** 모드 변경 콜백 */
  onModeChange?: (mode: SearchMode) => void;
}

export default function SearchModeBar({
  onFlightSearch,
  initialValues,
  searchBarKey,
  onModeChange,
}: SearchModeBarProps) {
  const [mode, setMode] = useState<SearchMode>("flight");

  const handleModeChange = (next: SearchMode) => {
    setMode(next);
    onModeChange?.(next);
  };

  const pillBase = [
    "inline-flex items-center gap-2 px-4 py-2 rounded-full font-pretendard text-body3 font-semibold",
    "border transition-all cursor-pointer",
  ].join(" ");

  const activePill = "bg-gray-900 text-white border-gray-900";
  const inactivePill = "bg-white text-gray-600 border-gray-300 hover:border-gray-500";

  return (
    <div className="flex flex-col gap-4">
      {/* ── 모드 토글 ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("flight")}
          className={[pillBase, mode === "flight" ? activePill : inactivePill].join(" ")}
        >
          <TakeoffIcon className="w-4 h-4" />
          항공편
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("hotel")}
          className={[pillBase, mode === "hotel" ? activePill : inactivePill].join(" ")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7v10M21 7v10M3 12h18M7 12V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
          호텔
        </button>
      </div>

      {/* ── 검색 바 ── */}
      {mode === "flight" ? (
        <SearchBar
          key={searchBarKey}
          onSearch={onFlightSearch}
          initialValues={initialValues}
        />
      ) : (
        <HotelSearchBar />
      )}
    </div>
  );
}
