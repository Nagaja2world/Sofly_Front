import { useRef, useState, useCallback, useEffect } from "react";
import type { JSONContent } from "@tiptap/core";
import CompactTravelLogCard from "./CompactTraveLogCard";
import CompactSnsLogCard from "./CompactSnsLogCard";
import NarrowLeftIcon from "@/assets/narrow-left.svg?react";
import NarrowRightIcon from "@/assets/narrow-right.svg?react";

/* ══════════════════════════════════════════
   CompactTravelLogSection
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 여행 기록 섹션. (이미지 1·2 기준)

   레이아웃:
   - 데스크톱 TravelLogSection처럼 "더보기" 없이 카드를 가로로 나열하고
     오른쪽으로 스크롤. (사용자 요청: 여행 일정과 동일한 가로 스크롤 패턴)
   - 카드 순서: SNS 카드(있으면 맨 앞) → 여행 기록 카드들(배열 순서).
   - 한 카드 너비는 288px 고정 → 다음 카드가 살짝 보여 "더 있음"을 암시.

   CompactItinerarySection과 동일한 가로 스크롤 보강:
   - 좌우 화살표 버튼 / 양 끝 페이드 / 휠→가로스크롤. 모두 hover 가능한
     기기(마우스)에서만 노출 → 모바일 터치 경험은 그대로.

   편집/추가/삭제/재정렬:
   - 여행 기록 카드(CompactTravelLogCard)는 보기/편집 모드를 자체 보유.
     · 헤더 제목(mainTitle) 인라인 편집 → onUpdateMainTitle(id, title)
     · 본문/날씨/한줄요약 편집 저장 → onSaveTravelLog(id, data)
     · 삭제 → onDeleteTravelLog(id)
   - "여행 기록 추가" 버튼을 맨 끝에 둬 새 카드를 추가 (onAddDailyCard).
   - 카드 순서 변경: 터치/마우스 드래그로 재정렬 → onReorderLogs(from, to).
     데스크톱 TravelLogSection은 HTML5 draggable을 쓰지만, 모바일은
     draggable이 터치에서 동작하지 않으므로 포인터 기반 드래그로 구현.
   - SNS 카드(CompactSnsLogCard)는 compact에서도 편집 가능 — onSaveSnsLog가
     있으면 카드에 편집 버튼이 붙고, snsLog가 없으면 "SNS 게시물 추가"
     버튼이 카드 목록 끝에 노출됨(onAddSnsCard). SNS는 워크스페이스당 1개.

   ── 타입 의존성 ──
   여행 기록 관련 타입(CompactTravelLog / CompactWeatherType /
   CompactTravelLogData / CompactSnsMedia / CompactSnsLogData)을 여기서
   로컬 정의하고 export함. 이유: 데스크톱 UI 파일(TravelLogSection.tsx,
   TravelLogCard.tsx, SnsLogCard.tsx)은 자주 바뀌고, 그 파일에 컴파일
   에러가 있거나 인터페이스가 수정되면 compact 쪽 타입까지 깨짐
   (예: TravelLog에서 dayNumber가 mainTitle로 바뀐 변경). compact
   컴포넌트들은 이 파일의 타입만 공유하므로 데스크톱 변경에 영향받지 않음.
   구조적 타이핑 덕분에 WorkspacePage가 넘기는 데스크톱 TravelLog[]는
   필드만 호환되면 그대로 들어옴.
*/

/* ──────────────────────────────────────────
   compact 여행 기록 공용 타입 (로컬 정의)
   ──────────────────────────────────────────
   데스크톱 타입과 동일 구조. compact 컴포넌트들이 이 파일에서 가져다 씀.
*/

/** 날씨 종류 */
export type CompactWeatherType = "sunny" | "cloudy" | "rainy" | "snowy";

/** 편집 저장 시 카드 → 부모로 전달되는 데이터 (mainTitle 제외 — 별도 콜백) */
export interface CompactTravelLogData {
  oneLineSummary?: string;
  weather?: CompactWeatherType;
  content?: JSONContent;
  albumPhotos?: string[];
}

