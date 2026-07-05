import { apiFetch } from "@/lib/api-client";

export type Family = {
  id: string;
  name: string;
  createdAt: string;
};

export function createFamily(name: string): Promise<Family> {
  return apiFetch<Family>("/families", { method: "POST", body: { name } });
}
