import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/flightSearch/FilterSidebar";
import FlightResultList from "@/components/flightSearch/FlightResultList";
import { searchFlightsFull, type FlightSearchInput } from "@/api/flightApi";
import {
  mapOffersToFlightItems,
  extractAirlineList,
  buildOfferMap,
  getTimeSlot,
} from "@/api/flightMapper";
import type { SearchFlightsFullResponse } from "@/types/flightOffersType";
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
 *
 */

/* ══════════════════════════════════════════
   타입 & 헬퍼
   ══════════════════════════════════════════ */

interface ApiCallState {
  status: "idle" | "loading" | "success" | "error";
  response?: SearchFlightsFullResponse;
  error?: string;
}

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

/** FlightItem 정렬 */
function sortFlights(items: FlightItem[], sort: SortOption): FlightItem[] {
  const copy = [...items];
  switch (sort) {
    case "cheapest":
      return copy.sort((a, b) => a.price - b.price);
    case "fastest":
      return copy.sort((a, b) => totalMinutes(a) - totalMinutes(b));
    case "best":
    default:
      /* 가격 + 시간을 간단히 합산 (필요 시 가중치 조정) */
      return copy.sort(
        (a, b) =>
          a.price / 10000 +
          totalMinutes(a) / 60 -
          (b.price / 10000 + totalMinutes(b) / 60),
      );
  }
}

/** FlightItem의 총 비행시간 (분) - "2시간 20분" 파싱 */
function totalMinutes(item: FlightItem): number {
  const parse = (s: string) => {
    const h = s.match(/(\d+)시간/);
    const m = s.match(/(\d+)분/);
    return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  };
  return (
    parse(item.outbound.duration) +
    (item.inbound ? parse(item.inbound.duration) : 0)
  );
}

/* ══════════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════════ */

export default function FlightSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── URL 쿼리스트링 → SearchBar 초기값 ── */
  const searchBarInitialValues = useMemo(
    () => parseFlightSearchParams(searchParams),
    [searchParams],
  );

  /* ── SearchBar 강제 리마운트용 key ──
     URL의 검색 조건이 바뀔 때(예: 브라우저 뒤로/앞으로 가기)
     SearchBar 내부 상태를 최신 URL과 동기화하기 위해 컴포넌트를 리마운트한다.
     검색 조건과 무관한 쿼리스트링 변경(향후 추가될 정렬/필터 등)으로
     불필요하게 리마운트되지 않도록 관련 필드만 추려서 안정적인 키를 구성. */
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

    /* 필수값 하나라도 없으면 자동 호출 안 함 */
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

  /* ── API 호출 상태 ── */
  const [apiState, setApiState] = useState<ApiCallState>({ status: "idle" });

  /* ── 재호출 트리거 (디버그 패널 재호출 버튼용) ── */
  //const [retryKey, setRetryKey] = useState(0);

  /* ── 필터 & 정렬 상태 ── */
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortOption>("best");

  /* ── URL 변경 시 자동 호출 ──
     setState를 useEffect 본체가 아닌, async 함수 내부(= 다음 마이크로태스크)에서만 호출해
     cascading render 경고 회피 + 언마운트 시 결과 폐기로 race condition 방지 */
  useEffect(() => {
    let cancelled = false;
    const input = searchInput;

    const run = async () => {
      /* 첫 setState가 effect 경계 밖(await 이후)에서 일어나도록
         await Promise.resolve() 한 번 거쳐서 미룸 */
      await Promise.resolve();
      if (cancelled) return;

      /* 검색 조건이 비어있으면 idle 상태로 리셋만 */
      if (!input) {
        setApiState({ status: "idle" });
        return;
      }

      setApiState({
        status: "loading",
      });

      try {
        const response = (await searchFlightsFull(
          input,
        )) as SearchFlightsFullResponse;
        if (cancelled) return;
        setApiState({
          status: "success",
          response,
        });
      } catch (err) {
        if (cancelled) return;
        setApiState({
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [searchInput]);

  /* ══════════════════════════════════════════
     매핑 & 필터 & 정렬
     ══════════════════════════════════════════ */

  const allItems = useMemo<FlightItem[]>(() => {
    if (apiState.status !== "success" || !apiState.response) return [];
    return mapOffersToFlightItems(apiState.response.result);
  }, [apiState]);

  const airlineList = useMemo(() => extractAirlineList(allItems), [allItems]);

  /* 필터 적용 후 FlightItem[] — offer 원본이 필요한 필터(시간대)는 offerMap 활용 */
  const offerMap = useMemo(
    () =>
      apiState.status === "success" && apiState.response
        ? buildOfferMap(apiState.response.result)
        : new Map(),
    [apiState],
  );

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
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

      /* ── 시간대 필터 (원본 offer의 ISO 시간 필요) ── */
      const offer = offerMap.get(item.id);
      if (filter.outboundTime.length > 0 && offer) {
        const slot = getTimeSlot(offer.segments[0].departureTime);
        if (!slot || !filter.outboundTime.includes(slot)) return false;
      }
      if (filter.inboundTime.length > 0 && offer?.segments[1]) {
        const slot = getTimeSlot(offer.segments[1].departureTime);
        if (!slot || !filter.inboundTime.includes(slot)) return false;
      }

      /* ── 항공사 필터 (빈 배열 = 전체) ── */
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
  }, [allItems, filter, offerMap]);

  const sortedItems = useMemo(
    () => sortFlights(filteredItems, sort),
    [filteredItems, sort],
  );

  /* ══════════════════════════════════════════
     핸들러
     ══════════════════════════════════════════ */

  const handleReSearch = (params: FlightSearchParams) => {
    const sp = buildFlightSearchParams(params, searchParams);
    setSearchParams(sp);
    /* 검색 조건이 바뀌면 필터 초기화 */
    setFilter(DEFAULT_FILTER);
  };

  const handleCardClick = (id: string) => {
    console.log("[FlightCard] clicked id:", id);
    /* TODO: 상세 페이지 이동 또는 상세 조회 (getFlightDetails) */
  };

  /* ══════════════════════════════════════════
     렌더
     ══════════════════════════════════════════ */

  return (
    <>
      {/* ══════════════════════════════════════════
          모바일 (md 미만)
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        {/* TODO: 모바일 항공편 검색 화면 */}
        <p className="text-gray-500 text-center text-body3">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상)
          ══════════════════════════════════════════ */}

      <div className="hidden md:block bg-background">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-10">
          {/* ── 페이지 타이틀 ── */}
          <h1 className="font-pretendard text-title2 font-semibold text-gray-900 mb-6">
            항공편 검색
          </h1>

          {/* ── SearchBar (재검색용) ── */}
          <section className="mb-10">
            <SearchBar
              key={searchBarKey}
              onSearch={handleReSearch}
              initialValues={searchBarInitialValues}
            />
          </section>

          {/* ── 입력값 없을 때 안내 ── */}
          {!searchInput ? (
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
          ) : (
            /* ── 결과 영역: FilterSidebar + FlightResultList ── */
            <section className="flex gap-6 items-start">
              <FilterSidebar
                value={filter}
                onChange={setFilter}
                airlineList={airlineList}
              />
              <FlightResultList
                flights={sortedItems}
                isLoading={apiState.status === "loading"}
                error={apiState.status === "error" ? apiState.error : null}
                sort={sort}
                onSortChange={setSort}
                onCardClick={handleCardClick}
              />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
