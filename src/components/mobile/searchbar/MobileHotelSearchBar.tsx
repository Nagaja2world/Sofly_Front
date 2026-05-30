import { useState } from "react";
import { type DateRange } from "@/components/searchbar/CalendarDropdown";
import { type HotelDestination } from "@/api/hotelApi";
import { type HotelSearchBarParams } from "@/components/HotelSearchBar";

import BottomSheet from "@/components/mobile/searchbar/BottomSheet";
import HotelDestSheetBody from "@/components/mobile/searchbar/HotelDestSheetBody";
import CalendarSheetBody from "@/components/mobile/searchbar/CalendarSheetBody";

import CalendarIcon from "@/assets/calendar.svg?react";
import UsersIcon from "@/assets/users.svg?react";

/* ══════════════════════════════════════════
   MobileHotelSearchBar
   ══════════════════════════════════════════
   데스크톱 HotelSearchBar의 모바일 버전.
   - onSearch 페이로드(HotelSearchBarParams)는 데스크톱과 동일.
   - 데스크톱과 동일하게 상단에 모드 탭(목적지 / URL)과
     부가 옵션 체크박스(무료 취소, 4성급+)를 제공.
     · URL 모드는 데스크톱과 동일하게 URL 입력만 받음(검색 로직은 범위 외 — 데스크톱도 미구현).
     · 무료취소/4성급+는 데스크톱처럼 상태만 보유(검색 페이로드 미반영).
   - 핵심 입력(목적지·날짜·인원)은 BottomSheet 시트로 제공.
*/

type SheetKind = "dest" | "calendar" | "guests" | null;
type HotelSearchMode = "destination" | "url";

interface HotelGuests {
  adults: number;
  rooms: number;
}

function toApiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromApiDate(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function fmtDate(d: Date | null) {
  if (!d) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}. ${m}. ${day}.`;
}

interface MobileHotelSearchBarProps {
  onSearch?: (params: HotelSearchBarParams) => void;
  initialValues?: HotelSearchBarParams;
  className?: string;
}

/* ── 옵션 체크박스(무료취소/4성급+) — 파일 레벨 컴포넌트 ── */
function OptionCheck({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const id = `option-${label.replace(/\s+/g, "")}`;
  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className="inline-flex items-center gap-1.5 cursor-pointer"
      >
        <span
          aria-hidden="true"
          className={[
            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
            checked ? "bg-primary border-primary" : "border-gray-400",
          ].join(" ")}
        >
          {checked && (
            <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
              <path
                d="M1 5L4.5 8.5L11 1.5"
                stroke="#2b2b2b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="font-pretendard text-body3 text-gray-700 whitespace-nowrap">
          {label}
        </span>
      </label>
    </div>
  );
}

export default function MobileHotelSearchBar({
  onSearch,
  initialValues,
  className = "",
}: MobileHotelSearchBarProps) {
  const [mode, setMode] = useState<HotelSearchMode>("destination");
  const [urlInput, setUrlInput] = useState("");
  const [freeCancel, setFreeCancel] = useState(false);
  const [fourStarPlus, setFourStarPlus] = useState(false);

  const [dest, setDest] = useState<HotelDestination | null>(
    initialValues
      ? ({
          destId: initialValues.destId,
          destType: initialValues.searchType,
          name: initialValues.destName,
          label: initialValues.destName,
        } as HotelDestination)
      : null,
  );
  const [dateRange, setDateRange] = useState<DateRange>({
    start: fromApiDate(initialValues?.arrivalDate),
    end: fromApiDate(initialValues?.departureDate),
  });
  const [guests, setGuests] = useState<HotelGuests>({
    adults: initialValues?.adults ?? 2,
    rooms: initialValues?.roomQty ?? 1,
  });
  const [guestsTemp, setGuestsTemp] = useState<HotelGuests>(guests);

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [error, setError] = useState<string | null>(null);

  const openSheet = (kind: SheetKind) => {
    if (kind === "guests") setGuestsTemp(guests);
    setError(null);
    setSheet(kind);
  };
  const closeSheet = () => setSheet(null);

  const handleSearch = () => {
    setError(null);
    /* URL 모드는 데스크톱과 동일하게 검색 동작 없음 (범위 외) */
    if (mode === "url") return;
    if (!dest) return setError("목적지를 선택해주세요");
    if (!dateRange.start) return setError("체크인 날짜를 선택해주세요");
    if (!dateRange.end) return setError("체크아웃 날짜를 선택해주세요");

    onSearch?.({
      destId: dest.destId,
      searchType: dest.destType,
      destName: dest.name,
      arrivalDate: toApiDate(dateRange.start),
      departureDate: toApiDate(dateRange.end),
      adults: guests.adults,
      roomQty: guests.rooms,
    });
  };

  const dateLabel = (() => {
    if (!dateRange.start) return "";
    if (!dateRange.end) return `${fmtDate(dateRange.start)} ~`;
    return `${fmtDate(dateRange.start)} ~ ${fmtDate(dateRange.end)}`;
  })();

  const modeItems: { key: HotelSearchMode; label: string }[] = [
    { key: "destination", label: "목적지" },
    { key: "url", label: "🔗 URL" },
  ];

  return (
    <section
      className={[
        "bg-white px-4 pt-4 pb-5 rounded-2xl",
        "shadow-[0_0.5rem_1.875rem_0_rgba(0,0,0,0.1)]",
        className,
      ].join(" ")}
    >
      {/* 상단: 모드 탭(목적지/URL) + 옵션(무료취소/4성급+) */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-x-3">
          {modeItems.map(({ key, label }) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={[
                  "font-pretendard text-body3 bg-transparent border-0 cursor-pointer",
                  "transition-all duration-200 pb-0.5",
                  isActive
                    ? "text-gray-800 border-b-2 border-gray-900"
                    : "text-gray-500 border-b-2 border-transparent",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
        <OptionCheck
          label="무료 취소"
          checked={freeCancel}
          onToggle={() => setFreeCancel((v) => !v)}
        />
        <OptionCheck
          label="4성급+"
          checked={fourStarPlus}
          onToggle={() => setFourStarPlus((v) => !v)}
        />
      </div>

      {/* 목적지 / URL 입력 */}
      {mode === "destination" ? (
        <button
          type="button"
          onClick={() => openSheet("dest")}
          className={[
            "flex items-center gap-2 w-full bg-gray-100 rounded-lg px-4 py-3.5 mb-2",
            "border-none cursor-pointer text-left",
          ].join(" ")}
        >
          <span
            className={[
              "flex-1 min-w-0 font-pretendard text-body2 truncate",
              dest ? "text-gray-900" : "text-gray-500",
            ].join(" ")}
          >
            {dest ? (dest.label ?? dest.name) : "목적지 또는 호텔 이름"}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 w-full bg-gray-100 rounded-lg px-4 py-3.5 mb-2">
          <span className="shrink-0 text-gray-500">🔗</span>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="호텔 예약 페이지 URL"
            className="flex-1 min-w-0 bg-transparent outline-none border-none font-pretendard text-body2 text-gray-900 placeholder:text-gray-500"
          />
        </div>
      )}

      {/* 날짜 (URL 모드에서는 숨김 — 데스크톱 동작에 맞춤) */}
      {mode === "destination" && (
        <>
          <button
            type="button"
            onClick={() => openSheet("calendar")}
            className={[
              "flex items-center gap-2 w-full bg-gray-100 rounded-lg px-4 py-3.5 mb-2",
              "border-none cursor-pointer text-left",
            ].join(" ")}
          >
            <CalendarIcon />
            <span
              className={[
                "flex-1 min-w-0 font-pretendard text-body2 truncate",
                dateLabel ? "text-gray-900" : "text-gray-500",
              ].join(" ")}
            >
              {dateLabel || "체크인 ~ 체크아웃"}
            </span>
          </button>

          {/* 투숙객/객실 */}
          <button
            type="button"
            onClick={() => openSheet("guests")}
            className={[
              "flex items-center gap-2 w-full bg-gray-100 rounded-lg px-4 py-3.5 mb-4",
              "border-none cursor-pointer text-left",
            ].join(" ")}
          >
            <UsersIcon />
            <span className="flex-1 min-w-0 font-pretendard text-body2 text-gray-900 truncate">
              성인 {guests.adults}명, 객실 {guests.rooms}개
            </span>
          </button>
        </>
      )}

      <button
        type="button"
        onClick={handleSearch}
        className={[
          "w-full py-4 rounded-lg",
          "font-pretendard text-body2 font-semibold text-gray-900",
          "bg-primary border-none cursor-pointer",
          "transition-all duration-200 active:scale-[0.99]",
        ].join(" ")}
      >
        검색하기
      </button>

      {error && (
        <p className="mt-3 font-pretendard text-body4 text-red-500 m-0">
          {error}
        </p>
      )}

      {/* ── 시트들 ── */}
      <BottomSheet
        isOpen={sheet === "dest"}
        onClose={closeSheet}
        title="목적지 선택"
      >
        <HotelDestSheetBody
          initialQuery={dest?.name ?? ""}
          onSelect={(d) => {
            setDest(d);
            closeSheet();
          }}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === "calendar"}
        onClose={closeSheet}
        title="체크인 · 체크아웃"
      >
        <CalendarSheetBody
          dateRange={dateRange}
          onChange={setDateRange}
          mode="range"
          startLabel="체크인"
          endLabel="체크아웃"
          onComplete={closeSheet}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === "guests"}
        onClose={closeSheet}
        title="투숙객 및 객실"
      >
        <GuestsSheetBody
          value={guestsTemp}
          onChange={setGuestsTemp}
          onApply={() => {
            setGuests(guestsTemp);
            closeSheet();
          }}
        />
      </BottomSheet>
    </section>
  );
}

/* ── 투숙객/객실 카운터 (파일 레벨 — render 중 생성 방지) ── */
function GuestCounter({
  label,
  sub,
  count,
  onDec,
  onInc,
  min,
}: {
  label: string;
  sub: string;
  count: number;
  onDec: () => void;
  onInc: () => void;
  min: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-pretendard text-body2 text-gray-900 m-0">{label}</p>
        <p className="font-pretendard text-body5 text-gray-500 m-0 mt-0.5">
          {sub}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={count <= min}
          onClick={onDec}
          aria-label={`${label} 줄이기`}
          className={[
            "w-10 h-10 rounded-full border border-gray-300 bg-white",
            "flex items-center justify-center font-pretendard text-body1",
            count <= min
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 cursor-pointer active:bg-gray-50",
          ].join(" ")}
        >
          −
        </button>
        <span className="font-pretendard text-body1 font-semibold text-gray-900 w-6 text-center">
          {count}
        </span>
        <button
          type="button"
          onClick={onInc}
          aria-label={`${label} 늘리기`}
          className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center font-pretendard text-body1 text-gray-700 cursor-pointer active:bg-gray-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── 투숙객/객실 시트 본문 (호텔 전용) ── */
function GuestsSheetBody({
  value,
  onChange,
  onApply,
}: {
  value: HotelGuests;
  onChange: (v: HotelGuests) => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="px-5 pt-4 pb-2">
        <GuestCounter
          label="성인"
          sub="만 18세 이상"
          count={value.adults}
          min={1}
          onDec={() =>
            onChange({ ...value, adults: Math.max(1, value.adults - 1) })
          }
          onInc={() => onChange({ ...value, adults: value.adults + 1 })}
        />
        <GuestCounter
          label="객실"
          sub="필요한 객실 수"
          count={value.rooms}
          min={1}
          onDec={() =>
            onChange({ ...value, rooms: Math.max(1, value.rooms - 1) })
          }
          onInc={() => onChange({ ...value, rooms: value.rooms + 1 })}
        />
      </div>
      <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onApply}
          className="w-full py-3.5 rounded-lg font-pretendard text-body2 font-semibold bg-gray-900 text-white border-none cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          적용
        </button>
      </div>
    </div>
  );
}
