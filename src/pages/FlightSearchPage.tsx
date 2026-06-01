import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchModeBar from "@/components/SearchModeBar";
import { type HotelSearchBarParams } from "@/components/HotelSearchBar";
import FilterSidebar from "@/components/flightSearch/FilterSidebar";
import FlightResultList from "@/components/flightSearch/FlightResultList";
import { buildHotelSearchParams } from "@/pages/HotelSearchPage";
import {
  searchFlightsFull,
  searchFlights,
  type FlightSearchInput,
} from "@/api/flightApi";
import {
  mapOffersToFlightItems,
  extractAirlineList,
  buildOfferMap,
  getTimeSlot,
} from "@/api/flightMapper";
import type {
  FlightOffer,
  FlightOffersResult,
  SearchFlightsFullResponse,
} from "@/types/flightOffersType";
import type { FilterState, SortOption, FlightItem } from "@/types/flightType";
import {
  parseFlightSearchParams,
  buildFlightSearchParams,
  type FlightSearchParams,
} from "@/utils/flightSearchQuery";

/**
 * FlightSearchPage
 *
 * - URL 쿼리스트링에서 검색 조건 파싱하여 자동 호출
 * - 상단 SearchBar로 재검색 가능
 * - 좌측 FilterSidebar + 우측 FlightResultList 구조
 * - 필터링 & 정렬은 클라이언트에서 수행
 * - 무한 스크롤로 다음 페이지 자동 로드
 */

/* ══════════════════════════════════════════
   헬퍼
   ══════════════════════════════════════════ */

const DEFAULT_FILTER: FilterState = {
  stops: { direct: false, oneStop: false, twoPlusStops: false },
  outboundTime: [],
  inboundTime: [],
  airlines: [],
  sameAirport: false,
};

function mapSeatClassToCabin(
  seatClass: string | null,
): FlightSearchInput["cabinClass"] {
  switch (seatClass) {
    case "프리미엄 일반석":
      return "PREMIUM_ECONOMY";
    case "비즈니스석":
      return "BUSINESS";
    case "일등석":
      return "FIRST";
    case "일반석":
    default:
      return "ECONOMY";
  }
}

/** UI SortOption → API sort 파라미터 매핑 */
const SORT_TO_API: Record<SortOption, "BEST" | "CHEAPEST" | "FASTEST"> = {
  best: "BEST",
  cheapest: "CHEAPEST",
  fastest: "FASTEST",
};

/* ══════════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════════ */

