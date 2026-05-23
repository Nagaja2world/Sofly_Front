import { useState, useRef, useEffect, useCallback } from "react";
import Checkbox from "./common/Checkbox";
import Button from "./common/Button";
import SelectField from "./common/SelectField";
import CalendarDropdown, { type DateRange } from "./searchbar/CalendarDropdown";
import { useHotelDestinations } from "@/hooks/useHotelDestinations";
import { type HotelDestination } from "@/api/hotelApi";

export interface HotelSearchBarParams {
  destId: string;
  searchType: string;
  destName: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  roomQty: number;
}

type HotelSearchMode = "destination" | "url";

interface HotelGuests {
  adults: number;
  rooms: number;
}

interface HotelSearchBarProps {
  className?: string;
  onSearch?: (params: HotelSearchBarParams) => void;
  initialValues?: HotelSearchBarParams;
}

function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromApiDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function HotelSearchBar({
  className = "",
  onSearch,
  initialValues,
}: HotelSearchBarProps) {
  const [mode, setMode] = useState<HotelSearchMode>("destination");
  const [query, setQuery] = useState(initialValues?.destName ?? "");
  const [urlInput, setUrlInput] = useState("");
  const [selectedDest, setSelectedDest] = useState<HotelDestination | null>(
    initialValues
      ? ({
          destId: initialValues.destId,
          destType: initialValues.searchType,
          name: initialValues.destName,
        } as HotelDestination)
      : null,
  );
  const [dateRange, setDateRange] = useState<DateRange>({
    start: fromApiDate(initialValues?.arrivalDate ?? ""),
    end: fromApiDate(initialValues?.departureDate ?? ""),
  });
  const [guests, setGuests] = useState<HotelGuests>({
    adults: initialValues?.adults ?? 2,
    rooms: initialValues?.roomQty ?? 1,
  });
  const [freeCancel, setFreeCancel] = useState(false);
  const [fourStarPlus, setFourStarPlus] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const guestRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const guestOpen = activePanel === "guests";
  const destOpen = activePanel === "dest";
  const closeAll = useCallback(() => setActivePanel(null), []);

  const { results: destResults, isLoading: destLoading, clear: clearDest } =
    useHotelDestinations(mode === "destination" ? query : "");

  /* 자동완성 외부 클릭 닫기 */
  useEffect(() => {
    if (!destOpen && !guestOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (destRef.current && !destRef.current.contains(target)) {
        if (activePanel === "dest") setActivePanel(null);
      }
      if (guestRef.current && !guestRef.current.contains(target)) {
        if (activePanel === "guests") setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activePanel, destOpen, guestOpen]);

  /* 목적지 입력 시 드롭다운 열기 */
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedDest(null);
    if (e.target.value.length >= 2) setActivePanel("dest");
    else setActivePanel(null);
  };

  const handleDestSelect = (dest: HotelDestination) => {
    setQuery(dest.label ?? dest.name);
    setSelectedDest(dest);
    clearDest();
    setActivePanel(null);
  };

  const guestLabel = `성인 ${guests.adults}명, ${guests.rooms}개`;

  const handleSearch = () => {
    setSearchError(null);
    if (mode === "destination") {
      if (!selectedDest) {
        setSearchError("목적지를 선택해주세요");
        return;
      }
      if (!dateRange.start) {
        setSearchError("체크인 날짜를 선택해주세요");
        return;
      }
      if (!dateRange.end) {
        setSearchError("체크아웃 날짜를 선택해주세요");
        return;
      }
      onSearch?.({
        destId: selectedDest.destId,
        searchType: selectedDest.destType,
        destName: selectedDest.name,
        arrivalDate: toApiDate(dateRange.start),
        departureDate: toApiDate(dateRange.end),
        adults: guests.adults,
        roomQty: guests.rooms,
      });
    }
  };

  const modeItems: { key: HotelSearchMode; label: string }[] = [
    { key: "destination", label: "목적지" },
    { key: "url", label: "🔗 URL" },
  ];

  return (
    <section
      className={[
        "bg-white px-4 pt-4 pb-6 rounded-2xl shadow-[0_0.5rem_1.875rem_0_rgba(0,0,0,0.1)]",
        className,
      ].join(" ")}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* 상단: 모드 탭 + 체크박스 */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex gap-x-3">
            {modeItems.map(({ key, label }) => {
              const isActive = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={[
                    "font-pretendard text-body2 bg-transparent border-0 cursor-pointer",
                    "transition-all duration-200 -mb-px pb-0.5",
                    isActive
                      ? "text-gray-800 border-b-2 border-gray-900"
                      : "text-gray-500 border-b-2 border-transparent hover:text-gray-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Checkbox label="무료 취소" checked={freeCancel} onChange={setFreeCancel} />
          <Checkbox label="4성급+" checked={fourStarPlus} onChange={setFourStarPlus} />
        </div>

        {/* 검색 필드 행 */}
        <div className="flex items-center gap-3">
          {/* 목적지 / URL 입력 */}
          {mode === "destination" ? (
            <div ref={destRef} className="flex-[2] min-w-0 relative">
              <div
                className={[
                  "flex items-center gap-2 px-5 py-4 w-full",
                  "border rounded-lg transition-all duration-200",
                  destOpen
                    ? "bg-gray-200 border-gray-700"
                    : "bg-gray-200 border-gray-200",
                ].join(" ")}
              >
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => {
                    if (query.length >= 2) setActivePanel("dest");
                  }}
                  placeholder="목적지 또는 호텔 이름"
                  className="flex-1 bg-transparent outline-none font-pretendard text-body2 text-gray-900 placeholder:text-gray-500"
                />
                {destLoading && (
                  <span className="font-pretendard text-body5 text-gray-400 shrink-0">
                    검색 중…
                  </span>
                )}
              </div>

              {/* 자동완성 드롭다운 */}
              {destOpen && destResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {destResults.slice(0, 8).map((dest) => (
                    <button
                      key={dest.destId}
                      type="button"
                      onClick={() => handleDestSelect(dest)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-none bg-transparent cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-pretendard text-body3 font-semibold text-gray-900 truncate">
                          {dest.name}
                        </span>
                        <span className="font-pretendard text-body4 text-gray-400 truncate">
                          {dest.label}
                        </span>
                      </div>
                      {dest.hotels > 0 && (
                        <span className="font-pretendard text-body5 text-gray-400 shrink-0 ml-auto">
                          호텔 {dest.hotels.toLocaleString()}개
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-[2] min-w-0">
              <div className="flex items-center gap-2 px-5 py-4 w-full border rounded-lg bg-gray-200 border-gray-200 focus-within:border-gray-700 transition-all">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="호텔 예약 페이지 URL"
                  className="flex-1 bg-transparent outline-none font-pretendard text-body2 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          )}

          {/* 체크인 / 체크아웃 */}
          <CalendarDropdown
            dateRange={dateRange}
            activePanel={activePanel}
            onOpen={(type) =>
              setActivePanel(type === "start" ? "cal-start" : "cal-end")
            }
            onChange={setDateRange}
            onClose={closeAll}
            startLabel="체크인"
            endLabel="체크아웃"
          />

          {/* 투숙객 및 객실 */}
          <div ref={guestRef} className="relative flex-1 min-w-0">
            <SelectField
              bg="gray"
              value={guestLabel}
              placeholder="투숙객 및 객실"
              onClick={() => setActivePanel(guestOpen ? null : "guests")}
              isOpen={guestOpen}
            />

            {guestOpen && (
              <div className="absolute top-full left-0 mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-56 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-pretendard text-body3 text-gray-700">성인</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setGuests((g) => ({ ...g, adults: Math.max(1, g.adults - 1) }))
                      }
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="font-pretendard text-body3 text-gray-900 w-4 text-center">
                      {guests.adults}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGuests((g) => ({ ...g, adults: g.adults + 1 }))
                      }
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-pretendard text-body3 text-gray-700">객실</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setGuests((g) => ({ ...g, rooms: Math.max(1, g.rooms - 1) }))
                      }
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="font-pretendard text-body3 text-gray-900 w-4 text-center">
                      {guests.rooms}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGuests((g) => ({ ...g, rooms: g.rooms + 1 }))
                      }
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-pretendard text-body3 text-gray-700 bg-transparent cursor-pointer hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="mt-1 w-full py-2 rounded-lg bg-primary font-pretendard text-body4 font-semibold text-gray-900 border-none cursor-pointer hover:brightness-95"
                >
                  확인
                </button>
              </div>
            )}
          </div>

          {/* 검색 버튼 */}
          <Button
            btnType="solid"
            className="py-4 px-8 text-body2 shrink-0"
            onClick={handleSearch}
          >
            검색하기
          </Button>
        </div>

        {/* 에러 메시지 */}
        {searchError && (
          <p className="mt-3 font-pretendard text-body4 text-red-500 m-0">
            {searchError}
          </p>
        )}
      </div>
    </section>
  );
}
