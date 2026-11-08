import { Camera, Keyboard, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const inputs = [
  { label: "Foto del cuaderno", icon: Camera },
  { label: "Nota de voz", icon: Mic },
  { label: "Mensaje", icon: Keyboard },
];

// Panel de marca de las pantallas sin sesión (solo escritorio): explica el producto antes de entrar.
export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-capture/80" aria-hidden />

      <div className="relative flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground font-heading text-xl font-bold text-primary">
          R
        </span>
        <span className="font-heading text-2xl font-bold">Restocker</span>
      </div>

      <div className="relative flex max-w-lg flex-col gap-8">
        <p className="font-heading text-5xl font-extrabold leading-[1.05]">
          Tu inventario se actualiza con una foto, un audio o un mensaje.
        </p>

        <ul className="flex flex-wrap gap-2">
          {inputs.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-medium"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 rounded-card bg-card p-4 text-card-foreground shadow-lg" aria-hidden>
          <div className="flex items-center justify-between gap-3">
            <span className="font-heading text-lg font-bold">Harina de arroz</span>
            <Badge variant="ok">Entrada</Badge>
          </div>

          <span className="text-sm text-muted-foreground">&quot;entraron 50 kilos de harina de arroz&quot; · foto</span>
          <span className="font-medium">5 kg → 55 kg</span>
        </div>
      </div>

      <p className="relative text-sm opacity-80">Anota como siempre. Restocker lo ordena por ti.</p>
    </aside>
  );
}
