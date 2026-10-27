"use client";

import { ChevronRight, LogOut, Moon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/shared/components/page-header";
import { ThemeSwitch } from "@/features/shared/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { type SettingsOption, useSettingsMenu } from "../hooks/useSettingsMenu";

export function SettingsMenu() {
  const { session, roleLabel, groups, onSelectOption, onSignOut, isSigningOut } = useSettingsMenu();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title="Ajustes" />

      {/* Quién eres y en qué negocio: contexto antes de las opciones. */}
      <div className="flex items-center gap-4 rounded-card bg-card p-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary font-heading text-xl font-bold text-secondary-foreground">
          {session?.initials ?? <Skeleton className="size-full rounded-2xl" />}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {session ? (
            <>
              <span className="truncate font-heading text-xl font-bold leading-tight">{session.fullName}</span>
              <span className="truncate text-sm text-muted-foreground">{session.email}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary">{roleLabel}</Badge>
                {session.business && <span className="truncate">en {session.business.name}</span>}
              </span>
            </>
          ) : (
            <>
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-3/5" />
            </>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <SettingsGroup key={group.title} title={group.title}>
          {group.options.map((option) => (
            <SettingsRow key={option.label} option={option} onSelect={() => onSelectOption(option)} />
          ))}
        </SettingsGroup>
      ))}

      <SettingsGroup title="Preferencias">
        <li>
          <label htmlFor="theme-switch" className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
            <RowIcon>
              <Moon className="size-5" aria-hidden />
            </RowIcon>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-medium">Modo oscuro</span>
              <span className="text-xs text-muted-foreground">Se recuerda en este dispositivo</span>
            </span>
            <ThemeSwitch id="theme-switch" />
          </label>
        </li>
      </SettingsGroup>

      {/* Separado del resto en su propia tarjeta: salir no es una opción más de la lista, pero
          sigue la misma familia visual (tarjeta blanca) en lugar de un contorno sobre el fondo. */}
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-card bg-card text-base font-medium text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:opacity-60"
      >
        <LogOut className="size-5" aria-hidden />
        {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{title}</h2>
      {/* Una sola tarjeta por grupo, con divisores: se lee como un bloque de opciones. */}
      <ul className="divide-y overflow-hidden rounded-card bg-card">{children}</ul>
    </section>
  );
}

function RowIcon({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl",
        muted ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

function SettingsRow({ option, onSelect }: { option: SettingsOption; onSelect: () => void }) {
  const comingSoon = Boolean(option.comingSoon);

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none"
      >
        <RowIcon muted={comingSoon}>
          <option.icon className="size-5" aria-hidden />
        </RowIcon>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn("text-base font-medium", comingSoon && "text-muted-foreground")}>{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </span>

        {/* "Pronto" en lugar de flecha: no promete una pantalla que todavía no existe. */}
        {comingSoon ? (
          <Badge variant="outline" className="shrink-0 font-normal">
            Pronto
          </Badge>
        ) : (
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
            aria-hidden
          />
        )}
      </button>
    </li>
  );
}
