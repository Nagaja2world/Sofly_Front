/**
 * /api/v1/flights/offers 응답 타입
 *
 * 실제 응답 구조 (2026-04 확인):
 * {
 *   success: true,
 *   data: {
 *     result: { status, data: { flightOffers: [...] } },
 *     fromId, toId
 *   }
 * }
 *
 * flightApi.ts의 searchFlightsFull은
 * { result, fromId, toId } 형태로 리턴 (공통 래퍼 unwrap 후)
 */

/** 가격 (Booking API 형식: units + nanos) */
export interface MoneyAmount {
  currencyCode: string;
  units: number;
  nanos: number;
}

export interface FlightOfferPrice {
  total: MoneyAmount;
  baseFare: MoneyAmount;
  tax: MoneyAmount;
}

export interface BrandedFareInfo {
  fareName: string;
  cabinClass: string;
}

export interface FlightAirport {
  code: string;
  cityName: string;
  countryName: string;
}

export interface FlightCarrier {
  name: string;
  code: string;
  logo: string;
}

/** 한 leg (법적으로 하나의 항공편 = 구간) */
export interface FlightLeg {
  departureTime: string; // "2026-04-27T22:35:00"
  arrivalTime: string;
  totalTime: number; // 초 단위
  cabinClass: string;
  flightNumber: number;
  planeType: string;
  operatingCarrier: string; // 코드 "MM"
  marketingCarrier: string;
  carriersData: FlightCarrier[];
  flightStops: unknown[]; // 중간 기착 (경유와는 다름)
}

/**
 * 한 segment = 한 여정 (편도 1개, 왕복 2개)
 * legs.length > 1 이면 경유
 */
export interface FlightSegment {
  departureAirport: FlightAirport;
  arrivalAirport: FlightAirport;
  departureTime: string;
  arrivalTime: string;
  totalTime: number;
  legs: FlightLeg[];
}

/** 항공편 하나 (가격, 경로 포함) */
export interface FlightOffer {
  token: string; // getFlightDetails 호출용
  tripType: "ONEWAY" | "ROUNDTRIP" | string;
  offerKeyToHighlight: string;
  price: FlightOfferPrice;
  brandedFareInfo?: BrandedFareInfo;
  segments: FlightSegment[];
}

/** searchFlights(offers) 응답의 data 필드 */
export interface FlightOffersData {
  flightOffers: FlightOffer[];
  /* 응답에 추가 필드가 있을 수 있음 (metadata, aggregations 등) */
  [key: string]: unknown;
}

/** searchFlights(offers) 응답 전체 */
export interface FlightOffersResult {
  status: boolean;
  data: FlightOffersData;
}

/** searchFlightsFull의 리턴 타입 */
export interface SearchFlightsFullResponse {
  result: FlightOffersResult;
  fromId: string;
  toId: string;
}
