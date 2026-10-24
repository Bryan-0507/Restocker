"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { captureAction, isActive, sections, type NavItem } from "@/features/shared/app-shell/navigation";
import { cn } from "@/lib/utils";

// Navegación móvil (< lg): dos secciones, Capturar al centro, dos secciones.
export function BottomNav() {
  const pathname = usePathname();
  const [first, second, ...rest] = sections;
  const CaptureIcon = captureAction.icon;

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid h-18 max-w-md grid-cols-5 items-center px-2">
        <Tab item={first} active={isActive(pathname, first.href)} />
        <Tab item={second} active={isActive(pathname, second.href)} />
        <Link
          href={captureAction.href}
          aria-label={captureAction.label}
          className={cn(
            buttonVariants({ variant: "capture" }),
            "mx-auto -mt-8 size-16 rounded-full shadow-lg ring-4 ring-background",
          )}
        >
          <CaptureIcon className="size-7" strokeWidth={2.6} aria-hidden />
        </Link>
        {rest.map((item) => (
          <Tab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-secondary")}>
        <Icon className="size-5" aria-hidden />
      </span>
      {item.label}
    </Link>
  );
}
