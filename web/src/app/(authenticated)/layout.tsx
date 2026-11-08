import { redirect } from "next/navigation";
import { AppShell } from "@/features/shared/app-shell/components/app-shell";
import { getProfileBusinessId } from "@/lib/supabase/get-profile-business";

export default async function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  // Sin negocio todavía: primero el onboarding.
  if (!(await getProfileBusinessId())) redirect("/onboarding");

  return <AppShell>{children}</AppShell>;
}
