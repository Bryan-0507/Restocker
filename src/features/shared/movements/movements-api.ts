import { createClient } from "@/lib/supabase/client";

// Deshace un movimiento registrando el contrario (función revert_movement). No borra nada.
// Vive en shared porque lo usan el historial y el aviso de "movimiento registrado".
export async function revertMovement(movementId: string): Promise<string> {
  const { data, error } = await createClient().rpc("revert_movement", { p_movement_id: movementId });

  // Los mensajes de la función ya vienen en español y explican por qué no se pudo.
  if (error) throw new Error(error.message || "No pudimos deshacer el movimiento.");
  return data;
}
