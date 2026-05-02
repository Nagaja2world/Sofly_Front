import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ReadGuideBox from "@/components/flightDetail/Readguidebox";
import ProviderCard from "@/components/flightDetail/Providercard";
import ItinerarySummaryCard from "@/components/flightDetail/Itinerarysummarycard";
import Button from "@/components/common/Button";
import { getFlightDetails } from "@/api/flightApi";
import { mapOfferToItinerarySummaries, toKrwInt } from "@/api/flightMapper";
import type { FlightOffer } from "@/types/flightOffersType";

import FlowerImage from "@/assets/flower.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 라우터 state로 전달되는 데이터 (FlightSearchPage → 이 페이지) */
interface FlightDetailLocationState {
  offer?: FlightOffer;
}

/** 판매처 카드 데이터 (백엔드 응답 구조 확정 시 mapper에 추가 예정) */
interface ProviderItem {
  id: string;
  name: string;
  logoUrl?: string;
  description: string;
  price: number;
}

/* ══════════════════════════════════════════
   목업: 판매처 데이터
   - getFlightDetails 응답 구조가 확정되면 mapper로 대체
   - 현재는 offer.price 기준으로 약간씩 변동만 줘서 11개 생성
   ══════════════════════════════════════════ */

const PROVIDER_TEMPLATES = [
  { id: "myrealtrip", name: "Myrealtrip" },
  { id: "ctrip", name: "Trip.com" },
  { id: "wetour", name: "위투어" },
  { id: "jinair", name: "Jin Air" },
  { id: "myrealtrip-2", name: "Myrealtrip" },
  { id: "ctrip-2", name: "Trip.com" },
  { id: "wetour-2", name: "위투어" },
  { id: "jinair-2", name: "Jin Air" },
  { id: "myrealtrip-3", name: "Myrealtrip" },
  { id: "ctrip-3", name: "Trip.com" },
  { id: "wetour-3", name: "위투어" },
];

function generateMockProviders(basePrice: number): ProviderItem[] {
  return PROVIDER_TEMPLATES.map((tpl, i) => ({
    id: `${tpl.id}-${i}`,
    name: tpl.name,
    description: "서브 텍스트입니다",
    /* 가격은 base ± 5% 범위에서 살짝씩만 변동 */
    price: Math.round(basePrice * (0.97 + (i % 5) * 0.015)),
  }));
}

/* ══════════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════════ */

