import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface SharedAlbumPickerPopupProps {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 공유 앨범의 사진 URL 배열 (워크스페이스 단위) */
  photos: string[];
  /** 닫기 콜백 (취소 / 백드롭 클릭 / × / ESC) */
  onClose: () => void;
  /**
   * 사진 선택 확정 콜백.
   * 사용자가 체크박스로 고른 사진들의 URL 배열을 체크 순서대로 전달.
   * 부모는 이 URL들을 Tiptap 에디터의 setImage()로 본문에 순서대로 삽입하면 됨.
   */
  onSelect: (selectedUrls: string[]) => void;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * "공유 앨범에서 찾기" 사진 선택 모달
 *
 * - TravelLogCard 편집 모드 본문 툴바의 "사진" 드롭다운에서 "공유앨범에서 찾기"
 *   클릭 시 열림.
 * - 워크스페이스 공유 앨범의 사진들을 5열 그리드로 표시.
 * - 각 사진 우상단에 체크박스 → 다중 선택 가능.
 *   선택 순서를 보존해서 onSelect에 전달 (먼저 체크한 사진이 먼저 삽입됨).
 * - 하단 푸터: 좌측 "N개 선택됨" 카운터, 우측 "취소" / "선택 (N)" 버튼.
 *   N=0이면 "선택" 버튼 비활성화.
 * - 공유 앨범이 비어있으면 빈 상태 안내.
 *
 * 닫기 방법:
 *   - 우상단 × 버튼
 *   - 백드롭 클릭
 *   - "취소" 버튼
 *   - ESC 키
 *
 * 렌더:
 *   - createPortal로 document.body에 렌더 → 부모의 overflow/z-index 영향 없음
 *
 * 디자인 스펙:
 *   - PhotoLightbox / ConfirmPopup과 동일한 z-50, bg-black/40 backdrop-blur-sm 백드롭
 *   - 모달 본체: max-w-2xl (=672px), 화면 80vh를 넘지 않음
 *   - 그리드는 SharedAlbumSection과 같은 5열, aspect-square, gap-2
 *   - 사진 영역만 내부 세로 스크롤 (헤더/푸터는 고정)
 *
 * 데이터 흐름:
 *   현재는 photos가 ObjectURL/서버 URL 그대로지만, 향후 API 연결 시에도
 *   동일한 string[] 인터페이스 유지 → 이 컴포넌트는 수정 없이 그대로 사용 가능.
 *
 * TODO(API 연결 시):
 *   - 공유 앨범 사진을 본문에 "삽입"하면 본문 이미지가 공유 앨범 사진을
 *     참조(같은 URL 사용)하게 되는데, 공유 앨범에서 그 사진이 나중에
 *     삭제되면 본문 이미지도 깨질 수 있음.
 *   - 백엔드에서 "본문 이미지 = 공유 앨범 사진 참조"로 처리하든
 *     복사본을 만들든 결정 필요.
 *   - 현재 프론트에서는 일단 URL을 그대로 삽입.
 */
export default function SharedAlbumPickerPopup({
  isOpen,
  photos,
  onClose,
  onSelect,
}: SharedAlbumPickerPopupProps) {
  /**
   * 체크된 사진의 인덱스 목록 — 체크한 "순서"를 보존하기 위해 배열로 관리.
   * (Set으로 관리하면 순서가 보장되지 않거나 구현이 번잡해짐.)
   * 인덱스 사용 이유: photos 배열에 동일 URL이 있어도 별개로 식별 가능.
   *
   * 초기화 시점: 모달이 닫힐 때(handleClose) / 선택 확정 시(handleConfirm).
   * useEffect로 isOpen을 감시해서 초기화하지 않는 이유:
   *   effect 안에서 동기적으로 setState를 호출하면 cascading render가 발생해
   *   성능에 좋지 않고 린트 규칙도 경고함. 닫는 시점이 명확하므로 그때 처리.
   */
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const dialogRef = useRef<HTMLDivElement>(null);

  /** 닫기 + 선택 상태 초기화. 외부 onClose 호출 전에 내부 state도 비움. */
  const handleClose = () => {
    setSelectedIndices([]);
    onClose();
  };

  /* ESC 키로 닫기 — ConfirmPopup / PhotoLightbox와 동일한 패턴 */
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
    /* handleClose는 의도적으로 dep에서 제외 — onClose 자체가 부모에서
       매 렌더 새 함수일 수 있어 effect가 재구독되는 비용이 있고,
       handleClose의 실제 동작(state 비우기 + onClose 호출)은 호출 시점에만
       의미 있으므로 stale closure 문제도 없음. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* 팝업 열릴 때 페이지 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  /** 사진 토글: 이미 체크돼 있으면 해제, 아니면 끝에 추가 */
  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  /** "선택" 버튼 클릭 — 체크된 순서대로 URL 배열 만들어 부모로 전달.
   *  선택 후엔 모달이 닫히므로 선택 상태도 같이 초기화. */
  const handleConfirm = () => {
    if (selectedIndices.length === 0) return;
    const selectedUrls = selectedIndices
      .map((i) => photos[i])
      .filter((url): url is string => typeof url === "string");
    setSelectedIndices([]);
    onSelect(selectedUrls);
  };

  /** 백드롭 클릭으로 닫기 — 본체 클릭은 무시 */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const selectedCount = selectedIndices.length;
  const hasPhotos = photos.length > 0;

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={[
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/40 backdrop-blur-sm",
        "animate-[fadeIn_0.15s_ease-out]",
        "p-4",
      ].join(" ")}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-album-picker-title"
        className={[
          "relative w-full max-w-2xl max-h-[80vh]",
          "bg-white rounded-xl border border-gray-300 shadow-xl",
          "flex flex-col overflow-hidden",
          "animate-[popupFadeIn_0.2s_ease-out]",
        ].join(" ")}
      >
        {/* ── 헤더 ── */}
        <header className="shrink-0 flex items-center justify-between gap-2 px-5 py-4 border-b border-gray-200">
          <h2
            id="shared-album-picker-title"
            className="font-pretendard text-title3 font-semibold text-gray-900 m-0"
          >
            공유 앨범에서 사진 선택
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className={[
              "p-1 rounded",
              "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
              "transition-colors cursor-pointer",
              "border-none bg-transparent",
              "inline-flex items-center justify-center",
            ].join(" ")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 3L13 13M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* ── 본문 (사진 그리드 또는 빈 상태) ──
            flex-1로 남는 공간을 차지하고 내부에서 세로 스크롤 */}
        <div
          className={[
            "flex-1 min-h-0 overflow-y-auto px-5 py-4",
            // 스크롤바 스타일 — 다른 컴포넌트와 결 맞춤
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-thumb]:bg-gray-300",
            "[&::-webkit-scrollbar-thumb]:rounded",
            "[&::-webkit-scrollbar-track]:bg-transparent",
          ].join(" ")}
        >
          {hasPhotos ? (
            <PhotoGrid
              photos={photos}
              selectedIndices={selectedIndices}
              onToggle={toggleSelect}
            />
          ) : (
            <EmptyState />
          )}
        </div>

        {/* ── 푸터 ── */}
        <footer className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200">
          <span className="font-pretendard text-body4 text-gray-500">
            {hasPhotos ? `${selectedCount}개 선택됨` : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className={[
                "px-4 py-2 rounded-md",
                "border border-gray-300 bg-white",
                "font-pretendard text-body3 text-gray-700",
                "hover:border-gray-700 hover:bg-gray-50 transition-colors cursor-pointer",
              ].join(" ")}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={[
                "px-4 py-2 rounded-md",
                "border border-transparent",
                "font-pretendard text-body3 font-medium",
                "transition-colors",
                selectedCount === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-gray-900 hover:bg-primary-hover cursor-pointer",
              ].join(" ")}
            >
              선택{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/* ══════════════════════════════════════════
   서브 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 사진 그리드 — 5열, aspect-square
 * 각 셀:
 *   - 클릭 영역 전체가 토글 (사진 클릭 / 체크박스 클릭 모두 토글)
 *   - 우상단 동그란 체크 인디케이터 (선택 시 primary 색 채움)
 *   - 선택 시 보더가 강조되고 살짝 어두운 오버레이로 시각 피드백
 */
function PhotoGrid({
  photos,
  selectedIndices,
  onToggle,
}: {
  photos: string[];
  selectedIndices: number[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {photos.map((src, i) => {
        const isSelected = selectedIndices.includes(i);
        /** 선택 순서 (1부터). 미선택이면 0 */
        const order = isSelected ? selectedIndices.indexOf(i) + 1 : 0;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(i)}
            aria-label={`공유 앨범 사진 ${i + 1}${isSelected ? " 선택됨" : ""}`}
            aria-pressed={isSelected}
            className={[
              "relative aspect-square rounded-lg overflow-hidden",
              "bg-gray-200 group cursor-pointer",
              "border-2 transition-all",
              isSelected
                ? "border-primary"
                : "border-transparent hover:border-gray-400",
              "focus-visible:outline-none focus-visible:border-primary",
            ].join(" ")}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* 선택 시 살짝 어두운 오버레이 (체크 인디케이터 가독성 ↑) */}
            <div
              className={[
                "absolute inset-0 pointer-events-none transition-colors",
                isSelected
                  ? "bg-black/15"
                  : "bg-black/0 group-hover:bg-black/5",
              ].join(" ")}
              aria-hidden="true"
            />

            {/* 우상단 체크 인디케이터
                - 미선택: 흰 보더의 빈 원
                - 선택: primary 색 원 + 선택 순서 번호 */}
            <span
              className={[
                "absolute top-1.5 right-1.5",
                "w-6 h-6 rounded-full",
                "inline-flex items-center justify-center",
                "transition-all",
                isSelected
                  ? "bg-primary text-gray-900"
                  : "bg-white/70 border-2 border-white",
              ].join(" ")}
              aria-hidden="true"
            >
              {isSelected && (
                <span className="font-pretendard text-body4 font-bold leading-none">
                  {order}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 공유 앨범이 비어있을 때 표시하는 빈 상태 안내
 * SharedAlbumSection의 EmptyAlbumPlaceholder와 톤을 맞춤
 */
function EmptyState() {
  return (
    <div
      className={[
        "w-full py-16 px-6",
        "flex flex-col items-center justify-center gap-3",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center justify-center",
          "w-12 h-12 rounded-full",
          "bg-gray-100 text-gray-400",
        ].join(" ")}
        aria-hidden="true"
      >
        {/* 사진 아이콘 (EditorToolbar의 사진 아이콘과 동일한 형태) */}
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="1.5"
            y="2.5"
            width="13"
            height="11"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="5.5" cy="6.5" r="1" fill="currentColor" />
          <path
            d="M2 11L6 7L9 10L11 8L14 11"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </span>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          공유 앨범에 사진이 없어요
        </span>
        <span className="font-pretendard text-body4 text-gray-500 whitespace-pre-line">
          {
            "공유 앨범에 먼저 사진을 추가하면\n여기에서 본문으로 가져올 수 있어요."
          }
        </span>
      </div>
    </div>
  );
}
