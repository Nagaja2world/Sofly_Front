import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* ══════════════════════════════════════════
   BottomSheet
   ══════════════════════════════════════════
   모바일 입력 패널 공용 컨테이너.

   - 화면 하단에서 슬라이드업(index.css의 .modal-slide-up 재사용).
   - 백드롭 탭 또는 헤더 X로 닫힘.
   - 열려 있는 동안 body 스크롤 락.
   - portal로 document.body에 렌더 → 부모의 overflow/transform 영향 없음.

   데스크톱 드롭다운(AirportSearchDropdown 등)이 position:absolute로
   필드 아래 붙는 방식이라 좁은 화면엔 부적합 → 모바일은 이 시트로 대체.
   입력 "로직"은 데스크톱과 공유하고, 표현만 시트로 바꾸는 게 설계 의도.
*/

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** 시트 상단 제목 */
  title?: string;
  /** 본문 */
  children: ReactNode;
  /** 시트 최대 높이 (기본 85vh) */
  maxHeightVh?: number;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeightVh = 85,
}: BottomSheetProps) {
  /* 열려 있는 동안 배경 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  /* ESC로 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* 백드롭 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 border-none cursor-pointer"
      />

      {/* 시트 본체 */}
      <div
        className={[
          "relative w-full bg-white",
          "rounded-t-2xl overflow-hidden",
          "flex flex-col modal-slide-up",
        ].join(" ")}
        style={{ maxHeight: `${maxHeightVh}vh` }}
      >
        {/* 그랩 핸들 */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <span className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
            <h3 className="font-pretendard text-body1 font-semibold text-gray-900 m-0">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center",
                "bg-transparent border-none cursor-pointer",
                "text-gray-500 hover:bg-gray-100 transition-colors",
              ].join(" ")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
