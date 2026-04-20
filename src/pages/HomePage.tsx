import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/common/Header";
import SearchBar from "@/components/SearchBar";
import FeatureCard from "@/components/homepage/FeatureCard";
import useAuthStore, { OAUTH_URLS } from "@/store/useAuthStore";
import type { Airport } from "@/components/searchbar/AirportSearchDropdown";
import type { DateRange } from "@/components/searchbar/CalendarDropdown";
import type { PassengerSeatData } from "@/components/searchbar/PassengerSeatDropdown";

import heroSvg from "@/assets/home_hero.svg";
import HomeCard1Img from "@/assets/home_card_1_img.svg?react";
import HomeCard2Img from "@/assets/home_card_2_img.svg?react";
import HomeCard3Img from "@/assets/home_card_3_img.svg?react";

/* ── 카드 데이터 ── */
const featureCards = [
  {
    title: "Search Flight",
    subtitle: "원하는 일정, 간편하게 찾기",
    bg: "#FFF6D6",
    illustration: <HomeCard1Img />,
  },
  {
    title: "Plan Itineraries",
    subtitle: "AI로 빠르게 여행 계획하기",
    bg: "#EEF5F9",
    illustration: <HomeCard2Img />,
  },
  {
    title: "Track Your Journey",
    subtitle: "나의 여행, 정복도를 확인해보세요",
    bg: "linear-gradient(180deg, rgba(233,245,244,0.5) 0%, #E9F5F4 100%)",
    illustration: <HomeCard3Img />,
  },
];

/* ── Date → "yyyy-MM-dd" 포맷 ── */
function formatDate(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ── SearchBar 파라미터 → URL 쿼리스트링 변환 ── */
function buildFlightSearchQuery(params: {
  tripType: string;
  directOnly: boolean;
  departure: Airport | null;
  arrival: Airport | null;
  dateRange: DateRange;
  passenger: PassengerSeatData;
}): string {
  const sp = new URLSearchParams();
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
  const departStr = formatDate(params.dateRange.start);
  const returnStr = formatDate(params.dateRange.end);
  if (departStr) sp.set("departDate", departStr);
  if (returnStr) sp.set("returnDate", returnStr);
  sp.set("adults", String(params.passenger.adults));
  sp.set("children", String(params.passenger.children));
  sp.set("seatClass", params.passenger.seatClass);
  return sp.toString();
}

/* ── 홈 페이지 ── */
export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuthStore();

  /* 🌟로그인 상태면 프로필 페이지로 이동 */
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/profile", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSearch = (params: {
    tripType: string;
    directOnly: boolean;
    departure: Airport | null;
    arrival: Airport | null;
    dateRange: DateRange;
    passenger: PassengerSeatData;
  }) => {
    const qs = buildFlightSearchQuery(params);
    navigate(`/flight-search?${qs}`);
  };

  /* 소셜 로그인: 백엔드 OAuth URL로 리다이렉트 */
  const handleKakaoLogin = () => {
    window.location.href = OAUTH_URLS.kakao;
  };

  const handleGoogleLogin = () => {
    window.location.href = OAUTH_URLS.google;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* ── Hero + SearchBar ── */}
      {/* 데스크톱: SearchBar가 Hero 하단에 겹침 / 모바일: 겹치지 않고 이어짐 */}
      {/* ══════════════════════════════════════════
          모바일 (md 미만): 별도 모바일 컴포넌트 렌더링
          ══════════════════════════════════════════ */}
      <div className="md:hidden px-4 py-6">
        {/* TODO: 모바일 전용 컴포넌트로 교체 예정 */}
        {/* <MobileSearchBar /> */}
        {/* <MobileFeatureCards /> */}
        <p className="text-gray-500 text-center text-body3">
          모바일 화면은 준비 중입니다.
        </p>
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상): Hero + SearchBar 겹침 레이아웃
          ══════════════════════════════════════════ */}
      <div className="hidden md:block">
        {/* ── Hero 이미지 ── */}
        <div className="w-full h-[374px] overflow-hidden">
          <img
            src={heroSvg}
            alt="Travel Like a Picnic"
            className="w-full h-full object-cover block"
          />
        </div>

        {/* ── Header (login 상태, 흰 배경) ── */}
        <div className="-mt-[374px] w-full bg-background relative z-20">
          <div className="max-w-[1200px] w-full mx-auto px-4">
            {/* <Header variant="default" /> */}
            <Header
              variant={isLoggedIn ? "login" : "default"}
              onKakaoLogin={handleKakaoLogin}
              onGoogleLogin={handleGoogleLogin}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* ── SearchBar: 고정 음수 마진으로 Hero 하단에 겹침 ── */}
        <div className="mt-[220px] z-10 px-4 relative">
          <div className="max-w-[1200px] w-full mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        {/* ── Feature Cards ── */}
        <div className="px-4">
          <div className="max-w-[1200px] w-full mx-auto pt-12.5 pb-44">
            <div className="flex gap-6">
              {featureCards.map((card) => (
                <FeatureCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
