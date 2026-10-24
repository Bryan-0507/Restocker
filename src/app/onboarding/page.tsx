import { redirect } from "next/navigation";
import { BusinessForm } from "@/features/onboarding/business/components/business-form";
import { getProfileBusinessId } from "@/lib/supabase/get-profile-business";

export default async function OnboardingPage() {
  if (await getProfileBusinessId()) redirect("/");
  return <BusinessForm />;
}
