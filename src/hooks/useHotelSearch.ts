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
          setState({
            hotels: offersRes.data?.hotels ?? [],
            totalCount: offersRes.data?.count ?? 0,
            sortOptions: sortRes,
            filterOptions: filterRes,
            isLoading: false,
            error: null,
          });
        } else {
          const offersRes = await searchHotelOffers(params);
          setState((prev) => ({
            ...prev,
            hotels: offersRes.data?.hotels ?? [],
            totalCount: offersRes.data?.count ?? 0,
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
