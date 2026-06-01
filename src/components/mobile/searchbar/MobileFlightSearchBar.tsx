import { useState } from "react";
import { type Airport } from "@/components/searchbar/AirportSearchDropdown";
import { type DateRange } from "@/components/searchbar/CalendarDropdown";
import { type PassengerSeatData } from "@/components/searchbar/PassengerSeatDropdown";
import { type FlightSearchParams } from "@/utils/flightSearchQuery";
import { type SearchBarInitialValues } from "@/components/SearchBar";

import BottomSheet from "@/components/mobile/searchbar/BottomSheet";
import AirportSearchSheetBody from "@/components/mobile/searchbar/AirportSearchSheetBody";
import CalendarSheetBody from "@/components/mobile/searchbar/CalendarSheetBody";
import PassengerSeatSheetBody from "@/components/mobile/searchbar/PassengerSeatSheetBody";

import SwitchIcon from "@/assets/switch.svg?react";
import CalendarIcon from "@/assets/calendar.svg?react";
import UsersIcon from "@/assets/users.svg?react";

/* ══════════════════════════════════════════
   MobileFlightSearchBar
   ══════════════════════════════════════════
   데스크톱 SearchBar(항공편)의 모바일 버전.
   - 상태/검증/onSearch 페이로드는 데스크톱과 동일하게 유지
     (tripType, directOnly, departure, arrival, dateRange, passenger).
   - 입력 UI는 절대위치 드롭다운 대신 세로 스택 필드 + BottomSheet.
   - 날짜는 한 칸으로 표시 (호텔 검색바와 동일):
     · 편도(0): "가는날" 단일 날짜.
     · 왕복(1): "가는날 ~ 오는날" 범위.
   - 편도/왕복/다구간 중 편도·왕복 동작. 다구간은 데스크톱과 동일하게
     탭만 제공(별도 다구간 UI는 범위 외).
*/

const tripTypes = ["편도", "왕복"];

type SheetKind = "dep" | "arr" | "calendar" | "pax" | null;

