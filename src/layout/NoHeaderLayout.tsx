import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Footer from "@/components/common/Footer";
import NavBar from "@/components/mobile/common/NavBar";
import MobileFooter from "@/components/common/MobileFooter";
import useAuthStore from "@/store/useAuthStore";

/**
 * ProfileLayout
 * - 데스크톱 Header 없음: ProfilePage가 Hero와 함께 자체 Header를 렌더링
 * - 모바일 NavBar + Footer 포함
 */
export default function NoHeaderLayout() {
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
        {/* <NavBar variant="login" /> */}
        <NavBar
          variant={isLoggedIn ? "login" : "default"}
          onLogout={handleLogout}
        />
      </div>

      {/* ── 페이지 콘텐츠 ── */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* ══ 모바일 Footer (md 미만) ══ */}
      <div className="md:hidden">
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
