"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const inputClass =
  "flex h-9 w-full border text-white border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xl";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Email o password errati");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-background shadow-2xl p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Accedi</h1>
          <p className="text-sm text-white/40 mt-1">FlightSim Tracker</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario.rossi@email.com" required className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={inputClass} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
        <p className="text-xs text-white/30 text-center">
          Non hai un account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Registrati
          </a>
        </p>
      </div>
    </div>
  );
}
