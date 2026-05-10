import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SmallPopupBg from "@/assets/small_popup.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface ConfirmPopupProps {
  /** 팝업 열림 여부 */
  isOpen: boolean;
  /** 닫기 콜백 (취소 또는 외부 클릭/ESC) */
  onClose: () => void;
  /** 확인 클릭 시 콜백 */
  onConfirm: () => void;
  /** 팝업 제목 (예: "카드를 삭제하시겠어요?") */
  title: string;
  /** 보조 설명. 길어질 수 있으니 줄바꿈 허용 */
  description?: string;
  /** 확인 버튼 라벨 (기본: "삭제") */
  confirmLabel?: string;
  /** 취소 버튼 라벨 (기본: "취소") */
  cancelLabel?: string;
  /**
   * 확인 버튼 스타일.
   * - "danger" (기본): 빨강 — 삭제처럼 되돌릴 수 없는 액션
   * - "primary": 강조색 — 일반 확인
   */
  variant?: "danger" | "primary";
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * 재사용 가능한 확인 모달 (Confirm Dialog)
 *
 * - 화면 정중앙에 표시되며, 어두운 백드롭이 뒤를 가림
 * - createPortal로 document.body에 렌더 → 부모의 overflow/z-index 영향 없음
 * - 닫기 방법: 취소 버튼 / 백드롭 클릭 / ESC 키
 * - 시각: small_popup.svg를 배경으로 사용 (우상단 일러스트, 헤더 라인, 하단 푸터 영역)
 *
 * 사용 예:
 *   <ConfirmPopup
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="이 카드를 삭제하시겠어요?"
 *     description="삭제하면 되돌릴 수 없어요."
 *   />
 */
export default function ConfirmPopup({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "삭제",
  cancelLabel = "취소",
  variant = "danger",
}: ConfirmPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ESC 키로 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  /* 팝업 열릴 때 페이지 스크롤 잠금 (모달 표준 동작) */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  /* 팝업 열릴 때 확인 버튼에 포커스 (키보드 접근성) */
  useEffect(() => {
    if (!isOpen) return;
    /* 약간의 delay로 트랜지션 후 포커스 */
    const timer = setTimeout(() => {
      const confirmBtn =
        dialogRef.current?.querySelector<HTMLButtonElement>(
          "[data-confirm-btn]",
        );
      confirmBtn?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  /* 백드롭 클릭 시 닫기 (단, 팝업 본체 클릭은 무시) */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* 확인 버튼 색상 — variant에 따라 */
  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-500 text-white hover:bg-red-600"
      : "bg-gray-900 text-white hover:bg-gray-800";

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={[
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/40 backdrop-blur-sm",
        "animate-[fadeIn_0.15s_ease-out]",
      ].join(" ")}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-popup-title"
        aria-describedby={description ? "confirm-popup-desc" : undefined}
        className={[
          "relative w-[420px] max-w-[90vw]",
          "animate-[popupFadeIn_0.2s_ease-out]",
        ].join(" ")}
        style={{ aspectRatio: "387 / 295" }}
      >
        {/* 배경 SVG — 우상단 일러스트(UFO/꽃), 헤더 라인, 하단 푸터 영역 포함 */}
        <SmallPopupBg className="w-full h-auto" aria-hidden="true" />

        {/* 컨텐츠 오버레이 — 배경 SVG의 영역에 맞춰 절대 위치
            inset-0로 SVG 위에 정확히 겹쳐짐.
            SVG 비율: 전체 387×295, 푸터 영역 387×56.49 (≈19%), 헤더 가로선 ≈30% 위치 */}
        <div className="absolute inset-0 flex flex-col">
          {/* 헤더 영역: SVG 상단의 가로선 위쪽 (~30%)
              제목을 좌우/상하 가운데 정렬해서 가로선 위에 자리 잡음 */}
          <div
            className="px-7 pb-3 flex items-end justify-center"
            style={{ flex: "0 0 30%" }}
          >
            <h2
              id="confirm-popup-title"
              className="font-pretendard text-title3 font-semibold text-gray-900 m-0 leading-snug text-center"
            >
              {title}
            </h2>
          </div>

          {/* 본문 영역: 가로선 아래 ~ 푸터 위
              좌우/상하 가운데 정렬 + 폰트 키움 (text-body1) */}
          <div className="px-7 py-4 flex-1 overflow-y-auto flex items-center justify-center">
            {description && (
              <p
                id="confirm-popup-desc"
                className="font-pretendard text-body1 text-gray-700 m-0 leading-relaxed whitespace-pre-line text-center"
              >
                {description}
              </p>
            )}
          </div>

          {/* 푸터 영역: SVG 하단 별도 영역 (~19%)
              버튼 두 개를 가운데 정렬 + 가로 길이 충분히 확보 */}
          <div
            className="flex items-center justify-center gap-3 px-5"
            style={{ flex: "0 0 19%" }}
          >
            <button
              type="button"
              onClick={onClose}
              className={[
                "min-w-[120px] px-6 py-2.5 rounded-md",
                "font-pretendard text-body2 font-medium",
                "text-gray-700 bg-transparent border border-gray-300 cursor-pointer",
                "hover:bg-gray-100 transition-colors",
              ].join(" ")}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              data-confirm-btn
              className={[
                "min-w-[120px] px-6 py-2.5 rounded-md",
                "font-pretendard text-body2 font-semibold",
                "border-none cursor-pointer transition-colors",
                confirmButtonClass,
              ].join(" ")}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
