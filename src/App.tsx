import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NoHeaderLayout from "./layout/NoHeaderLayout";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import Profile from "@/pages/Profile";
import ProfileEditPage from "@/pages/ProfileEditPage";
import ProfileOnboardingPage from "@/pages/ProfileOnboardingPage";
import FlightSearchPage from "@/pages/FlightSearchPage";
import FlightDetailPage from "@/pages/FlightDetailPage";
import WorkspacePage from "@/pages/WorkspacePage";
import WorkspacePreviewPage from "@/pages/WorkspacePreviewPage";
import SnsPage from "./pages/SnsPage";

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
      { path: "sns", element: <SnsPage /> },
    ],
  },

  /* OAuth 콜백 (레이아웃 없이 단독 렌더링) */
  { path: "/auth/callback", element: <AuthCallbackPage /> },

  /* Conquest Map (풀스크린, 자체 헤더) */
  { path: "/conquest-map", element: <ConquestMapPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
