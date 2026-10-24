"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/shared/components/page-header";
import { cn } from "@/lib/utils";
import { InviteForm } from "../../invite/components/invite-form";
import { ROLE_LABEL } from "../../shared/role-labels";
import { useMembersList } from "../hooks/useMembersList";

export function MembersList() {
  const { members, isLoading, error, refetch, setRole, removeMember, busyMemberId } = useMembersList();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/ajustes" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 self-start")}>
        <ArrowLeft aria-hidden />
        Ajustes
      </Link>

      <PageHeader title="Miembros" />

      <InviteForm />

      <section aria-label="Equipo" className="flex flex-col gap-2">
        <h2 className="px-1 text-xl font-bold">Tu equipo</h2>

        {isLoading && <p className="px-1 text-sm text-muted-foreground">Cargando…</p>}

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-card bg-card p-4">
            <span className="text-sm">{error.message}</span>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {members.map((member) => {
            const isBusy = busyMemberId === member.id;
            const otherRole = member.role === "admin" ? "base" : "admin";

            return (
              <li key={member.id} className="flex flex-wrap items-center gap-3 rounded-card bg-card px-4 py-3.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {member.fullName || member.email}
                    {member.isCurrentUser && <span className="text-muted-foreground"> (tú)</span>}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{member.email}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
                  {member.status === "invitado" && <Badge variant="review">Invitación enviada</Badge>}

                  {!member.isCurrentUser && (
                    <>
                      {member.status === "activo" && (
                        <Button variant="ghost" size="sm" disabled={isBusy} onClick={() => setRole(member.id, otherRole)}>
                          Hacer {ROLE_LABEL[otherRole].toLowerCase()}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => removeMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        {member.status === "invitado" ? "Cancelar invitación" : "Quitar"}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
