import { useState } from "react";
import PinIcon from "@/assets/pin.svg?react";
import MapIcon from "@/assets/map.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import { getCategoryStyle } from "@/utils/itineraryCategory";
import type { ItineraryRow } from "@/components/workspace/ItineraryDayCard";
import type { ScheduleCategory } from "@/api/scheduleApi";

/* ══════════════════════════════════════════
   CompactItineraryCard
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 여행 일정 "N일차" 카드 한 장.

   구조 (이미지 2·5 기준):
   ┌────────────────────────────┐
   │ 📍 1일차        [편집][지도] │  ← 헤더
   ├────────────────────────────┤
   │ 14:30  공항 도착      [교통] │  ┐ 일정 항목
   │ 1터미널 도착        13,000원 │  ┘ (1행: 시각·제목·배지 / 2행: 메모·비용)
   ┊┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┊  ← 점선 구분선
   │ 17:00  감자 레스토랑  [식당] │
   │ 현지 감자요리        7,000원 │
   └────────────────────────────┘

   두 가지 모드:

   1) 보기 모드 (기본)
      - 헤더: 📍 N일차 + 편집 버튼 + 지도 버튼
      - 일정 항목을 세로로 적층 (시각·제목·분류 / 메모·비용)

   2) 편집 모드 (onSave가 있을 때만 진입 가능)
      - 헤더: 📍 N일차 + 취소/저장 버튼
      - 각 항목을 인라인 폼으로 편집 (시각·제목·분류·비용·메모)
      - 항목 추가 / 항목 삭제
      - "저장" 시 onSave(rows) 호출 → 부모(Section)가 onSaveDay(dayNumber, rows)로 전달
      - 데스크톱 ItineraryDayCard와 달리 드래그 재정렬은 없음 (모바일 폭 제약).
        새 항목은 목록 맨 끝에 추가됨.

   데스크톱 ItineraryDayCard와의 차이:
   - 데스크톱은 가로 5컬럼 표 + 드래그앤드롭. 모바일은 세로 적층 카드.
   - 본문(리치 텍스트)은 없음 — 일정 항목은 단순 필드들.
   - 새 항목 id는 "row-"로 시작 → useSchedule.handleSaveItineraryDay가
     이를 신규로 인식해 addScheduleItem 호출.

   여러 일차 카드는 CompactItinerarySection이 가로 스크롤로 나열.
*/

interface CompactItineraryCardProps {
  /** 일차 번호 */
  dayNumber: number;
  /** 일정 항목 목록 */
  rows: ItineraryRow[];
  /** 지도 버튼 클릭 (미지정 시 지도 버튼 숨김) */
  onMapClick?: (dayNumber: number) => void;
  /**
   * 편집 저장 콜백.
   * 편집 모드에서 "저장"을 누르면 (갱신된 rows)로 호출.
   * 미지정 시 카드는 보기 전용 — 편집 버튼이 숨겨짐.
   */
  onSave?: (rows: ItineraryRow[]) => void;
  /**
   * 항목 분류 변경 콜백 (보기 모드 전용 — 현재 미사용, 시그니처 호환용).
   * 편집 모드의 분류 변경은 onSave 경로로 처리됨.
   */
  onCategoryChange?: (itemId: number, category: ScheduleCategory) => void;
  /** 추가 클래스 */
  className?: string;
}

/* 편집 모드 분류 선택 목록 */
const CATEGORY_KEYS: ScheduleCategory[] = [
  "TRANSPORT",
  "ACCOMMODATION",
  "RESTAURANT",
  "CAFE",
  "ATTRACTION",
];

/** 메모 입력 최대 글자 수 (데스크톱 ItineraryDayCard와 동일) */
const REMARK_MAX_LENGTH = 50;

/** 새 빈 행 생성 — id가 "row-"로 시작해야 저장 시 신규로 인식됨 */
function createEmptyRow(): ItineraryRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    _category: "ATTRACTION",
  };
}

/* ──────────────────────────────────────────
   보기 모드 — 일정 항목 1개
   ────────────────────────────────────────── */

