import { cn } from "@/lib/utils";

export function ProductThumb({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage que cambia cada hora
      <img src={imageUrl} alt="" className={cn("size-12 shrink-0 rounded-2xl object-cover", className)} />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        // Un solo tono: así la inicial no cambia de color mientras se escribe el nombre.
        "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent font-heading text-xl font-bold text-accent-foreground",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
