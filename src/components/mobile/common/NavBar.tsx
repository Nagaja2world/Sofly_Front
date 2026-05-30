import { useState, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import LoginPopup from "@/components/LoginPopup";
import LoginImage from "@/assets/my.svg?react";
import LogoutImage from "@/assets/logout.svg?react";
import NarrowLeftImage from "@/assets/narrow-left.svg?react";
import ShareImage from "@/assets/share.svg?react";

type NavBarVariant = "default" | "login" | "back";

interface NavBarProps {
  /** default: 로고 + 로그인 버튼 | login: 로고 + 유저 + 로그아웃 | back: 뒤로가기 + 타이틀 + 공유 */
  variant?: NavBarVariant;
  /** nav_back일 때 가운데 타이틀 */
  title?: string;
  /** 뒤로가기 클릭 */
  onBack?: () => void;
  /** 로그아웃 클릭 */
  onLogout?: () => void;
  /** 공유 클릭 */
  onShare?: () => void;
  /** 유저 아이콘 클릭 (login variant) */
  onUser?: () => void;
  /** 카카오 로그인 콜백 (default variant 로그인 팝업) */
  onKakaoLogin?: () => void;
  /** 구글 로그인 콜백 (default variant 로그인 팝업) */
  onGoogleLogin?: () => void;
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
  onBack,
  onLogout,
  onShare,
  onUser,
  onKakaoLogin,
  onGoogleLogin,
  className = "",
}: NavBarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginBtnRef = useRef<HTMLDivElement>(null);

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
        "min-h-12",
        variant === "login"
          ? "bg-white border-b border-gray-300"
          : "bg-background border-b border-white",
        className,
      ].join(" ")}
    >
      {/* Logo */}
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
      {variant === "login" ? (
        <div className="flex items-center gap-4">
          <IconButton onClick={onUser}>
            <LoginImage />
          </IconButton>
          <IconButton onClick={onLogout}>
            <LogoutImage />
          </IconButton>
        </div>
      ) : (
        /* default: 비로그인 — 데스크톱 Header처럼 "로그인" 버튼 + 팝업 */
        <div ref={loginBtnRef} className="relative">
          <Button
            btnType="outlined"
            onClick={() => setIsLoginOpen((prev) => !prev)}
          >
            로그인
          </Button>

          <LoginPopup
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            triggerRef={loginBtnRef}
            onKakaoLogin={onKakaoLogin}
            onGoogleLogin={onGoogleLogin}
          />
        </div>
      )}
    </nav>
  );
}
