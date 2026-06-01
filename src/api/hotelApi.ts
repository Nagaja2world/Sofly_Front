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
  accessibilityLabel?: string;
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
  status?: boolean;
  code?: string;
  message?: string;
  data?: T;
  timestamp?: number;
}

type RawHotelDestination = Partial<HotelDestination> & {
  dest_id?: string;
  dest_type?: string;
  city_name?: string;
  image_url?: string;
};

type RawBookingHotel = Partial<HotelOfferItem> & {
  accessibilityLabel?: string;
  property?: Partial<HotelOfferItem["property"]> & {
    id?: number;
    name?: string;
    reviewScore?: number;
    reviewScoreWord?: string;
    reviewCount?: number;
    propertyClass?: number;
    accuratePropertyClass?: number;
    qualityClass?: number;
    photoUrls?: string[];
    latitude?: number;
    longitude?: number;
    checkin?: {
      fromTime?: string;
      untilTime?: string;
    };
    checkout?: {
      fromTime?: string;
      untilTime?: string;
    };
    priceBreakdown?: {
      grossPrice?: {
        value?: number;
        currency?: string;
      };
      benefitBadges?: Array<{
        id?: string;
        text?: string;
        title?: string;
      }>;
    };
    bookingUrl?: string;
  };
};

type RawHotelOffersData = Partial<HotelOffersResponse["data"]> & {
  data?: Partial<HotelOffersResponse["data"]> & {
    hotels?: RawBookingHotel[];
    meta?: Array<{ title?: string }>;
  };
  hotels?: RawBookingHotel[];
  meta?: Array<{ title?: string }>;
};

type RawHotelFilterCategory = Partial<HotelFilterCategory> & {
  filters?: Partial<HotelFilterItem>[];
};

type RawHotelDetailsData = Partial<HotelDetailsData> & {
  data?: RawHotelDetailsData;
  hotel_id?: number;
  hotelId?: number;
  hotel_name?: string;
  hotelName?: string;
  name?: string;
  url?: string;
  address?: string;
  city?: string;
  cityName?: string;
  review_score?: number;
  reviewScore?: number;
  review_score_word?: string;
  reviewScoreWord?: string;
  review_nr?: number;
  reviewCount?: number;
  checkin?: {
    from?: string;
    until?: string;
    fromTime?: string;
    untilTime?: string;
  };
  checkout?: {
    from?: string;
    until?: string;
    fromTime?: string;
    untilTime?: string;
  };
  block?: RawHotelRoom[];
  rooms?: RawHotelRoom[];
  availableRooms?: RawHotelRoom[];
  photos?: Array<{
    url_original?: string;
    url_max300?: string;
    url?: string;
    url_1440?: string;
  }>;
  photoUrls?: string[];
  hotel_text?: { description?: string };
  description?: string;
};

type RawHotelRoom = Partial<HotelRoom> & {
  roomName?: string;
  name?: string;
  nameWithoutPolicy?: string;
  minPrice?: { price?: number; value?: number; currency?: string };
  priceBreakdown?: {
    grossPrice?: {
      value?: number;
      currency?: string;
    };
  };
  maxOccupancy?: number;
  roomSurfaceInM2?: number;
  isFreeCancellable?: number | boolean;
};

type RawHotelPhoto = {
  url_original?: string;
  url_max300?: string;
  url?: string;
  url_1440?: string;
};

