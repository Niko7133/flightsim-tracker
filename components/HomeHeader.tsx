"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import FlightListSearch from "./FlightListSearch";
import FlightMapAllWrapper from "./FlightMapAllWrapper";
import type { Flight } from "@/db/schema";
import Button from "./ui/button";
import AccountModal from "./modal/AccountModal";

export default function HomeHeader({ flights }: { flights: Flight[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <div className="flex items-center justify-between px-body py-6">
        <div>
          <h1 className="text-2xl font-bold">I miei voli</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{flights.length} voli totali</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setModalOpen(true)} className="rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Nuovo volo
          </Button>
        </div>
      </div>

      <div className="flex h-[80vh] bg-background text-white overflow-hidden">
        <div className="w-2/4 shrink-0 flex flex-col h-full border-r border-zinc-800">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FlightListSearch flights={flights} externalModalOpen={modalOpen} onExternalModalClose={() => setModalOpen(false)} />
          </div>
        </div>
        <div className="w-2/4 flex-1 h-full px-6 py-4">
          <div className="rounded-3xl overflow-hidden w-full h-full border border-zinc-800">
            <FlightMapAllWrapper flights={flights} />
          </div>
        </div>
      </div>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} user={session?.user ?? {}} />
    </>
  );
}
