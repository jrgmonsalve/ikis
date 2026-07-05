import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "@/features/auth/use-current-user";
import { clearToken, getToken } from "@/lib/auth-storage";

export function RequireAuth() {
  const hasToken = Boolean(getToken());
  const { data, isLoading, error } = useCurrentUser();

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return null;
  }

  if (error) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  if (!data) {
    return null;
  }

  return <Outlet context={data} />;
}

export function RequireFamily() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading || !data) {
    return null;
  }

  if (!data.familyId) {
    return <Navigate to="/onboarding/family" replace />;
  }

  return <Outlet context={data} />;
}

export function RequireNoFamily() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading || !data) {
    return null;
  }

  if (data.familyId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={data} />;
}
