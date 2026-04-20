import { useState, useCallback } from "react";
import Button from "./common/Button";
import Tab from "./common/Tab";
import Checkbox from "./common/Checkbox";

import AirportSearchDropdown, {
  type Airport,
} from "./searchbar/AirportSearchDropdown";
import CalendarDropdown, { type DateRange } from "./searchbar/CalendarDropdown";
import PassengerSeatDropdown, {
  type PassengerSeatData,
} from "./searchbar/PassengerSeatDropdown";

const tripTypes = ["편도", "왕복", "다구간"];

interface SearchBarProps {
  onSearch?: (params: {
    tripType: string;
    directOnly: boolean;
    departure: Airport | null;
    arrival: Airport | null;
    dateRange: DateRange;
    passenger: PassengerSeatData;
  }) => void;
  className?: string;
}

export default function SearchBar({
  onSearch,
  className = "",
}: SearchBarProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [directOnly, setDirectOnly] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [activePanel, setActivePanel] = useState<string | null>(null);

  const [departure, setDeparture] = useState<Airport | null>(null);
  const [arrival, setArrival] = useState<Airport | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [passenger, setPassenger] = useState<PassengerSeatData>({
    adults: 1,
    children: 0,
    seatClass: "일반석",
  });

  const closeAll = useCallback(() => setActivePanel(null), []);

  const handleSearch = () => {
    setSearchError(null);

    /* 유효성 검사 */
    if (!departure) {
      setSearchError("출발지를 선택해주세요");
      return;
    }
    if (!arrival) {
      setSearchError("도착지를 선택해주세요");
      return;
    }
    if (!dateRange.start) {
      setSearchError("출발일을 선택해주세요");
      return;
    }
    const isRoundTrip = tabIndex === 1;
    if (isRoundTrip && !dateRange.end) {
      setSearchError("돌아오는 날짜를 선택해주세요");
      return;
    }

    /* 부모에게 검색 파라미터 전달 — navigate는 부모가 담당 */
    onSearch?.({
      tripType: tripTypes[tabIndex],
      directOnly,
      departure,
      arrival,
      dateRange,
      passenger,
    });
  };

  return (
    <section
      className={[
        "bg-white px-4 pt-4 pb-6 rounded-2xl shadow-[0_0.5rem_1.875rem_0_rgba(0,0,0,0.1)]",
        className,
      ].join(" ")}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Tab + 직항만 */}
        <div className="flex items-center gap-6 mb-4">
          <Tab
            items={tripTypes}
            activeIndex={tabIndex}
            onChange={setTabIndex}
          />
          <Checkbox
            label="직항만"
            checked={directOnly}
            onChange={setDirectOnly}
          />
        </div>

        {/* 검색 필드 행 */}
        <div className="flex items-center gap-3">
          {/* 출발지 / 도착지 */}
          <AirportSearchDropdown
            departure={departure}
            arrival={arrival}
            activePanel={activePanel}
            onOpenDep={() => setActivePanel("dep")}
            onOpenArr={() => setActivePanel("arr")}
            onSelectDep={(a) => {
              setDeparture(a);
              setActivePanel("arr");
            }}
            onSelectArr={(a) => {
              setArrival(a);
              setActivePanel(null);
            }}
            onSwap={() => {
              setDeparture(arrival);
              setArrival(departure);
            }}
            onClose={closeAll}
          />

          {/* 가는편 / 오는편 */}
          <CalendarDropdown
            dateRange={dateRange}
            activePanel={activePanel}
            onOpen={(type) =>
              setActivePanel(type === "start" ? "cal-start" : "cal-end")
            }
            onChange={setDateRange}
            onClose={closeAll}
          />

          {/* 여행자 및 좌석 등급 */}
          <PassengerSeatDropdown
            value={passenger}
            activePanel={activePanel}
            onOpen={() => setActivePanel("pax")}
            onChange={setPassenger}
            onClose={closeAll}
          />

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
          <p className="mt-3 font-pretendard text-body4 text-red-500">
            {searchError}
          </p>
        )}
      </div>
    </section>
  );
}
