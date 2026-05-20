import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchModeBar from "@/components/SearchModeBar";
import HotelCard from "@/components/hotel/HotelCard";
import HotelFilterPanel from "@/components/hotel/HotelFilterPanel";
import { useHotelSearch } from "@/hooks/useHotelSearch";
import { type HotelSearchBarParams } from "@/components/HotelSearchBar";
import {
  type FlightSearchParams,
  buildFlightSearchParams,
} from "@/utils/flightSearchQuery";

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

  const parsedParams = parseParams(searchParams);
  const sortBy = searchParams.get("sortBy") ?? "price";
  const filtersParam = searchParams.get("filters") ?? "";
  const selectedFilters = filtersParam ? filtersParam.split(",") : [];

  const { hotels, totalCount, sortOptions, filterOptions, isLoading, error, search } =
    useHotelSearch();

  /* 첫 로드 및 URL 파라미터 변경 시 검색 */
  useEffect(() => {
    if (!parsedParams) return;
    search(
      {
        destId: parsedParams.destId,
        searchType: parsedParams.searchType,
        arrivalDate: parsedParams.arrivalDate,
        departureDate: parsedParams.departureDate,
        adults: parsedParams.adults,
        roomQty: parsedParams.roomQty,
        sortBy,
        categoriesFilter: filtersParam || undefined,
        currencyCode: "KRW",
        languageCode: "ko",
      },
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsedParams?.destId,
    parsedParams?.arrivalDate,
    parsedParams?.departureDate,
  ]);

  /* 정렬/필터 변경 */
  useEffect(() => {
    if (!parsedParams) return;
    search(
      {
        destId: parsedParams.destId,
        searchType: parsedParams.searchType,
        arrivalDate: parsedParams.arrivalDate,
        departureDate: parsedParams.departureDate,
        adults: parsedParams.adults,
        roomQty: parsedParams.roomQty,
        sortBy,
        categoriesFilter: filtersParam || undefined,
        currencyCode: "KRW",
        languageCode: "ko",
      },
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, filtersParam]);

  const handleSortChange = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sortBy", id);
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
      return next;
    });
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
              value={sortBy}
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
          {filterOptions.length > 0 && (
            <HotelFilterPanel
              filterOptions={filterOptions}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
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
              <HotelCard key={hotel.hotel_id} hotel={hotel} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
