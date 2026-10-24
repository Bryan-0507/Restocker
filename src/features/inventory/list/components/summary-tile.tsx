import { cn } from "@/lib/utils";

export function SummaryTile({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className={cn("flex flex-col rounded-2xl px-4 py-3", className)}>
      <span className="font-heading text-3xl font-extrabold leading-tight">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
