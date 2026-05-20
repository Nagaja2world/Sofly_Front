const SUPPLY_API_BASE =
  import.meta.env.VITE_SUPPLY_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "";

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
}

/* ── Query builder ── */

function buildQuery(params: HotelSearchInput): string {
  const p = new URLSearchParams();
  p.set("destId", params.destId);
  p.set("searchType", params.searchType);
  p.set("arrivalDate", params.arrivalDate);
  p.set("departureDate", params.departureDate);
  if (params.adults != null) p.set("adults", String(params.adults));
  if (params.roomQty != null) p.set("roomQty", String(params.roomQty));
  if (params.childrenAge) p.set("childrenAge", params.childrenAge);
  if (params.pageNumber != null) p.set("pageNumber", String(params.pageNumber));
  if (params.sortBy) p.set("sortBy", params.sortBy);
  if (params.priceMin != null) p.set("priceMin", String(params.priceMin));
  if (params.priceMax != null) p.set("priceMax", String(params.priceMax));
  if (params.categoriesFilter) p.set("categoriesFilter", params.categoriesFilter);
  if (params.currencyCode) p.set("currencyCode", params.currencyCode);
  if (params.languageCode) p.set("languageCode", params.languageCode);
  return p.toString();
}

/* ── API functions ── */

export async function searchHotelDestinations(
  query: string,
): Promise<HotelDestination[]> {
  const res = await fetch(
    `${SUPPLY_API_BASE}/supply/hotels/destinations?query=${encodeURIComponent(query)}`,
  );
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  return res.json();
}

export async function searchHotelOffers(
  params: HotelSearchInput,
): Promise<HotelOffersResponse> {
  const res = await fetch(
    `${SUPPLY_API_BASE}/supply/hotels/offers?${buildQuery(params)}`,
  );
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  return res.json();
}

export async function fetchHotelSortOptions(
  params: HotelSearchInput,
): Promise<HotelSortOption[]> {
  const res = await fetch(
    `${SUPPLY_API_BASE}/supply/hotels/sort-options?${buildQuery(params)}`,
  );
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  return res.json();
}

export async function fetchHotelFilterOptions(
  params: HotelSearchInput,
): Promise<HotelFilterCategory[]> {
  const res = await fetch(
    `${SUPPLY_API_BASE}/supply/hotels/filter-options?${buildQuery(params)}`,
  );
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  return res.json();
}
