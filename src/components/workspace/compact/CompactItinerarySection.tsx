import { useRef, useState, useCallback, useEffect } from "react";
import CompactItineraryCard from "./CompactItineraryCard";
import CompactDayMapModal from "./CompactDayMapModal";
import NarrowLeftIcon from "@/assets/narrow-left.svg?react";
import NarrowRightIcon from "@/assets/narrow-right.svg?react";
import type { ItineraryDay } from "@/utils/itineraryMapper";
import type { ItineraryRow } from "@/components/workspace/ItineraryDayCard";
import type { ScheduleCategory } from "@/api/scheduleApi";

/* ══════════════════════════════════════════
   CompactItinerarySection
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 여행 일정 섹션.

   레이아웃:
   - 일차 카드(1일차, 2일차…)가 가로로 나열되고, 오른쪽으로 스크롤.
   - 한 카드 너비는 고정(288px) → 다음 카드가 살짝 보여 "더 있음"을 암시.
   - 항공 섹션은 세로 1컬럼이지만, 여행 일정은 일차가 5~7개로 늘어나므로
     세로로 쌓으면 화면이 한없이 길어짐 → 가로 스크롤이 공간 효율·탐색에 유리.

   "더보기" 토글 대신 가로 스크롤 — 일차가 곧 카드 단위라
   스크롤만으로 전체를 훑을 수 있음.

   ── 지도 보기 ──
   각 일차 카드의 "지도" 버튼을 누르면 CompactDayMapModal(전체화면 모달)이
   열려 그 일차의 장소를 지도에 핀으로 표시. 모달 상태는 이 섹션이 직접 관리.

   ── 편집/추가/삭제 ──
   CompactItineraryCard가 보기/편집 모드를 자체적으로 가지며, 편집 결과는
   onSaveDay(dayNumber, rows)로 부모에 전달 → useSchedule.handleSaveItineraryDay.
   삭제는 행 단위로 onSaveDay를 통해 처리(해당 행을 제외한 rows 저장).

   ── 마우스 환경 보강 ──
   compact UI는 창 폭 768px 미만이면 무조건 뜨므로(좁힌 데스크톱 창 포함),
   터치가 없는 마우스 사용자도 가로 스크롤을 써야 함. 터치처럼 쓸어넘길
   수단이 없으므로 다음을 추가:
   - 좌우 화살표 버튼: 한 번에 카드 한 장(+gap)만큼 스크롤.
   - 양 끝 그라데이션 페이드: "더 있음" 시각 단서.
   - 마우스 휠(세로) → 가로 스크롤 변환.
   화살표·페이드는 hover 가능한 기기(=마우스)에서만 노출 → 모바일 터치
   경험은 기존 그대로. hover 판정은 matchMedia('(hover: hover)')로 1회.
   스크롤이 양 끝에 닿으면 해당 화살표/페이드를 숨김.
*/

interface CompactItinerarySectionProps {
  /** 일차 목록 (itineraryMapper.mapScheduleToDays 결과) */
  days: ItineraryDay[];
  /**
   * 일차 편집 저장 콜백.
   * 카드 편집 모드에서 "저장" 시 (dayNumber, 갱신된 rows)로 호출.
   * 미지정 시 카드는 보기 전용이 되어 편집/추가/삭제 버튼이 숨겨짐.
   */
  onSaveDay?: (dayNumber: number, rows: ItineraryRow[]) => void;
  /**
   * 항목 분류 변경 콜백.
   * 미지정 시 분류 배지는 단순 표시용.
   */
  onCategoryChange?: (itemId: number, category: ScheduleCategory) => void;
}

/** 한 카드 너비 (px) */
const CARD_WIDTH = 288;
/** 카드 사이 간격 (px) — Tailwind gap-3 = 0.75rem = 12px */
const CARD_GAP = 12;
/** 화살표 클릭 1회 스크롤 양 = 카드 1장 + 간격 */
const SCROLL_STEP = CARD_WIDTH + CARD_GAP;
/** 끝 도달 판정 여유 (px) — 소수점 오차 흡수 */
const EDGE_EPSILON = 2;

/* hover 가능 기기(마우스) 여부.
   SSR/비대응 환경 안전장치로 matchMedia 존재를 확인. */
function detectHover(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover)").matches;
}

