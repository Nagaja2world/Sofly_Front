import { useState, useCallback, useRef } from "react";
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
  isLoading: boolean; // 초기 검색 로딩
  isFetchingMore: boolean; // 다음 페이지 로딩
  hasMore: boolean;
  error: string | null;
}

const INITIAL: HotelSearchState = {
  hotels: [],
  totalCount: 0,
  sortOptions: [],
  filterOptions: [],
  isLoading: false,
  isFetchingMore: false,
  hasMore: false,
  error: null,
};

export function useHotelSearch() {
  const [state, setState] = useState<HotelSearchState>(INITIAL);

  /* 현재 검색 조건(페이지 제외) — loadMore에서 재사용 */
  const paramsRef = useRef<HotelSearchInput | null>(null);
  const pageRef = useRef(1);
  /* 검색이 바뀌면 진행 중이던 응답을 무시 */
  const reqIdRef = useRef(0);
  const fetchingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  /* 누적된 호텔 id — 페이지 간 중복 제거용 */
  const seenIdsRef = useRef<Set<number>>(new Set());

  /** 새 검색 — 1페이지 + 정렬/필터 옵션을 함께 로드하고 누적 상태를 초기화 */
  const search = useCallback(async (params: HotelSearchInput) => {
    const reqId = ++reqIdRef.current;
    paramsRef.current = params;
    pageRef.current = 1;
    fetchingMoreRef.current = false;
    hasMoreRef.current = false;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [offersRes, sortRes, filterRes] = await Promise.all([
        searchHotelOffers({ ...params, pageNumber: 1 }),
        fetchHotelSortOptions(params),
        fetchHotelFilterOptions(params),
      ]);
      if (reqIdRef.current !== reqId) return;

      const hotels = offersRes.data?.hotels ?? [];
      seenIdsRef.current = new Set(hotels.map((h) => h.hotel_id));
      const hasMore = hotels.length > 0;
      hasMoreRef.current = hasMore;
      // filter의 nbResultsTotal은 날짜 무관 전체 수라 더 큼 → offers count(예약 가능 수) 우선
      const totalCount =
        offersRes.data?.count || filterRes.totalCount || hotels.length;

      setState({
        hotels,
        totalCount,
        sortOptions: sortRes,
        filterOptions: filterRes.categories,
        isLoading: false,
        isFetchingMore: false,
        hasMore,
        error: null,
      });
    } catch (err) {
      if (reqIdRef.current !== reqId) return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        hasMore: false,
        error: err instanceof Error ? err.message : "검색 중 오류가 발생했어요",
      }));
    }
  }, []);

  /** 다음 페이지를 불러와 기존 목록에 이어 붙임 (무한 스크롤) */
  const loadMore = useCallback(async () => {
    if (fetchingMoreRef.current || !hasMoreRef.current || !paramsRef.current) {
      return;
    }
    const reqId = reqIdRef.current;
    const params = paramsRef.current;
    const nextPage = pageRef.current + 1;
    fetchingMoreRef.current = true;
    setState((prev) => ({ ...prev, isFetchingMore: true }));

    try {
      const offersRes = await searchHotelOffers({
        ...params,
        pageNumber: nextPage,
      });
      if (reqIdRef.current !== reqId) return;

      const newHotels = offersRes.data?.hotels ?? [];
      const fresh = newHotels.filter((h) => !seenIdsRef.current.has(h.hotel_id));

      if (fresh.length === 0) {
        // 새로 받은 게 없으면(빈 페이지 or 중복) 끝
        hasMoreRef.current = false;
        setState((prev) => ({ ...prev, hasMore: false }));
        return;
      }

      fresh.forEach((h) => seenIdsRef.current.add(h.hotel_id));
      pageRef.current = nextPage;
      hasMoreRef.current = true;
      setState((prev) => ({
        ...prev,
        hotels: [...prev.hotels, ...fresh],
        hasMore: true,
      }));
    } catch {
      /* 페이지네이션 오류는 조용히 처리 (다음 스크롤에 재시도) */
    } finally {
      if (reqIdRef.current === reqId) {
        fetchingMoreRef.current = false;
        setState((prev) => ({ ...prev, isFetchingMore: false }));
      }
    }
  }, []);

  return { ...state, search, loadMore };
}
