import { useState } from "react";
import Checkbox from "@/components/common/Checkbox";
import {
  type FilterState,
  type TimeSlot,
  TIME_SLOT_LABELS,
} from "@/types/flightType";

interface FilterSidebarProps {
  /** 현재 필터 상태 */
  value: FilterState;
  /** 필터 변경 콜백 */
  onChange: (next: FilterState) => void;
  /** 항공편 결과에서 추출한 항공사 목록 */
  airlineList?: string[];
  /** 추가 클래스 */
  className?: string;
}

/**
 * 섹션 구분선 + 타이틀 + 접기 지원
 */
function FilterSection({
  title,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="py-4 border-b border-gray-300 last:border-b-0">
      <button
        type="button"
        onClick={() => collapsible && setOpen((p) => !p)}
        className={[
          "w-full flex items-center justify-between",
          "bg-transparent border-none p-0",
          "font-pretendard text-body2 font-semibold text-gray-900",
          collapsible ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
      >
        <span>{title}</span>
        {collapsible && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={[
              "text-gray-600 transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {open && <div className="mt-3 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({
  value,
  onChange,
  airlineList = [],
  className = "",
}: FilterSidebarProps) {
  /* ── 경유/환승 ── */
  const setStop = (key: keyof FilterState["stops"], checked: boolean) => {
    onChange({ ...value, stops: { ...value.stops, [key]: checked } });
  };

  /* ── 시간대 토글 ── */
  const toggleTime = (
    field: "outboundTime" | "inboundTime",
    slot: TimeSlot,
  ) => {
    const current = value[field];
    const next = current.includes(slot)
      ? current.filter((s) => s !== slot)
      : [...current, slot];
    onChange({ ...value, [field]: next });
  };

  /* ── 항공사 토글 ── */
  const toggleAirline = (airline: string) => {
    const next = value.airlines.includes(airline)
      ? value.airlines.filter((a) => a !== airline)
      : [...value.airlines, airline];
    onChange({ ...value, airlines: next });
  };

  const allSlots: TimeSlot[] = ["00-06", "06-12", "12-18", "18-24"];

  return (
    <aside
      className={["w-[220px] shrink-0", "font-pretendard", className].join(" ")}
    >
      {/* ── 경유/환승 ── */}
      <FilterSection title="경유/환승">
        <Checkbox
          label="직항"
          checked={value.stops.direct}
          onChange={(c) => setStop("direct", c)}
        />
        <Checkbox
          label="경유 1회"
          checked={value.stops.oneStop}
          onChange={(c) => setStop("oneStop", c)}
        />
        <Checkbox
          label="경유 2회 이상"
          checked={value.stops.twoPlusStops}
          onChange={(c) => setStop("twoPlusStops", c)}
        />
      </FilterSection>

      {/* ── 가는편 출발시간 ── */}
      <FilterSection title="가는편 출발시간">
        {allSlots.map((slot) => (
          <Checkbox
            key={`out-${slot}`}
            label={TIME_SLOT_LABELS[slot]}
            checked={value.outboundTime.includes(slot)}
            onChange={() => toggleTime("outboundTime", slot)}
          />
        ))}
      </FilterSection>

      {/* ── 오는편 출발시간 ── */}
      <FilterSection title="오는편 출발시간">
        {allSlots.map((slot) => (
          <Checkbox
            key={`in-${slot}`}
            label={TIME_SLOT_LABELS[slot]}
            checked={value.inboundTime.includes(slot)}
            onChange={() => toggleTime("inboundTime", slot)}
          />
        ))}
      </FilterSection>

      {/* ── 항공사 (접기 가능) ── */}
      <FilterSection title="항공사" collapsible defaultOpen>
        {/* 전체 */}
        <Checkbox
          label="전체"
          checked={value.airlines.length === 0}
          onChange={(checked) => {
            if (checked) onChange({ ...value, airlines: [] });
          }}
        />
        {airlineList.length === 0 ? (
          <p className="font-pretendard text-body4 text-gray-500 py-1">
            항공사 정보 없음
          </p>
        ) : (
          airlineList.map((airline) => (
            <Checkbox
              key={airline}
              label={airline}
              checked={value.airlines.includes(airline)}
              onChange={() => toggleAirline(airline)}
            />
          ))
        )}
      </FilterSection>

      {/* ── 기타 ── */}
      <FilterSection title="기타">
        <Checkbox
          label="출발/도착 같음"
          checked={value.sameAirport}
          onChange={(c) => onChange({ ...value, sameAirport: c })}
        />
      </FilterSection>
    </aside>
  );
}
