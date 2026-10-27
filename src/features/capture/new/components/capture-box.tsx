"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/shared/components/page-header";
import { useCaptureBox } from "../hooks/useCaptureBox";
import { CaptureComposer } from "./capture-composer";
import { CaptureReview } from "../../review/components/capture-review";
import { CaptureCatalogEmpty, CaptureError, CaptureRejected } from "./capture-outcome";
import { CaptureProcessing } from "./capture-processing";

export function CaptureBox() {
  const capture = useCaptureBox();
  const { phase } = capture;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {/* La revisión trae su propio título. */}
      {!(phase.kind === "editing" && capture.pendingCapture) && <PageHeader title="Capturar" />}
      <CaptureBody capture={capture} phase={phase} />
    </div>
  );
}

function CaptureBody({ capture, phase }: { capture: ReturnType<typeof useCaptureBox>; phase: ReturnType<typeof useCaptureBox>["phase"] }) {
  // El envío manda sobre el contexto: si termina en revisión, el contexto se refresca después.
  if (phase.kind === "submitting") return <CaptureProcessing step={phase.step} />;

  if (phase.kind === "rejected") {
    return (
      <CaptureRejected
        message={phase.message}
        entries={phase.entries}
        onEdit={capture.backToEditing}
        onStartOver={capture.startOver}
      />
    );
  }

  if (phase.kind === "error") {
    return (
      <CaptureError
        message={phase.message}
        canRetry={phase.canRetry}
        onRetry={capture.submit}
        onBack={capture.backToEditing}
      />
    );
  }

  if (capture.isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-5 w-4/5" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="aspect-square rounded-card" />
          ))}
        </div>
        <Skeleton className="h-14 rounded-full" />
      </div>
    );
  }

  if (capture.error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
        <p className="font-medium">{capture.error.message}</p>
        <Button variant="secondary" size="touch" onClick={() => capture.refetch()}>
          <RotateCw aria-hidden />
          Reintentar
        </Button>
      </div>
    );
  }

  // Una captura a la vez: mientras haya una por revisar, Capturar muestra la revisión (Revisión, punto 1).
  if (capture.pendingCapture) return <CaptureReview key={capture.pendingCapture.id} captureId={capture.pendingCapture.id} />;
  if (capture.catalogEmpty) return <CaptureCatalogEmpty />;

  return <CaptureComposer capture={capture} />;
}