export default function FlightSearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFlightMode, setIsFlightMode] = useState(true);

  /* ── URL 쿼리스트링 → SearchBar 초기값 ── */
  const searchBarInitialValues = useMemo(
    () => parseFlightSearchParams(searchParams),
    [searchParams],
  );

  /* ── SearchBar 강제 리마운트용 key ── */
  const searchBarKey = useMemo(
    () =>
      [
        searchParams.get("fromId"),
        searchParams.get("toId"),
        searchParams.get("departDate"),
        searchParams.get("returnDate"),
        searchParams.get("tripType"),
        searchParams.get("directOnly"),
        searchParams.get("adults"),
        searchParams.get("children"),
        searchParams.get("seatClass"),
      ].join("|"),
    [searchParams],
  );

  /* ── URL 쿼리스트링 → 검색 input ── */
  const searchInput = useMemo<FlightSearchInput | null>(() => {
    const fromCity = searchParams.get("fromCity") ?? "";
    const fromCode = searchParams.get("fromCode") ?? "";
    const toCity = searchParams.get("toCity") ?? "";
    const toCode = searchParams.get("toCode") ?? "";
    const departDate = searchParams.get("departDate");
    const departureQuery = fromCity || fromCode;
    const arrivalQuery = toCity || toCode;

    if (!departureQuery || !arrivalQuery || !departDate) return null;

    return {
      departureQuery,
      arrivalQuery,
      departDate,
      returnDate: searchParams.get("returnDate") || undefined,
      adults: Number(searchParams.get("adults")) || 1,
      cabinClass: mapSeatClassToCabin(searchParams.get("seatClass")),
      stops: (searchParams.get("directOnly") === "true"
        ? "0"
        : "none") as FlightSearchInput["stops"],
    };
  }, [searchParams]);

  /* ── 무한 스크롤 상태 ── */
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accItems, setAccItems] = useState<FlightItem[]>([]);
  const [accOfferMap, setAccOfferMap] = useState<Map<string, FlightOffer>>(
    new Map(),
  );
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchIds, setSearchIds] = useState<{
    fromId: string;
    toId: string;
  } | null>(null);

  /* 검색이 바뀔 때 stale 결과 무시용 */
  const searchKeyRef = useRef(0);
  /* IntersectionObserver 콜백의 중복 호출 방지 */
  const isFetchingMoreRef = useRef(false);

  /* ── 필터 & 정렬 상태 ── */
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortOption>(() => {
    const raw = searchParams.get("sort");
    return (raw === "cheapest" || raw === "fastest" || raw === "best") ? raw : "best";
  });

  /* sentinel ref — FlightResultList 하단에 마운트 */
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ══════════════════════════════════════════
     초기 검색 (searchInput 변경 시)
     ══════════════════════════════════════════ */
  useEffect(() => {
    const currentKey = ++searchKeyRef.current;
    let cancelled = false;

    /* 상태 초기화 */
    setAccItems([]);
    setAccOfferMap(new Map());
    setPageNo(1);
    setHasMore(true);
    setSearchIds(null);
    setError(null);
    isFetchingMoreRef.current = false;

    if (!searchInput) {
      setIsLoading(false);
      return;
    }

    const run = async () => {
      await Promise.resolve();
      if (cancelled || searchKeyRef.current !== currentKey) return;

      setIsLoading(true);

      try {
        const response = (await searchFlightsFull({
          ...searchInput,
          sort: SORT_TO_API[sort],
        })) as SearchFlightsFullResponse;

        if (cancelled || searchKeyRef.current !== currentKey) return;

        const items = mapOffersToFlightItems(response.result);
        const map = buildOfferMap(response.result);

        setAccItems(items);
        setAccOfferMap(map);
        setSearchIds({ fromId: response.fromId, toId: response.toId });
        setHasMore(items.length > 0);
      } catch (err) {
        if (cancelled || searchKeyRef.current !== currentKey) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled && searchKeyRef.current === currentKey) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [searchInput, sort]);

  /* ══════════════════════════════════════════
     다음 페이지 로드
     ══════════════════════════════════════════ */
  const loadMore = useCallback(async () => {
    if (
      !searchIds ||
      !hasMore ||
      isFetchingMoreRef.current ||
      isLoading ||
      !searchInput
    )
      return;

    const currentKey = searchKeyRef.current;
    isFetchingMoreRef.current = true;
    setIsFetchingMore(true);

    const nextPage = pageNo + 1;

    try {
      const result = (await searchFlights({
        fromId: searchIds.fromId,
        toId: searchIds.toId,
        departDate: searchInput.departDate,
        returnDate: searchInput.returnDate,
        adults: searchInput.adults,
        children: searchInput.children,
        stops: searchInput.stops,
        sort: SORT_TO_API[sort],
        cabinClass: searchInput.cabinClass,
        pageNo: nextPage,
      })) as FlightOffersResult;

      if (searchKeyRef.current !== currentKey) return;

      const newItems = mapOffersToFlightItems(result);
      const newMap = buildOfferMap(result);

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setAccItems((prev) => [...prev, ...newItems]);
        setAccOfferMap((prev) => new Map([...prev, ...newMap]));
        setPageNo(nextPage);
      }
    } catch {
      /* 페이지네이션 오류는 조용히 처리 */
    } finally {
      if (searchKeyRef.current === currentKey) {
        isFetchingMoreRef.current = false;
        setIsFetchingMore(false);
      }
    }
  }, [searchIds, hasMore, isLoading, pageNo, searchInput, sort]);

  /* ══════════════════════════════════════════
     IntersectionObserver — sentinel 감지
     ══════════════════════════════════════════ */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  /* ══════════════════════════════════════════
     매핑 & 필터 & 정렬
     ══════════════════════════════════════════ */

  const airlineList = useMemo(
    () => extractAirlineList(accItems),
    [accItems],
  );

  const filteredItems = useMemo(() => {
    return accItems.filter((item) => {
      /* ── 경유 필터 ── */
      const { direct, oneStop, twoPlusStops } = filter.stops;
      const anyStopFilterOn = direct || oneStop || twoPlusStops;
      if (anyStopFilterOn) {
        const maxStops = Math.max(
          item.outbound.stops,
          item.inbound?.stops ?? 0,
        );
        const matchStop =
          (direct && maxStops === 0) ||
          (oneStop && maxStops === 1) ||
          (twoPlusStops && maxStops >= 2);
        if (!matchStop) return false;
      }

      /* ── 시간대 필터 ── */
      const offer = accOfferMap.get(item.id);
      if (filter.outboundTime.length > 0 && offer) {
        const slot = getTimeSlot(offer.segments[0].departureTime);
        if (!slot || !filter.outboundTime.includes(slot)) return false;
      }
      if (filter.inboundTime.length > 0 && offer?.segments[1]) {
        const slot = getTimeSlot(offer.segments[1].departureTime);
        if (!slot || !filter.inboundTime.includes(slot)) return false;
      }

      /* ── 항공사 필터 ── */
      if (
        filter.airlines.length > 0 &&
        !filter.airlines.includes(item.airline)
      ) {
        return false;
      }

      /* ── 출발/도착 같음 ── */
      if (filter.sameAirport && offer) {
        const depCode = offer.segments[0].departureAirport.code;
        const arrCode = offer.segments[0].arrivalAirport.code;
        if (depCode !== arrCode) return false;
      }

      return true;
    });
  }, [accItems, filter, accOfferMap]);

  /* ══════════════════════════════════════════
     핸들러
     ══════════════════════════════════════════ */

  const handleReSearch = (params: FlightSearchParams) => {
    const sp = buildFlightSearchParams(params, searchParams);
    sp.set("sort", sort);
    setSearchParams(sp);
    setFilter(DEFAULT_FILTER);
  };

  const handleSortChange = (next: SortOption) => {
    setSort(next);
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set("sort", next);
      return sp;
    }, { replace: true });
  };

  const handleCardClick = (id: string) => {
    const offer = accOfferMap.get(id);
    navigate(`/flight-detail/${encodeURIComponent(id)}`, {
      state: { offer },
    });
  };

  const handleHotelSearch = useCallback(
    (params: HotelSearchBarParams) => {
      navigate(`/hotel-search?${buildHotelSearchParams(params).toString()}`);
    },
    [navigate],
  );

  /* ══════════════════════════════════════════
     렌더
     ══════════════════════════════════════════ */

  return (
    <>
      {/* 모바일 */}
      <div className="md:hidden px-4 py-6">
        <p className="text-gray-500 text-center text-body3">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* 데스크톱 */}
      <div className="hidden md:block bg-background">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-10">
          {/* ── 모드 토글 + 검색바 ── */}
          <section className="mb-10">
            <SearchModeBar
              searchBarKey={searchBarKey}
              onFlightSearch={handleReSearch}
              onHotelSearch={handleHotelSearch}
              initialValues={searchBarInitialValues}
              onModeChange={(m) => setIsFlightMode(m === "flight")}
            />
          </section>

          {/* ── 항공편 결과 (항공편 모드일 때만) ── */}
          {isFlightMode && !searchInput ? (
            <div
              className={[
                "py-20 rounded-xl border-2 border-dashed border-gray-300",
                "bg-white text-center",
              ].join(" ")}
            >
              <p className="font-pretendard text-body2 text-gray-700 m-0">
                출발지, 도착지, 가는날을 입력해 주세요
              </p>
              <p className="font-pretendard text-body4 text-gray-500 mt-2">
                위 SearchBar에서 조건을 입력하고 검색하기 버튼을 눌러주세요.
              </p>
            </div>
          ) : isFlightMode ? (
            <section className="flex gap-6 items-start">
              <FilterSidebar
                value={filter}
                onChange={setFilter}
                airlineList={airlineList}
              />
              <FlightResultList
                flights={filteredItems}
                isLoading={isLoading}
                error={error}
                sort={sort}
                onSortChange={handleSortChange}
                onCardClick={handleCardClick}
                isFetchingMore={isFetchingMore}
                hasMore={hasMore}
                sentinelRef={sentinelRef}
              />
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
