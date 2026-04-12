import { useState, useRef } from "react";
import Button from "@/components/common/Button";
import LoginPopup from "../LoginPopup";

import UserIcon from "@/assets/group.svg?react";

type HeaderVariant = "default" | "login";

interface HeaderProps {
  /** default: 로그인 버튼 표시 | login: 유저 아이콘 + 로그아웃 표시 */
  variant?: HeaderVariant;
  /** 로그인 버튼 클릭 */
  onLogin?: () => void;
  /** 로그아웃 클릭 */
  onLogout?: () => void;
  /** 카카오 로그인 콜백 */
  onKakaoLogin?: () => void;
  /** 구글 로그인 콜백 */
  onGoogleLogin?: () => void;
  // /** 유저 아이콘 (src/assets에서 import하여 전달, login variant에서 사용) */
  // userIcon?: ReactNode;
}

export default function Header({
  variant = "default",
  onLogin,
  onLogout,
  onKakaoLogin,
  onGoogleLogin,
  //userIcon,
}: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginBtnRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
    } else {
      setIsLoginOpen((prev) => !prev);
    }
  };

  return (
    <header
      className={[
        "flex items-center justify-between h-20",
        variant === "login" ? "bg-white" : "bg-background",
      ].join(" ")}
    >
      {/* Logo */}
      <span className="font-montserrat text-[32px] font-semibold tracking-tight">
        Sofly
      </span>

      {/* Right Actions */}
      {variant === "default" ? (
        <div ref={loginBtnRef} className="relative">
          <Button btnType="outlined" onClick={handleLoginClick}>
            로그인
          </Button>

          {/* 로그인 드롭다운 팝업 */}
          <LoginPopup
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            triggerRef={loginBtnRef}
            onKakaoLogin={onKakaoLogin}
            onGoogleLogin={onGoogleLogin}
          />
        </div>
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
