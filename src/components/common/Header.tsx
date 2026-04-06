//import { type ReactNode } from "react";
import Button from "./Button";

import UserIcon from "@/assets/my.svg?react";

type HeaderVariant = "default" | "login";

interface HeaderProps {
  /** default: 로그인 버튼 표시 | login: 유저 아이콘 + 로그아웃 표시 */
  variant?: HeaderVariant;
  /** 로그인 버튼 클릭 */
  onLogin?: () => void;
  /** 로그아웃 클릭 */
  onLogout?: () => void;
  // /** 유저 아이콘 (src/assets에서 import하여 전달, login variant에서 사용) */
  // userIcon?: ReactNode;
}

export default function Header({
  variant = "default",
  onLogin,
  onLogout,
  //userIcon,
}: HeaderProps) {
  return (
    <header
      className={[
        "flex items-center justify-between h-20",
        variant === "login"
          ? "border-b border-gray-300 bg-white"
          : "border-b border-white bg-background",
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
          <UserIcon />
          <span className="font-pretendard text-body3 px-4 py-2.5">
            로그아웃
          </span>
        </button>
      )}
    </header>
  );
}
