import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import SearchModeBar from "@/components/SearchModeBar";
import MobileHomeView from "@/components/mobile/pages/MobileHomeView";
import { type HotelSearchBarParams } from "@/components/HotelSearchBar";
import { buildHotelSearchParams } from "@/pages/HotelSearchPage";
import AmbientBackground from "@/components/homepage/AmbientBackground";
import HeroScene from "@/components/homepage/HeroScene";
import HowToSection from "@/components/homepage/HowToSection";
import useAuthStore, { OAUTH_URLS } from "@/store/useAuthStore";
import {
  buildFlightSearchQuery,
  type FlightSearchParams,
} from "@/utils/flightSearchQuery";

// import HomeCard1Img from "@/assets/home_card_1_img.svg?react";
// import HomeCard2Img from "@/assets/home_card_2_img.svg?react";
// import HomeCard3Img from "@/assets/home_card_3_img.svg?react";

/* ── 카드 데이터 ── */
// const featureCards = [
//   {
//     title: "Search Flight",
//     subtitle: "원하는 일정, 간편하게 찾기",
//     bg: "#FFF6D6",
//     illustration: <HomeCard1Img />,
//   },
//   {
//     title: "Plan Itineraries",
//     subtitle: "AI로 빠르게 여행 계획하기",
//     bg: "#EEF5F9",
//     illustration: <HomeCard2Img />,
//   },
//   {
//     title: "Track Your Journey",
//     subtitle: "나의 여행, 정복도를 확인해보세요",
//     bg: "linear-gradient(180deg, rgba(233,245,244,0.5) 0%, #E9F5F4 100%)",
//     illustration: <HomeCard3Img />,
//   },
// ];

/* ── 홈 페이지 ── */
export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuthStore();

  /* 로그인 상태면 프로필 페이지로 이동 */
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/profile", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSearch = (params: FlightSearchParams) => {
    const qs = buildFlightSearchQuery(params);
    navigate(`/flight-search?${qs}`);
  };

  const handleHotelSearch = useCallback(
    (params: HotelSearchBarParams) => {
      navigate(`/hotel-search?${buildHotelSearchParams(params).toString()}`);
    },
    [navigate],
  );

  /* 소셜 로그인: 백엔드 OAuth URL로 리다이렉트 */
  const handleKakaoLogin = () => {
    window.location.href = OAUTH_URLS.kakao;
  };

  const handleGoogleLogin = () => {
    window.location.href = OAUTH_URLS.google;
  };

  const handleNaverLogin = () => {
    window.location.href = OAUTH_URLS.naver;
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
      <div className="md:hidden">
        <MobileHomeView
        //featureCards={featureCards}
        // onFlightSearch={handleSearch}
        // onHotelSearch={handleHotelSearch}
        />
      </div>

      {/* ══════════════════════════════════════════
          데스크톱 (md 이상): Hero + SearchBar 겹침 레이아웃
          ══════════════════════════════════════════ */}
      <div className="hidden md:block relative">
        {/* 전체 페이지를 감싸는 앰비언트 배경 (그라데이션 메쉬 + 노이즈) */}
        <AmbientBackground />

        {/* ── 인터랙티브 히어로 (원본 SVG + 파티클 + 나비 + 패럴랙스) ── */}
        <div className="w-full h-[374px] overflow-hidden relative">
          <HeroScene />
        </div>

        {/* ── Header (Hero 위에 오버레이) ── */}
        <div className="-mt-[374px] w-full relative z-30">
          <div className="max-w-[1200px] w-full mx-auto px-4">
            <Header
              variant={isLoggedIn ? "login" : "default"}
              onKakaoLogin={handleKakaoLogin}
              onGoogleLogin={handleGoogleLogin}
              onNaverLogin={handleNaverLogin}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* ── SearchModeBar: Hero 하단에 겹침, fade-in
            드롭다운(공항/캘린더/탑승객)이 아래 Feature Cards 위로 떠야 하므로 z-40 ── */}
        <motion.div
          className="mt-[220px] z-40 px-4 relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          <div className="max-w-[1200px] w-full mx-auto">
            <SearchModeBar
              onFlightSearch={handleSearch}
              onHotelSearch={handleHotelSearch}
            />
          </div>
        </motion.div>

        {/* ── How It Works 섹션 ── */}
        <div className="px-4 relative">
          <div className="max-w-[1200px] w-full mx-auto mt-10 pt-15 pb-44">
            <HowToSection />
          </div>
        </div>
      </div>
    </>
  );
}
