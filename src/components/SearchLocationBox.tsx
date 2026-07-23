"use client";

import { useEffect, useRef, useState } from "react";
import type { OneMapResult } from "@/types";

type Props = {
  onSelect: (location: OneMapResult) => void;
  onClear: () => void;
};

export function SearchLocationBox({ onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OneMapResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    return () => {
      requestGenerationRef.current += 1;
      requestControllerRef.current?.abort();
    };
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    const requestGeneration = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestGeneration;
    requestControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setConfirmed(null);

    try {
      const response = await fetch(`/api/onemap/search?query=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal
      });
      const payload = (await response.json()) as { results?: OneMapResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Search failed.");
      if (requestGeneration !== requestGenerationRef.current) return;
      setResults(payload.results ?? []);
    } catch (searchError) {
      if (controller.signal.aborted || requestGeneration !== requestGenerationRef.current) return;
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
      setResults([]);
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        requestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }

  function handleClear() {
    requestGenerationRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setError(null);
    setConfirmed(null);
    onClear();
  }

  function handleQueryChange(nextQuery: string) {
    if (requestControllerRef.current) {
      requestGenerationRef.current += 1;
      requestControllerRef.current.abort();
      requestControllerRef.current = null;
      setIsLoading(false);
    }
    setQuery(nextQuery);
    setResults([]);
    setError(null);
    setConfirmed(null);
    if (!nextQuery) onClear();
  }

  function closeResults() {
    setResults([]);
    setError(null);
  }

  const hasPanel = Boolean(error || results.length);

  return (
    <div
      className="relative min-w-0"
      onKeyDown={(event) => {
        if (event.key === "Escape" && hasPanel) {
          event.preventDefault();
          closeResults();
        }
      }}
    >
      <form
        onSubmit={handleSearch}
        className="relative flex h-11 min-w-0 items-center rounded-full bg-white/90 pl-4 pr-16 shadow-soft ring-1 ring-stone-200 backdrop-blur transition-shadow focus-within:ring-2 focus-within:ring-[#B97D7B]/45"
        role="search"
      >
        <input
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          type="search"
          enterKeyHint="search"
          name="location-search"
          placeholder="Search for a place…"
          className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-medium placeholder:text-stone-400/90 [&::-webkit-search-cancel-button]:hidden"
          aria-label="Search for a place"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="map-search-results"
          aria-expanded={hasPanel}
        />
        {isLoading ? (
          <span
            className="absolute right-11 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center"
            aria-hidden="true"
          >
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-ink" />
          </span>
        ) : null}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg font-bold text-stone-500 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B]/50"
            aria-label="Clear location search"
          >
            &times;
          </button>
        ) : null}
      </form>

      <span className="sr-only" aria-live="polite">
        {isLoading ? "Searching" : confirmed ? `Reference set to ${confirmed}` : ""}
      </span>

      {hasPanel ? (
        <div
          id="map-search-results"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 max-h-64 overflow-y-auto rounded-2xl bg-white/95 p-2 shadow-soft ring-1 ring-stone-200 backdrop-blur"
          aria-label="Search results"
        >
          {error ? <p className="px-3 py-2 text-xs font-semibold text-red-600">{error}</p> : null}
          {results.slice(0, 4).map((result) => (
            <button
              key={`${result.name}-${result.latitude}-${result.longitude}`}
              type="button"
              onClick={() => {
                setQuery(result.name);
                onSelect(result);
                setConfirmed(result.name);
                setResults([]);
                setError(null);
              }}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-[#FFF1B5]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B]/50"
            >
              <span className="block font-bold text-ink">{result.name}</span>
              <span className="mt-0.5 block text-xs leading-4 text-stone-500">{result.address}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
