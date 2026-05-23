import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import PinIcon from "@/assets/pin.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import MapIcon from "@/assets/map.svg?react";
import DayItineraryMap from "@/components/workspace/DayItineraryMap";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import { getCategoryStyle } from "@/utils/itineraryCategory";
import {
  searchPlaces,
  fetchPlacePhotoUri,
  type PlaceResult,
  type ScheduleCategory,
} from "@/api/scheduleApi";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 한 일정 행
 *
 *  화면 표시 5필드: visitTime(시각) · title(제목) · _category(분류)
 *                  · cost(비용) · remark(메모)
 *
 *  `_`로 시작하는 필드는 API 연동/지도 표시를 위한 내부 메타데이터로,
 *  표에는 직접 노출되지 않음(분류 컬럼에 쓰이는 _category는 예외).
 */
export interface ItineraryRow {
  /** 고유 id (drag&drop, edit, 삭제 식별에 사용). API item id의 문자열 형태. */
  id: string;
  /** 제목 — 장소명 "공항 도착", "감자 레스토랑" */
  title: string;
  /** 방문 시각 "14:30" — 없으면 "-" 표시 */
  visitTime?: string;
  /** 예상 비용 "13,000원" — 없으면 "-" 표시 */
  cost?: string;
  /** 메모(비고) — 없으면 "-" 표시. 보기 모드에서 2줄까지, 편집 시 50자 제한. */
  remark?: string;

  /* ── 내부 메타데이터 (API/지도 연동용) ── */
  /** 분류 — 표의 "분류" 컬럼에 배지로 표시됨 */
  _category?: string;
  _address?: string | null;
  _latitude?: number | null;
  _longitude?: number | null;
  _placeId?: string | null;
  _photoReference?: string | null;
  /** 비용 원본 숫자 (cost 문자열과 별개로 보존) */
  _estimatedCost?: number | null;
}

interface ItineraryDayCardProps {
  dayNumber: number;
  rows: ItineraryRow[];
  /**
   * 편집 저장 콜백.
   * 편집 모드에서 "저장"을 누르면 호출됨.
   * 부모 컴포넌트는 이 rows로 자신의 state를 갱신해야 함.
   *
   * readOnly가 true이면 편집 모드 자체로 진입할 수 없으므로 무시됨.
   */
  onSave?: (rows: ItineraryRow[]) => void;
  /**
   * 일정 항목 삭제 콜백.
   * 보기 모드 행 hover 시 노출되는 ×버튼 클릭 시 호출됨.
   * 미지정 시 행별 삭제 버튼이 렌더되지 않음.
   */
  onDeleteItem?: (itemId: number) => void;
  /**
   * 카테고리 변경 콜백.
   * 보기 모드에서 분류 배지를 클릭해 변경할 때 호출됨.
   * 미지정 시 분류 배지는 클릭 불가능한 단순 표시용으로 렌더됨.
   */
  onCategoryChange?: (itemId: number, category: ScheduleCategory) => void;
  /**
   * 읽기 전용 모드.
   * true이면:
   *  - 헤더의 편집 버튼(Edit2Icon)이 사라져 편집 모드 진입 자체가 불가능.
   *  - 지도 버튼은 그대로 표시됨 (지도 보기는 read-only 동작이므로).
   *  - 행 hover 시 노출되는 ×버튼/카테고리 변경은 부모가
   *    onDeleteItem/onCategoryChange를 넘기지 않음으로써 자연스럽게 막힘.
   *  - SNS 미리보기 페이지(/workspace/:id/preview)처럼 다른 사람의
   *    워크스페이스를 구경하는 용도의 페이지에서 사용.
   *
   * 기본값 false.
   */
  readOnly?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   공통 상수
   ══════════════════════════════════════════ */

/** 메모 입력 최대 글자 수 (편집 모드) */
const REMARK_MAX_LENGTH = 50;

/** 카테고리 목록 (편집 모드 분류 선택 드롭다운용) */
const CATEGORY_KEYS: ScheduleCategory[] = [
  "TRANSPORT",
  "ACCOMMODATION",
  "RESTAURANT",
  "CAFE",
  "ATTRACTION",
];

/** 보기 모드 표 컬럼 비율
 *  시각 | 제목 | 분류 | 비용 | 메모 */
const VIEW_GRID_COLS =
  "80px minmax(140px, 2fr) 92px minmax(90px, 1fr) minmax(160px, 2.2fr)";

/** 편집 모드 표 컬럼 비율
 *  드래그(28px) | 분류 | 제목 | 시각 | 비용 | 메모 | 삭제(28px) */
const EDIT_GRID_COLS =
  "28px 96px minmax(140px, 2fr) 88px minmax(90px, 1fr) minmax(150px, 2fr) 28px";

/** 새 행 생성 */
function createEmptyRow(): ItineraryRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
  };
}

