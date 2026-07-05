import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFamily } from "@/features/family/api";
import { currentUserQueryKey } from "@/features/auth/use-current-user";
import { ApiError } from "@/lib/api-client";

const formSchema = z.object({
  name: z.string().trim().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export function OnboardingFamily() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createFamily(values.name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      navigate("/", { replace: true });
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 409) {
        await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
        navigate("/", { replace: true });
      }
    },
  });

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("onboarding.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="family-name">{t("onboarding.nameLabel")}</Label>
              <Input
                id="family-name"
                placeholder={t("onboarding.namePlaceholder")}
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {t("onboarding.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
