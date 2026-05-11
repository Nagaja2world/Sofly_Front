import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import LoginPopup from "../LoginPopup";
import InvitationPanel from "@/components/common/InvitationPanel";
import useAuthStore from "@/store/useAuthStore";
import useInvitationStore from "@/store/useInvitationStore";

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
  /** 네이버 로그인 콜백 */
  onNaverLogin?: () => void;
}

export default function Header({
  variant = "default",
  onLogin,
  onLogout,
  onKakaoLogin,
  onGoogleLogin,
  onNaverLogin,
}: HeaderProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const loginBtnRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { invitations, load: loadInvitations } = useInvitationStore();

  /* 로그인 상태일 때 초대 목록 로드 */
  useEffect(() => {
    if (variant === "login") {
      loadInvitations();
    }
  }, [variant, loadInvitations]);

  const pendingCount = invitations.length;

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
            onNaverLogin={onNaverLogin}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* 초대 알림 벨 */}
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => setIsInvitationOpen((v) => !v)}
              aria-label={`워크스페이스 초대 알림${pendingCount > 0 ? ` (${pendingCount}건)` : ""}`}
              className="relative bg-transparent border-none cursor-pointer p-1.5 text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M11 2a7 7 0 0 0-7 7v3.382l-1.447 2.894A1 1 0 0 0 3.447 17H18.553a1 1 0 0 0 .894-1.724L18 12.382V9a7 7 0 0 0-7-7Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 17a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white font-pretendard text-[10px] font-bold flex items-center justify-center leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>

            {isInvitationOpen && (
              <InvitationPanel onClose={() => setIsInvitationOpen(false)} />
            )}
          </div>

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
