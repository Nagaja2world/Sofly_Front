import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import LoginImage from "@/assets/my.svg?react";
import LogoutImage from "@/assets/logout.svg?react";
import UserIcon from "@/assets/group.svg?react";
import NarrowLeftImage from "@/assets/narrow-left.svg?react";
import ShareImage from "@/assets/share.svg?react";

type NavBarVariant = "default" | "login" | "back";

interface NavBarProps {
  /** default: 로고 + 유저아이콘 | login: 로고 + 유저 + 로그아웃 | back: 뒤로가기 + 타이틀 + 공유 */
  variant?: NavBarVariant;
  /** nav_back일 때 가운데 타이틀 */
  title?: string;
  // /** 유저 아이콘 (src/assets에서 import, login용) */
  // userIcon?: ReactNode;
  /** 뒤로가기 클릭 */
  onBack?: () => void;
  /** 로그아웃 클릭 */
  onLogout?: () => void;
  /** 공유 클릭 */
  onShare?: () => void;
  /** 유저 아이콘 클릭 */
  onUser?: () => void;
  /** 추가 클래스 */
  className?: string;
}

const IconButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-transparent border-none cursor-pointer p-1 text-gray-900 hover:text-gray-600 transition-colors inline-flex items-center justify-center"
  >
    {children}
  </button>
);

export default function NavBar({
  variant = "default",
  title = "",
  // userIcon,
  onBack,
  onLogout,
  onShare,
  onUser,
  className = "",
}: NavBarProps) {
  if (variant === "back") {
    return (
      <nav
        className={[
          "flex items-center justify-between px-5 py-4",
          "bg-background border-b border-gray-300 min-h-12",
          className,
        ].join(" ")}
      >
        <IconButton onClick={onBack}>
          <NarrowLeftImage />
        </IconButton>
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {title}
        </span>
        <IconButton onClick={onShare}>
          <ShareImage />
        </IconButton>
      </nav>
    );
  }

  return (
    <nav
      className={[
        "flex items-center justify-between px-5 py-4",
        "bg-background min-h-12",
        variant === "login"
          ? "border-b border-gray-300"
          : "border-b border-white",
        className,
      ].join(" ")}
    >
      {/* Logo */}
      {/* <span className="font-montserrat text-[20px] font-semibold">Sofly</span> */}
      <Link
        to="/"
        className={[
          "font-montserrat text-[20px] font-semibold",
          "text-gray-900 no-underline",
          "hover:opacity-80 transition-opacity",
        ].join(" ")}
        aria-label="홈으로 이동"
      >
        Sofly
      </Link>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {variant === "login" && (
          <IconButton onClick={onUser}>
            <LoginImage />
          </IconButton>
        )}
        {variant === "login" ? (
          <IconButton onClick={onLogout}>
            <LogoutImage />
          </IconButton>
        ) : (
          <IconButton onClick={onUser}>
            <UserIcon />
          </IconButton>
        )}
      </div>
    </nav>
  );
}
