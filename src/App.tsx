import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/layout/Layout";
import HomePage from "@/pages/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [{ index: true, element: <HomePage /> }],
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
