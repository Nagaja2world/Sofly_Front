import { type ReactNode } from "react";
import { useFieldFocus } from "../../hooks/useFieldFocus";

type SelectFieldBg = "gray" | "white";

interface SelectFieldProps {
  /** 선택된 값 텍스트 2026. 03. 17. */
  value?: string;
  /** placeholder 텍스트 가는편, 오는편, 인원/좌석등급 */
  placeholder?: string;
  /** 배경 스타일 */
  bg?: SelectFieldBg;
  /** 좌측 아이콘 (src/assets에서 import) */
  leftIcon?: ReactNode;
  /** 우측 아이콘 (src/assets에서 import) */
  rightIcon?: ReactNode;
  /** 클릭 시 드롭다운/모달 열기 */
  onClick?: () => void;
  /** 외부에서 focus 상태 제어 (드롭다운 열림 여부 등) */
  isOpen?: boolean;
  /** 비활성 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

const bgClasses: Record<SelectFieldBg, { normal: string; focus: string }> = {
  gray: {
    normal: "bg-gray-200 border-gray-200",
    focus: "bg-gray-200 border-gray-700",
  },
  white: {
    normal: "bg-white border-gray-300",
    focus: "bg-white border-gray-700",
  },
};

export default function SelectField({
  value,
  placeholder,
  bg = "gray",
  leftIcon,
  rightIcon,
  onClick,
  isOpen,
  disabled = false,
  className = "",
}: SelectFieldProps) {
  const { ref, isFocused, activate } = useFieldFocus(isOpen);
  const styles = bgClasses[bg];

  return (
    <div className={["flex flex-col", className].join(" ")}>
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        type="button"
        disabled={disabled}
        onClick={() => {
          activate();
          onClick?.();
        }}
        className={[
          "flex items-center gap-2 px-5 py-4 w-full",
          "border rounded-lg transition-all duration-200",
          "font-pretendard text-body2 text-left",
          isFocused ? styles.focus : styles.normal,
          value ? "text-gray-900" : "text-gray-700",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span className="flex-1">{value || placeholder}</span>
        {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    </div>
  );
}