/* ══════════════════════════════════════════
   장소 사진 (auth 포함 blob URL 로딩)
   ══════════════════════════════════════════ */

function PlacePhotoImg({
  photoName,
  size = 56,
}: {
  photoName: string;
  size?: number;
}) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    fetchPlacePhotoUri(photoName, 800)
      .then(setUri)
      .catch(() => {});
  }, [photoName]);

  if (!uri) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-gray-200 animate-pulse shrink-0"
      />
    );
  }
  return (
    <img
      src={uri}
      alt=""
      style={{ width: size, height: size }}
      className="rounded-xl object-cover shrink-0"
    />
  );
}

/* ══════════════════════════════════════════
   분류 배지
   ══════════════════════════════════════════ */

/** 보기 모드 분류 배지.
 *  onSelect가 있으면 클릭해서 카테고리를 바꿀 수 있는 드롭다운으로 동작. */
function CategoryBadge({
  category,
  onSelect,
}: {
  category?: string;
  onSelect?: (cat: ScheduleCategory) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const style = getCategoryStyle(category);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badge = (
    <span
      className={[
        "inline-flex items-center justify-center px-2.5 py-1 rounded-md",
        "font-pretendard text-body5 font-medium",
        style.badgeBg,
        style.badgeText,
      ].join(" ")}
    >
      {style.label}
    </span>
  );

  /* 변경 불가 — 단순 표시 */
  if (!onSelect) return badge;

  /* 변경 가능 — 클릭 드롭다운 */
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="분류 변경"
        className="bg-transparent border-none p-0 cursor-pointer"
      >
        {badge}
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[100px]">
          {CATEGORY_KEYS.map((key) => {
            const s = getCategoryStyle(key);
            const isSelected = (category ?? "ATTRACTION") === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSelect(key);
                  setOpen(false);
                }}
                className={[
                  "flex items-center gap-2 w-full px-3 py-1.5",
                  "bg-transparent border-none cursor-pointer text-left",
                  "hover:bg-gray-50 transition-colors",
                  isSelected ? "bg-gray-50" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block w-2 h-2 rounded-full",
                    s.badgeBg,
                  ].join(" ")}
                />
                <span className="font-pretendard text-[12px] text-gray-700">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   보기 모드 서브 컴포넌트 — 5컬럼 표
   ══════════════════════════════════════════ */

/** 보기 모드 컬럼 헤더 */
function ViewHeaderRow() {
  return (
    <div
      className="grid items-center px-5 py-3 font-pretendard text-body4 text-gray-600"
      style={{ gridTemplateColumns: VIEW_GRID_COLS }}
    >
      <span className="text-center">시각</span>
      <span>제목</span>
      <span className="text-center">분류</span>
      <span className="text-center">비용</span>
      <span>메모</span>
    </div>
  );
}

/** 보기 모드 데이터 행 */
function ViewDataRow({
  row,
  onDelete,
  onCategoryChange,
}: {
  row: ItineraryRow;
  onDelete?: () => void;
  onCategoryChange?: (cat: ScheduleCategory) => void;
}) {
  return (
    <div
      className={[
        "group grid items-center gap-2",
        "px-5 py-3.5",
        "rounded-lg border border-gray-200 bg-gray-50",
        "font-pretendard text-body3",
      ].join(" ")}
      style={{ gridTemplateColumns: VIEW_GRID_COLS }}
    >
      {/* 시각 */}
      <span className="text-center text-gray-500">{row.visitTime || "-"}</span>

      {/* 제목 */}
      <span className="font-medium text-gray-900 truncate" title={row.title}>
        {row.title}
      </span>

      {/* 분류 */}
      <span className="flex justify-center">
        <CategoryBadge category={row._category} onSelect={onCategoryChange} />
      </span>

      {/* 비용 */}
      <span className="text-center text-gray-700">{row.cost || "-"}</span>

      {/* 메모 + (hover 시) 삭제 버튼 */}
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="flex-1 min-w-0 text-gray-500 line-clamp-2"
          title={row.remark}
        >
          {row.remark || "-"}
        </span>
        {onDelete && (
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   장소명 검색 자동완성 인풋 (편집 모드)
   ══════════════════════════════════════════ */

function PlaceSearchInput({
  value,
  onChange,
  onSelectPlace,
}: {
  value: string;
  onChange: (title: string) => void;
  onSelectPlace: (place: PlaceResult) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleInput = (text: string) => {
    setQuery(text);
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const places = await searchPlaces(text);
        setResults(places);
        setIsOpen(places.length > 0);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.displayName.text);
    setIsOpen(false);
    setResults([]);
    onSelectPlace(place);
  };

  const getDropdownStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return {};
    const rect = wrapperRef.current.getBoundingClientRect();
    const dropdownH = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const minWidth = Math.max(rect.width, 300);

    if (spaceBelow < dropdownH && rect.top > spaceBelow) {
      return {
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: minWidth,
        zIndex: 9999,
      };
    }
    return {
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: minWidth,
      zIndex: 9999,
    };
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="장소명"
          aria-label="제목"
          className={[
            "w-full px-2.5 py-1.5 pr-8",
            "bg-gray-50 border border-gray-200 rounded-lg",
            "font-pretendard text-body3 font-medium text-gray-900",
            "placeholder:text-gray-400",
            "outline-none focus:border-primary focus:bg-white transition-colors",
          ].join(" ")}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen &&
        results.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={getDropdownStyle()}
            className="bg-white border border-gray-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {results.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="flex items-center gap-3 w-full px-3 py-3 bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  {place.photos?.[0] ? (
                    <PlacePhotoImg photoName={place.photos[0].name} size={56} />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-gray-400"
                        fill="currentColor"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-pretendard text-[14px] font-semibold text-gray-900 m-0 truncate">
                      {place.displayName.text}
                    </p>
                    <p className="font-pretendard text-[11px] text-gray-500 m-0 mt-0.5 truncate">
                      {place.formattedAddress}
                    </p>
                    {place.rating != null && (
                      <p className="font-pretendard text-[11px] text-amber-500 m-0 mt-0.5">
                        ★ {place.rating.toFixed(1)}
                        {place.userRatingCount != null && (
                          <span className="text-gray-400 ml-1">
                            ({place.userRatingCount.toLocaleString()})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>,
          document.body,
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
      className="grid items-center gap-2 px-3 py-3 font-pretendard text-body4 text-gray-600"
      style={{ gridTemplateColumns: EDIT_GRID_COLS }}
    >
      <span />
      <span className="text-center">분류</span>
      <span className="text-center">제목</span>
      <span className="text-center">시각</span>
      <span className="text-center">비용</span>
      <span className="text-center">메모</span>
      <span />
    </div>
  );
}

/** 6점 그립 아이콘 */
function DragHandleIcon() {
  return (
    <svg
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="3" cy="2.5" r="1.5" />
      <circle cx="7" cy="2.5" r="1.5" />
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="7" cy="8" r="1.5" />
      <circle cx="3" cy="13.5" r="1.5" />
      <circle cx="7" cy="13.5" r="1.5" />
    </svg>
  );
}

/** 편집 모드 분류 선택 드롭다운 (작은 배지 버튼) */
function EditCategorySelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (cat: ScheduleCategory) => void;
}) {
  return <CategoryBadge category={value} onSelect={onChange} />;
}

function EditDataRow({
  row,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: {
  row: ItineraryRow;
  onChange: (patch: Partial<ItineraryRow>) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}) {
  const handlePlaceSelect = (place: PlaceResult) => {
    onChange({
      title: place.displayName.text,
      _placeId: place.id,
      _latitude: place.location.latitude,
      _longitude: place.location.longitude,
      _address: place.formattedAddress,
      _photoReference: place.photos?.[0]?.name ?? null,
    });
  };

  const cellInput =
    "w-full min-w-0 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg " +
    "font-pretendard text-body3 text-gray-900 placeholder:text-gray-400 " +
    "outline-none focus:border-primary focus:bg-white transition-colors";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        "grid items-center gap-2 px-3 py-2",
        "rounded-xl border bg-white",
        "transition-all duration-150",
        isDragging ? "opacity-40 scale-[0.98] shadow-inner" : "",
        isDragOver
          ? "border-primary border-2 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      ].join(" ")}
      style={{ gridTemplateColumns: EDIT_GRID_COLS }}
    >
      {/* 드래그 핸들 */}
      <div
        className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors flex justify-center"
        aria-label="드래그하여 순서 변경"
      >
        <DragHandleIcon />
      </div>

      {/* 분류 */}
      <div className="flex justify-center">
        <EditCategorySelect
          value={row._category}
          onChange={(cat) => onChange({ _category: cat })}
        />
      </div>

      {/* 제목 — 장소 검색 자동완성 */}
      <PlaceSearchInput
        value={row.title}
        onChange={(title) => onChange({ title })}
        onSelectPlace={handlePlaceSelect}
      />

      {/* 시각 */}
      <input
        type="text"
        value={row.visitTime ?? ""}
        onChange={(e) => onChange({ visitTime: e.target.value })}
        placeholder="14:30"
        aria-label="방문 시각"
        className={cellInput + " text-center"}
      />

      {/* 비용 */}
      <input
        type="text"
        value={row.cost ?? ""}
        onChange={(e) => onChange({ cost: e.target.value })}
        placeholder="13,000원"
        aria-label="예상 비용"
        className={cellInput + " text-center"}
      />

      {/* 메모 — 50자 제한 */}
      <input
        type="text"
        value={row.remark ?? ""}
        onChange={(e) => onChange({ remark: e.target.value })}
        placeholder="메모 (선택)"
        aria-label="메모"
        maxLength={REMARK_MAX_LENGTH}
        className={cellInput}
      />

      {/* 삭제 */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="행 삭제"
        className={[
          "shrink-0 w-6 h-6 rounded-md justify-self-center",
          "inline-flex items-center justify-center",
          "border-none bg-transparent",
          "text-gray-300 hover:text-red-500 hover:bg-red-50",
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
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 워크스페이스 페이지의 여행 일정 N일차 카드
 *
 * 두 가지 모드:
 *
 * 1) 보기 모드 (기본)
 *    - 헤더: 📍 + "N일차" + 편집 버튼(edit2) + 지도 토글 버튼
 *    - 지도 패널 (showMap === true 시 표시)
 *    - 5컬럼 표: 시각 | 제목 | 분류 | 비용 | 메모
 *
 * 2) 편집 모드 (헤더 편집 버튼 클릭 시 진입)
 *    - 헤더: 📍 + "N일차" + 취소 / 저장 버튼
 *    - 드래그&드롭 재정렬 가능한 편집 행 + "+ 일정 추가"
 *    - 편집 행 컬럼: 드래그 | 분류 | 제목(장소검색) | 시각 | 비용 | 메모 | 삭제
 *    - 저장 시 onSave(rows) 호출 → 부모가 state 갱신
 *
 * readOnly 모드: 편집 버튼 숨김, 지도 보기는 그대로 동작.
 */
export default function ItineraryDayCard({
  dayNumber,
  rows,
  onSave,
  onDeleteItem,
  onCategoryChange,
  readOnly = false,
  className = "",
}: ItineraryDayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [draftRows, setDraftRows] = useState<ItineraryRow[]>(rows);

  /* 드래그&드롭 */
  const dragIndexRef = React.useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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
            {/* readOnly이면 편집 버튼 숨김 */}
            {!readOnly && (
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
            )}

            {/* 지도 토글 — readOnly와 무관하게 항상 표시 */}
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
        <div
          className="border-t border-gray-100 px-2 py-2"
          style={{ height: 340 }}
        >
          <DayItineraryMap
            key={rows
              .map(
                (r) =>
                  `${r.id}|${r._placeId ?? ""}|${r._address ?? ""}|${r._latitude ?? ""}|${r._longitude ?? ""}`,
              )
              .join(",")}
            rows={rows}
            dayNumber={dayNumber}
          />
        </div>
      )}

      {/* ── 컬럼 헤더 ── */}
      <div className="border-t border-gray-200 px-2">
        {isEditing ? <EditHeaderRow /> : <ViewHeaderRow />}
      </div>

      {/* ── 데이터 행들 ── */}
      <div className="flex flex-col gap-2 px-2 pb-2">
        {isEditing ? (
          <>
            {draftRows.length === 0 ? (
              <div className="px-5 py-8 text-center font-pretendard text-body3 text-gray-500 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                아래 "+ 일정 추가" 버튼으로 일정을 추가하세요.
              </div>
            ) : (
              draftRows.map((row, idx) => (
                <EditDataRow
                  key={row.id}
                  row={row}
                  onChange={(patch) => updateRow(row.id, patch)}
                  onDelete={() => deleteRow(row.id)}
                  isDragging={draggingIndex === idx}
                  isDragOver={dragOverIndex === idx}
                  onDragStart={() => {
                    dragIndexRef.current = idx;
                    setDraggingIndex(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIndexRef.current !== idx) setDragOverIndex(idx);
                  }}
                  onDrop={() => {
                    const from = dragIndexRef.current;
                    if (from == null || from === idx) return;
                    setDraftRows((prev) => {
                      const next = [...prev];
                      const [item] = next.splice(from, 1);
                      next.splice(idx, 0, item);
                      return next;
                    });
                    dragIndexRef.current = null;
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    dragIndexRef.current = null;
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                />
              ))
            )}

            <button
              type="button"
              onClick={addRow}
              className={[
                "mt-1 px-5 py-3",
                "rounded-xl border-2 border-dashed border-gray-200 bg-gray-50",
                "font-pretendard text-body3 text-gray-400",
                "hover:border-primary hover:text-primary hover:bg-amber-50",
                "transition-colors cursor-pointer",
                "inline-flex items-center justify-center gap-2",
              ].join(" ")}
            >
              <PlusIcon className="w-4 h-4" />
              <span>일정 추가</span>
            </button>
          </>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center font-pretendard text-body3 text-gray-500 rounded-lg border border-dashed border-gray-300">
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
                      if (!isNaN(id)) setDeleteTarget({ id, title: row.title });
                    }
                  : undefined
              }
              onCategoryChange={
                onCategoryChange
                  ? (cat) => {
                      const id = parseInt(row.id, 10);
                      if (!isNaN(id)) onCategoryChange(id, cat);
                    }
                  : undefined
              }
            />
          ))
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
        description={
          deleteTarget
            ? `"${deleteTarget.title}"\n삭제하면 되돌릴 수 없어요.`
            : ""
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </article>
  );
}