/** 여행 기록 한 건 — 데스크톱 TravelLog와 동일 구조 */
export interface CompactTravelLog {
  /** API에서 받은 여행기 ID (없으면 로컬 임시 카드) */
  id?: number;
  /** 카드 제목 — 사용자 지정. null/빈 값이면 헤더에 플레이스홀더 표시 */
  mainTitle: string | null;
  /** 한 줄 여행 */
  oneLineSummary?: string;
  /** 날씨 */
  weather?: CompactWeatherType;
  /** 본문 (Tiptap JSON) */
  content?: JSONContent;
  /** 앨범 사진 URL 목록 */
  albumPhotos?: string[];
}

/** SNS 미디어 한 건 */
export interface CompactSnsMedia {
  id: string;
  type: "image" | "video";
  url: string;
}

/** SNS 게시물 */
export interface CompactSnsLogData {
  caption?: string;
  media: CompactSnsMedia[];
}

interface CompactTravelLogSectionProps {
  /** 여행 기록 목록 */
  travelLogs: CompactTravelLog[];
  /** SNS 게시물 (없으면 null) — 있으면 맨 앞 카드로 표시 */
  snsLog: CompactSnsLogData | null;
  /**
   * 워크스페이스 공유 앨범 사진 URL 배열.
   * 여행 기록 카드 본문 편집 시 "공유앨범에서 찾기"로 본문에 삽입할 수 있도록
   * 각 CompactTravelLogCard로 그대로 전달됨.
   */
  sharedAlbumPhotos?: string[];
  /**
   * 카드 제목(mainTitle) 인라인 편집 저장.
   * 미지정 시 헤더 제목이 편집 불가(읽기 전용 텍스트)로 렌더.
   */
  onUpdateMainTitle?: (id: number, title: string) => void;
  /**
   * 카드 본문/날씨/한줄요약 편집 저장.
   * 미지정 시 카드 본문 편집 버튼이 숨겨짐.
   */
  onSaveTravelLog?: (id: number, data: CompactTravelLogData) => void;
  /**
   * 앨범 사진 즉시 업로드 콜백 — 데스크톱 TravelLogSection의 동명 prop과
   * 동일한 계약(시그니처)을 노출하기 위한 채널.
   *
   * 데스크톱에서도 이 콜백은 카드 내부에서 호출되지 않는 "예약된 채널"이며
   * (TravelLogCard가 편집 모드에서 File을 onSave의 albumPhotos로만 넘김),
   * compact도 동일하게 선언만 해 두어 양쪽 props 표면을 일치시킨다.
   * 실제 호출 배선은 데스크톱에 없는 UI를 새로 만드는 별도 작업이므로
   * 여기서는 하지 않는다 (API 연결과도 무관 — 통로만 열어 둠).
   */
  onUploadTravellogPhotos?: (id: number, files: File[]) => void;
  /** 카드 삭제. 미지정 시 삭제 버튼 숨김. */
  onDeleteTravelLog?: (id: number) => void;
  /** 새 카드 추가. 미지정 시 "추가" 버튼 숨김. */
  onAddDailyCard?: () => void;
  /**
   * 카드 순서 변경 (from 인덱스 → to 인덱스).
   * 인덱스는 travelLogs 배열 기준 (SNS 카드는 별도이므로 제외).
   * 미지정 시 드래그 재정렬 비활성.
   */
  onReorderLogs?: (fromIdx: number, toIdx: number) => void;
  /**
   * SNS 게시물 편집 저장.
   * 미지정 시 SNS 카드가 보기 전용으로 렌더 (편집 버튼 숨김).
   */
  onSaveSnsLog?: (data: CompactSnsLogData) => void;
  /**
   * SNS 게시물 삭제.
   * 미지정 시 SNS 카드 삭제 버튼 숨김.
   */
  onDeleteSnsLog?: () => void;
  /**
   * SNS 게시물 새로 추가.
   * snsLog === null && onAddSnsCard 지정 시, 카드 목록 끝에 "SNS 게시물 추가"
   * 버튼이 노출됨. snsLog가 이미 있으면 (워크스페이스당 1개) 버튼 숨김.
   */
  onAddSnsCard?: () => void;
}

