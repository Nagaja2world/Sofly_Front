import SearchBar from "@/components/SearchBar";
import FeatureCard from "@/components/homepage/FeatureCard";

import heroSvg from "@/assets/hero.svg";
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

/* ── 홈 페이지 ── */
export default function HomePage() {
  const handleSearch = (params: { tripType: string; directOnly: boolean }) => {
    // TODO: 검색 결과 페이지 이동
    console.log("search:", params);
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
        <img
          src={heroSvg}
          alt="Travel Like a Picnic"
          className="w-full h-auto block"
        />

        {/* ── SearchBar: 고정 음수 마진으로 Hero 하단에 겹침 ── */}
        <div className="-mt-[3.5vw] z-10 px-4 relative">
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
