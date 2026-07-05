import { createBrowserRouter } from "react-router";
import { CategoriesPage } from "./CategoriesPage";
import { Dashboard } from "./Dashboard";
import { RequireAuth, RequireFamily, RequireNoFamily } from "./guards";
import { Login } from "./Login";
import { OnboardingFamily } from "./OnboardingFamily";
import { RootLayout } from "./RootLayout";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireNoFamily />,
        children: [{ path: "/onboarding/family", element: <OnboardingFamily /> }],
      },
      {
        element: <RequireFamily />,
        children: [
          {
            element: <RootLayout />,
            children: [
              { path: "/", element: <Dashboard /> },
              { path: "/categories", element: <CategoriesPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
