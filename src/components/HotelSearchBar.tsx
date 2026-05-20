import { useState, useRef, useEffect, useCallback } from "react";
import Checkbox from "./common/Checkbox";
import Button from "./common/Button";
import SelectField from "./common/SelectField";
import CalendarDropdown, { type DateRange } from "./searchbar/CalendarDropdown";

type HotelSearchMode = "destination" | "url";

interface HotelGuests {
  adults: number;
  rooms: number;
}

export default function HotelSearchBar({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<HotelSearchMode>("destination");
  const [query, setQuery] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [guests, setGuests] = useState<HotelGuests>({ adults: 2, rooms: 1 });
  const [freeCancel, setFreeCancel] = useState(false);
  const [fourStarPlus, setFourStarPlus] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  const guestOpen = activePanel === "guests";
  const closeAll = useCallback(() => setActivePanel(null), []);

  useEffect(() => {
    if (!guestOpen) return;
    const handler = (e: MouseEvent) => {
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [guestOpen]);

  const guestLabel = `성인 ${guests.adults}명, ${guests.rooms}개`;

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
          <div className="flex-[2] min-w-0">
            <div
              className={[
                "flex items-center gap-2 px-5 py-4 w-full",
                "border rounded-lg transition-all duration-200",
                "bg-gray-200 border-gray-200 focus-within:border-gray-700",
              ].join(" ")}
            >
              <input
                type={mode === "url" ? "url" : "text"}
                value={mode === "destination" ? query : urlInput}
                onChange={(e) =>
                  mode === "destination"
                    ? setQuery(e.target.value)
                    : setUrlInput(e.target.value)
                }
                placeholder={
                  mode === "destination"
                    ? "목적지 또는 호텔 이름"
                    : "호텔 예약 페이지 URL"
                }
                className="flex-1 bg-transparent outline-none font-pretendard text-body2 text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

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
              onClick={() =>
                setActivePanel(guestOpen ? null : "guests")
              }
              isOpen={guestOpen}
            />

            {guestOpen && (
              <div className="absolute top-full left-0 mt-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-56 flex flex-col gap-3">
                {/* 성인 */}
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

                {/* 객실 */}
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
          >
            검색하기
          </Button>
        </div>
      </div>
    </section>
  );
}