function isApiResponse<T>(json: unknown): json is ApiResponse<T> {
  return (
    typeof json === "object" &&
    json !== null &&
    ("success" in json || "status" in json)
  );
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API 오류: ${res.status}`);
  const json: unknown = await res.json();
  if (isApiResponse<T>(json)) {
    if (json.success === false || json.status === false) {
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
  const hotels = Array.isArray(payload?.hotels)
    ? payload.hotels
        .map(normalizeHotelOffer)
        .filter((hotel): hotel is HotelOfferItem => hotel !== null)
    : [];
  const metaCount = payload?.meta?.[0]?.title
    ? Number(payload.meta[0].title.match(/\d+/)?.[0])
    : undefined;
  const count = payload?.count ?? payload?.primary_count ?? metaCount ?? hotels.length;
  return {
    data: {
      hotels,
      count,
      primary_count: payload?.primary_count ?? count,
    },
  };
}

function normalizeHotelOffer(raw: RawBookingHotel): HotelOfferItem | null {
  const property = raw.property;
  const id = raw.hotel_id ?? property?.id;
  const name = raw.name ?? property?.name;
  if (id == null || !name) return null;

  const grossPrice = property?.priceBreakdown?.grossPrice;
  const classValue =
    raw.class ??
    property?.propertyClass ??
    property?.accuratePropertyClass ??
    property?.qualityClass ??
    null;

  return {
    hotel_id: id,
    name,
    review_score: raw.review_score ?? property?.reviewScore ?? null,
    review_score_word: raw.review_score_word ?? property?.reviewScoreWord ?? null,
    review_nr: raw.review_nr ?? property?.reviewCount ?? null,
    class: classValue,
    main_photo_url: raw.main_photo_url ?? property?.photoUrls?.[0] ?? null,
    url: raw.url ?? property?.bookingUrl ?? "",
    min_total_price: raw.min_total_price ?? grossPrice?.value ?? null,
    composite_price_breakdown:
      raw.composite_price_breakdown ??
      (grossPrice?.value != null
        ? {
            gross_amount: {
              value: grossPrice.value,
              currency: grossPrice.currency ?? "KRW",
            },
          }
        : null),
    latitude: raw.latitude ?? property?.latitude ?? 0,
    longitude: raw.longitude ?? property?.longitude ?? 0,
    distance_to_cc: raw.distance_to_cc ?? null,
    checkin: raw.checkin ?? (property?.checkin?.fromTime ? { from: property.checkin.fromTime } : null),
    checkout:
      raw.checkout ??
      (property?.checkout?.untilTime ? { until: property.checkout.untilTime } : null),
    is_free_cancellable:
      raw.is_free_cancellable ??
      raw.accessibilityLabel?.toLowerCase().includes("free cancellation") ??
      false,
    badges:
      raw.badges ??
      property?.priceBreakdown?.benefitBadges?.map((badge, index) => ({
        id: badge.id ?? String(index),
        text: badge.text ?? badge.title ?? "",
      })).filter((badge) => badge.text),
    property: {
      bookingUrl: property?.bookingUrl,
      name: property?.name,
    },
    accessibilityLabel: raw.accessibilityLabel,
  };
}

function normalizeHotelDetails(
  data: RawHotelDetailsData | undefined,
): HotelDetailsResponse {
  const payload = data?.data ?? data;
  if (!payload) return {};

  const rawRooms = payload.block ?? payload.rooms ?? payload.availableRooms ?? [];
  const photoUrls = payload.photoUrls ?? [];
  const rawPhotos = payload.photos as RawHotelPhoto[] | undefined;
  const photos: HotelDetailsData["photos"] =
    Array.isArray(rawPhotos) && rawPhotos.length > 0
      ? rawPhotos.reduce<NonNullable<HotelDetailsData["photos"]>>((acc, photo) => {
          const url = photo.url_original ?? photo.url_1440 ?? photo.url;
          if (!url) return acc;
          acc.push({
            url_original: url,
            url_max300: photo.url_max300 ?? photo.url ?? url,
          });
          return acc;
        }, [])
      : photoUrls.map((url) => ({ url_original: url, url_max300: url }));

  return {
    data: {
      hotel_id: payload.hotel_id ?? payload.hotelId,
      hotel_name: payload.hotel_name ?? payload.hotelName ?? payload.name,
      address: payload.address,
      city: payload.city ?? payload.cityName,
      url: payload.url,
      review_score: payload.review_score ?? payload.reviewScore,
      review_score_word: payload.review_score_word ?? payload.reviewScoreWord,
      review_nr: payload.review_nr ?? payload.reviewCount,
      checkin: payload.checkin
        ? {
            from: payload.checkin.from ?? payload.checkin.fromTime ?? "",
            until: payload.checkin.until ?? payload.checkin.untilTime,
          }
        : undefined,
      checkout: payload.checkout
        ? {
            from: payload.checkout.from ?? payload.checkout.fromTime,
            until: payload.checkout.until ?? payload.checkout.untilTime ?? "",
          }
        : undefined,
      block: Array.isArray(rawRooms) ? rawRooms.map(normalizeHotelRoom) : [],
      photos,
      hotel_text: payload.hotel_text ?? (payload.description ? { description: payload.description } : undefined),
    },
  };
}

function normalizeHotelRoom(room: RawHotelRoom): HotelRoom {
  const grossPrice = room.priceBreakdown?.grossPrice;
  return {
    block_id: room.block_id,
    room_name: room.room_name ?? room.roomName ?? room.name,
    name_without_policy:
      room.name_without_policy ?? room.nameWithoutPolicy ?? room.room_name ?? room.roomName,
    min_price:
      room.min_price ??
      (room.minPrice?.price != null || room.minPrice?.value != null
        ? {
            price: room.minPrice.price ?? room.minPrice.value ?? 0,
            currency: room.minPrice.currency ?? "KRW",
          }
        : grossPrice?.value != null
          ? { price: grossPrice.value, currency: grossPrice.currency ?? "KRW" }
          : undefined),
    max_occupancy: room.max_occupancy ?? room.maxOccupancy,
    room_surface_in_m2: room.room_surface_in_m2 ?? room.roomSurfaceInM2,
    is_free_cancellable: room.is_free_cancellable ?? room.isFreeCancellable,
    photos: Array.isArray(room.photos) ? room.photos : [],
    highlights: Array.isArray(room.highlights) ? room.highlights : [],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function pickArray(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];

  for (const key of keys) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested;
  }

  return Object.values(record).find(Array.isArray) ?? [];
}

function normalizeSortOptions(data: unknown): HotelSortOption[] {
  const options = pickArray(data, ["sortOptions", "options", "sorts", "items"]);
  return options
    .map((option) => {
      const item = asRecord(option);
      const id = item?.id ?? item?.value ?? item?.key;
      const title = item?.title ?? item?.name ?? item?.label;
      if (typeof id !== "string" || typeof title !== "string") return null;
      return { id, title };
    })
    .filter((option): option is HotelSortOption => option !== null);
}

function normalizeFilterOptions(data: unknown): HotelFilterCategory[] {
  const categories = pickArray(data, [
    "filterOptions",
    "filterCategories",
    "categories",
    "groups",
    "items",
    "filters",
  ]);

  const normalized = categories
    .map((category) => {
      const item = category as RawHotelFilterCategory & Record<string, unknown>;
      const id = item.id ?? item.value ?? item.key;
      const title = item.title ?? item.name ?? item.label;
      const rawFilters = pickArray(item, ["filters", "options", "items", "values"]);
      if (typeof id !== "string" || typeof title !== "string") return null;
      return {
        id,
        title,
        filters: rawFilters
          .map((filter) => {
            const rawFilter = filter as Partial<HotelFilterItem> &
              Record<string, unknown>;
            const filterId = rawFilter.id ?? rawFilter.value ?? rawFilter.key;
            const filterTitle = rawFilter.title ?? rawFilter.name ?? rawFilter.label;
            if (typeof filterId !== "string" || typeof filterTitle !== "string") {
              return null;
            }
            return {
              id: filterId,
              title: filterTitle,
              count: Number(rawFilter.count ?? rawFilter.total ?? 0) || 0,
            };
          })
          .filter((filter): filter is HotelFilterItem => filter !== null),
      };
    })
    .filter((category): category is HotelFilterCategory => category !== null);

  if (normalized.some((category) => category.filters.length > 0)) {
    return normalized;
  }

  const leafFilters = categories
    .map((filter) => {
      const rawFilter = filter as Partial<HotelFilterItem> & Record<string, unknown>;
      const id = rawFilter.id ?? rawFilter.value ?? rawFilter.key;
      const title = rawFilter.title ?? rawFilter.name ?? rawFilter.label;
      if (typeof id !== "string" || typeof title !== "string") return null;
      return {
        id,
        title,
        count: Number(rawFilter.count ?? rawFilter.total ?? 0) || 0,
      };
    })
    .filter((filter): filter is HotelFilterItem => filter !== null);

  return leafFilters.length > 0
    ? [{ id: "filters", title: "필터", filters: leafFilters }]
    : [];
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
  const data = await unwrap<unknown>(res);
  return normalizeSortOptions(data);
}

export async function fetchHotelFilterOptions(
  params: HotelSearchInput,
): Promise<HotelFilterCategory[]> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/hotels/filter-options?${buildQuery(params)}`,
  );
  const data = await unwrap<unknown>(res);
  return normalizeFilterOptions(data);
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
  const data = await unwrap<RawHotelDetailsData>(res);
  return normalizeHotelDetails(data);
}
