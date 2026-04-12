import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NoHeaderLayout from "./layout/NoHeaderLayout";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/ProfilePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <NoHeaderLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "/profile", element: <ProfilePage /> },
    ],
  },

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
