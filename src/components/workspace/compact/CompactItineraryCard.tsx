import PinIcon from "@/assets/pin.svg?react";
import MapIcon from "@/assets/map.svg?react";
import { getCategoryStyle } from "@/utils/itineraryCategory";
import type { ItineraryRow } from "@/components/workspace/ItineraryDayCard";

/* ══════════════════════════════════════════
   CompactItineraryCard
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 여행 일정 "N일차" 카드 한 장.

   구조 (이미지 2·5 기준):
   ┌────────────────────────────┐
   │ 📍 1일차              [지도] │  ← 헤더
   ├────────────────────────────┤
   │ 14:30  공항 도착      [교통] │  ┐ 일정 항목
   │ 1터미널 도착        13,000원 │  ┘ (1행: 시각·제목·배지 / 2행: 메모·비용)
   ┊┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┊  ← 점선 구분선
   │ 17:00  감자 레스토랑  [식당] │
   │ 현지 감자요리        7,000원 │
   └────────────────────────────┘

   데스크톱 ItineraryDayCard와의 차이:
   - 데스크톱은 가로 5컬럼 표. 모바일은 세로 적층 카드.
   - 같은 5개 필드(visitTime/title/_category/cost/remark) 사용.
   - 편집 모드 없음 — 보기 전용. (편집은 데스크톱에서)
   - cost/remark가 비면 "-" 표시 (사용자가 나중에 채울 수 있음).

   여러 일차 카드는 CompactItinerarySection이 가로 스크롤로 나열.
*/

interface CompactItineraryCardProps {
  /** 일차 번호 */
  dayNumber: number;
  /** 일정 항목 목록 */
  rows: ItineraryRow[];
  /** 지도 버튼 클릭 (미지정 시 지도 버튼 숨김) */
  onMapClick?: (dayNumber: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/* ──────────────────────────────────────────
   일정 항목 1개
   ────────────────────────────────────────── */

function ItineraryItem({
  row,
  isFirst,
}: {
  row: ItineraryRow;
  isFirst: boolean;
}) {
  const category = getCategoryStyle(row._category);

  return (
    <div
      className={[
        "px-[18px] py-3.5",
        /* 첫 항목은 헤더와 실선 경계, 이후 항목은 점선 구분선 */
        isFirst
          ? "border-t border-gray-200"
          : "border-t border-dashed border-gray-200",
      ].join(" ")}
    >
      {/* 1행: 시각 · 제목 · 분류 배지 */}
      <div className="flex items-baseline gap-2">
        {row.visitTime && (
          <span className="font-pretendard text-body4 text-gray-500 shrink-0">
            {row.visitTime}
          </span>
        )}
        <span className="font-pretendard text-body3 font-semibold text-gray-900 flex-1 min-w-0 truncate">
          {row.title}
        </span>
        <span
          className={[
            "shrink-0 px-2 py-0.5 rounded-md",
            "font-pretendard text-body5 font-medium",
            category.badgeBg,
            category.badgeText,
          ].join(" ")}
        >
          {category.label}
        </span>
      </div>

      {/* 2행: 메모(좌) · 비용(우) — 비면 "-" */}
      <div className="flex items-center justify-between gap-3 mt-1.5">
        <span className="font-pretendard text-body4 text-gray-400 min-w-0 line-clamp-2">
          {row.remark || "-"}
        </span>
        <span className="font-pretendard text-body4 text-gray-500 shrink-0">
          {row.cost || "-"}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   메인 컴포넌트
   ────────────────────────────────────────── */

export default function CompactItineraryCard({
  dayNumber,
  rows,
  onMapClick,
  className = "",
}: CompactItineraryCardProps) {
  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
        "flex flex-col",
        className,
      ].join(" ")}
    >
      {/* ── 헤더: 📍 N일차 ········ [지도] ── */}
      <header className="flex items-center gap-2 px-[18px] py-3.5">
        <PinIcon className="w-5 h-5 shrink-0" />
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {dayNumber}일차
        </span>
        {onMapClick && (
          <button
            type="button"
            onClick={() => onMapClick(dayNumber)}
            aria-label={`${dayNumber}일차 지도 보기`}
            className={[
              "ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md",
              "border border-gray-300 bg-white",
              "font-pretendard text-body5 text-gray-700",
              "hover:border-gray-700 hover:text-gray-900",
              "transition-colors cursor-pointer",
            ].join(" ")}
          >
            <MapIcon className="w-3.5 h-3.5 shrink-0" />
            <span>지도</span>
          </button>
        )}
      </header>

      {/* ── 일정 항목 목록 ── */}
      {rows.length === 0 ? (
        <div className="px-[18px] py-8 border-t border-gray-200 text-center font-pretendard text-body4 text-gray-400">
          등록된 일정이 없습니다.
        </div>
      ) : (
        rows.map((row, i) => (
          <ItineraryItem key={row.id} row={row} isFirst={i === 0} />
        ))
      )}
    </article>
  );
}
