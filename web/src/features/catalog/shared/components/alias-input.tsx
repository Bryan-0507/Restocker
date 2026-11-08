"use client";

import { X } from "lucide-react";
import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type Chip = { id: string; label: string };

// Alias como chips: Enter o coma agrega, pegar "a, b, c" agrega varios, Backspace en vacío
// quita el último. Sirve para crear (chips en memoria) y para editar (cada cambio va al servidor).
export function AliasInput({
  id,
  chips,
  onAdd,
  onRemove,
  disabled,
  placeholder = "Escribe un alias y presiona Enter",
}: {
  id: string;
  chips: Chip[];
  onAdd: (labels: string[]) => void;
  onRemove: (chip: Chip) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const existing = new Set(chips.map((chip) => chip.label.toLowerCase()));
    const labels = raw
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label.length > 0 && !existing.has(label.toLowerCase()));

    if (labels.length > 0) onAdd([...new Set(labels)]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && draft === "" && chips.length > 0) {
      onRemove(chips[chips.length - 1]);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (text.includes(",")) {
      event.preventDefault();
      commit(text);
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-12 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "opacity-60",
      )}
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm text-secondary-foreground"
        >
          {chip.label}

          <button
            type="button"
            onClick={() => onRemove(chip)}
            disabled={disabled}
            aria-label={`Quitar alias ${chip.label}`}
            className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-background/60"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}

      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => draft.trim() && commit(draft)}
        disabled={disabled}
        placeholder={chips.length === 0 ? placeholder : "Agregar otro"}
        className="h-8 min-w-32 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
}
