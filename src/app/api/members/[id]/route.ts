import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireBusinessAdmin } from "@/lib/supabase/require-admin";

// DELETE: quita a un miembro del negocio.
// - Si nunca entró (invitación sin aceptar): se borra su cuenta, así el correo se puede volver a invitar.
// - Si ya entró: se le saca del negocio con remove_member; su historial queda intacto.
export async function DELETE(_request: NextRequest, context: RouteContext<"/api/members/[id]">) {
  const admin = await requireBusinessAdmin();
  if (admin.error) return admin.error;

  const { id } = await context.params;

  if (id === admin.user.id) {
    return NextResponse.json({ error: "No puedes quitarte a ti mismo del negocio." }, { status: 400 });
  }

  // RLS: el administrador solo ve perfiles de su negocio.
  const { data: member } = await admin.supabase.from("profiles").select("id").eq("id", id).eq("business_id", admin.businessId).maybeSingle();
  if (!member) {
    return NextResponse.json({ error: "Esa persona no es miembro de tu negocio." }, { status: 404 });
  }

  const adminClient = createAdminClient();
  const { data: account } = await adminClient.auth.admin.getUserById(id);

  if (account.user && !account.user.last_sign_in_at) {
    const { error } = await adminClient.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: "No pudimos cancelar la invitación." }, { status: 502 });
    return NextResponse.json({ ok: true, cancelledInvitation: true });
  }

  const { error } = await admin.supabase.rpc("remove_member", { p_member_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, cancelledInvitation: false });
}
