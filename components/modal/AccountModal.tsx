"use client";

import { useState } from "react";
import { updateAccount } from "@/lib/actions";
import { signOut } from "next-auth/react";
import Button from "../ui/button";

const inputClass =
  "flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors text-white  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xl";
const labelClass = "text-xs text-muted-foreground mb-1.5 block font-medium";

type Props = {
  open: boolean;
  onClose: () => void;
  user: { name?: string | null; email?: string | null };
};

export default function AccountModal({ open, onClose, user }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const formData = new FormData(e.currentTarget);
      await updateAccount(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Errore durante il salvataggio");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-2000 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-background shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Account</h2>
            <p className="text-xs text-white/40 mt-0.5">{user.email}</p>
          </div>
          <Button variant="close" size="icon" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/50"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input name="name" defaultValue={user.name ?? ""} placeholder="Il tuo nome" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" defaultValue={user.email ?? ""} required className={inputClass} />
          </div>

          <div className="w-full h-px bg-white/8" />

          <div>
            <label className={labelClass}>
              Password attuale <span className="text-white/20">(richiesta per salvare)</span>
            </label>
            <input name="currentPassword" type="password" placeholder="••••••••" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Nuova password <span className="text-white/20">(opzionale)</span>
            </label>
            <input name="newPassword" type="password" placeholder="••••••••" minLength={8} className={inputClass} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-green-500">Salvato con successo</p>}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </form>

        <div className="w-full h-px bg-white/8" />

        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-destructive hover:text-destructive/80 transition-colors text-left">
          Esci dall'account
        </button>
      </div>
    </div>
  );
}
