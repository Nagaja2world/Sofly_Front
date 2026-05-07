import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NoHeaderLayout from "./layout/NoHeaderLayout";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";
import FlightSearchPage from "@/pages/FlightSearchPage";
import FlightDetailPage from "@/pages/FlightDetailPage";

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
      { path: "/profile", element: <ProfilePage /> },
      // { path: "/flight-search", element: <FlightSearchPage /> },
    ],
  },

  /* 일반 페이지 (Header 포함 Layout) */
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "flight-search", element: <FlightSearchPage /> },
      { path: "flight-detail/:id", element: <FlightDetailPage /> },
    ],
  },

  /* OAuth 콜백 (레이아웃 없이 단독 렌더링) */
  { path: "/auth/callback", element: <AuthCallbackPage /> },

  /* Conquest Map (풀스크린, 자체 헤더) */
  { path: "/conquest-map", element: <ConquestMapPage /> },

  // TODO: 추가 라우트
  // { path: "/login", element: <LoginPage /> },
  // {
  //   path: "/search",
  //   element: <SearchLayout />,
  //   children: [{ index: true, element: <SearchResultPage /> }],
  // },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
