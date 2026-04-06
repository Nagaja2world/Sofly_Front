import { Outlet } from "react-router-dom";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import NavBar from "@/components/common/NavBar";
import MobileFooter from "@/components/common/MobileFooter";

export default function Layout() {
  //   const handleLogin = () => {
  //     // TODO: 로그인 모달 또는 페이지 이동
  //   };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Header (공통) ── */}
      {/* <div className="w-full bg-background">
        <div className="max-w-[1200px] w-full mx-auto md:px-5">
          <Header variant="default" onLogin={handleLogin} />
        </div>
      </div> */}
      {/* ══ 모바일 Header (md 미만) ══ */}
      <div className="md:hidden">
        {/* TODO: NavBar 컴포넌트로 교체 */}
        <NavBar variant="default" />
      </div>

      {/* ══ 데스크톱 Header (md 이상) ══ */}
      <div className="hidden md:block w-full bg-background">
        <div className="max-w-[1200px] w-full mx-auto px-4">
          <Header variant="default" />
        </div>
      </div>

      {/* ── 페이지 콘텐츠 ── */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* ── Footer (공통) ── */}
      {/* <div className="w-full border-t border-gray-300">
        <div className="max-w-[1200px] w-full mx-auto md:px-5">
          <Footer />
        </div>
      </div> */}
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
