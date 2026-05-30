import { useState } from "react";
import { type SearchBarInitialValues } from "@/components/SearchBar";
import { type HotelSearchBarParams } from "@/components/HotelSearchBar";
import { type FlightSearchParams } from "@/utils/flightSearchQuery";
import MobileFlightSearchBar from "@/components/mobile/searchbar/MobileFlightSearchBar";
import MobileHotelSearchBar from "@/components/mobile/searchbar/MobileHotelSearchBar";
import TakeoffIcon from "@/assets/takeoff.svg?react";

/* ══════════════════════════════════════════
   MobileSearchModeBar
   ══════════════════════════════════════════
   데스크톱 SearchModeBar의 모바일 버전.
   props 시그니처를 데스크톱과 맞춰, 페이지에서 useIsCompact로
   둘 중 하나만 렌더하면 됨 (HomePage/ProfilePage).
*/

type SearchMode = "flight" | "hotel";

interface MobileSearchModeBarProps {
  onFlightSearch: (params: FlightSearchParams) => void;
  onHotelSearch?: (params: HotelSearchBarParams) => void;
  initialValues?: SearchBarInitialValues;
  hotelInitialValues?: HotelSearchBarParams;
  initialMode?: SearchMode;
  onModeChange?: (mode: SearchMode) => void;
}

export default function MobileSearchModeBar({
  onFlightSearch,
  onHotelSearch,
  initialValues,
  hotelInitialValues,
  initialMode,
  onModeChange,
}: MobileSearchModeBarProps) {
  const [mode, setMode] = useState<SearchMode>(initialMode ?? "flight");

  const handleModeChange = (next: SearchMode) => {
    setMode(next);
    onModeChange?.(next);
  };

  const pillBase = [
    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
    "font-pretendard text-body3 font-semibold border transition-all cursor-pointer",
  ].join(" ");
  const activePill = "bg-gray-900 text-white border-gray-900";
  const inactivePill = "bg-white text-gray-600 border-gray-300";

  return (
    <div className="flex flex-col gap-3">
      {/* 모드 토글 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("flight")}
          className={[
            pillBase,
            mode === "flight" ? activePill : inactivePill,
          ].join(" ")}
        >
          <TakeoffIcon className="w-4 h-4" />
          항공편
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("hotel")}
          className={[
            pillBase,
            mode === "hotel" ? activePill : inactivePill,
          ].join(" ")}
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
            aria-hidden="true"
          >
            <path d="M3 7v10M21 7v10M3 12h18M7 12V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" />
            <rect x="3" y="17" width="18" height="2" rx="1" />
          </svg>
          호텔
        </button>
      </div>

      {/* 검색 바 */}
      {mode === "flight" ? (
        <MobileFlightSearchBar
          onSearch={onFlightSearch}
          initialValues={initialValues}
        />
      ) : (
        <MobileHotelSearchBar
          onSearch={onHotelSearch}
          initialValues={hotelInitialValues}
        />
      )}
    </div>
  );
}
