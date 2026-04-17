import { useState } from "react";
import Button from "./common/Button";
import Tab from "./common/Tab";
import Checkbox from "./common/Checkbox";
import SelectField from "./common/SelectField";
import PairSelectField from "./common/PairSelectField";

import CalendarIcon from "@/assets/calendar.svg?react";
import UsersIcon from "@/assets/users.svg?react";
import SwitchIcon from "@/assets/switch.svg?react";

const tripTypes = ["편도", "왕복", "다구간"];

/* ══════════════════════════════════════════════
   SearchBar 메인 컴포넌트
   ══════════════════════════════════════════════ */
interface SearchBarProps {
  /** 검색 클릭 시 콜백 */
  onSearch?: (params: { tripType: string; directOnly: boolean }) => void;
  /** 추가 클래스 */
  className?: string;
}

export default function SearchBar({
  onSearch,
  className = "",
}: SearchBarProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [directOnly, setDirectOnly] = useState(false);

  const handleSearch = () => {
    onSearch?.({
      tripType: tripTypes[tabIndex],
      directOnly,
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
          <PairSelectField
            className="flex-[2] min-w-0"
            bg="gray"
            leftPlaceholder="출발지"
            rightPlaceholder="도착지"
            centerIcon={<SwitchIcon />}
          />

          <SelectField
            className="flex-1 min-w-0"
            bg="gray"
            placeholder="가는편"
            rightIcon={<CalendarIcon />}
          />
          <SelectField
            className="flex-1 min-w-0"
            bg="gray"
            placeholder="오는편"
            rightIcon={<CalendarIcon />}
          />
          <SelectField
            className="flex-1 min-w-0"
            bg="gray"
            placeholder="인원/좌석등급"
            leftIcon={<UsersIcon />}
          />
          <Button
            btnType="solid"
            className="py-4 px-8 text-body2 shrink-0"
            onClick={handleSearch}
          >
            검색하기
          </Button>
        </div>
      </div>
    </section>
  );
}
