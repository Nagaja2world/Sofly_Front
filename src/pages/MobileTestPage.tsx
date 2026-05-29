// @ts-nocheck
// TODO: update NavBarProps interface to include missing props
import { useState } from "react";
import NavBar from "../components/mobile/common/NavBar";
import MobileFooter from "../components/common/MobileFooter";

import MyIcon from "@/assets/my.svg?react";
import LogoutIcon from "@/assets/logout.svg?react";
import NarrowLeftIcon from "@/assets/narrow-left.svg?react";
import ShareIcon from "@/assets/share.svg?react";

export default function MobileTestPage() {
  const [currentNav, setCurrentNav] = useState<"default" | "login" | "back">(
    "default",
  );

  return (
    <div className="max-w-[360px] mx-auto min-h-screen flex flex-col bg-white ">
      {/* NavBar 전환 버튼 */}
      <div className="flex gap-2 p-3 bg-gray-900">
        {(["default", "login", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setCurrentNav(v)}
            className={[
              "px-3 py-1 rounded-lg text-body5 font-pretendard border-none cursor-pointer",
              currentNav === v
                ? "bg-primary text-gray-900"
                : "bg-gray-700 text-gray-300",
            ].join(" ")}
          >
            {v}
          </button>
        ))}
      </div>

      {/* NavBar */}
      {currentNav === "default" && (
        <NavBar variant="default" userIcon={<MyIcon />} />
      )}
      {currentNav === "login" && (
        <NavBar
          variant="login"
          userIcon={<MyIcon />}
          logoutIcon={<LogoutIcon />}
        />
      )}
      {currentNav === "back" && (
        <NavBar
          variant="back"
          title="워크스페이스명"
          backIcon={<NarrowLeftIcon />}
          shareIcon={<ShareIcon />}
          onBack={() => setCurrentNav("default")}
        />
      )}

      {/* Content */}
      <div className="flex-1 p-5">
        <p className="font-pretendard text-body3 text-gray-500">
          모바일 컴포넌트 테스트 (360px)
        </p>
      </div>

      {/* MobileFooter */}
      <MobileFooter />
    </div>
  );
}
