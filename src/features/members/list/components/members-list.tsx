"use client";

import Link from "next/link";
import { ArrowLeft, RotateCw, UsersRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/shared/components/page-header";
import { cn } from "@/lib/utils";
import { InviteForm } from "../../invite/components/invite-form";
import { useMembersList } from "../hooks/useMembersList";
import { MemberRow } from "./member-row";

export function MembersList() {
  const team = useMembersList();
  const invited = team.members.filter((member) => member.status === "invitado").length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/ajustes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 self-start")}>
          <ArrowLeft aria-hidden />
          Ajustes
        </Link>
        <PageHeader title="Miembros" />
      </div>

      <InviteForm />

      <section aria-label="Tu equipo" className="flex flex-col gap-2">
        <h2 className="flex items-baseline gap-2 px-1 text-sm font-medium text-muted-foreground">
          Tu equipo
          {team.members.length > 0 && (
            <span className="tabular-nums">
              · {team.members.length} {team.members.length === 1 ? "persona" : "personas"}
              {invited > 0 && ` (${invited} por aceptar)`}
            </span>
          )}
        </h2>

        {team.isLoading && (
          <ul aria-label="Cargando equipo" className="divide-y overflow-hidden rounded-card bg-card">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-11 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {team.error && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-8 text-center">
            <p className="font-medium">{team.error.message}</p>
            <Button variant="secondary" size="touch" onClick={() => team.refetch()}>
              <RotateCw aria-hidden />
              Reintentar
            </Button>
          </div>
        )}

        {team.members.length > 0 && (
          <ul className="divide-y overflow-hidden rounded-card bg-card">
            {team.members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isBusy={team.busyMemberId === member.id}
                isConfirmingRemove={team.confirmingRemoveId === member.id}
                onToggleRole={() => team.setRole(member.id, member.role === "admin" ? "base" : "admin")}
                onAskRemove={() => team.askRemove(member.id)}
                onCancelRemove={team.cancelRemove}
                onConfirmRemove={() => team.confirmRemove(member.id)}
              />
            ))}
          </ul>
        )}

        {team.isAlone && (
          <div className="flex items-center gap-3 rounded-card border border-dashed px-4 py-3.5 text-sm text-muted-foreground">
            <UsersRound className="size-5 shrink-0" aria-hidden />
            Por ahora solo estás tú. Invita a quien te ayuda con el inventario.
          </div>
        )}
      </section>
    </div>
  );
}
