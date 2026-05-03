import DownloadIcon from "@/assets/download.svg?react";

/* ══════════════════════════════════════════
   타입
   ══════════════════════════════════════════ */

interface SaveItineraryButtonProps {
  /** 버튼 라벨 (기본: "이 일정 저장하기") */
  label?: string;
  /** 클릭 콜백 */
  onClick?: () => void;
  /** 비활성화 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/* ══════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════ */

/**
 * "이 일정 저장하기" 버튼 (Image 3)
 *
 * AI가 일정을 제안했을 때, 그 응답 하단에 표시되는 액션 버튼.
 * - 좌측: download.svg 아이콘 (보라 사각형)
 * - 우측: 텍스트
 * - 배경: 노란 primary, 둥근 모서리 (pill 형태)
 */
export default function SaveItineraryButton({
  label = "이 일정 저장하기",
  onClick,
  disabled = false,
  className = "",
}: SaveItineraryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5",
        "px-3 py-1.5 rounded-full",
        "font-pretendard text-body4 font-medium",
        "transition-all duration-200 ease-out",
        "border-none",
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-primary text-gray-900 hover:bg-primary-hover active:scale-[0.97] cursor-pointer",
        className,
      ].join(" ")}
    >
      <DownloadIcon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
