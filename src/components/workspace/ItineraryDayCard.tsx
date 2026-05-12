import { useState } from "react";
import PinIcon from "@/assets/pin.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import MapIcon from "@/assets/map.svg?react";
import DayItineraryMap from "@/components/workspace/DayItineraryMap";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 한 일정 행 (테이블의 1행) */
export interface ItineraryRow {
  /** 고유 id. API에서 온 항목은 숫자 문자열(e.g. "101"), 신규 항목은 "row-*" */
  id: string;
  /** 장소명 */
  title: string;
  /** 방문 시각 "09:30" (API visitTime) — 없으면 "-" 표시 */
  visitTime?: string;
  /** 예상 비용 "13,000원" (API estimatedCost 포맷) */
  cost?: string;
  /** 메모 / 비고 (API memo) */
  remark?: string;
  /** API 원본 카테고리 — 편집 시 보존 */
  _category?: string;
  /** API 원본 주소 — 편집 시 보존 */
  _address?: string | null;
  /** API 원본 위도 */
  _latitude?: number | null;
  /** API 원본 경도 */
  _longitude?: number | null;
  /** API 원본 placeId */
  _placeId?: string | null;
  /** API 원본 photoReference */
  _photoReference?: string | null;
  /** API 원본 estimatedCost (숫자) */
  _estimatedCost?: number | null;
}

interface ItineraryDayCardProps {
  /** 일차 번호 (1, 2, 3 ...) */
  dayNumber: number;
  /** 일정 행 목록 */
  rows: ItineraryRow[];
  /**
   * 편집 저장 콜백.
   * 편집 모드에서 "저장"을 누르면 호출됨.
   * 부모 컴포넌트는 이 rows로 자신의 state를 갱신해야 함.
   * (API 연결 시: 여기서 PATCH/PUT 호출 후 성공 시 state 갱신)
   */
  onSave?: (rows: ItineraryRow[]) => void;
  /** 지도 버튼 클릭 시 외부 콜백 (선택). 카드 내부 인라인 지도가 기본 동작. */
  onMapClick?: (dayNumber: number) => void;
  /** 보기 모드에서 행 삭제 콜백. itemId(숫자)를 넘겨줌. */
  onDeleteItem?: (itemId: number) => void;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   공통 상수
   ══════════════════════════════════════════ */

/** 테이블 컬럼 비율 (보기 모드)
 *  제목 | 방문 시각 | 예상 비용 | 비고 */
const VIEW_GRID_COLS =
  "minmax(180px, 3fr) minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(80px, 1fr)";

/** 테이블 컬럼 비율 (편집 모드)
 *  드래그(28px) | 제목 | 방문 시각 | 예상 비용 | 비고 | 삭제(28px) */
const EDIT_GRID_COLS =
  "28px minmax(160px, 3fr) minmax(100px, 1fr) minmax(120px, 1.5fr) minmax(120px, 2fr) 28px";

/** 새 행 생성 */
function createEmptyRow(): ItineraryRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
  };
}

/* ══════════════════════════════════════════
   보기 모드 서브 컴포넌트
   ══════════════════════════════════════════ */

/** 보기 모드 컬럼 헤더 */
function ViewHeaderRow() {
  return (
    <div
      className={[
        "grid items-center",
        "px-5 py-3",
        "font-pretendard text-body4 text-gray-600",
      ].join(" ")}
      style={{ gridTemplateColumns: VIEW_GRID_COLS }}
    >
      <span className="text-center">제목</span>
      <span className="text-center">방문 시각</span>
      <span className="text-center">예상 비용</span>
      <span className="text-center">비고</span>
    </div>
  );
}

