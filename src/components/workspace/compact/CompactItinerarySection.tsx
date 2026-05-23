import CompactItineraryCard from "./CompactItineraryCard";
import type { ItineraryDay } from "@/utils/itineraryMapper";

/* ══════════════════════════════════════════
   CompactItinerarySection
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 여행 일정 섹션.

   레이아웃 (이미지 1 기준):
   - 일차 카드(1일차, 2일차…)가 가로로 나열되고, 오른쪽으로 스크롤.
   - 한 카드 너비는 고정(288px) → 다음 카드가 살짝 보여 "더 있음"을 암시.
   - 항공 섹션은 세로 1컬럼이지만, 여행 일정은 일차가 5~7개로 늘어나므로
     세로로 쌓으면 화면이 한없이 길어짐 → 가로 스크롤이 공간 효율·탐색에 유리.

   "더보기" 토글 대신 가로 스크롤 — 일차가 곧 카드 단위라
   스크롤만으로 전체를 훑을 수 있음.
*/

interface CompactItinerarySectionProps {
  /** 일차 목록 (itineraryMapper.mapScheduleToDays 결과) */
  days: ItineraryDay[];
  /** 지도 버튼 클릭 (미지정 시 카드의 지도 버튼 숨김) */
  onMapClick?: (dayNumber: number) => void;
}

/** 한 카드 너비 (px) — 이미지 기준 288 */
const CARD_WIDTH = 288;

export default function CompactItinerarySection({
  days,
  onMapClick,
}: CompactItinerarySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      {/* ── 섹션 제목 ── */}
      <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
        여행 일정
      </h2>

      {days.length === 0 ? (
        /* ── 빈 상태 ── */
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 flex flex-col items-center gap-2 text-center">
          <p className="font-pretendard text-body3 text-gray-700 m-0">
            아직 여행 일정이 없어요
          </p>
          <p className="font-pretendard text-body4 text-gray-400 m-0">
            AI 채팅으로 일정을 만들거나 직접 추가해보세요.
          </p>
        </div>
      ) : (
        /* ── 가로 스크롤 영역 ──
            음수 마진 + 패딩으로 카드가 화면 좌우 끝까지 스크롤되게 하되,
            첫 카드 왼쪽 여백은 섹션 패딩과 맞춤.
            snap으로 카드 단위 스크롤 정렬. */
        <div
          className={[
            "flex gap-3 overflow-x-auto",
            "-mx-4 px-4 pb-1",
            "snap-x snap-mandatory",
            /* 스크롤바 최소화 — 모바일은 보통 오버레이 스크롤바 */
            "[scrollbar-width:none] [-ms-overflow-style:none]",
            "[&::-webkit-scrollbar]:hidden",
          ].join(" ")}
        >
          {days.map((day) => (
            <div
              key={day.dayNumber}
              className="snap-start shrink-0"
              style={{ width: CARD_WIDTH }}
            >
              <CompactItineraryCard
                dayNumber={day.dayNumber}
                rows={day.rows}
                onMapClick={onMapClick}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
