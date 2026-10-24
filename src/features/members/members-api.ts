import type { Role } from "@/features/shared/types/inventory";
import { createClient } from "@/lib/supabase/client";
import type { InviteMemberInput, Member } from "./shared/types/member";

// Las rutas /api/... responden { error } con el mensaje para la persona.
async function readApiError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return new Error(body?.error ?? fallback);
}

// GET: miembros del negocio con su correo y estado (función business_members, solo admin).
export async function getMembers(): Promise<Member[]> {
  const { data, error } = await createClient().rpc("business_members");
  if (error) throw new Error(error.code === "42501" ? error.message : "No pudimos cargar a tu equipo.");

  return data.map((member) => ({
    id: member.id,
    fullName: member.full_name,
    email: member.email,
    role: member.role,
    joinedAt: member.joined_at,
    status: member.last_sign_in_at ? "activo" : "invitado",
    isCurrentUser: member.is_current_user,
  }));
}

// POST: invita por correo. Va al servidor porque usa la llave secreta de Supabase.
export async function inviteMember(input: InviteMemberInput) {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw await readApiError(response, "No pudimos enviar la invitación.");
}

// PATCH: cambia el rol de un miembro (no el propio).
export async function setMemberRole({ memberId, role }: { memberId: string; role: Role }) {
  const { error } = await createClient().rpc("set_member_role", { p_member_id: memberId, p_role: role });
  if (error) throw new Error(error.message || "No pudimos cambiar el rol.");
}

// DELETE: quita a un miembro, o cancela la invitación si nunca entró.
export async function removeMember(memberId: string): Promise<{ cancelledInvitation: boolean }> {
  const response = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
  if (!response.ok) throw await readApiError(response, "No pudimos quitar a esa persona.");
  return response.json();
}