function fmtDate(d: Date | null) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}.`;
}

interface MobileFlightSearchBarProps {
  onSearch?: (params: FlightSearchParams) => void;
  initialValues?: SearchBarInitialValues;
  className?: string;
}

export default function MobileFlightSearchBar({
  onSearch,
  initialValues,
  className = "",
}: MobileFlightSearchBarProps) {
  const initialTabIndex = (() => {
    if (!initialValues?.tripType) return 0;
    const idx = tripTypes.indexOf(initialValues.tripType);
    return idx >= 0 ? idx : 0;
  })();

  const [tabIndex, setTabIndex] = useState(initialTabIndex);
  const [directOnly, setDirectOnly] = useState(
    initialValues?.directOnly ?? false,
  );
  const [departure, setDeparture] = useState<Airport | null>(
    initialValues?.departure ?? null,
  );
  const [arrival, setArrival] = useState<Airport | null>(
    initialValues?.arrival ?? null,
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    initialValues?.dateRange ?? { start: null, end: null },
  );
  const [passenger, setPassenger] = useState<PassengerSeatData>(
    initialValues?.passenger ?? { adults: 1, children: 0, seatClass: "일반석" },
  );

  /* 인원 시트 임시값 (적용 전까지 확정 안 함) */
  const [paxTemp, setPaxTemp] = useState<PassengerSeatData>(passenger);

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [error, setError] = useState<string | null>(null);

  const isRoundTrip = tabIndex === 1;

  const openSheet = (kind: SheetKind) => {
    if (kind === "pax") setPaxTemp(passenger);
    setError(null);
    setSheet(kind);
  };
  const closeSheet = () => setSheet(null);

  const handleSwap = () => {
    setDeparture(arrival);
    setArrival(departure);
  };

  const handleSearch = () => {
    setError(null);
    if (!departure) return setError("출발지를 선택해주세요");
    if (!arrival) return setError("도착지를 선택해주세요");
    if (!dateRange.start) return setError("가는날을 선택해주세요");
    if (isRoundTrip && !dateRange.end) return setError("오는날을 선택해주세요");

    onSearch?.({
      tripType: tripTypes[tabIndex],
      directOnly,
      departure,
      arrival,
      dateRange,
      passenger,
    });
  };

  /* 날짜 필드 표시값 (한 칸) */
  const dateLabel = (() => {
    if (!dateRange.start) return "";
    if (!isRoundTrip) return fmtDate(dateRange.start);
    if (!dateRange.end) return `${fmtDate(dateRange.start)} ~`;
    return `${fmtDate(dateRange.start)} ~ ${fmtDate(dateRange.end)}`;
  })();

  const paxLabel = `여행자 ${passenger.adults + passenger.children}명, ${passenger.seatClass}`;

  return (
    <section
      className={[
        "bg-white px-4 pt-4 pb-5 rounded-2xl",
        "shadow-[0_0.5rem_1.875rem_0_rgba(0,0,0,0.1)]",
        className,
      ].join(" ")}
    >
      {/* 탭 + 직항만 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-x-4">
          {tripTypes.map((t, i) => {
            const active = i === tabIndex;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTabIndex(i);
                  /* 편도로 바꾸면 오는날 제거 */
                  if (i === 0)
                    setDateRange((r) => ({ start: r.start, end: null }));
                }}
                className={[
                  "font-pretendard text-body2 bg-transparent border-0 cursor-pointer",
                  "transition-all duration-200 pb-1",
                  active
                    ? "text-gray-800 border-b-2 border-primary"
                    : "text-gray-500 border-b-2 border-transparent",
                ].join(" ")}
              >
                {t}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setDirectOnly((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
        >
          <span
            className={[
              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
              directOnly ? "bg-primary border-primary" : "border-gray-400",
            ].join(" ")}
          >
            {directOnly && (
              <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
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
          <span className="font-pretendard text-body3 text-gray-800">
            직항만
          </span>
        </button>
      </div>

      {/* 출발지/도착지 (한 줄, 가운데 스왑) */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-3.5 mb-2">
        <button
          type="button"
          onClick={() => openSheet("dep")}
          className={[
            "flex-1 min-w-0 bg-transparent border-none cursor-pointer",
            "font-pretendard text-body2 text-center truncate",
            departure ? "text-gray-900" : "text-gray-500",
          ].join(" ")}
        >
          {departure ? `${departure.cityName} (${departure.code})` : "출발지"}
        </button>
        <button
          type="button"
          onClick={handleSwap}
          aria-label="출발지 도착지 교체"
          className="shrink-0 p-1 bg-transparent border-none cursor-pointer text-secondary"
        >
          <SwitchIcon />
        </button>
        <button
          type="button"
          onClick={() => openSheet("arr")}
          className={[
            "flex-1 min-w-0 bg-transparent border-none cursor-pointer",
            "font-pretendard text-body2 text-center truncate",
            arrival ? "text-gray-900" : "text-gray-500",
          ].join(" ")}
        >
          {arrival ? `${arrival.cityName} (${arrival.code})` : "도착지"}
        </button>
      </div>

      {/* 날짜 (한 칸 — 편도: 가는날 / 왕복: 가는날 ~ 오는날) */}
      <button
        type="button"
        onClick={() => openSheet("calendar")}
        className={[
          "flex items-center gap-2 w-full bg-gray-100 rounded-lg px-4 py-3.5 mb-2",
          "border-none cursor-pointer text-left",
        ].join(" ")}
      >
        <CalendarIcon />
        <span
          className={[
            "flex-1 min-w-0 font-pretendard text-body2 truncate",
            dateLabel ? "text-gray-900" : "text-gray-500",
          ].join(" ")}
        >
          {dateLabel || (isRoundTrip ? "가는날 ~ 오는날" : "가는날")}
        </span>
      </button>

      {/* 인원/좌석 */}
      <button
        type="button"
        onClick={() => openSheet("pax")}
        className={[
          "flex items-center gap-2 w-full bg-gray-100 rounded-lg px-4 py-3.5 mb-4",
          "border-none cursor-pointer text-left",
        ].join(" ")}
      >
        <UsersIcon />
        <span className="flex-1 min-w-0 font-pretendard text-body2 text-gray-900 truncate">
          {paxLabel}
        </span>
      </button>

      {/* 검색 버튼 */}
      <button
        type="button"
        onClick={handleSearch}
        className={[
          "w-full py-4 rounded-lg",
          "font-pretendard text-body2 font-semibold text-gray-900",
          "bg-primary border-none cursor-pointer",
          "transition-all duration-200 active:scale-[0.99]",
        ].join(" ")}
      >
        검색하기
      </button>

      {error && (
        <p className="mt-3 font-pretendard text-body4 text-red-500 m-0">
          {error}
        </p>
      )}

      {/* ── 시트들 ── */}
      <BottomSheet
        isOpen={sheet === "dep"}
        onClose={closeSheet}
        title="출발지 선택"
      >
        <AirportSearchSheetBody
          label="출발지"
          selected={departure}
          onSelect={(a) => {
            setDeparture(a);
            /* 출발지 고르면 자동으로 도착지 시트로 (데스크톱 흐름과 동일) */
            setSheet(arrival ? null : "arr");
          }}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === "arr"}
        onClose={closeSheet}
        title="도착지 선택"
      >
        <AirportSearchSheetBody
          label="도착지"
          selected={arrival}
          onSelect={(a) => {
            setArrival(a);
            closeSheet();
          }}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === "calendar"}
        onClose={closeSheet}
        title={isRoundTrip ? "가는날 · 오는날 선택" : "가는날 선택"}
      >
        <CalendarSheetBody
          dateRange={dateRange}
          onChange={setDateRange}
          mode={isRoundTrip ? "range" : "single"}
          startLabel="가는날"
          endLabel="오는날"
          onComplete={closeSheet}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === "pax"}
        onClose={closeSheet}
        title="여행자 및 좌석 등급"
      >
        <PassengerSeatSheetBody
          value={paxTemp}
          onChange={setPaxTemp}
          onApply={() => {
            setPassenger(paxTemp);
            closeSheet();
          }}
        />
      </BottomSheet>
    </section>
  );
}
