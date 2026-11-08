import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/supabase/require-admin";

const inviteSchema = z.object({
  email: z.email().transform((email) => email.trim().toLowerCase()),
  role: z.enum(["admin", "base"]),
});

// POST: registra la invitación y manda el correo de invitación de Supabase Auth.
// La invitación se guarda ANTES de invitar: inviteUserByEmail crea la cuenta en ese momento
// y el trigger handle_new_user la usa para meter a la persona al negocio con su rol.
export async function POST(request: NextRequest) {
  const admin = await requireBusinessAdmin();
  if (admin.error) return admin.error;

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribe un correo válido y elige un rol." }, { status: 400 });
  }

  const { email, role } = parsed.data;

  const { data: invitation, error: invitationError } = await admin.supabase
    .from("invitations")
    .insert({ business_id: admin.businessId, email, role, invited_by: admin.user.id })
    .select("id")
    .single();

  if (invitationError) {
    const message =
      invitationError.code === "23505" ? "Ya hay una invitación pendiente para ese correo." : "No pudimos crear la invitación.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  // Nombre del negocio y de quien invita, para personalizar el correo ({{ .Data.* }} en la plantilla).
  const [{ data: business }, { data: inviter }] = await Promise.all([
    admin.supabase.from("businesses").select("name").eq("id", admin.businessId).single(),
    admin.supabase.from("profiles").select("full_name").eq("id", admin.user.id).single(),
  ]);

  const { error: inviteError } = await createAdminClient().auth.admin.inviteUserByEmail(email, {
    redirectTo: `${request.nextUrl.origin}/auth/confirm`,
    data: {
      business_name: business?.name ?? "tu negocio",
      invited_by_name: inviter?.full_name || "Tu equipo",
    },
  });

  if (inviteError) {
    // Sin correo enviado, la invitación no sirve: se quita para poder intentarlo de nuevo.
    await admin.supabase.from("invitations").delete().eq("id", invitation.id);

    const alreadyRegistered = inviteError.code === "email_exists" || /already been registered/i.test(inviteError.message);
    return NextResponse.json(
      {
        error: alreadyRegistered
          ? "Ese correo ya tiene una cuenta en Restocker. Por ahora solo se puede invitar a correos nuevos."
          : "No pudimos enviar la invitación. Intenta de nuevo.",
      },
      { status: alreadyRegistered ? 409 : 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
