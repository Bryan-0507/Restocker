"use client";

import { ShieldCheck, UserMinus, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "../../shared/role-labels";
import type { Member } from "../../shared/types/member";

const initialsOf = (member: Member) =>
  (member.fullName || member.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "short" });

export function MemberRow({
  member,
  isBusy,
  isConfirmingRemove,
  onToggleRole,
  onAskRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  member: Member;
  isBusy: boolean;
  isConfirmingRemove: boolean;
  onToggleRole: () => void;
  onAskRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}) {
  const isInvited = member.status === "invitado";
  const nextRole = member.role === "admin" ? "base" : "admin";

  return (
    <li className="flex flex-col">
      <div className={cn("flex items-center gap-3 px-4 py-3.5", isBusy && "opacity-60")}>
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl font-heading text-base font-bold",
            isInvited ? "border border-dashed border-border text-muted-foreground" : "bg-accent text-accent-foreground",
          )}
        >
          {initialsOf(member)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{member.fullName || member.email}</span>
            {member.isCurrentUser && <span className="shrink-0 text-sm text-muted-foreground">(tú)</span>}
          </span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
              {member.role === "admin" ? (
                <ShieldCheck className="size-3.5" aria-hidden />
              ) : (
                <UserRound className="size-3.5" aria-hidden />
              )}
              {ROLE_LABEL[member.role]}
            </span>
            {isInvited ? (
              <Badge variant="review" className="font-normal">
                Invitado el {formatDate(member.joinedAt)}
              </Badge>
            ) : (
              member.fullName && <span className="truncate">{member.email}</span>
            )}
          </span>
        </div>

        {!member.isCurrentUser && (
          <div className="flex shrink-0 items-center gap-1">
            {!isInvited && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={onToggleRole}
                className="hidden h-9 rounded-full px-3 text-muted-foreground sm:inline-flex"
              >
                Hacer {ROLE_LABEL[nextRole].toLowerCase()}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-touch"
              disabled={isBusy || isConfirmingRemove}
              onClick={onAskRemove}
              aria-label={isInvited ? `Cancelar invitación de ${member.email}` : `Quitar a ${member.fullName || member.email}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <UserMinus aria-hidden />
            </Button>
          </div>
        )}
      </div>

      {/* En mobile el cambio de rol baja a su propia línea para no apretar la fila. */}
      {!member.isCurrentUser && !isInvited && !isConfirmingRemove && (
        <div className="-mt-2 px-4 pb-3 pl-[4.75rem] sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={onToggleRole}
            className="-ml-3 h-9 rounded-full px-3 text-primary"
          >
            Hacer {ROLE_LABEL[nextRole].toLowerCase()}
          </Button>
        </div>
      )}

      {isConfirmingRemove && (
        <div className="flex items-center justify-between gap-3 border-t border-dashed px-4 py-2.5">
          <span className="text-sm font-medium">
            {isInvited ? "¿Cancelar la invitación?" : "¿Quitar del negocio?"}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onCancelRemove} className="h-9 rounded-full px-3 text-muted-foreground">
              No
            </Button>
            <Button
              size="sm"
              onClick={onConfirmRemove}
              className="h-9 rounded-full bg-destructive px-3 text-destructive-foreground hover:bg-destructive/90"
            >
              {isInvited ? "Cancelar invitación" : "Quitar"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
