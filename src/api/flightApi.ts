// auth require
const API_BASE = import.meta.env.VITE_API_BASE_URL; // https://api.sofly.co.kr

/* ── 인증 헤더 ── */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── 공통 응답 래퍼 ── */
interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message ?? "알 수 없는 오류");
  return json.data;
}

/* ── 공항 검색 (/api/v1/flights/destinations) ── */
export interface AirportResult {
  id: string;
  type: string;
  name: string;
  code: string;
  city: string;
  cityName: string;
  regionName: string;
  country: string;
  countryName: string;
  countryNameShort: string;
  photoUri: string;
  distanceToCity: { value: number; unit: string };
  parent: string;
}

export async function searchDestination(
  query: string,
): Promise<AirportResult[]> {
  const params = new URLSearchParams({
    query,
    languageCode: "ko",
  });
  const res = await fetch(`${API_BASE}/api/v1/flights/destinations?${params}`, {
    headers: authHeaders(),
  });
  return unwrap<AirportResult[]>(res);
}

/* ── 항공편 검색 파라미터 ── */
export interface SearchFlightsParams {
  fromId: string; // e.g. "ICN.AIRPORT"
  toId: string; // e.g. "CEB.AIRPORT"
  departDate: string; // yyyy-MM-dd
  returnDate?: string; // 왕복일 때만
  adults?: number;
  children?: string; // 콤마 구분 나이 e.g. "2,5"
  stops?: "none" | "0" | "1" | "2";
  sort?: "BEST" | "CHEAPEST" | "FASTEST";
  cabinClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currencyCode?: string;
  pageNo?: number;
}

/* ── 항공편 검색 (/api/v1/flights/offers) ── */
export async function searchFlights(params: SearchFlightsParams) {
  const query = new URLSearchParams({
    supplier: "booking",
    fromId: params.fromId,
    toId: params.toId,
    departDate: params.departDate,
    adults: String(params.adults ?? 1),
    currencyCode: params.currencyCode ?? "KRW",
    stops: params.stops ?? "none",
    sort: params.sort ?? "BEST",
    cabinClass: params.cabinClass ?? "ECONOMY",
    pageNo: String(params.pageNo ?? 1),
  });

  if (params.returnDate) query.set("returnDate", params.returnDate);
  if (params.children) query.set("childrenAge", params.children);

  const res = await fetch(`${API_BASE}/api/v1/flights/offers?${query}`, {
    headers: authHeaders(),
  });
  return unwrap<unknown>(res);
}

/* ── 항공편 상세 조회 (/api/v1/flights/details) ── */
export async function getFlightDetails(token: string, currencyCode = "KRW") {
  const params = new URLSearchParams({
    supplier: "booking",
    token,
    currencyCode,
  });
  const res = await fetch(`${API_BASE}/api/v1/flights/details?${params}`, {
    headers: authHeaders(),
  });
  return unwrap<unknown>(res);
}

/* ── searchFlightsFull: destinations → offers 순서로 호출 ── */
export interface FlightSearchInput {
  departureQuery: string;
  arrivalQuery: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  children?: string;
  stops?: SearchFlightsParams["stops"];
  sort?: SearchFlightsParams["sort"];
  cabinClass?: SearchFlightsParams["cabinClass"];
}

export async function searchFlightsFull(input: FlightSearchInput) {
  const [depResults, arrResults] = await Promise.all([
    searchDestination(input.departureQuery),
    searchDestination(input.arrivalQuery),
  ]);

  const dep = depResults.find((r) => r.type === "AIRPORT") ?? depResults[0];
  const arr = arrResults.find((r) => r.type === "AIRPORT") ?? arrResults[0];

  if (!dep)
    throw new Error(`출발지를 찾을 수 없습니다: ${input.departureQuery}`);
  if (!arr) throw new Error(`도착지를 찾을 수 없습니다: ${input.arrivalQuery}`);

  const result = await searchFlights({
    fromId: dep.id,
    toId: arr.id,
    departDate: input.departDate,
    returnDate: input.returnDate,
    adults: input.adults,
    children: input.children,
    stops: input.stops,
    sort: input.sort,
    cabinClass: input.cabinClass,
  });

  return { result, fromId: dep.id, toId: arr.id };
}
