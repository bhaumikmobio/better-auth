"use client";

import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useIsClient } from "@/hooks/use-is-client";
import { useOpenModalDialog } from "@/hooks/use-open-modal-dialog";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmLoadingLabel: string;
  cancelLabel: string;
  confirmVariant?: "danger";
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
  isConfirming?: boolean;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmLoadingLabel,
  cancelLabel,
  confirmVariant = "danger",
  onConfirm,
  onDismiss,
  isConfirming = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isClient = useIsClient();

  useOpenModalDialog(dialogRef, isClient);

  async function handleConfirm() {
    await onConfirm();
  }

  if (!isClient) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[400] w-[min(100vw-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/90 bg-white p-0 text-slate-900 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.55)]"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      role="alertdialog"
      aria-modal="true"
      onClose={onDismiss}
    >
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isConfirming} onClick={() => dialogRef.current?.close()}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            disabled={isConfirming}
            isLoading={isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming ? confirmLoadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
