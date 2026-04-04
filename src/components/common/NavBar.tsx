import { type ReactNode } from "react";

type NavBarVariant = "default" | "login" | "back";

interface NavBarProps {
  /** default: 로고 + 유저아이콘 | login: 로고 + 유저 + 로그아웃 | back: 뒤로가기 + 타이틀 + 공유 */
  variant?: NavBarVariant;
  /** nav_back일 때 가운데 타이틀 */
  title?: string;
  /** 유저 아이콘 (src/assets에서 import, default/login용) */
  userIcon?: ReactNode;
  /** 로그아웃 아이콘 (src/assets에서 import, login용) */
  logoutIcon?: ReactNode;
  /** 뒤로가기 아이콘 (src/assets에서 import, back용) */
  backIcon?: ReactNode;
  /** 공유 아이콘 (src/assets에서 import, back용) */
  shareIcon?: ReactNode;
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
  userIcon,
  logoutIcon,
  backIcon,
  shareIcon,
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
          "bg-white border-b border-gray-300 min-h-12",
          className,
        ].join(" ")}
      >
        <IconButton onClick={onBack}>{backIcon}</IconButton>
        <span className="font-pretendard text-body2 font-semibold text-gray-900">
          {title}
        </span>
        <IconButton onClick={onShare}>{shareIcon}</IconButton>
      </nav>
    );
  }

  return (
    <nav
      className={[
        "flex items-center justify-between px-5 py-4",
        "bg-white min-h-12",
        variant === "login"
          ? "border-b border-gray-300"
          : "border-b border-white",
        className,
      ].join(" ")}
    >
      {/* Logo */}
      <span className="font-montserrat text-[20px] font-semibold">Sofly</span>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {variant === "login" && (
          <IconButton onClick={onUser}>{userIcon}</IconButton>
        )}
        {variant === "login" ? (
          <IconButton onClick={onLogout}>{logoutIcon}</IconButton>
        ) : (
          <IconButton onClick={onUser}>{userIcon}</IconButton>
        )}
      </div>
    </nav>
  );
}
