"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { captureAction, isActive, sections } from "@/features/shared/app-shell/navigation";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { ThemeToggle } from "@/features/shared/theme/theme-toggle";
import { cn } from "@/lib/utils";

// Navegación de escritorio (≥ lg). En móvil se usa BottomNav.
export function AppSidebar() {
  const pathname = usePathname();
  const { user: currentUser, business } = useCurrentSession();
  const CaptureIcon = captureAction.icon;

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 text-sidebar-foreground lg:flex">
      <Link href="/" className="flex items-center gap-3 px-2 pt-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-heading text-xl font-bold text-primary-foreground">
          R
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-heading text-xl font-bold leading-tight">Restocker</span>
          <span className="truncate text-xs text-muted-foreground">{business.name}</span>
        </span>
      </Link>

      <Link
        href={captureAction.href}
        className={cn(buttonVariants({ variant: "capture", size: "touch" }), "h-12 font-heading text-lg font-bold")}
      >
        <CaptureIcon className="size-5" strokeWidth={2.6} aria-hidden />
        {captureAction.label}
      </Link>

      <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1">
        {sections.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "touch" }),
                "justify-start gap-3 px-4",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 rounded-2xl bg-muted p-2 pl-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          {currentUser.initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{currentUser.name}</span>
          <span className="text-xs text-muted-foreground">
            {currentUser.role === "admin" ? "Administrador" : "Usuario"}
          </span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
