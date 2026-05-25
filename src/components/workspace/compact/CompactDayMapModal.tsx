import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import DayItineraryMap, {
  type DayItineraryMapRowStatus,
} from "@/components/workspace/DayItineraryMap";
import { getCategoryStyle } from "@/utils/itineraryCategory";
import type { ItineraryRow } from "@/components/workspace/ItineraryDayCard";

/* ══════════════════════════════════════════
   CompactDayMapModal
   ══════════════════════════════════════════
   좁은 화면(< 768px)용 "일차 지도 보기" 전체화면 모달.

   왜 모달인가:
   - compact 카드는 너비 288px 고정이라 안에 지도를 인라인으로 넣으면
     너무 좁고, 카드의 가로 스크롤과 지도의 가로 드래그가 충돌함.
   - 전체화면 모달로 빼면 지도를 넓게 쓰고 제스처 충돌도 사라짐.
   - MemberListPopup과 동일하게 createPortal 기반 모달 패턴을 재사용.

   레이아웃 (위 → 아래, 전부 화면을 덮음):
   ┌──────────────────────────────┐
   │ ←  N일차 지도            ✕   │  ← 상단 바
   ├──────────────────────────────┤
   │                              │
   │          지도 (풀블리드)       │  ← DayItineraryMap layout="compact"
   │                              │
   │   ┌────── 바텀시트 ──────┐    │
   │   │ ═══ (그랩 핸들)       │    │  ← peek: 핸들 + 헤더만
   │   │ N일차 경로 · n개 장소  │    │
   │   │ (펼치면 장소 목록)     │    │  ← expanded: 목록 스크롤
   │   └─────────────────────┘    │
   └──────────────────────────────┘

   바텀시트 2단 (peek / expanded):
   - peek      : 핸들 + "N일차 경로 · n개 장소" 헤더만 보임 (지도 최대 확보).
   - expanded  : 화면 높이의 약 55%까지 올라와 장소 목록 전체 스크롤.
   - 핸들/헤더를 탭하거나 위/아래로 드래그(스와이프)해 단 전환.
   - 목록 항목을 탭하면 → selectedIndex를 DayItineraryMap에 넘겨 해당
     마커로 카메라 이동 + InfoWindow 표시. 동시에 시트를 peek로 내려
     지도를 넓게 보여줌 (데스크톱 split UI의 "목록↔지도 연동"을 모바일화).

   DayItineraryMap 연동:
   - layout="compact"   → 좌측 목록 패널 없이 지도만 렌더.
   - onResolvedRowsChange→ 지오코딩 후 각 행의 좌표 확보 여부를 받아
     "주소 없음" 행을 목록에서 비활성화.
   - selectedIndex      → 목록 탭 시 해당 마커 활성화.
*/

interface CompactDayMapModalProps {
  /** 모달 열림 여부 */
  isOpen: boolean;
  /** 닫기 콜백 (✕ / 뒤로 / 백드롭 없음 — 전체화면이라 백드롭 클릭은 없음) */
  onClose: () => void;
  /** 일차 번호 (상단 바 타이틀) */
  dayNumber: number;
  /** 일정 항목 목록 */
  rows: ItineraryRow[];
}

/* 바텀시트 단(段) */
type SheetStage = "peek" | "expanded";

/** peek 단에서 보이는 높이 (px) — 핸들 + 헤더 한 줄 */
const SHEET_PEEK_HEIGHT = 92;
/** expanded 단 높이 — 뷰포트 높이 비율 */
const SHEET_EXPANDED_RATIO = 0.55;
/** 드래그가 이 px를 넘으면 단 전환으로 판정 */
const DRAG_THRESHOLD = 48;

/* ──────────────────────────────────────────
   아이콘
   ────────────────────────────────────────── */

/** 뒤로(←) 아이콘 */
function BackArrow() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 닫기(✕) 아이콘 */
function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────
   바텀시트 장소 목록 한 줄
   ──────────────────────────────────────────
   DayItineraryMap split 모드의 좌측 목록 항목을 모바일 폭에 맞춰 재구성.
   카테고리 색은 compact 카드들과 동일하게 itineraryCategory.getCategoryStyle 사용.
