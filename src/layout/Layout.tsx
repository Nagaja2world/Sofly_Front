import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NavBar from "@/components/common/NavBar";
import MobileFooter from "@/components/common/MobileFooter";
import useAuthStore from "@/store/useAuthStore";

export default function Layout() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ══ 모바일 Header (md 미만) ══ */}
      <div className="md:hidden">
        {/* TODO: NavBar 컴포넌트로 교체 */}
        <NavBar
          variant={isLoggedIn ? "login" : "default"}
          onLogout={handleLogout}
        />
      </div>

      {/* ══ 데스크톱 Header (md 이상) ══ */}
      <div
        className={[
          "hidden md:block w-full",
          isLoggedIn ? "bg-white border-b border-gray-300" : "bg-background",
        ].join(" ")}
      >
        <div className="max-w-[1200px] w-full mx-auto px-4">
          <Header
            variant={isLoggedIn ? "login" : "default"}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* ── 페이지 콘텐츠 ── */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* ══ 모바일 Footer (md 미만) ══ */}
      <div className="md:hidden">
        {/* TODO: MobileFooter 컴포넌트로 교체 */}
        <MobileFooter />
      </div>

      {/* ══ 데스크톱 Footer (md 이상) ══ */}
      <div className="hidden md:block w-full border-t border-gray-300">
        <div className="max-w-[1200px] w-full mx-auto px-4">
          <Footer />
        </div>
      </div>
    </div>
  );
}
