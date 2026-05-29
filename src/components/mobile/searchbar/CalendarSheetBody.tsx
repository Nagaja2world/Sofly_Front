import { useState } from "react";
import { type DateRange } from "@/components/searchbar/CalendarDropdown";

/* ══════════════════════════════════════════
   CalendarSheetBody
   ══════════════════════════════════════════
   BottomSheet 안에 들어가는 달력 본문.
   CalendarDropdown의 달력 계산/범위 선택 로직을 그대로 가져오되,
   모바일 폭에 맞춰 단일 월 그리드 + 큰 탭 타깃으로 표현.

   - mode "range": 가는편/오는편(또는 체크인/체크아웃) 범위 선택.
   - mode "single": 편도 등 출발일만 선택.
   부모(MobileSearchBar/MobileHotelSearchBar)가 dateRange와 onChange를 소유. */

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
function isPast(d: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d.getTime() < now.getTime();
}

interface CalendarSheetBodyProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  /** range: 왕복(가는/오는), single: 편도(출발일만) */
  mode: "range" | "single";
  /** single/ range start 선택 완료 시 시트 닫기 트리거 */
  onComplete?: () => void;
  startLabel?: string;
  endLabel?: string;
  /** 표시할 월 개수 (기본 2 — 모바일은 세로로 이어 스크롤) */
  monthsToShow?: number;
}

export default function CalendarSheetBody({
  dateRange,
  onChange,
  mode,
  onComplete,
  startLabel = "가는날",
  endLabel = "오는날",
  monthsToShow = 3,
}: CalendarSheetBodyProps) {
  /* 시작 월: 선택된 출발일 또는 이번 달 */
  const base = dateRange.start ?? new Date();
  const [anchor] = useState({
    year: base.getFullYear(),
    month: base.getMonth(),
  });

  /* single 모드는 첫 탭에 확정, range 모드는 start→end 순차 선택 */
  const handleDateClick = (d: Date) => {
    if (isPast(d)) return;

    if (mode === "single") {
      onChange({ start: d, end: null });
      onComplete?.();
      return;
    }

    /* range */
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      /* 새 범위 시작 */
      onChange({ start: d, end: null });
    } else {
      /* start만 있는 상태 → end 결정 */
      if (d.getTime() <= dateRange.start.getTime()) {
        onChange({ start: d, end: null });
      } else {
        onChange({ start: dateRange.start, end: d });
        onComplete?.();
      }
    }
  };

  /* anchor부터 monthsToShow개월 렌더 */
  const months = Array.from({ length: monthsToShow }).map((_, i) => {
    const y = anchor.year + Math.floor((anchor.month + i) / 12);
    const m = (anchor.month + i) % 12;
    return { year: y, month: m };
  });

  return (
    <div className="px-4 pb-4">
      {/* 안내 */}
      <p className="font-pretendard text-body4 text-gray-500 text-center py-3 m-0 sticky top-0 bg-white border-b border-gray-100">
        {mode === "single"
          ? `${startLabel}을 선택하세요`
          : !dateRange.start
            ? `${startLabel}을 선택하세요`
            : `${endLabel}을 선택하세요`}
      </p>

      {months.map(({ year, month }) => {
        const daysCount = getDaysInMonth(year, month);
        const firstDay = getFirstDay(year, month);
        const cells: (Date | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysCount; d++)
          cells.push(new Date(year, month, d));

        return (
          <div key={`${year}-${month}`} className="mt-4">
            <p className="font-pretendard text-body2 font-semibold text-gray-900 text-center mb-2">
              {year}년 {month + 1}월
            </p>

            <div className="grid grid-cols-7 mb-1">
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

            <div className="grid grid-cols-7">
              {cells.map((d, idx) => {
                if (!d) return <div key={`e-${idx}`} className="h-11" />;

                const isStart = sameDay(d, dateRange.start);
                const isEnd = sameDay(d, dateRange.end);
                const between = inRange(d, dateRange.start, dateRange.end);
                const past = isPast(d);
                const isSun = d.getDay() === 0;
                const isEdge = isStart || isEnd;

                return (
                  <div
                    key={d.toISOString()}
                    className={[
                      "relative h-11 flex items-center justify-center",
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
                        "w-10 h-10 rounded-full border-none",
                        "font-pretendard text-body3",
                        "flex items-center justify-center transition-all duration-150",
                        past
                          ? "text-gray-300 cursor-not-allowed bg-transparent"
                          : "cursor-pointer",
                        isEdge
                          ? "bg-primary text-gray-900 font-semibold"
                          : between
                            ? "bg-transparent text-gray-900"
                            : past
                              ? ""
                              : isSun
                                ? "bg-transparent text-red-400 active:bg-gray-100"
                                : "bg-transparent text-gray-800 active:bg-gray-100",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
