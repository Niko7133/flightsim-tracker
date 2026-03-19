"use client";

import Button from "./button";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title = "Sei sicuro?", description = "Questa azione non può essere annullata.", confirmLabel = "Elimina", onConfirm, onCancel }: Props) {
  return (
    <div
      className={`fixed inset-0 z-2000 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-background shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/40">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Annulla
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-destructive hover:bg-destructive/90">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
