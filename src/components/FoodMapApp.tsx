"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FoodPlace, MergedPlace, OneMapResult, RecommendationResult } from "@/types";
import { distanceMeters } from "@/utils/distance";
import { getVisiblePlaces } from "@/utils/places";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { ChatRecommendationPanel } from "@/components/ChatRecommendationPanel";
import { ListDrawer } from "@/components/ListDrawer";
import { MapView } from "@/components/MapView";
import { PlaceBottomSheet } from "@/components/PlaceBottomSheet";
import { PlaceCard } from "@/components/PlaceCard";
import { SearchLocationBox } from "@/components/SearchLocationBox";
import { SelectedListChips } from "@/components/SelectedListChips";
import { getFoodLists } from "@/lib/data/lists";
import { getAllFoodPlaces } from "@/lib/data/places";

type Props = {
  initialSelectedListIds?: string[];
};

export function FoodMapApp({ initialSelectedListIds }: Props) {
  const router = useRouter();
  const foodLists = getFoodLists();
  const defaultListIds = useMemo(() => foodLists.map((list) => list.id), [foodLists]);
  const [places, setPlaces] = useState<FoodPlace[]>(() => getAllFoodPlaces());
  const [selectedListIds, setSelectedListIds] = useState(() => {
    const validIds = new Set(defaultListIds);
    const fromUrl = [...new Set(initialSelectedListIds?.filter((id) => validIds.has(id)) ?? [])];
    return fromUrl.length ? fromUrl : defaultListIds;
  });
  const [selectedPlace, setSelectedPlace] = useState<MergedPlace | null>(null);
  const [referencePoint, setReferencePoint] = useState<OneMapResult | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const visiblePlaces = useMemo(
    () => getVisiblePlaces(places, selectedListIds),
    [places, selectedListIds]
  );

  useEffect(() => {
    router.replace(`/app/map?lists=${selectedListIds.join(",")}`, { scroll: false });
  }, [router, selectedListIds]);

  const selectedPlaceDistance =
    selectedPlace && referencePoint
      ? distanceMeters(referencePoint, selectedPlace)
      : undefined;

  function toggleList(listId: string) {
    setSelectedListIds((current) => {
      if (current.includes(listId)) {
        const next = current.filter((id) => id !== listId);
        return next.length ? next : current;
      }
      return [...current, listId];
    });
  }

  function handleSelectPlace(place: MergedPlace) {
    setSelectedPlace(place);
  }

  function handleRecommendationResults(results: RecommendationResult[]) {
    setHighlightedIds(results.map((result) => result.id));
  }

  function handleAddPlace(place: FoodPlace) {
    setPlaces((current) => [place, ...current]);
    if (!selectedListIds.includes(place.listIds[0])) {
      setSelectedListIds((current) => [...current, place.listIds[0]]);
    }
  }

  function handleSaveSelectedPlace() {
    if (!selectedPlace || selectedPlace.listIds.includes("list_my")) return;
    setPlaces((current) =>
      current.map((place) =>
        place.id === selectedPlace.id
          ? {
              ...place,
              listIds: [...place.listIds, "list_my"],
              savedBy: [...place.savedBy, "You"]
            }
          : place
      )
    );
    setSelectedPlace((current) =>
      current
        ? {
            ...current,
            selectedListIds: [...current.selectedListIds, "list_my"],
            savedBySelected: [...current.savedBySelected, "You"]
          }
        : current
    );
    // TODO: Persist this save to Supabase saved_places when auth is connected.
  }

  return (
    <main className="relative h-[calc(100dvh-41px)] overflow-hidden bg-cream">
      <div className="absolute inset-0">
        <MapView
          places={visiblePlaces}
          highlightedIds={highlightedIds}
          selectedPlace={selectedPlace}
          referencePoint={referencePoint}
          onSelectPlace={handleSelectPlace}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
        <div className="pointer-events-auto mx-auto max-w-2xl">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <SearchLocationBox onSelect={setReferencePoint} />
            </div>
            <button
              type="button"
              onClick={() => setIsListDrawerOpen(true)}
              className="shrink-0 rounded-full bg-white/95 px-4 py-3 text-sm font-black text-ink shadow-soft ring-1 ring-stone-200 backdrop-blur"
            >
              {selectedListIds.length} lists
            </button>
          </div>
          <div className="mt-2">
            <SelectedListChips lists={foodLists} selectedListIds={selectedListIds} onToggle={toggleList} />
          </div>
        </div>
      </div>

      <aside className="pointer-events-auto absolute right-4 top-28 z-20 hidden max-h-[calc(100dvh-170px)] w-80 overflow-y-auto rounded-lg bg-white/95 p-3 shadow-soft ring-1 ring-stone-200 backdrop-blur xl:block">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-tomato">Visible</p>
            <h1 className="text-lg font-black text-ink">{visiblePlaces.length} saves</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-full bg-ink px-3 py-2 text-xs font-bold text-white"
          >
            Add
          </button>
        </div>
        <div className="grid gap-2">
          {visiblePlaces.slice(0, 6).map((place) => (
            <PlaceCard key={place.id} place={place} onSelect={handleSelectPlace} />
          ))}
        </div>
      </aside>

      <div className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="rounded-full bg-tomato px-5 py-3 text-sm font-black text-white shadow-soft"
        >
          Ask Locco
        </button>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white shadow-soft"
        >
          Add
        </button>
      </div>

      <nav className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white/95 p-1.5 shadow-soft ring-1 ring-stone-200 backdrop-blur">
        <div className="grid grid-cols-3 gap-1">
          {[
            { href: "/app", label: "Home" },
            { href: "/app/map", label: "Map", active: true },
            { href: "/app/lists", label: "Lists" }
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2.5 text-center text-xs font-black transition ${
                item.active ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {isChatOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setIsChatOpen(false)}>
          <section
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[72dvh] max-w-xl overflow-y-auto rounded-t-lg bg-white p-4 shadow-soft sm:bottom-4 sm:rounded-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-tomato">Ask Locco</p>
                <h2 className="text-xl font-black text-ink">Find food from selected lists</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="rounded-full bg-stone-100 px-3 py-2 text-sm font-black text-stone-600"
                aria-label="Close Ask Locco"
              >
                X
              </button>
            </div>
            <ChatRecommendationPanel
              selectedListIds={selectedListIds}
              onResults={handleRecommendationResults}
              onSelectPlace={(place) => {
                handleSelectPlace(place);
                setIsChatOpen(false);
              }}
            />
          </section>
        </div>
      ) : null}

      <ListDrawer
        lists={foodLists}
        places={places}
        selectedListIds={selectedListIds}
        isOpen={isListDrawerOpen}
        onClose={() => setIsListDrawerOpen(false)}
        onToggle={toggleList}
      />

      <PlaceBottomSheet
        place={selectedPlace}
        distanceMeters={selectedPlaceDistance}
        onClose={() => setSelectedPlace(null)}
        onSave={handleSaveSelectedPlace}
      />

      <AddPlaceModal
        lists={foodLists}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddPlace={handleAddPlace}
      />
    </main>
  );
}
