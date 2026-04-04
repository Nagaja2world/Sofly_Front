import { type ReactNode } from "react";
import Button from "./Button";

type HeaderVariant = "default" | "login";

interface HeaderProps {
  /** default: 로그인 버튼 표시 | login: 유저 아이콘 + 로그아웃 표시 */
  variant?: HeaderVariant;
  /** 로그인 버튼 클릭 */
  onLogin?: () => void;
  /** 로그아웃 클릭 */
  onLogout?: () => void;
  /** 유저 아이콘 (src/assets에서 import하여 전달, login variant에서 사용) */
  userIcon?: ReactNode;
}

export default function Header({
  variant = "default",
  onLogin,
  onLogout,
  userIcon,
}: HeaderProps) {
  return (
    <header
      className={[
        "flex items-center justify-between bg-white h-20",
        variant === "login"
          ? "border-b border-gray-300"
          : "border-b border-white",
      ].join(" ")}
    >
      {/* Logo */}
      <span className="font-montserrat text-[32px] font-semibold tracking-tight">
        Sofly
      </span>

      {/* Right Actions */}
      {variant === "default" ? (
        <Button btnType="outlined" onClick={onLogin}>
          로그인
        </Button>
      ) : (
        <button
          onClick={onLogout}
          className="flex items-center bg-transparent border-none cursor-pointer text-black hover:text-gray-900 transition-colors"
        >
          {userIcon ?? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          )}
          <span className="font-pretendard text-body3 px-4 py-2.5">
            로그아웃
          </span>
        </button>
      )}
    </header>
  );
}
