import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import Button from "@/components/common/Button";
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

/**
 * FlightSearchPage
 *
 * - URL 쿼리스트링에서 검색 조건 자동 파싱하여 즉시 호출
 * - FilterSidebar + FlightResultList 실제 UI
 * - ?debug=true 시 하단에 디버그 패널 표시 (원본 응답 + 복사 버튼)
 * - 필터링 & 정렬은 클라이언트에서 수행
 *
 * 주의: FilterSidebar/FlightResultList import 경로는 실제 프로젝트 위치에 맞게 조정.
 */

/* ══════════════════════════════════════════
   타입 & 헬퍼
   ══════════════════════════════════════════ */

interface ApiCallState {
  status: "idle" | "loading" | "success" | "error";
  durationMs?: number;
  requestInput?: FlightSearchInput;
  response?: SearchFlightsFullResponse;
  error?: string;
  timestamp?: string;
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

  const debugMode = searchParams.get("debug") === "true";

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
  const [retryKey, setRetryKey] = useState(0);

  /* ── 필터 & 정렬 상태 ── */
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortOption>("best");

  /* ── URL 변경 시 자동 호출 ──
     setState를 useEffect 본체가 아닌, async 함수 내부(= 다음 마이크로태스크)에서만 호출해
     cascading render 경고 회피 + 언마운트 시 결과 폐기로 race condition 방지 */
  useEffect(() => {
    if (!searchInput) return;

    let cancelled = false;
    const startTime = performance.now();
    const input = searchInput;

    const run = async () => {
      /* 첫 setState가 effect 경계 밖(await 이후)에서 일어나도록
         await Promise.resolve() 한 번 거쳐서 미룸 */
      await Promise.resolve();
      if (cancelled) return;
      setApiState({
        status: "loading",
        requestInput: input,
        timestamp: new Date().toLocaleTimeString("ko-KR"),
      });

      try {
        const response = (await searchFlightsFull(
          input,
        )) as SearchFlightsFullResponse;
        if (cancelled) return;
        setApiState({
          status: "success",
          durationMs: Math.round(performance.now() - startTime),
          requestInput: input,
          response,
          timestamp: new Date().toLocaleTimeString("ko-KR"),
        });
      } catch (err) {
        if (cancelled) return;
        setApiState({
          status: "error",
          durationMs: Math.round(performance.now() - startTime),
          requestInput: input,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toLocaleTimeString("ko-KR"),
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [searchInput, retryKey]);

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

  /** SearchBar 재검색 — URL 갱신 → useEffect에서 자동 호출 */
  const handleReSearch = (params: {
    tripType: string;
    directOnly: boolean;
    departure: { id: string; code: string; cityName: string } | null;
    arrival: { id: string; code: string; cityName: string } | null;
    dateRange: { start: Date | null; end: Date | null };
    passenger: { adults: number; children: number; seatClass: string };
  }) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tripType", params.tripType);
    sp.set("directOnly", String(params.directOnly));
    if (params.departure) {
      sp.set("fromId", params.departure.id);
      sp.set("fromCode", params.departure.code);
      sp.set("fromCity", params.departure.cityName);
    }
    if (params.arrival) {
      sp.set("toId", params.arrival.id);
      sp.set("toCode", params.arrival.code);
      sp.set("toCity", params.arrival.cityName);
    }
    const fmt = (d: Date | null) => {
      if (!d) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const ds = fmt(params.dateRange.start);
    const rs = fmt(params.dateRange.end);
    if (ds) sp.set("departDate", ds);
    else sp.delete("departDate");
    if (rs) sp.set("returnDate", rs);
    else sp.delete("returnDate");
    sp.set("adults", String(params.passenger.adults));
    sp.set("children", String(params.passenger.children));
    sp.set("seatClass", params.passenger.seatClass);
    setSearchParams(sp);
    /* 필터 초기화 (검색 조건이 바뀌면 필터도 리셋) */
    setFilter(DEFAULT_FILTER);
  };

  const handleCardClick = (id: string) => {
    console.log("[FlightCard] clicked id:", id);
    /* TODO: 상세 페이지 이동 또는 상세 조회 (getFlightDetails) */
  };

  const toggleDebug = () => {
    const sp = new URLSearchParams(searchParams);
    if (debugMode) sp.delete("debug");
    else sp.set("debug", "true");
    setSearchParams(sp);
  };

  const handleRetry = () => setRetryKey((k) => k + 1);

  /* ══════════════════════════════════════════
     렌더
     ══════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* ── 페이지 헤더 ── */}
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
              항공편 검색
            </h1>
            {apiState.requestInput && (
              <p className="font-pretendard text-body3 text-gray-600 mt-2">
                {apiState.requestInput.departureQuery} →{" "}
                {apiState.requestInput.arrivalQuery} ·{" "}
                {apiState.requestInput.departDate}
                {apiState.requestInput.returnDate &&
                  ` ~ ${apiState.requestInput.returnDate}`}{" "}
                · 성인 {apiState.requestInput.adults}명 ·{" "}
                {apiState.requestInput.cabinClass}
              </p>
            )}
          </div>
          <Button btnType="text" onClick={toggleDebug}>
            {debugMode ? "🔧 디버그 끄기" : "🔧 디버그 켜기"}
          </Button>
        </header>

        {/* ── SearchBar (재검색용) ── */}
        <section className="mb-8">
          <SearchBar onSearch={handleReSearch} />
        </section>

        {/* ── 입력값 없을 때 안내 ── */}
        {!searchInput && (
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
        )}

        {/* ── 실제 UI: FilterSidebar + FlightResultList ── */}
        {searchInput && (
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

        {/* ══════════════════════════════════════
            디버그 패널 (?debug=true일 때만)
            ══════════════════════════════════════ */}
        {debugMode && (
          <DebugPanel
            apiState={apiState}
            onRetry={handleRetry}
            allItemsCount={allItems.length}
            filteredItemsCount={filteredItems.length}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   디버그 패널 (토글)
   ══════════════════════════════════════════ */

interface DebugPanelProps {
  apiState: ApiCallState;
  onRetry: () => void;
  allItemsCount: number;
  filteredItemsCount: number;
}

function DebugPanel({
  apiState,
  onRetry,
  allItemsCount,
  filteredItemsCount,
}: DebugPanelProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const accessToken = localStorage.getItem("accessToken");
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const copyToClipboard = async (data: unknown, label: string) => {
    if (data === null || data === undefined) {
      setCopyFeedback(`${label}: 데이터 없음`);
      setTimeout(() => setCopyFeedback(null), 2000);
      return;
    }
    const text =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} 복사됨 ✓ (${text.length.toLocaleString()}자)`);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
      setCopyFeedback(`${label} 복사 실패`);
    }
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const offers = apiState.response?.result?.data?.flightOffers;
  const offerCount = Array.isArray(offers) ? offers.length : 0;

  return (
    <section className="mt-10 bg-white rounded-2xl border-2 border-dashed border-gray-400 p-6 shadow-sm">
      <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0 mb-4">
        🔧 디버그 패널
      </h2>

      {/* ── 환경 정보 ── */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-mono text-body4">
          <dt className="text-gray-600">API_BASE</dt>
          <dd className="text-gray-900 break-all">
            {apiBase || (
              <span className="text-red-500">(VITE_API_BASE_URL 미설정)</span>
            )}
          </dd>
          <dt className="text-gray-600">accessToken</dt>
          <dd className="text-gray-900">
            {accessToken ? (
              <span className="text-green-600">
                ✓ 저장됨 ({accessToken.slice(0, 12)}...
                {accessToken.slice(-8)})
              </span>
            ) : (
              <span className="text-red-500">✗ 없음</span>
            )}
          </dd>
          <dt className="text-gray-600">status</dt>
          <dd>
            <StatusBadge status={apiState.status} /> {apiState.timestamp}{" "}
            {apiState.durationMs !== undefined && (
              <span className="text-gray-500">{apiState.durationMs}ms</span>
            )}
          </dd>
          <dt className="text-gray-600">counts</dt>
          <dd className="text-gray-900">
            offers={offerCount} · mapped={allItemsCount} · filtered=
            {filteredItemsCount}
          </dd>
        </dl>
      </div>

      {/* ── 액션 버튼 ── */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <Button
          btnType="outlined"
          onClick={onRetry}
          disabled={apiState.status === "loading"}
        >
          🔄 재호출
        </Button>
        {apiState.status === "success" && (
          <>
            <CopyButton
              label="전체 응답"
              onClick={() => copyToClipboard(apiState.response, "전체 응답")}
            />
            <CopyButton
              label="flightOffers[0]"
              disabled={offerCount === 0}
              onClick={() =>
                copyToClipboard(offers?.[0] ?? null, "flightOffers[0]")
              }
            />
            <CopyButton
              label="전체 flightOffers"
              disabled={offerCount === 0}
              onClick={() => copyToClipboard(offers ?? null, "flightOffers")}
            />
            <CopyButton
              label="Request Input"
              onClick={() =>
                copyToClipboard(apiState.requestInput, "Request Input")
              }
            />
          </>
        )}
        {copyFeedback && (
          <span className="font-pretendard text-body5 text-green-600 ml-2">
            {copyFeedback}
          </span>
        )}
      </div>

      {/* ── 요청 & 응답 블록 ── */}
      {apiState.requestInput && (
        <DebugBlock
          title="Request Input"
          content={apiState.requestInput}
          variant="info"
        />
      )}
      {apiState.status === "error" && apiState.error && (
        <DebugBlock title="Error" content={apiState.error} variant="error" />
      )}
      {apiState.status === "success" && (
        <DebugBlock
          title="Response"
          content={apiState.response}
          variant="success"
        />
      )}
    </section>
  );
}

/* ══════════════════════════════════════════
   디버그 서브 컴포넌트
   ══════════════════════════════════════════ */

function StatusBadge({ status }: { status: ApiCallState["status"] }) {
  const config = {
    idle: { label: "대기", cls: "bg-gray-200 text-gray-700" },
    loading: { label: "로딩", cls: "bg-blue-100 text-blue-700" },
    success: { label: "성공", cls: "bg-green-100 text-green-700" },
    error: { label: "실패", cls: "bg-red-100 text-red-700" },
  }[status];
  return (
    <span
      className={[
        "px-2 py-0.5 rounded-full font-pretendard text-body5 font-semibold",
        config.cls,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

function CopyButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-3 py-1.5 rounded-md border cursor-pointer",
        "font-pretendard text-body5 transition-all duration-150",
        disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:border-gray-400",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function DebugBlock({
  title,
  content,
  variant,
}: {
  title: string;
  content: unknown;
  variant: "info" | "success" | "error";
}) {
  const variantCls = {
    info: "bg-gray-50 border-gray-300",
    success: "bg-green-50 border-green-300",
    error: "bg-red-50 border-red-300",
  }[variant];

  const text =
    typeof content === "string" ? content : JSON.stringify(content, null, 2);

  return (
    <div className="mb-3">
      <p className="font-pretendard text-body4 font-semibold text-gray-700 m-0 mb-1.5">
        {title}
      </p>
      <pre
        className={[
          "rounded-lg border p-3",
          "font-mono text-body5 text-gray-900",
          "overflow-x-auto max-h-[400px] overflow-y-auto",
          "whitespace-pre-wrap break-all",
          variantCls,
        ].join(" ")}
      >
        {text}
      </pre>
    </div>
  );
}
