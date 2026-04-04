import { type ButtonHTMLAttributes } from "react";

type ButtonType = "solid" | "outlined" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** solid | outlined | text */
  btnType?: ButtonType;
  /** 버튼 텍스트 우측 아이콘 (text 타입은 기본 화살표 제공) */
  icon?: React.ReactNode;
}

/*
 * ── Figma 디자인 토큰 매핑 ──
 *
 * solid
 *   default  : bg-primary (#F5D15A), text-gray-900, rounded-lg
 *   pressed  : bg-[#D4B23E], text-gray-900
 *   disabled : bg-gray-300, text-gray-500
 *
 * outlined
 *   default  : bg-white, text-gray-900, border-gray-300, rounded-lg
 *   pressed  : border-gray-700
 *   disabled : text-gray-500, border-gray-300
 *
 * text
 *   default  : text-gray-700, no border
 *   pressed  : text-gray-900, underline
 *   disabled : text-gray-500
 */

const typeClasses: Record<
  ButtonType,
  { base: string; hover: string; disabled: string }
> = {
  solid: {
    base: "bg-primary text-gray-900 border border-transparent rounded-lg",
    hover: "hover:bg-primary-hover active:bg-primary-hover",
    disabled: "bg-gray-300 text-gray-500 border-transparent rounded-lg",
  },
  outlined: {
    base: "bg-white text-gray-900 border border-gray-300 rounded-lg",
    hover: "hover:border-gray-700 active:border-gray-700",
    disabled: "bg-white text-gray-500 border border-gray-300 rounded-lg",
  },
  text: {
    base: "bg-transparent text-gray-700 border-none",
    hover:
      "hover:text-gray-900 hover:underline active:text-gray-900 active:underline",
    disabled: "bg-transparent text-gray-500 border-none",
  },
};

const paddingClasses: Record<ButtonType, string> = {
  solid: "px-5 py-3",
  outlined: "px-3.5 py-2.5",
  text: "px-0 py-2",
};

export default function Button({
  btnType = "outlined",
  icon,
  disabled = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles = typeClasses[btnType];

  return (
    <button
      disabled={disabled}
      className={[
        // 공통 레이아웃
        "inline-flex items-center justify-center gap-1.5",
        "font-pretendard font-medium text-body3",
        "transition-all duration-200 ease-out",

        // 타입별 패딩
        paddingClasses[btnType],

        // 상태별 스타일
        disabled
          ? `${styles.disabled} cursor-not-allowed`
          : `${styles.base} ${styles.hover} active:scale-[0.97] cursor-pointer`,

        className,
      ].join(" ")}
      {...props}
    >
      {children}

      {icon && <span className="inline-flex">{icon}</span>}
    </button>
  );
}
