import type { MovementType, ProductUnit } from "@/features/shared/types/inventory";
import { formatQuantity } from "@/features/shared/utils/units";
import type { CatalogEntry, MovementSource } from "../../shared/types/history-entry";

export const movementLabel: Record<MovementType, string> = {
  entrada: "Entrada",
  uso: "Uso",
  perdida: "Pérdida",
  ajuste: "Ajuste",
};

// "manual" no se muestra: es lo normal y solo agregaría ruido.
export const sourceLabel: Partial<Record<MovementSource, string>> = {
  foto: "foto",
  audio: "audio",
  texto: "texto",
};

type FieldChange = { from: unknown; to: unknown };

function describeField(field: string, change: FieldChange, unit: ProductUnit) {
  switch (field) {
    case "name":
      return `Nombre: ${change.from} → ${change.to}`;
    case "minimum_quantity":
      return `Mínimo ${Number(change.from)} → ${formatQuantity(Number(change.to), unit)}`;
    case "unit":
      return `Unidad ${change.from} → ${change.to}`;
    case "description":
      return change.to ? "Descripción actualizada" : "Descripción quitada";
    case "image_path":
      if (!change.from) return "Foto agregada";
      return change.to ? "Foto cambiada" : "Foto quitada";
    default:
      return null;
  }
}

// Qué pasó en el catálogo, en una frase corta: "Mínimo 2 → 4 kg · Foto agregada".
export function describeCatalogEntry(entry: CatalogEntry) {
  const changes = (entry.changes ?? {}) as Record<string, unknown>;

  switch (entry.type) {
    case "producto_creado":
      return "Producto creado";
    case "producto_desactivado":
      return "Producto desactivado";
    case "producto_reactivado":
      return "Producto reactivado";
    case "alias_agregado":
      return `Alias “${changes.alias}” agregado`;
    case "alias_quitado":
      return `Alias “${changes.alias}” quitado`;
    case "producto_editado": {
      const parts = Object.entries(changes)
        .map(([field, change]) => describeField(field, change as FieldChange, entry.product.unit))
        .filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : "Producto editado";
    }
  }
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-GT", { hour: "numeric", minute: "2-digit" });
}

// "Hoy", "Ayer" o "lunes 20 oct" (con año si no es el actual).
export function formatDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);

  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";

  const label = date.toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
