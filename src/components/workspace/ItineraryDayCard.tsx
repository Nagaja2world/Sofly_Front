import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import PinIcon from "@/assets/pin.svg?react";
import Edit2Icon from "@/assets/edit2.svg?react";
import PlusIcon from "@/assets/plus.svg?react";
import MapIcon from "@/assets/map.svg?react";
import DayItineraryMap from "@/components/workspace/DayItineraryMap";
import ConfirmPopup from "@/components/common/ConfirmPopup";
import {
  searchPlaces,
  fetchPlacePhotoUri,
  type PlaceResult,
  type ScheduleCategory,
} from "@/api/scheduleApi";

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
   * 보기 모드에서 카테고리 아이콘을 클릭해 변경할 때 호출됨.
   * 미지정 시 카테고리 아이콘은 클릭 불가능한 단순 표시용으로 렌더됨.
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
  return (
    CATEGORY_CONFIG[(category as CategoryKey) ?? "ATTRACTION"] ??
    CATEGORY_CONFIG.ATTRACTION
  );
}

/* ══════════════════════════════════════════
   카테고리 아이콘 (인라인 SVG)
   ══════════════════════════════════════════ */

function CategoryIcon({
  category,
  className,
}: {
  category?: string;
  className?: string;
}) {
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
   카테고리 선택 드롭다운
   ══════════════════════════════════════════ */

function CategoryPicker({
  value,
  onChange,
  size = "sm",
}: {
  value?: string;
  onChange: (cat: ScheduleCategory) => void;
  /** 'sm': 편집 모드 (36px), 'lg': 보기 모드 (44px) */
  size?: "sm" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = getCategoryConfig(value);
  const btnSize = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const iconSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="카테고리 변경"
        className={[
          btnSize,
          "rounded-full flex items-center justify-center",
          config.bgColor,
          "cursor-pointer transition-opacity hover:opacity-80",
          "border-2",
          open ? "border-primary" : "border-transparent",
        ].join(" ")}
      >
        <CategoryIcon
          category={value}
          className={`${iconSize} ${config.iconColor}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[120px]">
          {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key) => {
            const c = CATEGORY_CONFIG[key];
            const isSelected = (value ?? "ATTRACTION") === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={[
                  "flex items-center gap-2 w-full px-3 py-2",
                  "bg-transparent border-none cursor-pointer text-left",
                  "hover:bg-gray-50 transition-colors",
                  isSelected ? "bg-gray-50" : "",
                ].join(" ")}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${c.bgColor} shrink-0`}
                >
                  <CategoryIcon
                    category={key}
                    className={`w-3 h-3 ${c.iconColor}`}
                  />
                </div>
                <span className="font-pretendard text-[12px] text-gray-700">
                  {c.label}
                </span>
                {isSelected && (
                  <svg
                    className="ml-auto w-3 h-3 text-primary shrink-0"
                    viewBox="0 0 12 10"
                    fill="none"
                  >
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   장소명 검색 자동완성 인풋
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
  // portal 드롭다운 DOM ref — 포털은 wrapperRef 바깥 DOM에 있어서 별도로 추적 필요
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // wrapper 또는 portal 드롭다운 내부 클릭이면 닫지 않음
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

  /* Portal 드롭다운의 fixed 위치 계산 */
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
  onRowClick,
  onCategoryChange,
}: {
  row: ItineraryRow;
  index: number;
  total: number;
  onDelete?: () => void;
  onRowClick?: (index: number) => void;
  onCategoryChange?: (category: ScheduleCategory) => void;
}) {
  const config = getCategoryConfig(row._category);
  const itemId = parseInt(row.id, 10);
  const isDeletable = !isNaN(itemId) && !!onDelete;
  const hasCost = row._estimatedCost != null && row._estimatedCost > 0;

  return (
    <div className="flex gap-3">
      {/* 왼쪽: 번호 배지 + 시각 + 연결선 */}
      <div
        className="flex flex-col items-center"
        style={{ width: 48, minWidth: 48 }}
      >
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
          <div
            className="w-px bg-gray-200 flex-1 mt-2"
            style={{ minHeight: 16 }}
          />
        )}
      </div>

      {/* 오른쪽: 카드 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onRowClick?.(index)}
        onKeyDown={(e) => e.key === "Enter" && onRowClick?.(index)}
        className={[
          "flex-1 min-w-0",
          "rounded-xl border border-gray-100 bg-white",
          "flex items-start gap-3 p-4",
          index < total - 1 ? "mb-3" : "",
          "group hover:border-gray-200 hover:shadow-sm transition-all",
          onRowClick ? "cursor-pointer" : "",
        ].join(" ")}
      >
        {/* 카테고리 아이콘 — onCategoryChange 있으면 클릭 가능한 CategoryPicker */}
        {onCategoryChange ? (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <CategoryPicker
              value={row._category}
              onChange={onCategoryChange}
              size="lg"
            />
          </div>
        ) : (
          <div
            className={[
              "w-11 h-11 rounded-full shrink-0",
              "flex items-center justify-center",
              config.bgColor,
            ].join(" ")}
          >
            <CategoryIcon
              category={row._category}
              className={`w-5 h-5 ${config.iconColor}`}
            />
          </div>
        )}

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
        <span className="font-pretendard text-[11px] text-gray-400 mb-0.5">
          총 일정
        </span>
        <span className="font-pretendard text-body3 font-semibold text-gray-800">
          {rows.length}개
        </span>
      </div>
      <div className="flex flex-col items-center py-3 px-4">
        <span className="font-pretendard text-[11px] text-gray-400 mb-0.5">
          총 예상 비용
        </span>
        <span className="font-pretendard text-body3 font-semibold text-orange-500">
          {totalCost > 0 ? `${totalCost.toLocaleString("ko-KR")}원` : "0원"}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   편집 모드 서브 컴포넌트 (드래그&드롭 재정렬)
   ══════════════════════════════════════════ */

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

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        "flex items-center gap-3 px-3 py-3",
        "rounded-xl border bg-white",
        "transition-all duration-150",
        isDragging ? "opacity-40 scale-[0.98] shadow-inner" : "",
        isDragOver
          ? "border-primary border-2 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      ].join(" ")}
    >
      {/* 드래그 핸들 */}
      <div
        className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors px-0.5"
        aria-label="드래그하여 순서 변경"
      >
        <DragHandleIcon />
      </div>

      {/* 카테고리 선택 */}
      <CategoryPicker
        value={row._category}
        onChange={(cat) => onChange({ _category: cat })}
      />

      {/* 입력 필드 그룹 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* 장소명 검색 자동완성 */}
        <PlaceSearchInput
          value={row.title}
          onChange={(title) => onChange({ title })}
          onSelectPlace={handlePlaceSelect}
        />
        {/* 시각 / 비용 / 비고 */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={row.visitTime ?? ""}
            onChange={(e) => onChange({ visitTime: e.target.value })}
            placeholder="09:30"
            aria-label="방문 시각"
            className={[
              "w-20 shrink-0 px-2 py-1",
              "bg-gray-50 border border-gray-200 rounded-lg text-center",
              "font-pretendard text-[12px] text-gray-700",
              "placeholder:text-gray-400",
              "outline-none focus:border-primary focus:bg-white transition-colors",
            ].join(" ")}
          />
          <input
            type="text"
            value={row.cost ?? ""}
            onChange={(e) => onChange({ cost: e.target.value })}
            placeholder="0원"
            aria-label="예상 비용"
            className={[
              "w-24 shrink-0 px-2 py-1",
              "bg-gray-50 border border-gray-200 rounded-lg text-center",
              "font-pretendard text-[12px] text-gray-700",
              "placeholder:text-gray-400",
              "outline-none focus:border-primary focus:bg-white transition-colors",
            ].join(" ")}
          />
          <input
            type="text"
            value={row.remark ?? ""}
            onChange={(e) => onChange({ remark: e.target.value })}
            placeholder="메모 (선택)"
            aria-label="비고"
            className={[
              "flex-1 min-w-0 px-2 py-1",
              "bg-gray-50 border border-gray-200 rounded-lg",
              "font-pretendard text-[12px] text-gray-700",
              "placeholder:text-gray-400",
              "outline-none focus:border-primary focus:bg-white transition-colors",
            ].join(" ")}
          />
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="행 삭제"
        className={[
          "shrink-0 w-6 h-6 rounded-md",
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
 * 두 가지 모드를 가짐:
 *
 * 1) 보기 모드 (기본)
 *    - 헤더: 📍 + "N일차" + 편집 버튼(edit2) + 지도 토글 버튼
 *    - 본문 상단: 지도 패널 (showMap === true 시 표시)
 *    - 본문 하단: 타임라인 카드 목록
 *    - 행 클릭 시 해당 장소 핀이 지도에서 강조됨
 *
 * 2) 편집 모드 (헤더 편집 버튼 클릭 시 진입)
 *    - 헤더: 📍 + "N일차" + 취소 / 저장 버튼
 *    - 본문: 드래그&드롭 재정렬 가능한 편집 행 목록 + "+ 일정 추가"
 *    - 저장 시 onSave(rows) 호출 → 부모가 state 갱신 (API 연결 시 PATCH)
 *    - 취소 시 진입 시점의 rows로 되돌림
 *
 * readOnly 모드 (SNS 미리보기 페이지 등):
 *  - readOnly={true}로 넘기면 편집 버튼이 사라져 편집 모드 진입 자체가 불가능.
 *  - 지도 보기는 read-only 동작이므로 readOnly와 무관하게 그대로 동작함.
 *  - 행별 삭제/카테고리 변경도 부모가 onDeleteItem/onCategoryChange를
 *    넘기지 않음으로써 자연스럽게 막힘.
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
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

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

        {/* 보기 모드: edit2 버튼(readOnly 아닐 때만) + 지도 토글 버튼
            편집 모드: 취소·저장 버튼 */}
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
            {/* readOnly === true 이면 편집 버튼 숨김 (편집 모드 진입 자체 불가) */}
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

            {/* 지도 토글 버튼 — 지도 보기는 read-only 동작이므로
                readOnly와 무관하게 항상 표시.
                SNS 미리보기 페이지에서도 동선 확인은 의미가 있음. */}
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
            selectedIndex={selectedRowIndex}
          />
        </div>
      )}

      {/* ── 데이터 행들 ── */}
      <div
        className={
          isEditing ? "flex flex-col gap-2 px-3 pt-3 pb-3" : "px-4 pt-4 pb-3"
        }
      >
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
          <>
            {rows.map((row, idx) => (
              <ViewTimelineRow
                key={row.id}
                row={row}
                index={idx}
                total={rows.length}
                onRowClick={(i) => {
                  if (showMap) {
                    setSelectedRowIndex(i);
                  } else {
                    setShowMap(true);
                    setSelectedRowIndex(i);
                  }
                }}
                onDelete={
                  onDeleteItem
                    ? () => {
                        const id = parseInt(row.id, 10);
                        if (!isNaN(id))
                          setDeleteTarget({ id, title: row.title });
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
