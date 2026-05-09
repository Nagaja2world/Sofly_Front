import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import LoginPopup from "../LoginPopup";
import useAuthStore from "@/store/useAuthStore";

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
}

export default function Header({
  variant = "default",
  onLogin,
  onLogout,
  onKakaoLogin,
  onGoogleLogin,
}: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginBtnRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

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
      <Link
        to="/"
        className={[
          "font-montserrat text-[32px] font-semibold tracking-tight",
          "bg-transparent border-none p-0 cursor-pointer",
          "text-gray-900 no-underline hover:opacity-80 transition-opacity",
        ].join(" ")}
        aria-label="홈으로 이동"
      >
        Sofly
      </Link>

      {/* Right Actions */}
      {variant === "default" ? (
        <div ref={loginBtnRef} className="relative">
          <Button btnType="outlined" onClick={handleLoginClick}>
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
      ) : (
        <div className="flex items-center gap-3">
          {/* 프로필 아바타 */}
          <button
            type="button"
            onClick={() => navigate("/mypage")}
            className="bg-transparent border-none cursor-pointer p-0 flex items-center"
            aria-label="프로필 페이지로 이동"
          >
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.nickname ?? "프로필"}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <UserIcon />
            )}
          </button>

          {/* 로그아웃 */}
          <button
            type="button"
            onClick={onLogout}
            className="bg-transparent border-none cursor-pointer text-black hover:text-gray-600 transition-colors font-pretendard text-body3 px-2 py-1"
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
