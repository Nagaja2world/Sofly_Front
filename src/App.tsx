import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NoHeaderLayout from "./layout/NoHeaderLayout";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";

import AuthCallbackPage from "@/pages/AuthCallbackPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <NoHeaderLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },

  /* OAuth 콜백 (레이아웃 없이 단독 렌더링) */
  { path: "/auth/callback", element: <AuthCallbackPage /> },

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
