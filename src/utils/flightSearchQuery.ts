import type { Airport } from "@/components/searchbar/AirportSearchDropdown";
import type { DateRange } from "@/components/searchbar/CalendarDropdown";
//import type { PassengerSeatData } from "@/components/searchbar/PassengerSeatDropdown";
import type {
  PassengerSeatData,
  SeatClass,
} from "@/components/searchbar/PassengerSeatDropdown";

/** Date → "yyyy-MM-dd" 포맷 (로컬 타임존 기준) */
export function formatDate(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "yyyy-MM-dd" → Date (로컬 타임존 기준, 자정 00:00) */
export function parseDate(str: string | null): Date | null {
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  return d;
}

/** SeatClass 유효값 목록 (런타임 검증용) */
const SEAT_CLASS_VALUES: readonly SeatClass[] = [
  "일반석",
  "프리미엄 일반석",
  "비즈니스석",
  "일등석",
] as const;

/** string | null → SeatClass 타입 가드 (URL 쿼리스트링 검증) */
function parseSeatClass(value: string | null): SeatClass {
  if (value && (SEAT_CLASS_VALUES as readonly string[]).includes(value)) {
    return value as SeatClass;
  }
  return "일반석";
}

/** SearchBar의 onSearch 파라미터 타입 */
export interface FlightSearchParams {
  tripType: string;
  directOnly: boolean;
  departure: Airport | null;
  arrival: Airport | null;
  dateRange: DateRange;
  passenger: PassengerSeatData;
}

/** SearchBar 파라미터 → URLSearchParams 로 직렬화 */
export function buildFlightSearchParams(
  params: FlightSearchParams,
  base?: URLSearchParams,
): URLSearchParams {
  const sp = new URLSearchParams(base);
  sp.set("tripType", params.tripType);
  sp.set("directOnly", String(params.directOnly));

  if (params.departure) {
    sp.set("fromId", params.departure.id);
    sp.set("fromCode", params.departure.code);
    sp.set("fromCity", params.departure.cityName);
  }
  if (params.arrival) {
    sp.set("toId", params.arrival.id);
    sp.set("toCode", params.arrival.code);
    sp.set("toCity", params.arrival.cityName);
  }

  const departStr = formatDate(params.dateRange.start);
  const returnStr = formatDate(params.dateRange.end);
  if (departStr) sp.set("departDate", departStr);
  else sp.delete("departDate");
  if (returnStr) sp.set("returnDate", returnStr);
  else sp.delete("returnDate");

  sp.set("adults", String(params.passenger.adults));
  sp.set("children", String(params.passenger.children));
  sp.set("seatClass", params.passenger.seatClass);

  return sp;
}

/** buildFlightSearchParams의 문자열 버전 (navigate(`?${qs}`) 용) */
export function buildFlightSearchQuery(params: FlightSearchParams): string {
  return buildFlightSearchParams(params).toString();
}

/* ══════════════════════════════════════════
   역방향: URLSearchParams → SearchBar 초기값
   FlightSearchPage 등에서 SearchBar의 initialValues로 주입할 때 사용
   ══════════════════════════════════════════ */

/**
 * URL 쿼리스트링을 SearchBar의 initialValues 형태로 복원
 *
 * AirportSearchDropdown의 Airport 타입은 id/code/name/cityName/countryName을 가지지만,
 * URL에는 id/code/cityName만 저장되므로 name/countryName은 빈 문자열로 둠
 * (UI 표시는 cityName + code만 사용하므로 문제 없음)
 */
export function parseFlightSearchParams(searchParams: URLSearchParams): {
  tripType?: string;
  directOnly?: boolean;
  departure: Airport | null;
  arrival: Airport | null;
  dateRange: DateRange;
  passenger: PassengerSeatData;
} {
  /* ── 출발지 ── */
  const fromId = searchParams.get("fromId");
  const fromCode = searchParams.get("fromCode");
  const fromCity = searchParams.get("fromCity");
  const departure: Airport | null =
    fromId && fromCode && fromCity
      ? {
          id: fromId,
          code: fromCode,
          name: "",
          cityName: fromCity,
          countryName: "",
        }
      : null;

  /* ── 도착지 ── */
  const toId = searchParams.get("toId");
  const toCode = searchParams.get("toCode");
  const toCity = searchParams.get("toCity");
  const arrival: Airport | null =
    toId && toCode && toCity
      ? {
          id: toId,
          code: toCode,
          name: "",
          cityName: toCity,
          countryName: "",
        }
      : null;

  /* ── 날짜 ── */
  const dateRange: DateRange = {
    start: parseDate(searchParams.get("departDate")),
    end: parseDate(searchParams.get("returnDate")),
  };

  /* ── 승객 ── */
  const adults = Number(searchParams.get("adults"));
  const children = Number(searchParams.get("children"));
  const passenger: PassengerSeatData = {
    adults: Number.isFinite(adults) && adults > 0 ? adults : 1,
    children: Number.isFinite(children) && children >= 0 ? children : 0,
    seatClass: parseSeatClass(searchParams.get("seatClass")),
  };

  /* ── 기타 ── */
  const tripType = searchParams.get("tripType") ?? undefined;
  const directOnlyRaw = searchParams.get("directOnly");
  const directOnly =
    directOnlyRaw === null ? undefined : directOnlyRaw === "true";

  return {
    tripType,
    directOnly,
    departure,
    arrival,
    dateRange,
    passenger,
  };
}
