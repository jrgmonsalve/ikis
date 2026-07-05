import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { loginAsDevUser, loginWithGoogle } from "@/features/auth/api";
import { currentUserQueryKey } from "@/features/auth/use-current-user";
import { getToken } from "@/lib/auth-storage";

const DEV_AUTH_ENABLED = import.meta.env.VITE_DEV_AUTH === "true";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  if (getToken()) {
    return <Navigate to="/" replace />;
  }

  async function afterLogin() {
    await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    navigate("/", { replace: true });
  }

  async function handleGoogleCredential(idToken: string) {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      await afterLogin();
    } catch {
      setError(t("login.error"));
    }
  }

  async function handleDevLogin() {
    setError(null);
    try {
      await loginAsDevUser();
      await afterLogin();
    } catch {
      setError(t("login.error"));
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{t("login.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground">{t("login.subtitle")}</p>
          <GoogleSignInButton onCredential={handleGoogleCredential} />
          {DEV_AUTH_ENABLED && (
            <Button variant="secondary" onClick={handleDevLogin}>
              {t("login.devLogin")}
            </Button>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
