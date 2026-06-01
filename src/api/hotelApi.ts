import { apiFetch } from "@/api/apiFetch";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/* ── Types ── */

export interface HotelDestination {
  destId: string;
  destType: string;
  name: string;
  label: string;
  cityName: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  hotels: number;
}

export interface HotelOfferItem {
  hotel_id: number;
  name: string;
  review_score: number | null;
  review_score_word: string | null;
  review_nr: number | null;
  class: number | null;
  main_photo_url: string | null;
  url: string;
  min_total_price: number | null;
  composite_price_breakdown: {
    gross_amount: { value: number; currency: string };
  } | null;
  latitude: number;
  longitude: number;
  distance_to_cc: string | null;
  checkin: { from: string } | null;
  checkout: { until: string } | null;
  is_free_cancellable: boolean;
  badges?: Array<{ id: string; text: string }>;
  /** 백엔드가 property 노드에 주입하는 Booking.com 딥링크 */
  property?: { bookingUrl?: string; name?: string };
}

/* ── 호텔 상세 타입 ── */

export interface HotelRoomPhoto {
  url: string;
  url_1440?: string;
}

export interface HotelRoom {
  block_id?: string;
  room_name?: string;
  name_without_policy?: string;
  min_price?: { price: number; currency: string };
  max_occupancy?: number;
  room_surface_in_m2?: number;
  is_free_cancellable?: number | boolean;
  photos?: HotelRoomPhoto[];
  highlights?: Array<{ translated_name: string }>;
}

export interface HotelDetailsData {
  hotel_id?: number;
  hotel_name?: string;
  address?: string;
  city?: string;
  url?: string;
  review_score?: number;
  review_score_word?: string;
  review_nr?: number;
  checkin?: { from: string; until?: string };
  checkout?: { from?: string; until: string };
  block?: HotelRoom[];
  photos?: Array<{ url_original: string; url_max300?: string }>;
  hotel_text?: { description?: string };
}

export interface HotelDetailsResponse {
  status?: boolean;
  data?: HotelDetailsData;
}

export interface HotelDetailsInput {
  hotelId: string;
  arrivalDate: string;
  departureDate: string;
  adults?: number;
  childrenAge?: string;
  roomQty?: number;
  languageCode?: string;
  currencyCode?: string;
}

export interface HotelOffersResponse {
  data: {
    hotels: HotelOfferItem[];
    count: number;
    primary_count: number;
  };
}

export interface HotelSortOption {
  id: string;
  title: string;
}

export interface HotelFilterItem {
  id: string;
  title: string;
  count: number;
}

export interface HotelFilterCategory {
  id: string;
  title: string;
  filters: HotelFilterItem[];
}

export interface HotelSearchInput {
  destId: string;
  searchType: string;
  arrivalDate: string;
  departureDate: string;
  adults?: number;
  roomQty?: number;
  childrenAge?: string;
  pageNumber?: number;
  sortBy?: string;
  priceMin?: number;
  priceMax?: number;
  categoriesFilter?: string;
  currencyCode?: string;
  languageCode?: string;
  supplier?: string;
  units?: "METRIC" | "IMPERIAL";
  temperatureUnit?: "CELSIUS" | "FAHRENHEIT";
  location?: string;
}

/* ── Query builder ── */

function buildQuery(params: HotelSearchInput): string {
  const p = new URLSearchParams();
  if (params.supplier) p.set("supplier", params.supplier);
  p.set("destId", params.destId);
  p.set("searchType", params.searchType);
  p.set("arrivalDate", params.arrivalDate);
  p.set("departureDate", params.departureDate);
  if (params.adults != null) p.set("adults", String(params.adults));
  if (params.roomQty != null) p.set("roomQty", String(params.roomQty));
  p.set("childrenAge", params.childrenAge ?? "0");
  if (params.pageNumber != null) p.set("pageNumber", String(params.pageNumber));
  if (params.sortBy) p.set("sortBy", params.sortBy);
  if (params.priceMin != null) p.set("priceMin", String(params.priceMin));
  if (params.priceMax != null) p.set("priceMax", String(params.priceMax));
  if (params.categoriesFilter) p.set("categoriesFilter", params.categoriesFilter);
  p.set("units", params.units ?? "METRIC");
  p.set("temperatureUnit", params.temperatureUnit ?? "CELSIUS");
  p.set("currencyCode", params.currencyCode ?? "KRW");
  p.set("languageCode", params.languageCode ?? "ko");
  if (params.location) p.set("location", params.location);
  return p.toString();
}

