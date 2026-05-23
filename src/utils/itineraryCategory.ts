import type { ItineraryCategory } from "@/utils/itineraryMapper";
/* ══════════════════════════════════════════
   itineraryCategory
   ══════════════════════════════════════════
   일정 카테고리 → 한글 라벨 + 배지 색상.
   데스크톱 ItineraryDayCard와 모바일 CompactItineraryCard가 공용 사용.

   색상은 Tailwind 기본 팔레트의 50/600/200 계열을 직접 클래스로 지정.
   (프로젝트 토큰에 카테고리색이 따로 없으므로 명시적으로 둠)
*/

export interface CategoryStyle {
  /** 한글 라벨 */
  label: string;
  /** 배지 배경 클래스 */
  badgeBg: string;
  /** 배지 글자색 클래스 */
  badgeText: string;
}

const CATEGORY_STYLE: Record<ItineraryCategory, CategoryStyle> = {
  TRANSPORT: {
    label: "교통",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
  },
  ACCOMMODATION: {
    label: "숙소",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
  },
  RESTAURANT: {
    label: "식당",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
  },
  CAFE: {
    label: "카페",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  ATTRACTION: {
    label: "관광",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
  },
};

/** 카테고리 → 스타일. 알 수 없는 값이면 관광으로 폴백. */
export function getCategoryStyle(category?: string): CategoryStyle {
  return (
    CATEGORY_STYLE[category as ItineraryCategory] ?? CATEGORY_STYLE.ATTRACTION
  );
}
