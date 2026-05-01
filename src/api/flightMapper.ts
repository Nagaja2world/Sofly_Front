import type {
  FlightOffer,
  FlightSegment,
  FlightLeg,
  FlightOffersResult,
  MoneyAmount,
} from "../types/flightOffersType";
import type { FlightItem, FlightLegData, TimeSlot } from "@/types/flightType";
import type {
  ItineraryLegDetail,
  LayoverInfo,
} from "@/components/flightDetail/Itinerarysummarycard";

/* ══════════════════════════════════════════
   포맷 헬퍼
   ══════════════════════════════════════════ */

/** "2026-04-27T22:35:00" → "22:35" */
export function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "--:--";
}

/** 초 → "2시간 20분" / "45분" */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "-";
  const minutes = Math.floor(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** MoneyAmount → 원 단위 숫자 (₩482,032.22 → 482032) */
export function toKrwInt(money: MoneyAmount | undefined): number {
  if (!money) return 0;
  return money.units + Math.round(money.nanos / 1_000_000_000);
}

/** ISO 날짜 시간에서 "HH:mm"의 hour만 추출 → 시간대(TimeSlot) 판정 */
export function getTimeSlot(iso: string): TimeSlot | null {
  const m = iso.match(/T(\d{2}):/);
  if (!m) return null;
  const hour = Number(m[1]);
  if (hour < 6) return "00-06";
  if (hour < 12) return "06-12";
  if (hour < 18) return "12-18";
  return "18-24";
}

/* ══════════════════════════════════════════
   segment → FlightLegData 변환
   ══════════════════════════════════════════ */

function segmentToLegData(segment: FlightSegment): FlightLegData {
  const stops = Math.max(0, segment.legs.length - 1);

  /** 경유 공항 코드: 첫 leg의 도착 ~ 마지막 leg의 출발 사이의 공항 */
  const stopCodes: string[] = [];
  if (segment.legs.length > 1) {
    for (let i = 0; i < segment.legs.length - 1; i++) {
      /* leg[i]의 도착 공항은 segment에 직접 없지만, 다음 leg의 출발 시간/공항과 연결됨.
         응답 구조에 leg별 공항 정보가 없으므로, 경유 공항은 일단 빈 배열로 두고
         추후 API 응답에 경유 공항 정보가 추가되면 여기서 채움. */
    }
  }

  return {
    departTime: formatTime(segment.departureTime),
    arriveTime: formatTime(segment.arrivalTime),
    departCode: segment.departureAirport.code,
    arriveCode: segment.arrivalAirport.code,
    duration: formatDuration(segment.totalTime),
    stops,
    stopCodes: stopCodes.length > 0 ? stopCodes : undefined,
  };
}

/* ══════════════════════════════════════════
   FlightOffer → FlightItem 변환
   ══════════════════════════════════════════ */

/**
 * 항공사 정보 추출
 * - 모든 leg의 carriersData를 모아서 중복 제거
 * - 대표 항공사 1개 + 복수면 label에 개수 표시
 */
function extractAirlineInfo(offer: FlightOffer): {
  airline: string;
  airlineLogo?: string;
  airlineLabel?: string;
} {
  const carrierMap = new Map<string, { name: string; logo: string }>();
  offer.segments.forEach((seg) =>
    seg.legs.forEach((leg) =>
      leg.carriersData.forEach((c) => {
        if (!carrierMap.has(c.code)) {
          carrierMap.set(c.code, { name: c.name, logo: c.logo });
        }
      }),
    ),
  );

  const carriers = Array.from(carrierMap.values());
  if (carriers.length === 0) {
    return { airline: "Unknown" };
  }

  const primary = carriers[0];
  if (carriers.length === 1) {
    return { airline: primary.name, airlineLogo: primary.logo };
  }

  /* 복수 항공사: 대표 1개 + "외 N개" */
  return {
    airline: primary.name,
    airlineLogo: primary.logo,
    airlineLabel: `${primary.name} 외 ${carriers.length - 1}개 항공사`,
  };
}

/**
 * token이 있으면 token을 id로, 없으면 offerKeyToHighlight + index 조합
 */
function makeId(offer: FlightOffer, index: number): string {
  return offer.token || `${offer.offerKeyToHighlight || "offer"}-${index}`;
}

/** FlightOffer → FlightItem 단일 변환 */
export function mapOfferToFlightItem(
  offer: FlightOffer,
  index: number,
): FlightItem {
  const airlineInfo = extractAirlineInfo(offer);

  const outboundSeg = offer.segments[0];
  const inboundSeg = offer.segments[1];

  return {
    id: makeId(offer, index),
    airline: airlineInfo.airline,
    airlineLogo: airlineInfo.airlineLogo,
    airlineLabel: airlineInfo.airlineLabel,
    outbound: segmentToLegData(outboundSeg),
    inbound: inboundSeg ? segmentToLegData(inboundSeg) : undefined,
    price: toKrwInt(offer.price.total),
  };
}

/** FlightOffersResult → FlightItem[] */
export function mapOffersToFlightItems(
  result: FlightOffersResult | null | undefined,
): FlightItem[] {
  const offers = result?.data?.flightOffers;
  if (!Array.isArray(offers)) return [];
  return offers.map((offer, i) => mapOfferToFlightItem(offer, i));
}

/* ══════════════════════════════════════════
   항공사 목록 추출 (FilterSidebar용)
   ══════════════════════════════════════════ */

/** 모든 FlightItem에서 등장한 항공사 이름을 중복 없이 수집 */
export function extractAirlineList(items: FlightItem[]): string[] {
  const set = new Set<string>();
  items.forEach((item) => set.add(item.airline));
  return Array.from(set).sort();
}

/* ══════════════════════════════════════════
   원본 offer 인덱스 ↔ FlightItem id 매핑
   (필터 후에도 원본 offer에 접근 가능하도록)
   ══════════════════════════════════════════ */

/** FlightItem[] 중에서 시간대(TimeSlot) 판정용으로 원본 offer가 필요하므로,
   id → 원본 offer 매핑도 유지해야 필터 로직에서 쓸 수 있음 */
export function buildOfferMap(
  result: FlightOffersResult | null | undefined,
): Map<string, FlightOffer> {
  const map = new Map<string, FlightOffer>();
  const offers = result?.data?.flightOffers;
  if (!Array.isArray(offers)) return map;
  offers.forEach((offer, i) => {
    map.set(makeId(offer, i), offer);
  });
  return map;
}

/* ── 한국어 시각/날짜 포맷 ── */

/** "2026-04-27T22:35:00" → "오후 10:35" */
export function formatTimeKR(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "--:--";
  const hour24 = Number(m[1]);
  const minute = m[2];
  const isAM = hour24 < 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${isAM ? "오전" : "오후"} ${hour12}:${minute}`;
}

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "2026-04-27T22:35:00" → "2026.04.27 (월)" */
export function formatDateKR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(year, month - 1, day);
  const dayLabel = WEEKDAY_KR[date.getDay()] ?? "";
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}.${mm}.${dd} (${dayLabel})`;
}

/* ── leg 사이 layover 시간 계산 (분 단위) ──
   인접 leg의 totalTime 합산이 segment.totalTime과 다른 차이를 layover로 간주.
   leg에는 도착시각이 없고 출발시각만 있으므로,
   다음 leg.departureTime - (현재 leg.departureTime + 현재 leg.totalTime) 으로 추정 */

function calcLayoverSeconds(currLeg: FlightLeg, nextLeg: FlightLeg): number {
  const currStart = new Date(currLeg.departureTime).getTime();
  const nextStart = new Date(nextLeg.departureTime).getTime();
  if (isNaN(currStart) || isNaN(nextStart)) return 0;
  /* 현재 leg 종료 시각 = 출발 + totalTime(초) */
  const currEnd = currStart + currLeg.totalTime * 1000;
  const layover = Math.max(0, Math.round((nextStart - currEnd) / 1000));
  return layover;
}

/* ── 항공사 정보: leg → carriersData[0] 사용 ── */
function getLegAirline(leg: FlightLeg): { name: string; logo?: string } {
  const carrier = leg.carriersData[0];
  if (!carrier) return { name: leg.marketingCarrier || "Unknown" };
  return { name: carrier.name, logo: carrier.logo };
}

/**
 * FlightSegment → ItineraryLegDetail[]
 *
 * 주의: 현재 FlightLeg 타입에는 leg별 출/도착 공항 정보가 없음
 * - 첫 leg의 출발지: segment.departureAirport
 * - 마지막 leg의 도착지: segment.arrivalAirport
 * - 중간 경유지(공항/시각/도착시각): 응답에 없음 → placeholder로 표시
 *   (백엔드 응답 구조 확장되면 이 함수에서 채우면 됨)
 */
export function mapSegmentToItineraryLegs(
  segment: FlightSegment,
): ItineraryLegDetail[] {
  const { legs } = segment;
  if (!legs || legs.length === 0) return [];

  return legs.map((leg, i) => {
    const isFirst = i === 0;
    const isLast = i === legs.length - 1;
    const airline = getLegAirline(leg);

    /* 출발 공항: 첫 leg만 segment 정보 사용, 나머지는 미상 */
    const departCode = isFirst ? segment.departureAirport.code : "";
    const departAirport = isFirst
      ? segment.departureAirport.cityName
      : "경유지";

    /* 도착 공항: 마지막 leg만 segment 정보 사용, 나머지는 미상 */
    const arriveCode = isLast ? segment.arrivalAirport.code : "";
    const arriveAirport = isLast ? segment.arrivalAirport.cityName : "경유지";

    /* 도착 시각: 마지막 leg는 segment.arrivalTime, 나머지는 출발+비행시간 추정 */
    const arrivalTimeIso = isLast
      ? segment.arrivalTime
      : new Date(
          new Date(leg.departureTime).getTime() + leg.totalTime * 1000,
        ).toISOString();

    /* 다음 leg가 있으면 layover 계산 */
    let layoverAfter: LayoverInfo | undefined;
    if (!isLast) {
      const layoverSec = calcLayoverSeconds(leg, legs[i + 1]);
      if (layoverSec > 0) {
        layoverAfter = {
          count: 1,
          waitDuration: formatDuration(layoverSec),
        };
      }
    }

    return {
      airline: airline.name,
      airlineLogo: airline.logo,
      departTimeLabel: formatTimeKR(leg.departureTime),
      departCode,
      departAirport,
      arriveTimeLabel: formatTimeKR(arrivalTimeIso),
      arriveCode,
      arriveAirport,
      duration: formatDuration(leg.totalTime),
      /* 부가정보 칩: 응답에 좌석배열/기내식 데이터 없음 → 일단 빈 배열 */
      badges: [],
      layoverAfter,
    };
  });
}

/* ── 한 segment의 경로 (도시명 배열) ──
   현재 응답 구조상 경유지 도시명을 알 수 없으므로,
   경유 leg가 있으면 중간에 "경유지" placeholder를 채움 */
export function buildRoutePath(segment: FlightSegment): string[] {
  const { legs } = segment;
  const start = segment.departureAirport.cityName;
  const end = segment.arrivalAirport.cityName;
  if (!legs || legs.length <= 1) return [start, end];
  /* 경유 횟수만큼 중간에 placeholder */
  const stops = legs.length - 1;
  return [start, ...Array(stops).fill("경유지"), end];
}

/* ══════════════════════════════════════════
   ItinerarySummaryCard 1장에 필요한 데이터
   ══════════════════════════════════════════ */

export interface ItinerarySummaryData {
  direction: "가는편" | "오는편";
  date: string;
  routePath: string[];
  legs: ItineraryLegDetail[];
}

/** FlightOffer → ItinerarySummaryCard 데이터 묶음 (편도면 1개, 왕복이면 2개) */
export function mapOfferToItinerarySummaries(
  offer: FlightOffer,
): ItinerarySummaryData[] {
  return offer.segments.map((segment, i) => ({
    direction: i === 0 ? "가는편" : "오는편",
    date: formatDateKR(segment.departureTime),
    routePath: buildRoutePath(segment),
    legs: mapSegmentToItineraryLegs(segment),
  }));
}
