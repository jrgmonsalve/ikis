import { apiFetch } from "@/lib/api-client";
import { setToken } from "@/lib/auth-storage";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  familyId: string | null;
};

export async function loginWithGoogle(idToken: string): Promise<void> {
  const { token } = await apiFetch<{ token: string }>("/auth/google", {
    method: "POST",
    body: { idToken },
  });
  setToken(token);
}

export async function loginAsDevUser(): Promise<void> {
  const { token } = await apiFetch<{ token: string }>("/auth/dev", { method: "POST" });
  setToken(token);
}

export function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/me");
}
