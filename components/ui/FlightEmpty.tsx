// FlightEmpty.tsx
"use client";

import { LuPlaneTakeoff } from "react-icons/lu";

type PreviewFlight = {
  id: number;
  from: { iata: string; city: string };
  to: { iata: string; city: string };
};

const PREVIEW_FLIGHTS: PreviewFlight[] = [
  { id: 1, from: { iata: "JFK", city: "New York" }, to: { iata: "LHR", city: "London" } },
  { id: 2, from: { iata: "HND", city: "Tokyo" }, to: { iata: "SIN", city: "Singapore" } },
  { id: 3, from: { iata: "SFO", city: "San Francisco" }, to: { iata: "SEA", city: "Seattle" } },
  { id: 4, from: { iata: "CDG", city: "Paris" }, to: { iata: "FCO", city: "Rome" } },
  { id: 5, from: { iata: "LAX", city: "Los Angeles" }, to: { iata: "NRT", city: "Tokyo" } },
];

const SCROLL_CARDS = [...PREVIEW_FLIGHTS, ...PREVIEW_FLIGHTS];

export default function FlightEmpty({ hasFlights, hasFilters, onAddFlight, onShowAll }: { hasFlights: boolean; hasFilters: boolean; onAddFlight?: () => void; onShowAll?: () => void }) {
  const title = hasFlights ? "No flights found" : "No flights yet";
  const description = !hasFlights
    ? "Start logging your flights to track routes, airlines, and travel patterns over time."
    : hasFilters
      ? "No flights match this airport or route. Try showing all flights or adjusting your filters."
      : "Your current filters don't match any flights. Try relaxing them to see results.";

  return (
    <div className="mx-4 mb-4 flex flex-col items-center justify-center gap-6 rounded-lg border border-border px-4 py-10 md:mt-4 md:mx-0 md:mb-0 md:min-h-[500px]">
      {/* Scrolling cards */}
      <div className="h-36 w-full max-w-64 overflow-hidden px-4 [mask-image:linear-gradient(transparent,black_10%,black_90%,transparent)]">
        <div className="flex flex-col animate-infinite-scroll-y">
          {SCROLL_CARDS.map((flight, idx) => (
            <div key={idx} className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="text-sm font-bold tracking-wide">{flight.from.iata}</span>
                <LuPlaneTakeoff className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-bold tracking-wide">{flight.to.iata}</span>
              </div>
              <span className="truncate text-xs text-muted-foreground">{flight.from.city}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="max-w-sm text-center">
        <span className="text-base font-medium text-foreground">{title}</span>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">{description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!hasFlights && onAddFlight && (
          <button onClick={onAddFlight} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <span>+</span> Add flight
          </button>
        )}
        {hasFilters && onShowAll && (
          <button onClick={onShowAll} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <LuPlaneTakeoff className="w-4 h-4" /> Show all flights
          </button>
        )}
      </div>
    </div>
  );
}
