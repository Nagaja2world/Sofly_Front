import { useState, useRef, useEffect } from "react";
import SelectField from "@/components/common/SelectField";
import CalendarIcon from "@/assets/calendar.svg?react";

/* ── 타입 ── */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CalendarDropdownProps {
  /** 현재 날짜 범위 */
  dateRange: DateRange;
  /** 현재 열린 패널: "cal-start" | "cal-end" | null */
  activePanel: string | null;
  /** 트리거 클릭 */
  onOpen: (type: "start" | "end") => void;
  /** 날짜 변경 콜백 */
  onChange: (range: DateRange) => void;
  /** 드롭다운 닫기 */
  onClose: () => void;
  /** start 버튼 라벨 (기본: "가는편") */
  startLabel?: string;
  /** end 버튼 라벨 (기본: "오는편") */
  endLabel?: string;
  /** 편도 모드: 단일 날짜만 선택, 오는편 비활성화 */
  singleMode?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/* ── 유틸 ── */
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function getFirstDay(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}
function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function inRange(d: Date, s: Date | null, e: Date | null) {
  if (!s || !e) return false;
  return d.getTime() > s.getTime() && d.getTime() < e.getTime();
}
function fmtDate(d: Date | null) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}.`;
}
function isPast(d: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d.getTime() < now.getTime();
}

export default function CalendarDropdown({
  dateRange,
  activePanel,
  onOpen,
  onChange,
  onClose,
  startLabel = "가는편",
  endLabel = "오는편",
  singleMode = false,
  className = "",
}: CalendarDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = activePanel === "cal-start" || activePanel === "cal-end";
  const selecting = activePanel === "cal-end" ? "end" : "start";
  const [month, setMonth] = useState(() => {
    const d = dateRange.start || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  /* 외부 클릭 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  /* 달력 데이터 */
  const daysCount = getDaysInMonth(month.year, month.month);
  const firstDay = getFirstDay(month.year, month.month);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++)
    cells.push(new Date(month.year, month.month, d));

  const handleDateClick = (d: Date) => {
    if (isPast(d)) return;
    if (singleMode) {
      onChange({ start: d, end: null });
      onClose();
      return;
    }
    if (selecting === "start") {
      const newEnd =
        dateRange.end && d.getTime() < dateRange.end.getTime()
          ? dateRange.end
          : null;
      onChange({ start: d, end: newEnd });
      onOpen("end");
    } else {
      if (dateRange.start && d.getTime() <= dateRange.start.getTime()) {
        onChange({ start: d, end: null });
        onOpen("end");
      } else {
        onChange({ start: dateRange.start, end: d });
        onClose();
      }
    }
  };

  const prevMonth = () =>
    setMonth((p) =>
      p.month === 0
        ? { year: p.year - 1, month: 11 }
        : { ...p, month: p.month - 1 },
    );
  const nextMonth = () =>
    setMonth((p) =>
      p.month === 11
        ? { year: p.year + 1, month: 0 }
        : { ...p, month: p.month + 1 },
    );

  return (
    <div
      ref={ref}
      className={["relative flex gap-3 flex-[2] min-w-0", className].join(" ")}
    >
      {/* start 트리거 */}
      <SelectField
        className="flex-1 min-w-0"
        bg="gray"
        value={dateRange.start ? fmtDate(dateRange.start) : undefined}
        placeholder={startLabel}
        rightIcon={<CalendarIcon />}
        onClick={() => onOpen("start")}
        isOpen={isOpen && selecting === "start"}
      />

      {/* end 트리거 (편도 모드에서는 비활성화) */}
      <SelectField
        className="flex-1 min-w-0"
        bg="gray"
        value={dateRange.end ? fmtDate(dateRange.end) : undefined}
        placeholder={endLabel}
        rightIcon={<CalendarIcon />}
        onClick={() => onOpen("end")}
        isOpen={isOpen && selecting === "end"}
        disabled={singleMode}
      />

      {/* 캘린더 패널 */}
      {isOpen && (
        <div
          className={[
            "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
            "bg-white border border-gray-300 rounded-xl",
            "shadow-[0_8px_30px_0_rgba(0,0,0,0.1)]",
            "p-5 w-[360px]",
          ].join(" ")}
        >
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className={[
                "w-8 h-8 flex items-center justify-center",
                "bg-transparent border-none cursor-pointer",
                "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                "rounded-lg transition-colors text-body1",
              ].join(" ")}
            >
              ‹
            </button>
            <span className="font-pretendard text-body1 font-semibold text-gray-900">
              {month.year}년 {month.month + 1}월
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className={[
                "w-8 h-8 flex items-center justify-center",
                "bg-transparent border-none cursor-pointer",
                "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                "rounded-lg transition-colors text-body1",
              ].join(" ")}
            >
              ›
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={[
                  "text-center font-pretendard text-body4 py-1",
                  i === 0 ? "text-red-400" : "text-gray-500",
                ].join(" ")}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {cells.map((d, idx) => {
              if (!d) return <div key={`e-${idx}`} className="h-10" />;

              const isStart = sameDay(d, dateRange.start);
              const isEnd = sameDay(d, dateRange.end);
              const between = inRange(d, dateRange.start, dateRange.end);
              const past = isPast(d);
              const isSun = d.getDay() === 0;

              return (
                <div
                  key={d.toISOString()}
                  className={[
                    "relative h-10 flex items-center justify-center",
                    between ? "bg-primary/15" : "",
                  ].join(" ")}
                  style={
                    isStart && dateRange.end
                      ? {
                          background:
                            "linear-gradient(to right, transparent 50%, rgba(245,209,90,0.15) 50%)",
                        }
                      : isEnd && dateRange.start
                        ? {
                            background:
                              "linear-gradient(to left, transparent 50%, rgba(245,209,90,0.15) 50%)",
                          }
                        : undefined
                  }
                >
                  <button
                    type="button"
                    disabled={past}
                    onClick={() => handleDateClick(d)}
                    className={[
                      "w-9 h-9 rounded-full border-none",
                      "font-pretendard text-body3",
                      "flex items-center justify-center",
                      "transition-all duration-150",
                      past
                        ? "text-gray-400 cursor-not-allowed bg-transparent"
                        : "cursor-pointer",
                      isStart || isEnd
                        ? "bg-primary text-gray-900 font-semibold"
                        : between
                          ? "bg-transparent text-gray-900 hover:bg-primary/30"
                          : past
                            ? ""
                            : isSun
                              ? "bg-transparent text-red-400 hover:bg-gray-100"
                              : "bg-transparent text-gray-800 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 선택 안내 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="font-pretendard text-body4 text-gray-500 text-center m-0">
              {singleMode
                ? `${startLabel} 날짜를 선택하세요`
                : selecting === "start"
                  ? `${startLabel} 날짜를 선택하세요`
                  : `${endLabel} 날짜를 선택하세요`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
