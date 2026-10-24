"use client";

import { ChevronRight, LogOut, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/shared/components/page-header";
import { ThemeToggle } from "@/features/shared/theme/theme-toggle";
import { useSettingsMenu } from "../hooks/useSettingsMenu";

export function SettingsMenu() {
  const { session, roleLabel, options, onSelectOption, onSignOut, isSigningOut } = useSettingsMenu();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Ajustes" />

      <div className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
          {session?.initials}
        </span>

        <div className="flex min-w-0 flex-col">
          <span className="h-6 truncate font-heading text-lg font-bold leading-tight">{session?.fullName}</span>
          <span className="h-4 text-xs text-muted-foreground">{roleLabel}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.label}>
            <Button
              variant="ghost"
              onClick={() => onSelectOption(option)}
              className="h-auto w-full justify-start gap-3 rounded-card bg-card px-4 py-3.5 text-left"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <option.icon className="size-5" aria-hidden />
              </span>

              <span className="flex min-w-0 flex-1 flex-col whitespace-normal">
                <span className="text-base font-medium">{option.label}</span>
                <span className="text-xs font-normal text-muted-foreground">{option.description}</span>
              </span>

              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </Button>
          </li>
        ))}
    
        <li className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Palette className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-medium">Apariencia</span>
            <span className="text-xs text-muted-foreground">Modo claro u oscuro</span>
          </span>
          <ThemeToggle className="bg-muted" />
        </li>
        <li>
          <Button
            variant="ghost"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="h-auto w-full justify-start gap-3 rounded-card px-4 py-3.5 text-base text-destructive hover:text-destructive"
          >
            <LogOut className="size-5" aria-hidden />
            {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </Button>
        </li>
      </ul>
    </div>
  );
}