/** 보기 모드 데이터 행 */
function ViewDataRow({
  row,
  onDelete,
}: {
  row: ItineraryRow;
  onDelete?: () => void;
}) {
  const itemId = parseInt(row.id, 10);
  const isDeletable = !isNaN(itemId) && onDelete;

  return (
    <div
      className={[
        "grid items-center",
        "px-5 py-4",
        "rounded-lg border border-gray-300 bg-gray-100",
        "font-pretendard text-body3 text-gray-900",
        "group",
      ].join(" ")}
      style={{ gridTemplateColumns: isDeletable ? `${VIEW_GRID_COLS} 28px` : VIEW_GRID_COLS }}
    >
      <span className="text-gray-900 truncate">{row.title}</span>
      <span className="text-center text-gray-700">
        {row.visitTime ?? "-"}
      </span>
      <span className="text-center text-gray-700">{row.cost || "-"}</span>
      <span className="text-center text-gray-700 truncate">
        {row.remark ?? ""}
      </span>
      {isDeletable && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="일정 삭제"
          className={[
            "w-6 h-6 rounded",
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
  );
}

/* ══════════════════════════════════════════
   편집 모드 서브 컴포넌트
   ══════════════════════════════════════════ */

/** 편집 모드 컬럼 헤더 */
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

/** 편집 모드용 input — 셀 내부 공간을 꽉 채우는 미니멀 입력 */
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

/** 행 순서 변경 핸들 (위/아래 이동) */
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

/** 행 삭제 버튼 (X) */
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

/** 편집 모드 데이터 행 */
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

/**
 * 워크스페이스 페이지의 여행 일정 N일차 카드
 *
 * 두 가지 모드를 가짐:
 *
 * 1) 보기 모드 (기본)
 *    - 헤더: 📍 + "1일차" + 편집 버튼(edit2) + 지도 버튼
 *    - 본문: 4컬럼 테이블 (제목 | 체류 | 이동 | 비고)
 *
 * 2) 편집 모드 (헤더 편집 버튼 클릭 시 진입)
 *    - 헤더: 📍 + "1일차" + 취소 / 저장 버튼
 *    - 본문: 8컬럼 편집 테이블 (이동 | 제목 | 체류 | 교통편 | 이동시간 | 비용 | 비고 | 삭제)
 *    - 하단: "+ 행 추가" 버튼
 *    - 저장 시 onSave(rows) 호출 → 부모가 state 갱신 (API 연결 시 PATCH)
 *    - 취소 시 진입 시점의 rows로 되돌림
 *
 * 부모는 보기/편집 모드 전환을 신경 쓸 필요 없이 rows + onSave + onMapClick만 넘기면 됨.
 */
export default function ItineraryDayCard({
  dayNumber,
  rows,
  onSave,
  onDeleteItem,
  className = "",
}: ItineraryDayCardProps) {
  /** 편집 모드 여부 */
  const [isEditing, setIsEditing] = useState(false);

  /** 지도 펼침 여부 (기본 열림) */
  const [showMap, setShowMap] = useState(true);

  /** 편집 중 임시 rows (저장 시 onSave로 위임, 취소 시 폐기)
   *  보기 모드일 때는 이 state를 사용하지 않고 props.rows를 직접 렌더하므로
   *  부모 props 변경을 useEffect로 동기화할 필요가 없음.
   *  (편집 모드 진입 시점에 enterEditMode에서 한 번만 초기화하면 충분) */
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
    /* 빈 제목인 행은 저장에서 제외 (사용자가 깜빡한 빈 행 방지) */
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

  /* ── draft 조작 헬퍼 ── */
  const updateRow = (id: string, patch: Partial<ItineraryRow>) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
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
        "bg-white rounded-xl border border-gray-300 overflow-hidden",
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

        {/* 보기 모드: edit2 버튼 + 지도 버튼 / 편집 모드: 취소·저장 버튼 */}
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

            {/* 지도 버튼 — 헤더 맨 오른쪽 끝 */}
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              aria-label={`${dayNumber}일차 지도 ${showMap ? '닫기' : '보기'}`}
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

      {/* ── 컬럼 헤더 ── */}
      <div className="border-t border-gray-200 px-2">
        {isEditing ? <EditHeaderRow /> : <ViewHeaderRow />}
      </div>

      {/* ── 지도 패널 (지도 버튼 클릭 시 펼침) ── */}
      {showMap && !isEditing && (
        <div className="border-t border-gray-200 px-2 py-2" style={{ height: 340 }}>
          <DayItineraryMap rows={rows} dayNumber={dayNumber} />
        </div>
      )}

      {/* ── 데이터 행들 ── */}
      <div className="flex flex-col gap-2 px-2 pb-2">
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

            {/* 행 추가 버튼 */}
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
          <div className="px-5 py-8 text-center font-pretendard text-body3 text-gray-500 rounded-lg border border-gray-300 bg-gray-100">
            등록된 일정이 없습니다.
          </div>
        ) : (
          rows.map((row) => (
            <ViewDataRow
              key={row.id}
              row={row}
              onDelete={
                onDeleteItem
                  ? () => {
                      const id = parseInt(row.id, 10);
                      if (!isNaN(id) && confirm(`"${row.title}" 일정을 삭제할까요?`)) {
                        onDeleteItem(id);
                      }
                    }
                  : undefined
              }
            />
          ))
        )}
      </div>
    </article>
  );
}
