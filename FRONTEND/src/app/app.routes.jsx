import { createBrowserRouter} from "react-router";
import Register from "../features/auth/pages/register";
import Login from "../features/auth/pages/Login";
import RootLayout from "../components/layout/RootLayout";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <div className="p-8 text-center"><h1 className="text-3xl font-light">Welcome to CivicFlow</h1><p className="text-secondary-text mt-2">Manage your complaints seamlessly.</p></div>
      },
      {
        path: "register",
        element: <Register/>
      },
      {
        path: "login",
        element: <Login/>
      }
    ]
  }
]);