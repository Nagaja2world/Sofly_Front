import { useEffect, useCallback, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchModeBar from "@/components/SearchModeBar";
import HotelCard from "@/components/hotel/HotelCard";
import HotelDetailModal from "@/components/hotel/HotelDetailModal";
import HotelFilterPanel from "@/components/hotel/HotelFilterPanel";
import { useHotelSearch } from "@/hooks/useHotelSearch";
import { type HotelOfferItem } from "@/api/hotelApi";
import { type HotelSearchBarParams } from "@/components/HotelSearchBar";
import {
  type FlightSearchParams,
  buildFlightSearchParams,
} from "@/utils/flightSearchQuery";

const HOTEL_PAGE_SIZE = 20;
const PAGE_WINDOW = 5;

function buildPageItems(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= PAGE_WINDOW + 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(PAGE_WINDOW / 2);
  let start = Math.max(2, currentPage - half);
  let end = Math.min(totalPages - 1, currentPage + half);

  if (currentPage <= half + 2) {
    start = 2;
    end = PAGE_WINDOW;
  }

  if (currentPage >= totalPages - half - 1) {
    start = totalPages - PAGE_WINDOW + 1;
    end = totalPages - 1;
  }

  const pages: Array<number | "..."> = [1];
  if (start > 2) pages.push("...");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

/* URL query params ↔ hotel search params */
function parseParams(sp: URLSearchParams): HotelSearchBarParams | null {
  const destId = sp.get("destId");
  const searchType = sp.get("searchType");
  const arrivalDate = sp.get("arrivalDate");
  const departureDate = sp.get("departureDate");
  if (!destId || !searchType || !arrivalDate || !departureDate) return null;
  return {
    destId,
    searchType,
    destName: sp.get("destName") ?? "",
    arrivalDate,
    departureDate,
    adults: Number(sp.get("adults") ?? 2),
    roomQty: Number(sp.get("roomQty") ?? 1),
  };
}

export function buildHotelSearchParams(p: HotelSearchBarParams): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("destId", p.destId);
  sp.set("searchType", p.searchType);
  sp.set("destName", p.destName);
  sp.set("arrivalDate", p.arrivalDate);
  sp.set("departureDate", p.departureDate);
  sp.set("adults", String(p.adults));
  sp.set("roomQty", String(p.roomQty));
  return sp;
}

export default function HotelSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedHotel, setSelectedHotel] = useState<HotelOfferItem | null>(null);

  const parsedParams = parseParams(searchParams);
  const sortBy = searchParams.get("sortBy") ?? "";
  const filtersParam = searchParams.get("filters") ?? "";
  const categoriesFilter = filtersParam || "";
  const priceMin = Number(searchParams.get("priceMin") ?? 0) || 0;
  const priceMax = Number(searchParams.get("priceMax") ?? 0) || 0;
  const pageNumber = Math.max(1, Number(searchParams.get("pageNumber") ?? 1) || 1);
  const selectedFilters = filtersParam ? filtersParam.split(",") : [];

  const { hotels, totalCount, sortOptions, filterOptions, isLoading, error, search } =
    useHotelSearch();
  const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / HOTEL_PAGE_SIZE)) : 0;
  const pageItems = totalPages > 0 ? buildPageItems(pageNumber, totalPages) : [];
  const hasNextPage = totalPages > 0 ? pageNumber < totalPages : hotels.length >= HOTEL_PAGE_SIZE;

  const prevSearchKey = useRef<string>("");

  /* 첫 로드 및 URL 파라미터 변경 시 검색 */
  useEffect(() => {
    if (!parsedParams) return;

    const searchKey = [
      parsedParams.destId,
      parsedParams.searchType,
      parsedParams.arrivalDate,
      parsedParams.departureDate,
      parsedParams.adults,
      parsedParams.roomQty,
      sortBy,
      categoriesFilter,
      priceMin,
      priceMax,
    ].join("|");

    const isNewSearch = searchKey !== prevSearchKey.current;
    prevSearchKey.current = searchKey;

    search(
      {
        destId: parsedParams.destId,
        searchType: parsedParams.searchType,
        arrivalDate: parsedParams.arrivalDate,
        departureDate: parsedParams.departureDate,
        adults: parsedParams.adults,
        roomQty: parsedParams.roomQty,
        sortBy: sortBy || undefined,
        categoriesFilter: categoriesFilter || undefined,
        priceMin,
        priceMax,
        pageNumber,
        currencyCode: "KRW",
        languageCode: "ko",
      },
      isNewSearch,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsedParams?.destId,
    parsedParams?.searchType,
    parsedParams?.arrivalDate,
    parsedParams?.departureDate,
    parsedParams?.adults,
    parsedParams?.roomQty,
    sortBy,
    categoriesFilter,
    priceMin,
    priceMax,
    pageNumber,
  ]);

  const handleSortChange = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sortBy", id);
      next.set("pageNumber", "1");
      return next;
    });
  };

  const handleFilterChange = (filterId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = next.get("filters")
        ? next.get("filters")!.split(",")
        : [];
      const updated = current.includes(filterId)
        ? current.filter((f) => f !== filterId)
        : [...current, filterId];
      if (updated.length > 0) next.set("filters", updated.join(","));
      else next.delete("filters");
      next.set("pageNumber", "1");
      return next;
    });
  };

  const handlePriceChange = (nextMin: number, nextMax: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextMin > 0) next.set("priceMin", String(nextMin));
      else next.delete("priceMin");
      if (nextMax > 0) next.set("priceMax", String(nextMax));
      else next.delete("priceMax");
      next.set("pageNumber", "1");
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("filters");
      next.delete("priceMin");
      next.delete("priceMax");
      next.set("pageNumber", "1");
      return next;
    });
  };

  const handlePageChange = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pageNumber", String(Math.max(1, nextPage)));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHotelSearch = useCallback(
    (params: HotelSearchBarParams) => {
      navigate(`/hotel-search?${buildHotelSearchParams(params).toString()}`);
    },
    [navigate],
  );

  const handleFlightSearch = useCallback(
    (params: FlightSearchParams) => {
      navigate(`/flight-search?${buildFlightSearchParams(params).toString()}`);
    },
    [navigate],
  );

  /* 검색 바 초기값 */
  const searchBarInitial = parsedParams ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 검색 바 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1200px] mx-auto">
          <SearchModeBar
            initialMode="hotel"
            onFlightSearch={handleFlightSearch}
            onHotelSearch={handleHotelSearch}
            hotelInitialValues={searchBarInitial}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* 결과 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-pretendard text-title2 font-bold text-gray-900 m-0">
              {parsedParams?.destName
                ? `${parsedParams.destName} 호텔`
                : "호텔 검색 결과"}
            </h1>
            {!isLoading && totalCount > 0 && (
              <p className="font-pretendard text-body3 text-gray-500 m-0 mt-1">
                총 {totalCount.toLocaleString()}개 숙소
              </p>
            )}
          </div>

          {/* 정렬 */}
          {sortOptions.length > 0 && (
            <select
              value={sortBy || sortOptions[0]?.id || ""}
              onChange={(e) => handleSortChange(e.target.value)}
              className="font-pretendard text-body3 text-gray-700 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-gray-700 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 필터 + 결과 */}
        <div className="flex gap-8 items-start">
          {/* 필터 패널 */}
          {parsedParams && (
            <HotelFilterPanel
              filterOptions={filterOptions}
              selectedFilters={selectedFilters}
              priceMin={priceMin}
              priceMax={priceMax}
              onFilterChange={handleFilterChange}
              onPriceChange={handlePriceChange}
              onClear={handleClearFilters}
            />
          )}

          {/* 호텔 목록 */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {isLoading && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="font-pretendard text-body2 text-red-600 m-0">
                  {error}
                </p>
              </div>
            )}

            {!isLoading && !error && hotels.length === 0 && parsedParams && (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
                <p className="font-pretendard text-body2 text-gray-500 m-0">
                  검색 결과가 없어요
                </p>
                <p className="font-pretendard text-body3 text-gray-400 m-0 mt-2">
                  날짜나 조건을 변경해 보세요
                </p>
              </div>
            )}

            {!parsedParams && (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
                <p className="font-pretendard text-body2 text-gray-500 m-0">
                  위 검색창에서 목적지와 날짜를 입력해 검색하세요
                </p>
              </div>
            )}

            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.hotel_id}
                hotel={hotel}
                onClick={() => setSelectedHotel(hotel)}
              />
            ))}

            {!isLoading && !error && parsedParams && hotels.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePageChange(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className={[
                    "rounded-lg border px-4 py-2 font-pretendard text-body3",
                    pageNumber <= 1
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 bg-white text-gray-800 cursor-pointer hover:border-gray-700",
                  ].join(" ")}
                >
                  이전
                </button>
                {pageItems.length > 0 ? (
                  pageItems.map((item, index) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 font-pretendard text-body3 text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        aria-current={item === pageNumber ? "page" : undefined}
                        className={[
                          "min-w-10 rounded-lg border px-3 py-2 font-pretendard text-body3",
                          item === pageNumber
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-300 bg-white text-gray-800 cursor-pointer hover:border-gray-700",
                        ].join(" ")}
                      >
                        {item}
                      </button>
                    ),
                  )
                ) : (
                  <span className="min-w-16 text-center font-pretendard text-body3 font-semibold text-gray-800">
                    {pageNumber}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handlePageChange(pageNumber + 1)}
                  disabled={!hasNextPage}
                  className={[
                    "rounded-lg border px-4 py-2 font-pretendard text-body3",
                    !hasNextPage
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 bg-white text-gray-800 cursor-pointer hover:border-gray-700",
                  ].join(" ")}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedHotel && parsedParams && (
        <HotelDetailModal
          hotel={selectedHotel}
          arrivalDate={parsedParams.arrivalDate}
          departureDate={parsedParams.departureDate}
          adults={parsedParams.adults}
          roomQty={parsedParams.roomQty}
          onClose={() => setSelectedHotel(null)}
        />
      )}
    </div>
  );
}
