"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { LocationSearchResult } from "@/types";
import { SearchLocationBox } from "@/components/SearchLocationBox";

type Props = {
  isHidden: boolean;
  isFilterActive: boolean;
  filterButtonRef: RefObject<HTMLButtonElement | null>;
  onSelectLocation: (location: LocationSearchResult) => void;
  onClearLocation: () => void;
  onOpenFilters: () => void;
};

export function MapTopControls({
  isHidden,
  isFilterActive,
  filterButtonRef,
  onSelectLocation,
  onClearLocation,
  onOpenFilters
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isHidden || !containerRef.current?.contains(document.activeElement)) return;
    (document.activeElement as HTMLElement | null)?.blur();
  }, [isHidden]);

  return (
    <div
      ref={containerRef}
      className={`mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-2 transition-opacity duration-200 ${
        isHidden ? "pointer-events-none invisible opacity-0" : "pointer-events-auto visible opacity-100"
      }`}
      aria-hidden={isHidden}
      inert={isHidden}
    >
      <div className="min-w-0">
        <SearchLocationBox onSelect={onSelectLocation} onClear={onClearLocation} />
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-[#575527] shadow-soft ring-1 ring-stone-200 backdrop-blur"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="12" cy="8" r="3" />
            <path d="M5.5 19.5c.8-3.7 3-5.5 6.5-5.5s5.7 1.8 6.5 5.5" />
          </svg>
        </div>
        <button
          ref={filterButtonRef}
          type="button"
          onClick={onOpenFilters}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft ring-1 ring-stone-200 backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B]/50"
          aria-label="Map filters"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h10" />
            <path d="M18 7h2" />
            <circle cx="16" cy="7" r="2" />
            <path d="M4 17h2" />
            <path d="M10 17h10" />
            <circle cx="8" cy="17" r="2" />
          </svg>
          {isFilterActive ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B97D7B] px-1 text-[10px] font-black text-white shadow-sm">
              1
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
