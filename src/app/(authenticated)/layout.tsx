import { AppShell } from "@/features/shared/app-shell/components/app-shell";

export default function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