interface ApiResponse<T> {
  success?: boolean;
  code?: string;
  message?: string;
  data?: T;
}

type RawHotelDestination = Partial<HotelDestination> & {
  dest_id?: string;
  dest_type?: string;
  city_name?: string;
  image_url?: string;
};

type RawHotelOffersData = Partial<HotelOffersResponse["data"]> & {
  data?: Partial<HotelOffersResponse["data"]>;
};

function isApiResponse<T>(json: unknown): json is ApiResponse<T> {
  return typeof json === "object" && json !== null && "success" in json;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json: unknown = await res.json();
  if (isApiResponse<T>(json)) {
    if (json.success === false) {
      throw new Error(json.message ?? "요청 처리 중 오류가 발생했어요");
    }
    return json.data as T;
  }
  return json as T;
}

function normalizeDestination(dest: RawHotelDestination): HotelDestination {
  const destId = dest.destId ?? dest.dest_id ?? "";
  const destType = dest.destType ?? dest.dest_type ?? "";
  const name = dest.name ?? dest.label ?? "";
  return {
    destId,
    destType,
    name,
    label: dest.label ?? name,
    cityName: dest.cityName ?? dest.city_name ?? "",
    country: dest.country ?? "",
    region: dest.region ?? "",
    latitude: dest.latitude ?? 0,
    longitude: dest.longitude ?? 0,
    imageUrl: dest.imageUrl ?? dest.image_url ?? "",
    hotels: dest.hotels ?? 0,
  };
}

function normalizeOffers(data: RawHotelOffersData | undefined): HotelOffersResponse {
  const payload = data?.data ?? data;
  const hotels = Array.isArray(payload?.hotels) ? payload.hotels : [];
  const count = payload?.count ?? payload?.primary_count ?? hotels.length;
  return {
    data: {
      hotels,
      count,
      primary_count: payload?.primary_count ?? count,
    },
  };
}

function normalizeHotelDetails(
  data: HotelDetailsData | { data?: HotelDetailsData } | undefined,
): HotelDetailsResponse {
  if (data && "data" in data) return { data: data.data };
  return { data: data as HotelDetailsData | undefined };
}

/* ── API functions ── */

export async function searchHotelDestinations(
  query: string,
): Promise<HotelDestination[]> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/hotels/destinations?query=${encodeURIComponent(query)}`,
  );
  const data = await unwrap<RawHotelDestination[]>(res);
  return Array.isArray(data) ? data.map(normalizeDestination) : [];
}

export async function searchHotelOffers(
  params: HotelSearchInput,
): Promise<HotelOffersResponse> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/hotels/offers?${buildQuery(params)}`,
  );
  const data = await unwrap<RawHotelOffersData>(res);
  return normalizeOffers(data);
}

export async function fetchHotelSortOptions(
  params: HotelSearchInput,
): Promise<HotelSortOption[]> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/hotels/sort-options?${buildQuery(params)}`,
  );
  const data = await unwrap<HotelSortOption[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchHotelFilterOptions(
  params: HotelSearchInput,
): Promise<HotelFilterCategory[]> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/hotels/filter-options?${buildQuery(params)}`,
  );
  const data = await unwrap<HotelFilterCategory[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchHotelDetails(
  params: HotelDetailsInput,
): Promise<HotelDetailsResponse> {
  const p = new URLSearchParams();
  p.set("hotelId", params.hotelId);
  p.set("arrivalDate", params.arrivalDate);
  p.set("departureDate", params.departureDate);
  if (params.adults != null) p.set("adults", String(params.adults));
  if (params.childrenAge) p.set("childrenAge", params.childrenAge);
  if (params.roomQty != null) p.set("roomQty", String(params.roomQty));
  if (params.languageCode) p.set("languageCode", params.languageCode);
  if (params.currencyCode) p.set("currencyCode", params.currencyCode);
  const res = await apiFetch(`${API_BASE}/api/v1/hotels/details?${p}`);
  const data = await unwrap<HotelDetailsData | { data?: HotelDetailsData }>(res);
  return normalizeHotelDetails(data);
}
