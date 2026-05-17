import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface PhotoLightboxProps {
  /** 사진 URL 배열 (라이트박스에서 보여줄 전체 사진들) */
  photos: string[];
  /** 현재 보여줄 사진 인덱스. null이면 닫혀 있음 */
  index: number | null;
  /** 라이트박스 닫기 (× 버튼 / 백드롭 클릭 / ESC) */
  onClose: () => void;
  /**
   * 인덱스 변경 콜백.
   * 좌우 화살표 버튼 / 키보드 ← → 키로 사진을 넘길 때 호출됨.
   * 부모는 받은 인덱스로 라이트박스를 다시 열어주면 됨.
   */
  onIndexChange: (next: number) => void;
  /** 이미지 alt 텍스트 (스크린 리더용). "공유 앨범" 등 */
  alt?: string;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 사진 확대 보기 라이트박스 모달
 *
 * - 화면 정중앙에 큰 사진을 띄움 (가로/세로 화면에 맞게 자동 축소)
 * - 좌우 화살표 버튼으로 이전/다음 사진 이동
 * - 키보드 단축키:
 *   - ←  : 이전 사진
 *   - →  : 다음 사진
 *   - ESC: 닫기
 * - 우상단 × 버튼 또는 백드롭 클릭으로 닫기
 * - createPortal로 document.body에 렌더 → 부모 overflow/z-index 영향 없음
 *
 * 사용 예:
 *   const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
 *   ...
 *   <PhotoLightbox
 *     photos={photos}
 *     index={lightboxIndex}
 *     onClose={() => setLightboxIndex(null)}
 *     onIndexChange={setLightboxIndex}
 *     alt="공유 앨범"
 *   />
 */
export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  alt = "사진",
}: PhotoLightboxProps) {
  /** 현재 인덱스 유효성. 사진이 없거나 인덱스가 null이면 열지 않음. */
  const isOpen = index !== null && photos.length > 0;

  /** index가 photos 길이를 초과하지 않도록 보정한 안전한 인덱스
   *  (편집/삭제로 사진 배열이 줄어든 경우 대비) */
  const safeIndex =
    isOpen && index !== null
      ? Math.min(Math.max(0, index), photos.length - 1)
      : 0;

  /** 이전 사진으로 이동. 첫 번째면 마지막으로 순환. */
  const goPrev = useCallback(() => {
    if (!isOpen) return;
    const prev = safeIndex === 0 ? photos.length - 1 : safeIndex - 1;
    onIndexChange(prev);
  }, [isOpen, safeIndex, photos.length, onIndexChange]);

  /** 다음 사진으로 이동. 마지막이면 처음으로 순환. */
  const goNext = useCallback(() => {
    if (!isOpen) return;
    const next = safeIndex === photos.length - 1 ? 0 : safeIndex + 1;
    onIndexChange(next);
  }, [isOpen, safeIndex, photos.length, onIndexChange]);

  /* 키보드 단축키: ←, →, ESC */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, goPrev, goNext]);

  /* 라이트박스 열릴 때 페이지 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  /* 백드롭 클릭 시 닫기 (사진 본체나 버튼 클릭은 무시) */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* 1장만 있을 때는 좌우 화살표 / 인덱스 표시 숨김 */
  const showNav = photos.length > 1;

  return createPortal(
    <div
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 확대 보기`}
      className={[
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/80 backdrop-blur-sm",
        "animate-[fadeIn_0.15s_ease-out]",
      ].join(" ")}
    >
      {/* 우상단 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className={[
          "absolute top-4 right-4 z-10",
          "w-10 h-10 rounded-full",
          "inline-flex items-center justify-center",
          "bg-white/10 text-white hover:bg-white/20",
          "border-none cursor-pointer transition-colors",
        ].join(" ")}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M3 3L15 15M15 3L3 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* 좌측 이전 버튼 */}
      {showNav && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="이전 사진"
          className={[
            "absolute left-4 top-1/2 -translate-y-1/2 z-10",
            "w-12 h-12 rounded-full",
            "inline-flex items-center justify-center",
            "bg-white/10 text-white hover:bg-white/20",
            "border-none cursor-pointer transition-colors",
          ].join(" ")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M13 4L7 10L13 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* 사진 본체 — 화면에 맞춰 자동 축소, 클릭 이벤트는 전파 안 됨(백드롭 닫기 방지) */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[safeIndex]}
          alt={`${alt} ${safeIndex + 1}`}
          className={[
            "max-w-[90vw] max-h-[85vh]",
            "object-contain",
            "rounded-lg",
            "shadow-2xl",
            "animate-[fadeIn_0.2s_ease-out]",
          ].join(" ")}
          /* key를 인덱스로 줘서 사진 바뀔 때마다 fadeIn 다시 트리거 */
          key={safeIndex}
        />
      </div>

      {/* 우측 다음 버튼 */}
      {showNav && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="다음 사진"
          className={[
            "absolute right-4 top-1/2 -translate-y-1/2 z-10",
            "w-12 h-12 rounded-full",
            "inline-flex items-center justify-center",
            "bg-white/10 text-white hover:bg-white/20",
            "border-none cursor-pointer transition-colors",
          ].join(" ")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M7 4L13 10L7 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* 하단 인덱스 표시 (3 / 27) */}
      {showNav && (
        <div
          className={[
            "absolute bottom-6 left-1/2 -translate-x-1/2 z-10",
            "px-3 py-1.5 rounded-full",
            "bg-white/10 text-white",
            "font-pretendard text-body3 font-medium",
            "select-none",
          ].join(" ")}
        >
          {safeIndex + 1} / {photos.length}
        </div>
      )}
    </div>,
    document.body,
  );
}
