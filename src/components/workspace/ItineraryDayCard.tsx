import { useState } from "react";
import PinIcon from "@/assets/pin.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import MapIcon from "@/assets/map.svg?react";
import DayItineraryMap from "@/components/workspace/DayItineraryMap";
import ConfirmPopup from "@/components/common/ConfirmPopup";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

export interface ItineraryRow {
  id: string;
  title: string;
  visitTime?: string;
  cost?: string;
  remark?: string;
  _category?: string;
  _address?: string | null;
  _latitude?: number | null;
  _longitude?: number | null;
  _placeId?: string | null;
  _photoReference?: string | null;
  _estimatedCost?: number | null;
}

interface ItineraryDayCardProps {
  dayNumber: number;
  rows: ItineraryRow[];
  onSave?: (rows: ItineraryRow[]) => void;
  onMapClick?: (dayNumber: number) => void;
  onDeleteItem?: (itemId: number) => void;
  className?: string;
}

/* ══════════════════════════════════════════
   카테고리 설정
   ══════════════════════════════════════════ */

const CATEGORY_CONFIG = {
  TRANSPORT: {
    label: "교통",
    bgColor: "bg-sky-100",
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-600",
    badgeBorder: "border-sky-200",
    circleFrom: "from-sky-400",
    circleTo: "to-sky-500",
  },
  ACCOMMODATION: {
    label: "숙소",
    bgColor: "bg-violet-100",
    iconColor: "text-violet-500",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-600",
    badgeBorder: "border-violet-200",
    circleFrom: "from-violet-400",
    circleTo: "to-violet-500",
  },
  RESTAURANT: {
    label: "식당",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-600",
    badgeBorder: "border-orange-200",
    circleFrom: "from-orange-400",
    circleTo: "to-orange-500",
  },
  CAFE: {
    label: "카페",
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    circleFrom: "from-amber-400",
    circleTo: "to-amber-500",
  },
  ATTRACTION: {
    label: "관광",
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    circleFrom: "from-emerald-400",
    circleTo: "to-emerald-500",
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

function getCategoryConfig(category?: string) {
  return CATEGORY_CONFIG[(category as CategoryKey) ?? "ATTRACTION"] ?? CATEGORY_CONFIG.ATTRACTION;
}

/* ══════════════════════════════════════════
   카테고리 아이콘 (인라인 SVG)
   ══════════════════════════════════════════ */

function CategoryIcon({ category, className }: { category?: string; className?: string }) {
  const cls = className ?? "w-6 h-6";

  switch (category as CategoryKey) {
    case "TRANSPORT":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
          <path
            d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="currentColor"
          />
        </svg>
      );
    case "ACCOMMODATION":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
          <path
            d="M2 20v-8l10-7 10 7v8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 20v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 20h20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "RESTAURANT":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
          <path
            d="M18 2v6c0 1.66-1.34 3-3 3h0v9a1 1 0 0 1-2 0V2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 2v4M7 10v10a1 1 0 0 1-2 0V10M7 6A3 3 0 0 1 4 9v1h6V9A3 3 0 0 1 7 6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "CAFE":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
          <path
            d="M17 8h1a4 4 0 0 1 0 8h-1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 1v2M9.5 1v2M12.5 1v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "ATTRACTION":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
          <path
            d="M3 21h18M6 21V9M18 21V9M12 3l9 6H3l9-6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/* ══════════════════════════════════════════
   편집 모드 컬럼 비율
   ══════════════════════════════════════════ */

const EDIT_GRID_COLS =
  "28px minmax(160px, 3fr) minmax(100px, 1fr) minmax(120px, 1.5fr) minmax(120px, 2fr) 28px";

function createEmptyRow(): ItineraryRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
  };
}

/* ══════════════════════════════════════════
   보기 모드 — 타임라인 카드
   ══════════════════════════════════════════ */

function ViewTimelineRow({
  row,
  index,
  total,
  onDelete,
}: {
  row: ItineraryRow;
  index: number;
  total: number;
  onDelete?: () => void;
}) {
  const config = getCategoryConfig(row._category);
  const itemId = parseInt(row.id, 10);
  const isDeletable = !isNaN(itemId) && !!onDelete;
  const hasCost = row._estimatedCost != null && row._estimatedCost > 0;

  return (
    <div className="flex gap-3">
      {/* 왼쪽: 번호 배지 + 시각 + 연결선 */}
      <div className="flex flex-col items-center" style={{ width: 48, minWidth: 48 }}>
        <div
          className={[
            "w-7 h-7 rounded-full shrink-0",
            "bg-gradient-to-b",
            config.circleFrom,
            config.circleTo,
            "flex items-center justify-center",
            "text-white font-pretendard text-xs font-bold",
            "shadow-sm",
          ].join(" ")}
        >
          {index + 1}
        </div>
        {row.visitTime && (
          <span className="font-pretendard text-[11px] text-gray-500 mt-1 leading-tight text-center">
            {row.visitTime}
          </span>
        )}
        {index < total - 1 && (
          <div className="w-px bg-gray-200 flex-1 mt-2" style={{ minHeight: 16 }} />
        )}
      </div>

      {/* 오른쪽: 카드 */}
      <div
        className={[
          "flex-1 min-w-0",
          "rounded-xl border border-gray-100 bg-white",
          "flex items-start gap-3 p-4",
          index < total - 1 ? "mb-3" : "",
          "group hover:border-gray-200 hover:shadow-sm transition-all",
        ].join(" ")}
      >
        {/* 카테고리 아이콘 */}
        <div
          className={[
            "w-11 h-11 rounded-full shrink-0",
            "flex items-center justify-center",
            config.bgColor,
          ].join(" ")}
        >
          <CategoryIcon category={row._category} className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <span
            className={[
              "inline-flex items-center px-2 py-0.5 rounded-full",
              "font-pretendard text-[11px] font-medium",
              "border",
              config.badgeBg,
              config.badgeText,
              config.badgeBorder,
              "mb-1",
            ].join(" ")}
          >
            {config.label}
          </span>
          <div className="font-pretendard text-body3 font-semibold text-gray-900 leading-snug">
            {row.title}
          </div>
          {row.remark && (
            <div className="font-pretendard text-[12px] text-gray-400 mt-0.5 line-clamp-1">
              {row.remark}
            </div>
          )}
        </div>

        {/* 예상 비용 배지 */}
        <div
          className={[
            "shrink-0 px-3 py-1 rounded-full",
            "font-pretendard text-[13px] font-medium",
            hasCost
              ? "bg-orange-50 text-orange-600 border border-orange-200"
              : "bg-emerald-50 text-emerald-600 border border-emerald-200",
          ].join(" ")}
        >
          {row.cost || "0원"}
        </div>

        {/* 삭제 버튼 */}
        {isDeletable && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="일정 삭제"
            className={[
              "shrink-0 w-6 h-6 rounded",
              "inline-flex items-center justify-center",
              "border-none bg-transparent",
              "text-gray-300 hover:text-red-500 hover:bg-red-50",
              "opacity-0 group-hover:opacity-100",
              "transition-all cursor-pointer",
            ].join(" ")}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   보기 모드 — 하단 요약 푸터
   ══════════════════════════════════════════ */

function ViewFooter({ rows }: { rows: ItineraryRow[] }) {
  const totalCost = rows.reduce((sum, r) => sum + (r._estimatedCost ?? 0), 0);

  return (
    <div className="mt-1 mx-0 rounded-xl border border-gray-100 bg-gray-50 grid grid-cols-2 divide-x divide-gray-200">
      <div className="flex flex-col items-center py-3 px-4">
        <span className="font-pretendard text-[11px] text-gray-400 mb-0.5">총 일정</span>
        <span className="font-pretendard text-body3 font-semibold text-gray-800">
          {rows.length}개
        </span>
      </div>
      <div className="flex flex-col items-center py-3 px-4">
        <span className="font-pretendard text-[11px] text-gray-400 mb-0.5">총 예상 비용</span>
        <span className="font-pretendard text-body3 font-semibold text-orange-500">
          {totalCost > 0 ? `${totalCost.toLocaleString("ko-KR")}원` : "0원"}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   편집 모드 서브 컴포넌트 (기존 유지)
   ══════════════════════════════════════════ */

function EditHeaderRow() {
  return (
    <div
      className={[
        "grid items-center gap-2",
        "px-3 py-3",
        "font-pretendard text-body4 text-gray-600",
      ].join(" ")}
      style={{ gridTemplateColumns: EDIT_GRID_COLS }}
    >
      <span />
      <span className="text-center">제목</span>
      <span className="text-center">방문 시각</span>
      <span className="text-center">예상 비용</span>
      <span className="text-center">비고</span>
      <span />
    </div>
  );
}

function CellInput({
  value,
  onChange,
  placeholder,
  align = "left",
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align?: "left" | "center";
  ariaLabel?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={[
        "w-full min-w-0 px-2 py-1.5",
        "bg-white border border-gray-300 rounded-md",
        "font-pretendard text-body3 text-gray-900",
        "placeholder:text-gray-500",
        "outline-none focus:border-gray-700 transition-colors",
        align === "center" ? "text-center" : "text-left",
      ].join(" ")}
    />
  );
}

function MoveHandle({
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label="위로 이동"
        className={[
          "w-5 h-3 rounded-sm",
          "inline-flex items-center justify-center",
          "border-none bg-transparent",
          "transition-colors",
          canMoveUp
            ? "text-gray-500 hover:text-gray-900 hover:bg-gray-200 cursor-pointer"
            : "text-gray-300 cursor-not-allowed",
        ].join(" ")}
      >
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
          <path
            d="M1 5L4 1L7 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label="아래로 이동"
        className={[
          "w-5 h-3 rounded-sm",
          "inline-flex items-center justify-center",
          "border-none bg-transparent",
          "transition-colors",
          canMoveDown
            ? "text-gray-500 hover:text-gray-900 hover:bg-gray-200 cursor-pointer"
            : "text-gray-300 cursor-not-allowed",
        ].join(" ")}
      >
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
          <path
            d="M1 1L4 5L7 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function DeleteRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="행 삭제"
      className={[
        "w-6 h-6 rounded",
        "inline-flex items-center justify-center",
        "border-none bg-transparent",
        "text-gray-500 hover:text-gray-900 hover:bg-gray-200",
        "transition-colors cursor-pointer",
      ].join(" ")}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2 2L10 10M10 2L2 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function EditDataRow({
  row,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  row: ItineraryRow;
  index: number;
  total: number;
  onChange: (patch: Partial<ItineraryRow>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={[
        "grid items-center gap-2",
        "px-3 py-2",
        "rounded-lg border border-gray-200 bg-gray-100",
        "hover:border-gray-300 transition-colors",
      ].join(" ")}
      style={{ gridTemplateColumns: EDIT_GRID_COLS }}
    >
      <MoveHandle
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={index > 0}
        canMoveDown={index < total - 1}
      />
      <CellInput
        value={row.title}
        onChange={(v) => onChange({ title: v })}
        placeholder="공항 도착"
        ariaLabel="제목"
      />
      <CellInput
        value={row.visitTime ?? ""}
        onChange={(v) => onChange({ visitTime: v })}
        placeholder="09:30"
        align="center"
        ariaLabel="방문 시각"
      />
      <CellInput
        value={row.cost ?? ""}
        onChange={(v) => onChange({ cost: v })}
        placeholder="13,000원"
        align="center"
        ariaLabel="예상 비용"
      />
      <CellInput
        value={row.remark ?? ""}
        onChange={(v) => onChange({ remark: v })}
        placeholder="비고"
        ariaLabel="비고"
      />
      <DeleteRowButton onClick={onDelete} />
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function ItineraryDayCard({
  dayNumber,
  rows,
  onSave,
  onDeleteItem,
  className = "",
}: ItineraryDayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [draftRows, setDraftRows] = useState<ItineraryRow[]>(rows);

  const enterEditMode = () => {
    setDraftRows(rows);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftRows(rows);
    setIsEditing(false);
  };

  const saveEdit = () => {
    const cleaned = draftRows
      .map((r) => ({
        ...r,
        title: r.title.trim(),
        visitTime: r.visitTime?.trim() || undefined,
        cost: r.cost?.trim() || undefined,
        remark: r.remark?.trim() || undefined,
      }))
      .filter((r) => r.title.length > 0);

    onSave?.(cleaned);
    setIsEditing(false);
  };

  const updateRow = (id: string, patch: Partial<ItineraryRow>) => {
    setDraftRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const deleteRow = (id: string) => {
    setDraftRows((prev) => prev.filter((r) => r.id !== id));
  };
  const addRow = () => {
    setDraftRows((prev) => [...prev, createEmptyRow()]);
  };
  const moveRow = (index: number, direction: -1 | 1) => {
    setDraftRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <article
      className={[
        "bg-white rounded-xl border border-gray-200 overflow-hidden",
        "transition-shadow duration-200",
        isEditing ? "shadow-md" : "",
        className,
      ].join(" ")}
    >
      {/* ── 헤더 ── */}
      <header className="flex items-center gap-2 px-5 py-3.5">
        <PinIcon className="w-5 h-5 shrink-0" />
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {dayNumber}일차
        </span>

        {isEditing ? (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className={[
                "px-3 py-1.5 rounded-md",
                "border border-gray-300 bg-white",
                "font-pretendard text-body4 text-gray-700",
                "hover:border-gray-700 transition-colors cursor-pointer",
              ].join(" ")}
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className={[
                "px-3 py-1.5 rounded-md",
                "border border-transparent bg-primary",
                "font-pretendard text-body4 font-medium text-gray-900",
                "hover:bg-primary-hover transition-colors cursor-pointer",
              ].join(" ")}
            >
              저장
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={enterEditMode}
              aria-label={`${dayNumber}일차 편집`}
              className={[
                "ml-1 p-1 rounded",
                "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                "transition-colors cursor-pointer",
                "border-none bg-transparent",
                "inline-flex items-center justify-center",
              ].join(" ")}
            >
              <Edit2Icon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              aria-label={`${dayNumber}일차 지도 ${showMap ? "닫기" : "보기"}`}
              className={[
                "ml-auto",
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-md",
                "border transition-colors cursor-pointer",
                "font-pretendard text-body4",
                showMap
                  ? "border-amber-400 bg-amber-50 text-amber-600"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-700 hover:text-gray-900",
              ].join(" ")}
            >
              <MapIcon className="w-4 h-4 shrink-0" />
              <span>{showMap ? "닫기" : "지도"}</span>
            </button>
          </>
        )}
      </header>

      {/* ── 지도 패널 ── */}
      {showMap && !isEditing && (
        <div className="border-t border-gray-100 px-2 py-2" style={{ height: 340 }}>
          <DayItineraryMap rows={rows} dayNumber={dayNumber} />
        </div>
      )}

      {/* ── 편집 모드 컬럼 헤더 ── */}
      {isEditing && (
        <div className="border-t border-gray-200 px-2">
          <EditHeaderRow />
        </div>
      )}

      {/* ── 데이터 행들 ── */}
      <div className={isEditing ? "flex flex-col gap-2 px-2 pb-2" : "px-4 pt-4 pb-3"}>
        {isEditing ? (
          <>
            {draftRows.length === 0 ? (
              <div className="px-5 py-8 text-center font-pretendard text-body3 text-gray-500 rounded-lg border border-dashed border-gray-300 bg-white">
                아래 "+ 행 추가" 버튼으로 일정을 추가하세요.
              </div>
            ) : (
              draftRows.map((row, idx) => (
                <EditDataRow
                  key={row.id}
                  row={row}
                  index={idx}
                  total={draftRows.length}
                  onChange={(patch) => updateRow(row.id, patch)}
                  onDelete={() => deleteRow(row.id)}
                  onMoveUp={() => moveRow(idx, -1)}
                  onMoveDown={() => moveRow(idx, 1)}
                />
              ))
            )}

            <button
              type="button"
              onClick={addRow}
              className={[
                "mt-1 mb-1 px-5 py-3",
                "rounded-lg border border-dashed border-gray-300 bg-white",
                "font-pretendard text-body3 text-gray-500",
                "hover:border-gray-700 hover:text-gray-900 hover:bg-gray-100",
                "transition-colors cursor-pointer",
                "inline-flex items-center justify-center gap-1.5",
              ].join(" ")}
            >
              <PlusIcon className="w-4 h-4" />
              <span>행 추가</span>
            </button>
          </>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center font-pretendard text-body3 text-gray-500 rounded-lg border border-dashed border-gray-300">
            등록된 일정이 없습니다.
          </div>
        ) : (
          <>
            {rows.map((row, idx) => (
              <ViewTimelineRow
                key={row.id}
                row={row}
                index={idx}
                total={rows.length}
                onDelete={
                  onDeleteItem
                    ? () => {
                        const id = parseInt(row.id, 10);
                        if (!isNaN(id)) setDeleteTarget({ id, title: row.title });
                      }
                    : undefined
                }
              />
            ))}
            <ViewFooter rows={rows} />
          </>
        )}
      </div>

      {/* ── 삭제 확인 모달 ── */}
      <ConfirmPopup
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDeleteItem?.(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="일정을 삭제할까요?"
        description={deleteTarget ? `"${deleteTarget.title}"\n삭제하면 되돌릴 수 없어요.` : ""}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </article>
  );
}
