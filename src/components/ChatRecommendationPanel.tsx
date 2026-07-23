"use client";

import { useEffect, useRef, useState } from "react";
import type { MergedPlace, RecommendationResult } from "@/types";
import { formatDistance } from "@/utils/distance";
import { TagChip } from "@/components/TagChip";

export type RecommendationPanelState = {
  query: string;
  summary: string | null;
  results: RecommendationResult[];
  hasAsked: boolean;
};

type Props = {
  selectedListIds: string[];
  session: RecommendationPanelState;
  onSessionChange: (session: RecommendationPanelState) => void;
  onResults: (results: RecommendationResult[]) => void;
  onSelectPlace: (place: MergedPlace) => void;
};

export function ChatRecommendationPanel({
  selectedListIds,
  session,
  onSessionChange,
  onResults,
  onSelectPlace
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const requestGenerationRef = useRef(0);
  const { query, summary, results, hasAsked } = session;
  const hasSelectedLists = selectedListIds.length > 0;
  const listScopeKey = selectedListIds.join(",");

  useEffect(() => {
    requestGenerationRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsLoading(false);
    setError(null);

    return () => {
      requestGenerationRef.current += 1;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [listScopeKey]);

  function getRecommendationReason(result: RecommendationResult) {
    const reasons: string[] = [];
    if (result.matchedTags.length) {
      reasons.push(`matches ${result.matchedTags.slice(0, 2).join(" and ")}`);
    }
    if (result.distanceMeters <= 600) {
      reasons.push(`is ${formatDistance(result.distanceMeters)} away`);
    }
    if (result.savedBySelected.length > 1) {
      reasons.push(`is trusted by ${result.savedBySelected.length} selected lists`);
    }
    if (result.status === "visited") {
      reasons.push("has been visited");
    }

    return reasons.length
      ? `Locco picked this because it ${reasons.slice(0, 2).join(" and ")}.`
      : "Locco picked this as one of the strongest nearby saves from your selected lists.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || !hasSelectedLists || isLoading) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    const requestGeneration = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestGeneration;
    requestControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    onSessionChange({
      query,
      summary: null,
      results: [],
      hasAsked: true
    });
    onResults([]);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, selectedListIds }),
        signal: controller.signal
      });
      const payload = (await response.json()) as {
        interpretedLocation?: string;
        interpretedTags?: string[];
        results?: RecommendationResult[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Recommendation failed.");
      if (requestGeneration !== requestGenerationRef.current) return;
      const nextResults = (payload.results ?? []).slice(0, 5);
      onResults(nextResults);
      onSessionChange({
        query,
        results: nextResults,
        hasAsked: true,
        summary: `Looking near ${payload.interpretedLocation ?? "Singapore"}${
          payload.interpretedTags?.length ? ` for ${payload.interpretedTags.join(", ")}` : ""
        }.`
      });
    } catch (recommendError) {
      if (controller.signal.aborted || requestGeneration !== requestGenerationRef.current) return;
      setError(recommendError instanceof Error ? recommendError.message : "Recommendation failed.");
      onSessionChange({
        query,
        summary: null,
        results: [],
        hasAsked: true
      });
      onResults([]);
    } finally {
      if (requestGeneration === requestGenerationRef.current) {
        requestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }

  return (
    <section className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-stone-200">
      <p className="mb-2 text-xs font-bold text-stone-500">
        Try: Dessert from Isabella&apos;s list near Orchard
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(event) =>
            onSessionChange({
              ...session,
              query: event.target.value
            })
          }
          className="min-w-0 flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm outline-none focus:border-tomato"
          placeholder="Cafe near Tanjong Pagar"
        />
        <button
          type="submit"
          disabled={isLoading || !hasSelectedLists}
          className="rounded-full bg-tomato px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isLoading ? "..." : "Ask"}
        </button>
      </form>
      {!hasSelectedLists ? (
        <p className="mt-2 text-xs font-bold text-[#B97D7B]">
          Select at least one list before asking Locco.
        </p>
      ) : null}
      {summary ? <p className="mt-2 text-xs font-semibold text-stone-500">{summary}</p> : null}
      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}

      {results.length ? (
        <div className="mt-3 grid gap-2">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => onSelectPlace(result)}
              className="rounded-lg border border-orange-100 bg-cream px-3 py-3 text-left shadow-sm transition hover:bg-orange-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{result.name}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    {formatDistance(result.distanceMeters)} away - Saved by {result.savedBySelected.join(", ")}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-tomato">
                  {result.categories[0]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...new Set([...result.matchedTags, ...result.categories, ...result.moodTags])]
                  .slice(0, 4)
                  .map((tag) => (
                    <TagChip key={tag} label={tag} />
                  ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-600">{getRecommendationReason(result)}</p>
            </button>
          ))}
        </div>
      ) : null}

      {hasAsked && !isLoading && !error && !results.length ? (
        <div className="mt-3 rounded-lg bg-cream p-4 text-sm text-stone-600">
          <p className="font-black text-ink">No strong matches yet</p>
          <p className="mt-1 leading-6">
            Locco could not find a confident match. Try something like dessert near Orchard MRT or
            cafe from Isabella&apos;s list.
          </p>
        </div>
      ) : null}
    </section>
  );
}
