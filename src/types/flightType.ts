/**
 * 항공편 검색 페이지에서 공용으로 사용하는 타입
 *
 * - API 응답 구조가 확정되기 전이므로 UI 렌더링에 필요한 최소 필드만 정의
 * - 실제 API 연결 시 flightApi.ts의 응답 타입과 매핑하면 됨
 */

/** 한 구간 (편도 1 레그, 왕복 2 레그) */
export interface FlightLegData {
  /** 출발 시간 "09:30" */
  departTime: string;
  /** 도착 시간 "16:45" */
  arriveTime: string;
  /** 출발 공항 코드 "ICN" */
  departCode: string;
  /** 도착 공항 코드 "BCN" */
  arriveCode: string;
  /** 비행 시간 "13시간 15분" */
  duration: string;
  /** 경유 횟수 (0이면 직항) */
  stops: number;
  /** 경유 공항 코드 리스트 (경유시 표시용) e.g. ["BUD", "VIE"] */
  stopCodes?: string[];
}

/** 항공편 카드 한 장 (편도 1 레그 / 왕복 2 레그) */
export interface FlightItem {
  /** 고유 id (선택 상태 관리용) */
  id: string;
  /** 항공사명 "대한항공" */
  airline: string;
  /** 항공사 로고 URL (optional) */
  airlineLogo?: string;
  /** 복수 항공사일 때 라벨 e.g. "라이언에어 + 축홍방항공" */
  airlineLabel?: string;
  /** 가는편 */
  outbound: FlightLegData;
  /** 오는편 (왕복일 때만) */
  inbound?: FlightLegData;
  /** 총 가격 (KRW) */
  price: number;
}

/** 필터 상태 */
export interface FilterState {
  /** 경유 옵션: 직항 / 경유 1회 / 경유 2회 이상 */
  stops: {
    direct: boolean;
    oneStop: boolean;
    twoPlusStops: boolean;
  };
  /** 가는편 출발 시간대 */
  outboundTime: TimeSlot[];
  /** 오는편 출발 시간대 */
  inboundTime: TimeSlot[];
  /** 선택된 항공사 (빈 배열이면 전체) */
  airlines: string[];
  /** 출발/도착 같음 */
  sameAirport: boolean;
}

/** 시간대 슬롯 */
export type TimeSlot = "00-06" | "06-12" | "12-18" | "18-24";

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  "00-06": "00시 ~ 06시",
  "06-12": "06시 ~ 12시",
  "12-18": "12시 ~ 18시",
  "18-24": "18시 ~ 24시",
};

/** 정렬 옵션 */
export type SortOption = "cheapest" | "fastest" | "best";

export const SORT_LABELS: Record<SortOption, string> = {
  cheapest: "최저가",
  fastest: "최단시간",
  best: "추천순",
};
