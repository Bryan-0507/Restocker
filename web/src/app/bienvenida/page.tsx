import { redirect } from "next/navigation";
import { WelcomeForm } from "@/features/onboarding/welcome/components/welcome-form";
import { createClient } from "@/lib/supabase/server";

export default async function BienvenidaPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business:businesses(name)")
    .eq("id", auth.user.id)
    .single();

  // Sin negocio no llegó por invitación: va al onboarding normal.
  if (!profile?.business) redirect("/onboarding");

  return <WelcomeForm businessName={profile.business.name} />;
}
