import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ReadGuideBox from "@/components/flightDetail/Readguidebox";
import BrandedFareCard from "@/components/flightDetail/Providercard";
import ItinerarySummaryCard from "@/components/flightDetail/Itinerarysummarycard";
import Button from "@/components/common/Button";
import { getFlightDetails } from "@/api/flightApi";
import {
  mapOfferToItinerarySummaries,
  mapDetailsToItinerarySummaries,
  toKrwInt,
} from "@/api/flightMapper";
import type { FlightOffer, FlightDetailsResponse } from "@/types/flightOffersType";

import FlowerImage from "@/assets/flower.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

/** 라우터 state로 전달되는 데이터 (FlightSearchPage → 이 페이지) */
interface FlightDetailLocationState {
  offer?: FlightOffer;
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

  /* offer를 로컬 상태로 유지 — state가 사라지면 (새로고침) null 
    TODO(API 연결 시): id로 getFlightDetails 재조회하여 offer 복원
    현재는 안내 화면(아래 if (!offer))으로 fallback */
  const [offer] = useState<FlightOffer | null>(stateOffer ?? null);

  /* 상세 API 응답 */
  const [detailsData, setDetailsData] = useState<FlightDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  /* 선택된 branded fare 토큰 */
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  /* ── getFlightDetails 호출 ── */
  useEffect(() => {
    if (!offer?.token) return;

    let cancelled = false;
    setIsLoadingDetails(true);

    const run = async () => {
      try {
        const data = await getFlightDetails(offer.token);
        if (!cancelled) {
          setDetailsData(data);
          /* 첫 번째 brandedFareOffer를 기본 선택, 없으면 기본 토큰 사용 */
          if (data.brandedFareOffers && data.brandedFareOffers.length > 0) {
            setSelectedToken(data.brandedFareOffers[0].token);
          } else {
            setSelectedToken(data.token);
          }
        }
      } catch (err) {
        console.warn("[FlightDetail] getFlightDetails 실패:", err);
      } finally {
        if (!cancelled) {
          setIsLoadingDetails(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [offer]);

  /* ── 일정 카드 데이터: 상세 API가 로드되면 상세 데이터 사용, 아니면 offer 사용 ── */
  const itineraries = useMemo(() => {
    if (detailsData?.segments?.length) return mapDetailsToItinerarySummaries(detailsData);
    if (offer) return mapOfferToItinerarySummaries(offer);
    return [];
  }, [detailsData, offer]);

  /* ── 우측 헤더용: 도착지 도시명 ── */
  const destinationCity = useMemo(() => {
    if (detailsData?.segments?.[0]) {
      return detailsData.segments[0].arrivalAirport.cityName;
    }
    if (!offer || offer.segments.length === 0) return "";
    return offer.segments[0].arrivalAirport.cityName;
  }, [detailsData, offer]);

  const passengerSummary = useMemo(() => {
    const cabin =
      detailsData?.brandedFareInfo?.cabinClass ||
      offer?.brandedFareInfo?.cabinClass ||
      offer?.segments?.[0]?.legs?.[0]?.cabinClass;
    const cabinLabel = cabin === "ECONOMY" ? "일반석" : cabin || "일반석";
    return `여행객 1명 ㅣ 편도 ㅣ ${cabinLabel}`;
  }, [detailsData, offer]);

  /* ── 가격 분해 ── */
  const priceBreakdown = useMemo(() => {
    if (!detailsData) return null;
    const pb = detailsData.priceBreakdown;
    return {
      baseFare: toKrwInt(pb.baseFare),
      tax: toKrwInt(pb.tax),
      total: toKrwInt(pb.total),
    };
  }, [detailsData]);

  /* ── 잔여 좌석 경고 ── */
  const seatsLeft = detailsData?.seatAvailability?.numberOfSeatsAvailable ?? null;

  /* ── 운임 규정 ── */
  const fareRuleFeatures = useMemo(() => {
    return detailsData?.fareRules?.featuresDisplay?.features?.slice(0, 3) ?? [];
  }, [detailsData]);

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

  const handleFareClick = (token: string) => {
    setSelectedToken(token);
    console.log("[BrandedFare] selected token:", token, "for offer:", id);
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

              {/* 브랜디드 운임 카드 리스트 */}
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  <p className="font-pretendard text-body3 text-gray-500 m-0">
                    운임 정보를 불러오는 중...
                  </p>
                </div>
              ) : detailsData && (detailsData.brandedFareOffers?.length ?? 0) > 0 ? (
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  {(detailsData.brandedFareOffers ?? []).map((fareOffer) => {
                    const includedFeatures = fareOffer.brandedFareInfo.features
                      .filter((f) => f.availability === "INCLUDED")
                      .map((f) => f.label);
                    return (
                      <li key={fareOffer.token}>
                        <BrandedFareCard
                          token={fareOffer.token}
                          fareName={fareOffer.brandedFareInfo.fareName}
                          cabinClass={fareOffer.brandedFareInfo.cabinClass}
                          fareTag={fareOffer.brandedFareInfo.fareTag}
                          includedFeatures={includedFeatures}
                          price={toKrwInt(fareOffer.priceBreakdown.total)}
                          isSelected={selectedToken === fareOffer.token}
                          onClick={handleFareClick}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : detailsData?.brandedFareInfo ? (
                <ul className="flex flex-col gap-3 list-none p-0 m-0">
                  <li>
                    <BrandedFareCard
                      token={detailsData.token}
                      fareName={detailsData.brandedFareInfo.fareName}
                      cabinClass={detailsData.brandedFareInfo.cabinClass}
                      fareTag={detailsData.brandedFareInfo.fareTag}
                      includedFeatures={
                        (detailsData.brandedFareInfo.features ?? [])
                          .filter((f) => f.availability === "INCLUDED")
                          .map((f) => f.label)
                      }
                      price={toKrwInt(detailsData.priceBreakdown.total)}
                      isSelected
                      onClick={handleFareClick}
                    />
                  </li>
                </ul>
              ) : !isLoadingDetails && !detailsData ? (
                <p className="font-pretendard text-body3 text-gray-500 text-center py-8 m-0">
                  운임 정보를 불러올 수 없어요
                </p>
              ) : null}
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

              {/* 잔여 좌석 경고 */}
              {seatsLeft !== null && seatsLeft <= 3 && (
                <div className="px-1">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-red-50 border border-red-200 font-pretendard text-body5 font-medium text-red-600">
                    잔여 {seatsLeft}석
                  </span>
                </div>
              )}

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

              {/* 가격 분해 */}
              {priceBreakdown && (
                <div className="bg-white rounded-xl border border-gray-300 px-5 py-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-pretendard text-body4 text-gray-600">기본 운임</span>
                    <span className="font-pretendard text-body4 text-gray-900">
                      ₩{priceBreakdown.baseFare.toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-pretendard text-body4 text-gray-600">세금 및 수수료</span>
                    <span className="font-pretendard text-body4 text-gray-900">
                      ₩{priceBreakdown.tax.toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-1 flex justify-between items-center">
                    <span className="font-pretendard text-body3 font-semibold text-gray-900">합계</span>
                    <span className="font-pretendard text-body3 font-semibold text-gray-900">
                      ₩{priceBreakdown.total.toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
              )}

              {/* 운임 규정 */}
              {fareRuleFeatures.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-300 px-5 py-4 flex flex-col gap-2">
                  <span className="font-pretendard text-body3 font-semibold text-gray-900">
                    운임 규정
                  </span>
                  <ul className="list-none p-0 m-0 flex flex-col gap-1">
                    {fareRuleFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span className="font-pretendard text-body4 text-gray-600">
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
          {/* ── 데코레이션 ── */}
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
