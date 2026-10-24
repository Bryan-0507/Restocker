import { Camera, Keyboard, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/shared/components/page-header";

const inputs = [
  { label: "Foto", icon: Camera },
  { label: "Audio", icon: Mic },
  { label: "Texto", icon: Keyboard },
];

// Marcador del esqueleto: la caja de captura real se construye después.
export function CaptureBox() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Capturar" />
      <p className="text-muted-foreground">Toma una foto, graba un audio o escribe lo que entró o salió.</p>
      <div className="grid grid-cols-3 gap-3">
        {inputs.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            variant="ghost"
            className="aspect-square h-auto flex-col gap-2 rounded-card bg-card text-base"
          >
            <Icon className="size-7 text-primary" aria-hidden />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