export default function CompactItinerarySection({
  days,
  onSaveDay,
  onCategoryChange,
}: CompactItinerarySectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  /* 마우스 환경 여부 — 화살표/페이드는 이 값이 true일 때만 렌더 */
  const [hoverable, setHoverable] = useState(detectHover);

  /* 양 끝 도달 여부 — 화살표/페이드 표시 제어 */
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* 지도 모달 — 어느 일차의 지도를 보여줄지 (null이면 닫힘) */
  const [mapDayNumber, setMapDayNumber] = useState<number | null>(null);

  /* hover 가능 여부 변화 추적 (마우스↔터치 전환 환경 대응) */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover)");
    const onChange = () => setHoverable(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* 스크롤 위치를 읽어 atStart/atEnd 갱신 */
  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= EDGE_EPSILON);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - EDGE_EPSILON);
  }, []);

  /* 마운트 시 + days 변경 시 동기화.
     (카드 수가 줄어 스크롤이 사라지는 경우 등 반영) */
  useEffect(() => {
    syncEdges();
  }, [syncEdges, days]);

  /* 화살표 클릭 — 카드 한 장만큼 부드럽게 스크롤 */
  const scrollByStep = useCallback((dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: dir * SCROLL_STEP,
      behavior: "smooth",
    });
  }, []);

  /* 마우스 휠(세로) → 가로 스크롤 변환.
     가로 의도(deltaX)가 이미 있으면 브라우저 기본 동작에 맡김. */
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
  }, []);

  /* 화살표/페이드를 그릴지 — 마우스 환경 + 해당 방향에 더 볼 게 있을 때 */
  const showLeft = hoverable && !atStart;
  const showRight = hoverable && !atEnd;

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
        /* ── 가로 스크롤 영역 (래퍼) ──
            래퍼는 페이드 오버레이·화살표의 기준(relative).
            음수 마진으로 카드가 화면 좌우 끝까지 닿게 함. */
        <div className="relative -mx-4">
          {/* 스크롤러 본체 */}
          <div
            ref={scrollerRef}
            onScroll={syncEdges}
            onWheel={handleWheel}
            className={[
              "flex gap-3 overflow-x-auto",
              "px-4 scroll-px-4 pb-1",
              "snap-x snap-mandatory",
              /* 스크롤바 최소화 — 모바일은 오버레이 스크롤바.
                 마우스 사용자는 아래 화살표/페이드로 보강됨. */
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
                  onMapClick={() => setMapDayNumber(day.dayNumber)}
                  onSave={
                    onSaveDay
                      ? (rows) => onSaveDay(day.dayNumber, rows)
                      : undefined
                  }
                  onCategoryChange={onCategoryChange}
                />
              </div>
            ))}
          </div>

          {/* ── 좌측 페이드 + 화살표 (마우스 환경 & 시작 아님) ── */}
          {showLeft && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"
              />
              <button
                type="button"
                onClick={() => scrollByStep(-1)}
                aria-label="이전 일차 보기"
                className={[
                  "inline-flex items-center justify-center",
                  "absolute left-2 top-1/2 -translate-y-1/2 z-10",
                  "w-9 h-9 rounded-full",
                  "bg-white border border-gray-300 shadow-md",
                  "text-gray-700 hover:text-gray-900 hover:border-gray-700",
                  "transition-colors cursor-pointer",
                ].join(" ")}
              >
                <NarrowLeftIcon className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ── 우측 페이드 + 화살표 (마우스 환경 & 끝 아님) ── */}
          {showRight && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"
              />
              <button
                type="button"
                onClick={() => scrollByStep(1)}
                aria-label="다음 일차 보기"
                className={[
                  "inline-flex items-center justify-center",
                  "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                  "w-9 h-9 rounded-full",
                  "bg-white border border-gray-300 shadow-md",
                  "text-gray-700 hover:text-gray-900 hover:border-gray-700",
                  "transition-colors cursor-pointer",
                ].join(" ")}
              >
                <NarrowRightIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── 일차 지도 모달 ──
          mapDayNumber가 가리키는 일차의 rows를 찾아 전체화면 지도로 표시.
          days가 갱신돼 해당 일차가 사라지면 모달도 자동으로 닫힘.

          key={mapDayNumber}: 다른 일차 지도를 열 때마다 모달이 새로
          마운트됨 → 시트 단/선택 인덱스/드래그 상태가 useState 초기값으로
          자연히 리셋. (모달 내부에서 초기화 effect로 setState하면
          cascading render 경고가 나므로 key 리마운트 방식을 택함.) */}
      <CompactDayMapModal
        key={mapDayNumber ?? "closed"}
        isOpen={mapDayNumber != null}
        onClose={() => setMapDayNumber(null)}
        dayNumber={mapDayNumber ?? 0}
        rows={days.find((d) => d.dayNumber === mapDayNumber)?.rows ?? []}
      />
    </section>
  );
}
