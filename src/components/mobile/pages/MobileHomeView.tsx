//import { type ReactNode } from "react";
// import MobileSearchModeBar from "@/components/mobile/searchbar/MobileSearchModeBar";
import MobileAmbientEffects from "@/components/mobile/common/MobileAmbientEffects";
import HowToSection from "@/components/homepage/HowToSection";
// import { type FlightSearchParams } from "@/utils/flightSearchQuery";
// import { type HotelSearchBarParams } from "@/components/HotelSearchBar";

import moHeroSvg from "@/assets/mo_home_hero.svg";

/* ══════════════════════════════════════════
   MobileHomeView
   ══════════════════════════════════════════
   HomePage의 md:hidden 본문.
   NavBar/Footer는 NoHeaderLayout이 담당하므로 본문만 렌더.

   레이아웃 (피그마 / 데스크톱 Hero 기준):
   - Hero 일러스트 (mo_home_hero.svg) — 카피("Travel Like a Picnic")가
     이미지 안에 포함돼 있음. 데스크톱처럼 풀블리드로 꽉 채워 보여줌.
   - 모바일 검색바 (항공/호텔 토글 + 시트 입력)
   - Feature 카드 3개 세로 스택
*/

// interface FeatureCardData {
//   title: string;
//   subtitle: string;
//   bg: string;
//   illustration: ReactNode;
// }

// interface MobileHomeViewProps {
//   featureCards: FeatureCardData[];
//   // onFlightSearch: (params: FlightSearchParams) => void;
//   // onHotelSearch?: (params: HotelSearchBarParams) => void;
//   onFeatureClick?: (title: string) => void;
// }

// export default function MobileHomeView({
//   onFlightSearch,
//   onHotelSearch,
// }: MobileHomeViewProps) {
export default function MobileHomeView() {
  return (
    <div className="pb-8">
      {/* ── Hero 일러스트 (풀블리드, 데스크톱과 동일하게 카피 포함 이미지) ── */}
      {/* 카피가 SVG 안에 있으므로 좌우 패딩 없이 화면 폭을 꽉 채움 */}
      {/* 나비/꽃잎 효과를 위해 relative + overflow-hidden 컨테이너로 감쌈.
          이미지가 레이아웃 높이를 만들고(z-0), 효과 레이어를 그 위에 절대배치(z-10).
          데스크톱 HeroScene 과 동일하게 "베이스 이미지 → 그 위 효과" 순서. */}
      <div className="relative w-full overflow-hidden min-h-[220px]">
        <img
          src={moHeroSvg}
          alt="Travel Like a Picnic"
          className="relative z-0 w-full h-auto block object-cover object-center"
        />
        <div className="absolute inset-0 z-10 pointer-events-none">
          <MobileAmbientEffects particleCount={18} />
        </div>
      </div>

      {/* ── 본문(검색바·카드)은 좌우 패딩 적용 ── */}
      <div className="px-4">
        {/* 검색바 — Hero 하단에 살짝 끌어올려 데스크톱의 겹침 느낌을 약하게 재현 */}
        {/* <div className="-mt-36 relative z-10">
          <MobileSearchModeBar
            onFlightSearch={onFlightSearch}
            onHotelSearch={onHotelSearch}
          />
        </div> */}

        {/* Feature 카드 세로 스택 */}
        {/* <div className="flex flex-col gap-4 mt-8">
          {featureCards.map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              bg={card.bg}
              illustration={card.illustration}
              onClick={
                onFeatureClick ? () => onFeatureClick(card.title) : undefined
              }
            />
          ))}
        </div> */}

        {/* How It Works 섹션 */}
        <div className="-mt-36 relative z-10">
          <HowToSection />
        </div>
      </div>
    </div>
  );
}
