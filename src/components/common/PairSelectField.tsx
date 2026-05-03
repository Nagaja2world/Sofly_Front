import { type ReactNode } from "react";
import { useFieldFocus } from "../../hooks/useFieldFocus";

type PairSelectFieldBg = "gray" | "white";

interface PairSelectFieldProps {
  /** 왼쪽 영역 텍스트 */
  leftValue?: string;
  leftPlaceholder?: string;
  /** 오른쪽 영역 텍스트 */
  rightValue?: string;
  rightPlaceholder?: string;
  /** 배경 스타일 */
  bg?: PairSelectFieldBg;
  /** 가운데 아이콘 (src/assets에서 import) */
  centerIcon?: ReactNode;
  /** 왼쪽 영역 클릭 */
  onLeftClick?: () => void;
  /** 가운데 아이콘 클릭 (예: 스왑) */
  onCenterClick?: () => void;
  /** 오른쪽 영역 클릭 */
  onRightClick?: () => void;
  /** 외부에서 focus 상태 제어 */
  isOpen?: boolean;
  /** 추가 클래스 */
  className?: string;
}

const bgClasses: Record<PairSelectFieldBg, { normal: string; focus: string }> =
  {
    gray: {
      normal: "bg-gray-200 border-gray-200",
      focus: "bg-gray-200 border-gray-700",
    },
    white: {
      normal: "bg-white border-gray-300",
      focus: "bg-white border-gray-700",
    },
  };

export default function PairSelectField({
  leftValue,
  leftPlaceholder = "",
  rightValue,
  rightPlaceholder = "",
  bg = "gray",
  centerIcon,
  onLeftClick,
  onCenterClick,
  onRightClick,
  isOpen,
  className = "",
}: PairSelectFieldProps) {
  const { ref, isFocused, activate } = useFieldFocus(isOpen);
  const styles = bgClasses[bg];

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={[
        "flex items-center rounded-lg overflow-hidden gap-2 px-5 py-4",
        "transition-all duration-200",
        isFocused ? styles.focus : styles.normal,
        className,
      ].join(" ")}
    >
      {/* 왼쪽 영역 */}
      <button
        type="button"
        onClick={() => {
          activate();
          onLeftClick?.();
        }}
        className={[
          "flex-1 min-w-0 bg-transparent border-none",
          "font-pretendard text-body2 text-center truncate",
          "cursor-pointer hover:bg-gray-200/50 transition-colors",
          leftValue ? "text-gray-900" : "text-gray-700",
        ].join(" ")}
      >
        {leftValue || leftPlaceholder}
      </button>

      {/* 가운데 아이콘 */}
      <button
        type="button"
        onClick={() => {
          activate();
          onCenterClick?.();
        }}
        className={[
          "shrink-0 p-1 bg-transparent border-none",
          "cursor-pointer hover:bg-gray-200/50 transition-colors",
          "inline-flex items-center justify-center",
        ].join(" ")}
      >
        {centerIcon}
      </button>

      {/* 오른쪽 영역 */}
      <button
        type="button"
        onClick={() => {
          activate();
          onRightClick?.();
        }}
        className={[
          "flex-1 min-w-0 bg-transparent border-none",
          "font-pretendard text-body2 text-center truncate",
          "cursor-pointer hover:bg-gray-200/50 transition-colors",
          rightValue ? "text-gray-900" : "text-gray-700",
        ].join(" ")}
      >
        {rightValue || rightPlaceholder}
      </button>
    </div>
  );
}