/** 한 카드 너비 (px) — 이미지 3 기준 288 */
const CARD_WIDTH = 288;
/** 카드 사이 간격 (px) — Tailwind gap-3 = 12px */
const CARD_GAP = 12;
/** 화살표 클릭 1회 스크롤 양 */
const SCROLL_STEP = CARD_WIDTH + CARD_GAP;
/** 끝 도달 판정 여유 (px) */
const EDGE_EPSILON = 2;

/* hover 가능 기기(마우스) 여부 */
function detectHover(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover)").matches;
}

export default function CompactTravelLogSection({
  travelLogs,
  snsLog,
  sharedAlbumPhotos,
  onUpdateMainTitle,
  onSaveTravelLog,
  onUploadTravellogPhotos,
  onDeleteTravelLog,
  onAddDailyCard,
  onReorderLogs,
  onSaveSnsLog,
  onDeleteSnsLog,
  onAddSnsCard,
}: CompactTravelLogSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [hoverable, setHoverable] = useState(detectHover);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* hover 가능 여부 변화 추적 */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover)");
    const onChange = () => setHoverable(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* 스크롤 위치 → atStart/atEnd 갱신 */
  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= EDGE_EPSILON);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - EDGE_EPSILON);
  }, []);

  /* 마운트 시 + 카드 수 변경 시 동기화 */
  useEffect(() => {
    syncEdges();
  }, [syncEdges, travelLogs, snsLog]);

  /* 화살표 클릭 — 카드 한 장만큼 부드럽게 스크롤 */
  const scrollByStep = useCallback((dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: dir * SCROLL_STEP,
      behavior: "smooth",
    });
  }, []);

  /* 마우스 휠(세로) → 가로 스크롤 변환 */
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
  }, []);

  const showLeft = hoverable && !atStart;
  const showRight = hoverable && !atEnd;

  /* 표시할 카드가 하나라도 있는지 */
  const hasAnyCard = snsLog != null || travelLogs.length > 0;
  /* 추가 버튼(여행 기록 / SNS)이 하나라도 가능한지 */
  const canAddAny = onAddDailyCard != null || onAddSnsCard != null;

  /* ──────────────────────────────────────────
     카드 드래그 재정렬
     ──────────────────────────────────────────
     데스크톱 TravelLogSection은 HTML5 draggable을 쓰지만, draggable은
     모바일 터치에서 동작하지 않음. 그래서 포인터 이벤트로 직접 구현.

     가로 스크롤과의 충돌 방지:
     - 카드 헤더의 "⠿" 드래그 핸들에서 포인터를 누를 때만 재정렬 시작.
     - 핸들 외 영역(본문 등)에서의 터치는 평소대로 가로 스크롤.
     - 재정렬 중에는 스크롤러의 touch-action을 막아 스크롤이 안 끼어들게 함.

     동작:
     - 핸들 pointerdown → dragIdx 설정.
     - pointermove → 손가락 아래에 있는 카드를 찾아 overIdx 갱신.
     - pointerup → dragIdx ≠ overIdx면 onReorderLogs(dragIdx, overIdx).
  */
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // 최신 카드가 왼쪽에 오도록 역순 렌더링
  const reversedLogs = [...travelLogs].reverse();
  const lastLogIdx = travelLogs.length - 1;

  /* 각 여행 기록 카드 래퍼의 DOM 참조 (pointermove에서 위치 판정용).
     ref 콜백은 카드가 삭제돼도 배열을 줄여주지 않아 stale한 슬롯이
     남을 수 있으나, 아래 findCardIndexAtX가 reversedLogs.length 범위
     안에서만 순회하므로 stale 슬롯에는 접근하지 않는다. (ref는 렌더
     중 접근이 금지되므로 배열 길이를 렌더 본문에서 자르지 않는다.) */
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* 포인터 X좌표 아래에 있는 카드 인덱스 찾기.
     데스크톱 TravelLogSection처럼 useCallback 없이 일반 함수로 둔다 —
     메모이제이션은 React Compiler가 처리한다. (수동 useCallback의
     [travelLogs.length] 의존성이 컴파일러가 추론한 reversedLogs와
     불일치해 "Compilation Skipped" 경고를 유발했음. 또한 함수가
     reversedLogs를 클로저로 참조하므로, 길이가 같고 내용만 바뀐
     경우 stale 참조 위험도 있었음.) */
  const findCardIndexAtX = (clientX: number): number | null => {
    /* reversedLogs.length 기준으로 순회 — cardRefs.current.length는
       삭제된 카드의 stale 슬롯을 포함할 수 있으므로, 실제 렌더된
       카드 개수를 기준으로 돌아 stale 슬롯 접근을 원천 차단한다.
       (Gemini 리뷰 반영) */
    for (let i = 0; i < reversedLogs.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return null;
  };

  /* 드래그 핸들에서 포인터 누름 → 재정렬 시작 */
  const handleReorderPointerDown = (idx: number, e: React.PointerEvent) => {
    if (!onReorderLogs) return;
    /* 핸들이 포인터를 캡처해 손가락이 카드를 벗어나도 move/up을 받음 */
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragIdx(idx);
    setOverIdx(idx);
  };

  const handleReorderPointerMove = (e: React.PointerEvent) => {
    if (dragIdx == null) return;
    const found = findCardIndexAtX(e.clientX);
    if (found != null) setOverIdx(found);
  };

  const handleReorderPointerUp = () => {
    if (dragIdx != null && overIdx != null && dragIdx !== overIdx) {
      // 시각적 인덱스(역순) → 원래 배열 인덱스로 변환
      onReorderLogs?.(lastLogIdx - dragIdx, lastLogIdx - overIdx);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <section className="flex flex-col gap-3">
      {/* ── 섹션 제목 ── (이미지 2 — "더보기" 없음) */}
      <h2 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
        여행 기록
      </h2>

      {!hasAnyCard && !canAddAny ? (
        /* 카드도 없고 추가도 불가 → 빈 상태 안내만 */
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 flex flex-col items-center gap-2 text-center">
          <p className="font-pretendard text-body3 text-gray-700 m-0">
            아직 여행 기록이 없어요
          </p>
          <p className="font-pretendard text-body4 text-gray-400 m-0">
            하루를 마치고 오늘의 기록을 남겨보세요.
          </p>
        </div>
      ) : (
        /* ── 가로 스크롤 영역 ── */
        <div className="relative -mx-4">
          <div
            ref={scrollerRef}
            onScroll={syncEdges}
            onWheel={handleWheel}
            className={[
              "flex gap-3 overflow-x-auto items-stretch",
              "px-4 scroll-px-4 pb-1",
              "snap-x snap-mandatory",
              "[scrollbar-width:none] [-ms-overflow-style:none]",
              "[&::-webkit-scrollbar]:hidden",
              /* 재정렬 중에는 가로 스크롤이 끼어들지 않게 터치 제스처 차단 */
              dragIdx != null ? "touch-none" : "",
            ].join(" ")}
          >
            {/* SNS 카드 — 있으면 맨 앞 (재정렬 대상 아님).
                onSaveSnsLog가 있으면 편집 가능, 없으면 보기 전용. */}
            {snsLog && (
              <div
                className="snap-start shrink-0"
                style={{ width: CARD_WIDTH }}
              >
                <CompactSnsLogCard
                  data={snsLog}
                  onSave={onSaveSnsLog}
                  onDelete={onDeleteSnsLog}
                />
              </div>
            )}

            {/* 여행 기록 카드 (최신순: 왼쪽부터) */}
            {reversedLogs.map((log, visualIdx) => (
              <div
                key={log.id ?? visualIdx}
                ref={(el) => {
                  cardRefs.current[visualIdx] = el;
                }}
                className={[
                  "snap-start shrink-0 transition-all duration-150",
                  /* 드래그 중인 카드: 반투명 */
                  dragIdx === visualIdx ? "opacity-40" : "",
                  /* 드롭 대상 카드: 강조 링 */
                  overIdx === visualIdx &&
                  dragIdx !== visualIdx &&
                  dragIdx != null
                    ? "ring-2 ring-primary ring-offset-1 rounded-xl"
                    : "",
                ].join(" ")}
                style={{ width: CARD_WIDTH }}
              >
                <CompactTravelLogCard
                  mainTitle={log.mainTitle}
                  oneLineSummary={log.oneLineSummary}
                  weather={log.weather}
                  content={log.content}
                  albumPhotos={log.albumPhotos}
                  sharedAlbumPhotos={sharedAlbumPhotos}
                  onSaveMainTitle={
                    onUpdateMainTitle && log.id != null
                      ? (title) => onUpdateMainTitle(log.id!, title)
                      : undefined
                  }
                  onSave={
                    onSaveTravelLog && log.id != null
                      ? (data) => onSaveTravelLog(log.id!, data)
                      : undefined
                  }
                  onUploadPhotos={
                    onUploadTravellogPhotos && log.id != null
                      ? (files) => onUploadTravellogPhotos(log.id!, files)
                      : undefined
                  }
                  onDelete={
                    onDeleteTravelLog && log.id != null
                      ? () => onDeleteTravelLog(log.id!)
                      : undefined
                  }
                  /* 드래그 핸들 — onReorderLogs가 있을 때만 활성 */
                  dragHandleProps={
                    onReorderLogs
                      ? {
                          onPointerDown: (e) =>
                            handleReorderPointerDown(visualIdx, e),
                          onPointerMove: handleReorderPointerMove,
                          onPointerUp: handleReorderPointerUp,
                          onPointerCancel: handleReorderPointerUp,
                        }
                      : undefined
                  }
                />
              </div>
            ))}

            {/* 여행 기록 추가 카드 — 맨 끝 */}
            {onAddDailyCard && (
              <div
                className="snap-start shrink-0"
                style={{ width: CARD_WIDTH }}
              >
                <button
                  type="button"
                  onClick={onAddDailyCard}
                  aria-label="여행 기록 추가"
                  className={[
                    "w-full min-h-[200px] h-full rounded-xl",
                    "border border-dashed border-gray-300 bg-white",
                    "flex flex-col items-center justify-center gap-2",
                    "text-gray-400 hover:text-gray-700",
                    "hover:border-gray-700 hover:bg-gray-50",
                    "transition-colors cursor-pointer",
                  ].join(" ")}
                >
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-body1"
                    aria-hidden="true"
                  >
                    +
                  </span>
                  <span className="font-pretendard text-body3 font-medium">
                    여행 기록 추가
                  </span>
                </button>
              </div>
            )}

            {/* SNS 게시물 추가 카드 — SNS가 아직 없을 때만 (워크스페이스당 1개) */}
            {onAddSnsCard && snsLog == null && (
              <div
                className="snap-start shrink-0"
                style={{ width: CARD_WIDTH }}
              >
                <button
                  type="button"
                  onClick={onAddSnsCard}
                  aria-label="SNS 게시물 추가"
                  className={[
                    "w-full min-h-[200px] h-full rounded-xl",
                    "border border-dashed border-gray-300 bg-white",
                    "flex flex-col items-center justify-center gap-2",
                    "text-gray-400 hover:text-gray-700",
                    "hover:border-gray-700 hover:bg-gray-50",
                    "transition-colors cursor-pointer",
                  ].join(" ")}
                >
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/30 text-body1 font-semibold text-gray-700"
                    aria-hidden="true"
                  >
                    S
                  </span>
                  <span className="font-pretendard text-body3 font-medium">
                    SNS 게시물 추가
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ── 좌측 페이드 + 화살표 ── */}
          {showLeft && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"
              />
              <button
                type="button"
                onClick={() => scrollByStep(-1)}
                aria-label="이전 기록 보기"
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

          {/* ── 우측 페이드 + 화살표 ── */}
          {showRight && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"
              />
              <button
                type="button"
                onClick={() => scrollByStep(1)}
                aria-label="다음 기록 보기"
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
    </section>
  );
}
