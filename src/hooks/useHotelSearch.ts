import { useState, useCallback } from "react";
import {
  searchHotelOffers,
  fetchHotelSortOptions,
  fetchHotelFilterOptions,
  type HotelOfferItem,
  type HotelSortOption,
  type HotelFilterCategory,
  type HotelSearchInput,
} from "@/api/hotelApi";

interface HotelSearchState {
  hotels: HotelOfferItem[];
  totalCount: number;
  sortOptions: HotelSortOption[];
  filterOptions: HotelFilterCategory[];
  isLoading: boolean;
  error: string | null;
}

const INITIAL: HotelSearchState = {
  hotels: [],
  totalCount: 0,
  sortOptions: [],
  filterOptions: [],
  isLoading: false,
  error: null,
};

export function useHotelSearch() {
  const [state, setState] = useState<HotelSearchState>(INITIAL);

  /** isNewSearch=true → sort/filter options도 함께 로드 (첫 검색 or 조건 변경) */
  const search = useCallback(
    async (params: HotelSearchInput, isNewSearch = true) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        if (isNewSearch) {
          const [offersRes, sortRes, filterRes] = await Promise.all([
            searchHotelOffers(params),
            fetchHotelSortOptions(params),
            fetchHotelFilterOptions(params),
          ]);
          // offers meta "N properties"가 실제 예약 가능 수 — filter의 nbResultsTotal은 날짜 무관 전체 수라 더 클 수 있음
          const totalCount =
            offersRes.data?.count ||
            filterRes.totalCount ||
            0;
          setState({
            hotels: offersRes.data?.hotels ?? [],
            totalCount,
            sortOptions: sortRes,
            filterOptions: filterRes.categories,
            isLoading: false,
            error: null,
          });
        } else {
          const offersRes = await searchHotelOffers(params);
          setState((prev) => ({
            ...prev,
            hotels: offersRes.data?.hotels ?? [],
            // totalCount는 초기 검색 값을 유지 — 페이지별 API 응답은 현재 페이지 수만 반환할 수 있음
            isLoading: false,
          }));
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            err instanceof Error ? err.message : "검색 중 오류가 발생했어요",
        }));
      }
    },
    [],
  );

  return { ...state, search };
}
