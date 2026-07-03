"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_LIST_ID, DEMO_USER_DISPLAY_NAME } from "@/lib/demoIdentity";
import type { FoodList, FoodPlace, MergedPlace, OneMapResult, RecommendationResult } from "@/types";
import { distanceMeters } from "@/utils/distance";
import { getVisiblePlaces } from "@/utils/places";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import {
  ChatRecommendationPanel,
  type RecommendationPanelState
} from "@/components/ChatRecommendationPanel";
import { ListDrawer } from "@/components/ListDrawer";
import { MapView } from "@/components/MapView";
import { PlaceBottomSheet } from "@/components/PlaceBottomSheet";
import { PlaceCard } from "@/components/PlaceCard";
import { SearchLocationBox } from "@/components/SearchLocationBox";
import { SelectedListChips } from "@/components/SelectedListChips";

type Props = {
  foodLists: FoodList[];
  foodPlaces: FoodPlace[];
  initialSelectedListIds?: string[];
};

type SavePlaceResponse = {
  saved?: boolean;
  error?: string;
  placeId?: string;
  listId?: string;
  listName?: string;
  listColor?: string;
  savedByDisplayName?: string;
  savedByAvatar?: string;
  placeKey?: string;
};

const DEFAULT_SAVED_LIST_COLOR = "#B97D7B";

function initialsForName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "You";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function FoodMapApp({ foodLists, foodPlaces, initialSelectedListIds }: Props) {
  const router = useRouter();
  const defaultListIds = useMemo(() => foodLists.map((list) => list.id), [foodLists]);
  const [lists, setLists] = useState<FoodList[]>(() => foodLists);
  const [places, setPlaces] = useState<FoodPlace[]>(() => foodPlaces);
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
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(() => new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recommendationSession, setRecommendationSession] = useState<RecommendationPanelState>({
    query: "I'm going to Orchard MRT and I feel like dessert",
    summary: null,
    results: [],
    hasAsked: false
  });

  const visiblePlaces = useMemo(
    () => getVisiblePlaces(places, selectedListIds, lists),
    [lists, places, selectedListIds]
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

  function closeAskLocco() {
    setIsChatOpen(false);
    setHighlightedIds([]);
    setRecommendationSession({
      query: recommendationSession.query,
      summary: null,
      results: [],
      hasAsked: false
    });
  }

  function viewRecommendations() {
    setIsChatOpen(true);
    setHighlightedIds(recommendationSession.results.map((result) => result.id));
  }

  function handleAddPlace(place: FoodPlace) {
    setPlaces((current) => [place, ...current]);
    if (!selectedListIds.includes(place.listIds[0])) {
      setSelectedListIds((current) => [...current, place.listIds[0]]);
    }
  }

  function addListIfMissing(list: FoodList) {
    setLists((current) =>
      current.some((item) => item.id === list.id) ? current : [list, ...current]
    );
  }

  function markPlaceSaved(placeId: string, list: FoodList, savedByDisplayName: string) {
    setSavedPlaceIds((current) => new Set(current).add(placeId));
    setSelectedListIds((current) => (current.includes(list.id) ? current : [...current, list.id]));
    setPlaces((current) =>
      current.map((place) =>
        place.id === placeId
          ? {
              ...place,
              listIds: place.listIds.includes(list.id) ? place.listIds : [...place.listIds, list.id],
              savedBy: place.savedBy.includes(savedByDisplayName)
                ? place.savedBy
                : [...place.savedBy, savedByDisplayName]
            }
          : place
      )
    );
    setSelectedPlace((current) =>
      current && current.id === placeId
        ? {
            ...current,
            listIds: current.listIds.includes(list.id)
              ? current.listIds
              : [...current.listIds, list.id],
            savedBy: current.savedBy.includes(savedByDisplayName)
              ? current.savedBy
              : [...current.savedBy, savedByDisplayName],
            selectedListIds: current.selectedListIds.includes(list.id)
              ? current.selectedListIds
              : [...current.selectedListIds, list.id],
            savedBySelected: current.savedBySelected.includes(savedByDisplayName)
              ? current.savedBySelected
              : [...current.savedBySelected, savedByDisplayName]
          }
        : current
    );
  }

  function saveLocallyToDemoList(place: MergedPlace) {
    const demoList = lists.find((list) => list.id === DEMO_LIST_ID) ?? {
      id: DEMO_LIST_ID,
      name: "My Food List",
      ownerName: DEMO_USER_DISPLAY_NAME,
      avatar: "You",
      description: "Personal saves for weekday meals and weekend plans.",
      color: "#f36b4f",
      isMine: true
    };

    addListIfMissing(demoList);
    markPlaceSaved(place.id, demoList, DEMO_USER_DISPLAY_NAME);
  }

  async function handleSaveSelectedPlace() {
    if (!selectedPlace || savingPlaceId === selectedPlace.id) return;

    if (selectedPlace.id.startsWith("local-")) {
      setSaveError("Add Place entries stay local for now.");
      return;
    }

    const placeBeingSaved = selectedPlace;
    setSavingPlaceId(placeBeingSaved.id);
    setSaveError(null);

    try {
      const response = await fetch("/api/places/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: placeBeingSaved.id,
          name: placeBeingSaved.name,
          address: placeBeingSaved.address,
          postalCode: placeBeingSaved.postalCode,
          latitude: placeBeingSaved.latitude,
          longitude: placeBeingSaved.longitude,
          priceRange: placeBeingSaved.priceRange,
          notes: placeBeingSaved.notes,
          status: placeBeingSaved.status
        })
      });

      const result = (await response.json().catch(() => null)) as SavePlaceResponse | null;
      if (!response.ok || !result?.saved || !result.listId) {
        const message = result?.error ?? "Could not save this place yet.";
        if (response.status === 503) {
          saveLocallyToDemoList(placeBeingSaved);
          setSaveError(null);
          return;
        }
        setSaveError(message);
        return;
      }

      const ownerName = result.savedByDisplayName ?? "You";
      const savedList: FoodList = {
        id: result.listId,
        name: result.listName ?? "My saved places",
        ownerName,
        avatar: result.savedByAvatar ?? initialsForName(ownerName),
        description: "Your saved places from the map.",
        color: result.listColor ?? DEFAULT_SAVED_LIST_COLOR,
        isMine: true
      };

      addListIfMissing(savedList);
      markPlaceSaved(placeBeingSaved.id, savedList, ownerName);
    } catch {
      setSaveError("Could not save this place yet.");
    } finally {
      setSavingPlaceId((current) => (current === placeBeingSaved.id ? null : current));
    }
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
            <SelectedListChips lists={lists} selectedListIds={selectedListIds} onToggle={toggleList} />
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
        <div className="fixed inset-0 z-[60] bg-black/20" onClick={closeAskLocco}>
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
                onClick={closeAskLocco}
                className="rounded-full bg-stone-100 px-3 py-2 text-sm font-black text-stone-600"
                aria-label="Close Ask Locco"
              >
                X
              </button>
            </div>
            <ChatRecommendationPanel
              selectedListIds={selectedListIds}
              session={recommendationSession}
              onSessionChange={setRecommendationSession}
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
        lists={lists}
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
        isSaving={savingPlaceId === selectedPlace?.id}
        isSaved={selectedPlace ? savedPlaceIds.has(selectedPlace.id) : false}
        saveError={saveError}
        onViewRecommendations={recommendationSession.results.length ? viewRecommendations : undefined}
      />

      <AddPlaceModal
        lists={lists}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddPlace={handleAddPlace}
      />
    </main>
  );
}
