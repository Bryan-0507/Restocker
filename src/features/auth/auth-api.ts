import { createClient } from "@/lib/supabase/client";

export async function signIn({ email, password }: { email: string; password: string }) {
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      error.code === "email_not_confirmed"
        ? "Confirma tu correo antes de iniciar sesión."
        : "Correo o contraseña incorrectos.",
    );
  }
}

export async function resendConfirmation(email: string) {
  const { error } = await createClient().auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });

  if (error) {
    throw new Error(
      error.status === 429 ? "Espera un momento antes de pedir otro correo." : "No pudimos reenviar el correo.",
    );
  }
}

// Devuelve si quedó con sesión; si no, falta confirmar el correo.
export async function signUp({ fullName, email, password }: { fullName: string; email: string; password: string }) {
  const { data, error } = await createClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.code === "user_already_exists" ? "Ya existe una cuenta con ese correo." : error.message);
  }

  return { hasSession: Boolean(data.session) };
}