function ItineraryItemView({
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
   편집 모드 — 일정 항목 1개 (인라인 폼)
   ────────────────────────────────────────── */

function ItineraryItemEdit({
  row,
  index,
  isFirst,
  onChange,
  onRemove,
}: {
  row: ItineraryRow;
  index: number;
  isFirst: boolean;
  onChange: (patch: Partial<ItineraryRow>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={[
        "px-[18px] py-4 flex flex-col gap-2.5",
        isFirst
          ? "border-t border-gray-200"
          : "border-t border-dashed border-gray-200",
      ].join(" ")}
    >
      {/* 상단: 순번 + 삭제 */}
      <div className="flex items-center justify-between">
        <span className="font-pretendard text-body5 font-semibold text-gray-400">
          항목 {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`항목 ${index + 1} 삭제`}
          className={[
            "p-1 rounded border-none bg-transparent shrink-0",
            "text-gray-400 hover:text-red-500 hover:bg-red-50",
            "cursor-pointer transition-colors",
            "inline-flex items-center justify-center",
          ].join(" ")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4h9.334Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 제목 */}
      <input
        type="text"
        value={row.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="장소 / 일정 이름"
        aria-label="일정 제목"
        className={[
          "w-full px-2.5 py-1.5 rounded-md",
          "bg-white border border-gray-300",
          "font-pretendard text-body3 text-gray-900",
          "placeholder:text-gray-400",
          "outline-none focus:border-gray-700 transition-colors",
        ].join(" ")}
      />

      {/* 시각 + 비용 (한 줄) */}
      <div className="flex gap-2">
        <input
          type="text"
          value={row.visitTime ?? ""}
          onChange={(e) => onChange({ visitTime: e.target.value || undefined })}
          placeholder="시각 (14:30)"
          aria-label="방문 시각"
          inputMode="numeric"
          className={[
            "flex-1 min-w-0 px-2.5 py-1.5 rounded-md",
            "bg-white border border-gray-300",
            "font-pretendard text-body4 text-gray-900",
            "placeholder:text-gray-400",
            "outline-none focus:border-gray-700 transition-colors",
          ].join(" ")}
        />
        <input
          type="text"
          value={row.cost ?? ""}
          onChange={(e) => onChange({ cost: e.target.value || undefined })}
          placeholder="비용 (13,000원)"
          aria-label="예상 비용"
          className={[
            "flex-1 min-w-0 px-2.5 py-1.5 rounded-md",
            "bg-white border border-gray-300",
            "font-pretendard text-body4 text-gray-900",
            "placeholder:text-gray-400",
            "outline-none focus:border-gray-700 transition-colors",
          ].join(" ")}
        />
      </div>

      {/* 분류 칩 */}
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label="분류"
      >
        {CATEGORY_KEYS.map((key) => {
          const style = getCategoryStyle(key);
          const active = (row._category ?? "ATTRACTION") === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ _category: key })}
              className={[
                "px-2 py-0.5 rounded-md",
                "font-pretendard text-body5 font-medium",
                "border transition-colors cursor-pointer",
                active
                  ? `${style.badgeBg} ${style.badgeText} border-transparent`
                  : "bg-white text-gray-500 border-gray-300 hover:border-gray-500",
              ].join(" ")}
            >
              {style.label}
            </button>
          );
        })}
      </div>

      {/* 메모 */}
      <input
        type="text"
        value={row.remark ?? ""}
        onChange={(e) =>
          onChange({
            remark: e.target.value.slice(0, REMARK_MAX_LENGTH) || undefined,
          })
        }
        placeholder="메모"
        aria-label="메모"
        maxLength={REMARK_MAX_LENGTH}
        className={[
          "w-full px-2.5 py-1.5 rounded-md",
          "bg-white border border-gray-300",
          "font-pretendard text-body4 text-gray-900",
          "placeholder:text-gray-400",
          "outline-none focus:border-gray-700 transition-colors",
        ].join(" ")}
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function CompactItineraryCard({
  dayNumber,
  rows,
  onMapClick,
  onSave,
  className = "",
}: CompactItineraryCardProps) {
  /* 편집 모드 여부 */
  const [isEditing, setIsEditing] = useState(false);

  /* 편집 중 임시 행 목록 (저장 전까지 원본 rows를 건드리지 않음) */
  const [draftRows, setDraftRows] = useState<ItineraryRow[]>(rows);

  /* ── 모드 전환 ── */
  const enterEditMode = () => {
    /* 진입 시점의 rows를 얕은 복사로 draft에 적재
       (각 행 객체를 새로 만들어 보기 모드 rows와 참조 분리) */
    setDraftRows(rows.map((r) => ({ ...r })));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = () => {
    /* 제목이 빈 행은 제외 — 의미 없는 빈 항목 저장 방지 */
    const cleaned = draftRows
      .map((r) => ({ ...r, title: r.title.trim() }))
      .filter((r) => r.title.length > 0);
    onSave?.(cleaned);
    setIsEditing(false);
  };

  /* ── 행 편집 헬퍼 ── */
  const patchRow = (id: string, patch: Partial<ItineraryRow>) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const removeRow = (id: string) => {
    setDraftRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setDraftRows((prev) => [...prev, createEmptyRow()]);
  };

  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
        "flex flex-col",
        isEditing ? "shadow-md" : "",
        className,
      ].join(" ")}
    >
      {/* ── 헤더 ── */}
      <header className="flex items-center gap-2 px-[18px] py-3">
        <PinIcon className="w-5 h-5 shrink-0" />
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {dayNumber}일차
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className={[
                  "px-2.5 py-1 rounded-md",
                  "border border-gray-300 bg-white",
                  "font-pretendard text-body5 text-gray-700",
                  "hover:border-gray-700 transition-colors cursor-pointer",
                ].join(" ")}
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className={[
                  "px-2.5 py-1 rounded-md",
                  "border border-transparent bg-primary",
                  "font-pretendard text-body5 font-medium text-gray-900",
                  "hover:bg-primary-hover transition-colors cursor-pointer",
                ].join(" ")}
              >
                저장
              </button>
            </>
          ) : (
            <>
              {/* 편집 버튼 — onSave가 있을 때만 */}
              {onSave && (
                <button
                  type="button"
                  onClick={enterEditMode}
                  aria-label={`${dayNumber}일차 일정 편집`}
                  className={[
                    "p-1 rounded-md border-none bg-transparent",
                    "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                    "transition-colors cursor-pointer",
                    "inline-flex items-center justify-center",
                  ].join(" ")}
                >
                  <Edit2Icon className="w-4 h-4" />
                </button>
              )}

              {/* 지도 버튼 — onMapClick이 있을 때만 */}
              {onMapClick && (
                <button
                  type="button"
                  onClick={() => onMapClick(dayNumber)}
                  aria-label={`${dayNumber}일차 지도 보기`}
                  className={[
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md",
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
            </>
          )}
        </div>
      </header>

      {/* ── 일정 항목 목록 ── */}
      {isEditing ? (
        <>
          {draftRows.length === 0 ? (
            <div className="px-[18px] py-6 border-t border-gray-200 text-center font-pretendard text-body4 text-gray-400">
              아래 버튼으로 일정을 추가하세요.
            </div>
          ) : (
            draftRows.map((row, i) => (
              <ItineraryItemEdit
                key={row.id}
                row={row}
                index={i}
                isFirst={i === 0}
                onChange={(patch) => patchRow(row.id, patch)}
                onRemove={() => removeRow(row.id)}
              />
            ))
          )}

          {/* 항목 추가 버튼 */}
          <button
            type="button"
            onClick={addRow}
            className={[
              "flex items-center justify-center gap-1.5",
              "px-[18px] py-3 border-t border-dashed border-gray-300",
              "bg-transparent",
              "font-pretendard text-body4 font-medium text-gray-600",
              "hover:bg-gray-50 hover:text-gray-900",
              "transition-colors cursor-pointer",
            ].join(" ")}
          >
            <PlusIcon className="w-4 h-4" />
            일정 추가
          </button>
        </>
      ) : rows.length === 0 ? (
        <div className="px-[18px] py-8 border-t border-gray-200 text-center font-pretendard text-body4 text-gray-400">
          등록된 일정이 없습니다.
        </div>
      ) : (
        rows.map((row, i) => (
          <ItineraryItemView key={row.id} row={row} isFirst={i === 0} />
        ))
      )}
    </article>
  );
}
