import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { usePermissionToast } from "@/store/usePermissionToast";

function PermissionToast() {
  const { message, hide } = usePermissionToast();
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <div
        onClick={hide}
        className={[
          "pointer-events-auto",
          "flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg",
          "bg-red-50 border border-red-200 text-red-700",
          "font-pretendard text-body4",
        ].join(" ")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 5v3.5M8 11h.01"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {message}
      </div>
    </div>
  );
}
import NoHeaderLayout from "./layout/NoHeaderLayout";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import Profile from "@/pages/Profile";
import ProfileEditPage from "@/pages/ProfileEditPage";
import ProfileOnboardingPage from "@/pages/ProfileOnboardingPage";
import FlightSearchPage from "@/pages/FlightSearchPage";
import FlightDetailPage from "@/pages/FlightDetailPage";
import HotelSearchPage from "@/pages/HotelSearchPage";
import WorkspacePage from "@/pages/WorkspacePage";
import WorkspacePreviewPage from "@/pages/WorkspacePreviewPage";
import SnsPage from "./pages/SnsPage";
import LegalPage from "./pages/LegalPage";

import AuthCallbackPage from "@/pages/AuthCallbackPage";
import ConquestMapPage from "@/pages/ConquestMapPage";
import Layout from "./layout/Layout";

const router = createBrowserRouter([
  /* Hero가 있는 페이지 (자체 Header) */
  {
    path: "/",
    element: <NoHeaderLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "mypage", element: <Profile /> },
      { path: "mypage/edit", element: <ProfileEditPage /> },
      { path: "onboarding", element: <ProfileOnboardingPage /> },
      { path: "workspace/:id", element: <WorkspacePage /> },
      { path: "workspace/:id/preview", element: <WorkspacePreviewPage /> },
    ],
  },

  /* 일반 페이지 (Header 포함 Layout) */
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "flight-search", element: <FlightSearchPage /> },
      { path: "flight-detail/:id", element: <FlightDetailPage /> },
      { path: "hotel-search", element: <HotelSearchPage /> },
      { path: "sns", element: <SnsPage /> },
      { path: "legal/:type", element: <LegalPage /> },
    ],
  },

  /* OAuth 콜백 (레이아웃 없이 단독 렌더링) */
  { path: "/auth/callback", element: <AuthCallbackPage /> },

  /* Conquest Map (풀스크린, 자체 헤더) */
  { path: "/conquest-map", element: <ConquestMapPage /> },
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PermissionToast />
    </>
  );
}