export default function FlightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  /* state로 전달된 offer (FlightSearchPage에서 navigate 시 함께 보냄) */
  const stateOffer = (location.state as FlightDetailLocationState | null)
    ?.offer;

  /* offer를 로컬 상태로 유지 — state가 사라지면 (새로고침) null */
  const [offer] = useState<FlightOffer | null>(stateOffer ?? null);

  /* 판매처 정보 — getFlightDetails 응답 받아서 채울 예정, 현재는 목업 */
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  /* ── getFlightDetails 호출 (token이 있을 때만) ──
     응답 구조가 미정이라 결과는 사용하지 않고, 호출만 시도해서
     실패해도 목업으로 fallback */
  useEffect(() => {
    if (!offer?.token) {
      /* offer 없으면 목업도 만들 수 없음 */
      return;
    }

    let cancelled = false;
    setIsLoadingProviders(true);

    const run = async () => {
      try {
        await getFlightDetails(offer.token);
        /* TODO: 응답 구조 확정 시 mapDetailsToProviders로 변환
           현재는 응답 무시하고 목업 사용 */
      } catch (err) {
        console.warn("[FlightDetail] getFlightDetails 실패, 목업 사용:", err);
      } finally {
        if (!cancelled) {
          const basePrice = toKrwInt(offer.price.total);
          setProviders(generateMockProviders(basePrice));
          setIsLoadingProviders(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [offer]);

  /* ── 일정 카드 데이터 (편도 1장, 왕복 2장) ── */
  const itineraries = useMemo(
    () => (offer ? mapOfferToItinerarySummaries(offer) : []),
    [offer],
  );

  /* ── 우측 헤더용: 도착지 도시명 + 인원/등급 요약 ──
     URL 쿼리스트링이나 offer에서 가져오기 — 현재는 마지막 segment의 도착지 사용 */
  const destinationCity = useMemo(() => {
    if (!offer || offer.segments.length === 0) return "";
    /* 가는편의 도착지가 진짜 목적지 */
    return offer.segments[0].arrivalAirport.cityName;
  }, [offer]);

  const passengerSummary = useMemo(() => {
    /* TODO: SearchBar에서 넘어온 인원/등급 정보 활용
       현재 offer에는 인원 정보가 없어서 기본값 표시 */
    const cabin =
      offer?.brandedFareInfo?.cabinClass ||
      offer?.segments?.[0]?.legs?.[0]?.cabinClass;
    const cabinLabel = cabin === "ECONOMY" ? "일반석" : cabin || "일반석";
    return `여행객 1명 ㅣ 편도 ㅣ ${cabinLabel}`;
  }, [offer]);

  /* ══════════════════════════════════════════
     offer 없음 → 안내 화면
     (새로고침으로 state가 사라진 경우)
     ══════════════════════════════════════════ */

  if (!offer) {
    return (
      <div className="hidden md:block bg-background min-h-[calc(100vh-160px)]">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-20">
          <div
            className={[
              "py-20 rounded-xl border-2 border-dashed border-gray-300",
              "bg-white text-center flex flex-col items-center gap-3",
            ].join(" ")}
          >
            <p className="font-pretendard text-body2 text-gray-700 m-0">
              항공편 정보를 불러올 수 없어요
            </p>
            <p className="font-pretendard text-body4 text-gray-500 m-0">
              검색 결과 페이지에서 항공편을 다시 선택해 주세요.
            </p>
            <div className="mt-3">
              <Button
                btnType="solid"
                onClick={() => navigate("/flight-search")}
              >
                검색 결과로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     렌더
     ══════════════════════════════════════════ */

  const handleProviderClick = (providerId: string) => {
    /* TODO: 판매처별 외부 링크로 이동 (window.open) */
    console.log("[Provider] clicked:", providerId, "for offer:", id);
  };

  return (
    <>
      {/* ══════════════════════════════════════════
          모바일 (md 미만)
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        <p className="text-gray-500 text-center text-body3">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상)
          ══════════════════════════════════════════ */}
      <div className="hidden md:block bg-background">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-10">
          {/* ── 2-column grid: 좌(메인) + 우(사이드) ── */}
          <div className="grid grid-cols-[1fr_360px] gap-8 items-start">
            {/* ══ 좌측 메인 ══ */}
            <main className="min-w-0 flex flex-col gap-3">
              {/* 섹션 타이틀 */}
              <h1 className="font-pretendard text-title2 font-semibold text-gray-900 m-0 mb-2">
                항공편 예약하기
              </h1>

              {/* 안내 박스 */}
              <ReadGuideBox />

              {/* 판매처 카드 리스트 */}
              {isLoadingProviders ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  <p className="font-pretendard text-body3 text-gray-500 m-0">
                    판매처 정보를 불러오는 중...
                  </p>
                </div>
              ) : providers.length === 0 ? (
                <p className="font-pretendard text-body3 text-gray-500 text-center py-8 m-0">
                  판매처 정보를 불러올 수 없어요
                </p>
              ) : (
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {providers.map((p) => (
                    <li key={p.id}>
                      <ProviderCard
                        id={p.id}
                        name={p.name}
                        logoUrl={p.logoUrl}
                        description={p.description}
                        price={p.price}
                        onClick={handleProviderClick}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </main>

            {/* ══ 우측 사이드 (sticky) ══ */}
            <aside className="sticky top-6 flex flex-col gap-3">
              {/* 사이드 헤더: 도착지 + 인원/등급 */}
              <div className="flex items-end justify-between gap-3 px-1">
                <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
                  {destinationCity}
                </h2>
                <span className="font-pretendard text-body5 text-gray-500 pb-1.5">
                  {passengerSummary}
                </span>
              </div>

              {/* 일정 카드 (가는편 / 오는편) */}
              {itineraries.map((itin, i) => (
                <ItinerarySummaryCard
                  key={i}
                  direction={itin.direction}
                  date={itin.date}
                  routePath={itin.routePath}
                  legs={itin.legs}
                />
              ))}
            </aside>
          </div>
          {/* ── 데코레이션: 콘텐츠 영역 우측 하단 (Footer 바로 위) ──
             absolute로 컨테이너 우측 하단에 배치.
             콘텐츠 끝나는 지점 = Footer 시작 직전이므로
             스크롤하다 페이지 끝에 도달했을 때 Footer 위에 자연스럽게 보임 */}
          <div
            aria-hidden="true"
            className={[
              "flex justify-end pointer-events-none select-none -mb-10",
            ].join(" ")}
          >
            <FlowerImage />
          </div>
        </div>
      </div>
    </>
  );
}