*/
function PlaceRow({
  row,
  index,
  hasCoords,
  isActive,
  onSelect,
}: {
  row: ItineraryRow;
  index: number;
  hasCoords: boolean;
  isActive: boolean;
  onSelect: () => void;
}) {
  const category = getCategoryStyle(row._category);

  return (
    <button
      type="button"
      onClick={() => hasCoords && onSelect()}
      disabled={!hasCoords}
      aria-label={`${index + 1}번 ${row.title}${hasCoords ? "" : " (주소 없음)"}`}
      className={[
        "w-full text-left px-4 py-3",
        "border-b border-gray-100 last:border-0",
        "flex items-center gap-3",
        "transition-colors",
        isActive ? "bg-amber-50" : hasCoords ? "active:bg-gray-100" : "",
        hasCoords ? "cursor-pointer" : "cursor-default opacity-60",
        "border-l-[3px] bg-transparent",
        isActive ? "border-l-amber-400" : "border-l-transparent",
      ].join(" ")}
    >
      {/* 순번 원 */}
      <span
        className={[
          "shrink-0 w-7 h-7 rounded-full",
          "inline-flex items-center justify-center",
          "font-pretendard text-body5 font-bold",
          category.badgeBg,
          category.badgeText,
        ].join(" ")}
      >
        {index + 1}
      </span>

      {/* 본문: 제목 + (분류 · 시각) */}
      <span className="flex flex-col min-w-0 flex-1">
        <span className="font-pretendard text-body3 font-medium text-gray-900 truncate">
          {row.title || "(제목 없음)"}
        </span>
        <span className="font-pretendard text-body5 text-gray-400 truncate">
          {category.label}
          {row.visitTime ? ` · ${row.visitTime}` : ""}
          {!hasCoords ? " · 주소 없음" : ""}
        </span>
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

export default function CompactDayMapModal({
  isOpen,
  onClose,
  dayNumber,
  rows,
}: CompactDayMapModalProps) {
  /* 바텀시트 단 */
  const [stage, setStage] = useState<SheetStage>("peek");

  /* 지도에 활성화 요청할 마커 인덱스 (목록 탭 시 갱신) */
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /* 각 행의 좌표 확보 여부 — DayItineraryMap의 지오코딩 결과로 채워짐 */
  const [rowStatus, setRowStatus] = useState<DayItineraryMapRowStatus[]>([]);

  /* 드래그 추적
     - dragStartYRef: 핸들러 간 동기 공유용 (드래그 시작 Y좌표).
     - isDragging   : 렌더에서 transition on/off를 결정하기 위한 state.
       (React 규칙상 렌더 중에는 ref.current를 읽으면 안 되므로,
        "드래그 중인가"를 state로 따로 둠.) */
  const dragStartYRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  /* expanded 단 높이 (px) — 마운트/리사이즈 시 계산 */
  const [expandedHeight, setExpandedHeight] = useState(() =>
    typeof window !== "undefined"
      ? Math.round(window.innerHeight * SHEET_EXPANDED_RATIO)
      : 360,
  );

  /* 뷰포트 높이 변동(주소창 노출 등) 대응 */
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () =>
      setExpandedHeight(Math.round(window.innerHeight * SHEET_EXPANDED_RATIO));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen]);

  /* 모달 상태(stage/selectedIndex/드래그)는 "열릴 때마다 초기화"가 필요하지만,
     effect 본문에서 동기적으로 setState하면 cascading render 경고가 남.
     대신 부모(CompactItinerarySection)가 이 모달을 mapDayNumber 기반 key로
     렌더 → 모달을 열 때마다 새 인스턴스가 마운트되어 useState 초기값으로
     자연히 리셋됨. 따라서 별도 초기화 effect가 필요 없음. */

  /* ESC로 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* 열릴 때 body 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  /* onResolvedRowsChange는 매 렌더 새 함수면 DayItineraryMap의 effect를
     불필요하게 재실행시키므로 useCallback으로 안정화. */
  const handleResolvedRowsChange = useCallback(
    (status: DayItineraryMapRowStatus[]) => {
      setRowStatus(status);
    },
    [],
  );

  /* 목록 항목 선택 → 마커 활성화 + 시트 내려 지도 넓히기.
     같은 항목을 다시 눌러도 지도가 반응하도록, selectedIndex가 같을 때는
     null로 한 번 비웠다가 채워 DayItineraryMap의 effect가 다시 돌게 함. */
  const handleSelectPlace = useCallback((index: number) => {
    setStage("peek");
    setSelectedIndex((prev) => {
      if (prev === index) {
        /* 동일 인덱스 재선택: 다음 틱에 같은 값을 넣어 effect 재실행 */
        queueMicrotask(() => setSelectedIndex(index));
        return null;
      }
      return index;
    });
  }, []);

  /* ── 바텀시트 드래그 ── */
  const onDragStart = (clientY: number) => {
    dragStartYRef.current = clientY;
    setIsDragging(true);
    setDragOffset(0);
  };

  const onDragMove = (clientY: number) => {
    if (dragStartYRef.current == null) return;
    const delta = clientY - dragStartYRef.current;
    /* peek에서는 위로(-)만, expanded에서는 아래로(+)만 의미가 있음.
       반대 방향 드래그는 0으로 클램프해 시트가 한계를 넘지 않게 함. */
    if (stage === "peek") {
      setDragOffset(Math.min(0, delta));
    } else {
      setDragOffset(Math.max(0, delta));
    }
  };

  const onDragEnd = () => {
    if (dragStartYRef.current == null) return;
    dragStartYRef.current = null;
    setIsDragging(false);

    if (stage === "peek" && dragOffset < -DRAG_THRESHOLD) {
      setStage("expanded");
    } else if (stage === "expanded" && dragOffset > DRAG_THRESHOLD) {
      setStage("peek");
    }
    setDragOffset(0);
  };

  /* 핸들/헤더 탭 → 단 토글 (드래그가 아주 작을 때만 탭으로 간주) */
  const toggleStage = () => {
    setStage((s) => (s === "peek" ? "expanded" : "peek"));
  };

  if (!isOpen) return null;

  /* 현재 시트 높이 계산 — 드래그 중에는 offset을 더해 손가락을 따라오게 함 */
  const baseHeight = stage === "peek" ? SHEET_PEEK_HEIGHT : expandedHeight;
  /* dragOffset: peek에서 위로 끌면 음수(높이 증가), expanded에서 아래로 끌면 양수(높이 감소) */
  const liveHeight = Math.max(
    SHEET_PEEK_HEIGHT,
    Math.min(expandedHeight, baseHeight - dragOffset),
  );

  const validCount = rowStatus.filter((s) => s.hasCoords).length;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${dayNumber}일차 지도`}
    >
      {/* ── 상단 바 ── */}
      <header className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="뒤로"
          className={[
            "p-1.5 rounded-lg border-none bg-transparent shrink-0",
            "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
            "cursor-pointer transition-colors",
          ].join(" ")}
        >
          <BackArrow />
        </button>
        <h2 className="flex-1 min-w-0 font-pretendard text-body1 font-semibold text-gray-900 m-0 truncate">
          {dayNumber}일차 지도
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={[
            "p-1.5 rounded-lg border-none bg-transparent shrink-0",
            "text-gray-500 hover:bg-gray-100 active:bg-gray-200",
            "cursor-pointer transition-colors",
          ].join(" ")}
        >
          <CloseIcon />
        </button>
      </header>

      {/* ── 지도 + 바텀시트 ──
          relative 컨테이너 안에서 지도는 전체를, 시트는 하단에 absolute로 띄움. */}
      <div className="relative flex-1 overflow-hidden">
        {/* 지도 (풀블리드) */}
        <div className="absolute inset-0">
          <DayItineraryMap
            /* rows가 바뀌면 지오코딩을 다시 하도록 key를 좌표 의존으로 구성
               (데스크톱 ItineraryDayCard와 동일 패턴). */
            key={rows
              .map(
                (r) =>
                  `${r.id}|${r._placeId ?? ""}|${r._address ?? ""}|${r._latitude ?? ""}|${r._longitude ?? ""}`,
              )
              .join(",")}
            rows={rows}
            dayNumber={dayNumber}
            layout="compact"
            selectedIndex={selectedIndex}
            onResolvedRowsChange={handleResolvedRowsChange}
          />
        </div>

        {/* ── 바텀시트 ── */}
        <div
          className={[
            "absolute left-0 right-0 bottom-0",
            "bg-white rounded-t-2xl",
            "border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]",
            "flex flex-col",
            /* 드래그 중에는 transition 끔 — 손가락을 즉각 따라오게 */
            isDragging ? "" : "transition-[height] duration-300 ease-out",
          ].join(" ")}
          style={{ height: liveHeight }}
        >
          {/* 핸들 + 헤더 (드래그 손잡이 영역) */}
          <div
            role="button"
            tabIndex={0}
            aria-label={
              stage === "peek" ? "장소 목록 펼치기" : "장소 목록 접기"
            }
            aria-expanded={stage === "expanded"}
            onClick={toggleStage}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleStage();
              }
            }}
            onTouchStart={(e) => onDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => onDragMove(e.touches[0].clientY)}
            onTouchEnd={onDragEnd}
            onMouseDown={(e) => onDragStart(e.clientY)}
            onMouseMove={(e) => {
              if (dragStartYRef.current != null) onDragMove(e.clientY);
            }}
            onMouseUp={onDragEnd}
            onMouseLeave={() => {
              if (dragStartYRef.current != null) onDragEnd();
            }}
            className={[
              "shrink-0 cursor-grab active:cursor-grabbing select-none",
              "px-4 pt-2.5 pb-3",
            ].join(" ")}
          >
            {/* 그랩 핸들 */}
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-300" />

            {/* 헤더 텍스트 */}
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-pretendard text-body2 font-semibold text-gray-900">
                {dayNumber}일차 경로
              </span>
              <span className="font-pretendard text-body4 text-gray-400">
                {rows.length}개 장소
                {validCount < rows.length && rowStatus.length > 0
                  ? ` · ${validCount}개 표시`
                  : ""}
              </span>
            </div>
          </div>

          {/* 장소 목록 (expanded 단에서 스크롤) */}
          <div className="flex-1 overflow-y-auto overscroll-contain border-t border-gray-100">
            {rows.length === 0 ? (
              <p className="px-4 py-8 text-center font-pretendard text-body4 text-gray-400 m-0">
                등록된 일정이 없습니다.
              </p>
            ) : (
              rows.map((row, index) => (
                <PlaceRow
                  key={row.id}
                  row={row}
                  index={index}
                  /* rowStatus가 아직 안 채워졌으면(지오코딩 전) 일단 활성으로 두되,
                     채워진 뒤에는 좌표 없는 행을 비활성화. */
                  hasCoords={rowStatus[index]?.hasCoords ?? true}
                  isActive={selectedIndex === index}
                  onSelect={() => handleSelectPlace(index)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
