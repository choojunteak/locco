"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_LIST_ID, DEMO_USER_DISPLAY_NAME } from "@/lib/demoIdentity";
import type {
  FoodList,
  FoodPlace,
  MergedPlace,
  OneMapResult,
  PlaceStatus,
  RecommendationResult
} from "@/types";
import { distanceMeters } from "@/utils/distance";
import { getVisiblePlaces } from "@/utils/places";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import {
  ChatRecommendationPanel,
  type RecommendationPanelState
} from "@/components/ChatRecommendationPanel";
import { MapBottomControls } from "@/components/MapBottomControls";
import { MapFiltersSheet } from "@/components/MapFiltersSheet";
import { MapTopControls } from "@/components/MapTopControls";
import { MapView } from "@/components/MapView";
import {
  PlaceBottomSheet,
  type PlaceSheetSnapState
} from "@/components/PlaceBottomSheet";
import { PlaceCard } from "@/components/PlaceCard";
import { SaveStatusSheet } from "@/components/SaveStatusSheet";

type Props = {
  foodLists: FoodList[];
  foodPlaces: FoodPlace[];
  initialSelectedListIds?: string[];
  initialFocusedPlaceId?: string;
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

type UnsavePlaceResponse = {
  unsaved?: boolean;
  error?: string;
  placeId?: string;
  removedListIds?: string[];
};

type SaveSheetState = {
  mode: "create" | "edit";
  status: PlaceStatus;
  note: string;
  rating: number | null;
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

function slugPart(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);

  return slug || "place";
}

function coordinatePart(value: number) {
  return value.toFixed(5).replace("-", "m").replace(".", "p");
}

function placeKeyForFoodPlace(
  place: Pick<FoodPlace, "name" | "postalCode" | "latitude" | "longitude">
) {
  const namePart = slugPart(place.name);
  const postalPart = place.postalCode?.replace(/\D/g, "");

  if (postalPart) {
    return `${namePart}-${postalPart}`;
  }

  return `${namePart}-lat${coordinatePart(place.latitude)}-lng${coordinatePart(place.longitude)}`;
}

function getInitialSavedPlaceIds(lists: FoodList[], places: FoodPlace[]) {
  const mineListIds = new Set(lists.filter((list) => list.isMine).map((list) => list.id));
  return new Set(
    places
      .filter((place) => place.listIds.some((listId) => mineListIds.has(listId)))
      .map((place) => place.id)
  );
}

function canonicalizeSelectedListIds(lists: FoodList[], candidateListIds: string[]) {
  const requestedIds = new Set(candidateListIds);
  return lists.map((list) => list.id).filter((listId) => requestedIds.has(listId));
}

export function FoodMapApp({
  foodLists,
  foodPlaces,
  initialSelectedListIds,
  initialFocusedPlaceId
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultListIds = useMemo(() => foodLists.map((list) => list.id), [foodLists]);
  const [lists, setLists] = useState<FoodList[]>(() => foodLists);
  const [places, setPlaces] = useState<FoodPlace[]>(() => foodPlaces);
  const [selectedListIds, setSelectedListIds] = useState(() => {
    if (initialSelectedListIds === undefined) return defaultListIds;
    return canonicalizeSelectedListIds(foodLists, initialSelectedListIds);
  });
  const [selectedPlace, setSelectedPlace] = useState<MergedPlace | null>(null);
  const [resolvedInitialPlaceId, setResolvedInitialPlaceId] = useState<string | null>(
    initialFocusedPlaceId ? null : ""
  );
  const [placeSheetSnapState, setPlaceSheetSnapState] =
    useState<PlaceSheetSnapState>("mid");
  const [referencePoint, setReferencePoint] = useState<OneMapResult | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMapFiltersOpen, setIsMapFiltersOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [unsavingPlaceId, setUnsavingPlaceId] = useState<string | null>(null);
  const [saveSheet, setSaveSheet] = useState<SaveSheetState | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(() =>
    getInitialSavedPlaceIds(foodLists, foodPlaces)
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recommendationSession, setRecommendationSession] = useState<RecommendationPanelState>({
    query: "I'm going to Orchard MRT and I feel like dessert",
    summary: null,
    results: [],
    hasAsked: false
  });
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const recommendationScopeRef = useRef(selectedListIds.join(","));

  const visiblePlaces = useMemo(
    () => getVisiblePlaces(places, selectedListIds, lists),
    [lists, places, selectedListIds]
  );
  const selectedAccessibleListCount = useMemo(
    () => lists.filter((list) => selectedListIds.includes(list.id)).length,
    [lists, selectedListIds]
  );
  const isListFilterActive = Boolean(lists.length) && selectedAccessibleListCount < lists.length;

  useEffect(() => {
    const nextScope = selectedListIds.join(",");
    if (recommendationScopeRef.current === nextScope) return;
    recommendationScopeRef.current = nextScope;
    setHighlightedIds([]);
    setRecommendationSession((current) => ({
      query: current.query,
      summary: null,
      results: [],
      hasAsked: false
    }));
  }, [selectedListIds]);

  useEffect(() => {
    if (initialFocusedPlaceId && resolvedInitialPlaceId !== initialFocusedPlaceId) return;

    const currentQuery = searchParams.toString();
    const params = new URLSearchParams(currentQuery);
    params.set("lists", selectedListIds.join(","));

    if (selectedPlace) {
      params.set("place", selectedPlace.id);
    } else {
      params.delete("place");
    }

    const nextQuery = params.toString();
    if (nextQuery === currentQuery) return;
    router.replace(`/app/map?${nextQuery}`, { scroll: false });
  }, [
    initialFocusedPlaceId,
    resolvedInitialPlaceId,
    router,
    searchParams,
    selectedListIds,
    selectedPlace
  ]);

  useEffect(() => {
    if (initialFocusedPlaceId) {
      const focusedPlace = visiblePlaces.find((place) => place.id === initialFocusedPlaceId);
      if (focusedPlace) {
        setSelectedPlace(focusedPlace);
      }
    }
    setResolvedInitialPlaceId(initialFocusedPlaceId ?? "");
  }, [initialFocusedPlaceId, visiblePlaces]);

  const selectedPlaceDistance =
    selectedPlace && referencePoint
      ? distanceMeters(referencePoint, selectedPlace)
      : undefined;

  function handleSelectPlace(place: MergedPlace) {
    setPlaceSheetSnapState((current) => (selectedPlace ? current : "mid"));
    setSelectedPlace(place);
  }

  function closeSelectedPlace() {
    setSelectedPlace(null);
    setPlaceSheetSnapState("mid");
  }

  function updateMapListScope(listIds: string[]) {
    const nextListIds = canonicalizeSelectedListIds(lists, listIds);
    const scopeChanged = nextListIds.join(",") !== selectedListIds.join(",");
    if (!scopeChanged) return;

    if (selectedPlace) {
      const nextSelectedPlace = getVisiblePlaces([selectedPlace], nextListIds, lists)[0];
      if (nextSelectedPlace) {
        setSelectedPlace(nextSelectedPlace);
      } else {
        closeSelectedPlace();
      }
    }

    setSelectedListIds(nextListIds);
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
    const addedListId = place.listIds[0];
    if (addedListId) {
      setSelectedListIds((current) =>
        canonicalizeSelectedListIds(lists, current.concat(addedListId))
      );
    }
  }

  function addListIfMissing(list: FoodList) {
    setLists((current) =>
      current.some((item) => item.id === list.id) ? current : [list, ...current]
    );
  }

  function getSavedByForListIds(listIds: string[]) {
    return [
      ...new Set(
        listIds
          .map((listId) => lists.find((list) => list.id === listId)?.ownerName)
          .filter((ownerName): ownerName is string => Boolean(ownerName))
      )
    ];
  }

  function markPlaceSaved(
    placeId: string,
    list: FoodList,
    savedByDisplayName: string,
    status: PlaceStatus,
    note: string,
    rating: number | null
  ) {
    const personalNote = note.trim();
    const nextPersonalNote = personalNote || undefined;
    const nextRating = status === "visited" && rating ? rating : undefined;
    const orderedLists = lists.some((item) => item.id === list.id) ? lists : [list, ...lists];

    setSavedPlaceIds((current) => new Set(current).add(placeId));
    setSelectedListIds((current) =>
      canonicalizeSelectedListIds(orderedLists, current.concat(list.id))
    );
    setPlaces((current) =>
      current.map((place) =>
        place.id === placeId
          ? {
              ...place,
              listIds: place.listIds.includes(list.id) ? place.listIds : [...place.listIds, list.id],
              savedBy: place.savedBy.includes(savedByDisplayName)
                ? place.savedBy
                : [...place.savedBy, savedByDisplayName],
              notes: personalNote || place.notes,
              personalNote: nextPersonalNote,
              rating: nextRating,
              status
            }
          : place
      )
    );
    setSelectedPlace((current) =>
      current && current.id === placeId
        ? (() => {
            const nextSelectedListIds = canonicalizeSelectedListIds(
              orderedLists,
              current.selectedListIds.concat(list.id)
            );

            return {
              ...current,
              listIds: current.listIds.includes(list.id)
                ? current.listIds
                : [...current.listIds, list.id],
              savedBy: current.savedBy.includes(savedByDisplayName)
                ? current.savedBy
                : [...current.savedBy, savedByDisplayName],
              selectedListIds: nextSelectedListIds,
              savedBySelected: current.savedBySelected.includes(savedByDisplayName)
                ? current.savedBySelected
                : [...current.savedBySelected, savedByDisplayName],
              notes: personalNote || current.notes,
              personalNote: nextPersonalNote,
              rating: nextRating,
              status
            };
          })()
        : current
    );
  }

  function saveLocallyToDemoList(
    place: MergedPlace,
    status: PlaceStatus,
    note: string,
    rating: number | null
  ) {
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
    markPlaceSaved(place.id, demoList, DEMO_USER_DISPLAY_NAME, status, note, rating);
  }

  function markPlaceUnsaved(placeId: string, canonicalPlaceId: string, removedListIds: string[]) {
    const removedListIdSet = new Set(removedListIds);

    setSavedPlaceIds((current) => {
      const next = new Set(current);
      next.delete(placeId);
      next.delete(canonicalPlaceId);
      return next;
    });

    setPlaces((current) =>
      current.map((place) => {
        if (place.id !== placeId && place.id !== canonicalPlaceId) return place;

        const listIds = place.listIds.filter((listId) => !removedListIdSet.has(listId));
        return {
          ...place,
          listIds,
          savedBy: getSavedByForListIds(listIds)
        };
      })
    );

    setSelectedPlace((current) => {
      if (!current || (current.id !== placeId && current.id !== canonicalPlaceId)) return current;

      const listIds = current.listIds.filter((listId) => !removedListIdSet.has(listId));
      const selectedListIds = current.selectedListIds.filter(
        (listId) => !removedListIdSet.has(listId)
      );

      return {
        ...current,
        listIds,
        savedBy: getSavedByForListIds(listIds),
        selectedListIds,
        savedBySelected: getSavedByForListIds(selectedListIds)
      };
    });
  }

  function getOwnedListIdsForPlace(place: FoodPlace) {
    const mineListIds = new Set(lists.filter((list) => list.isMine).map((list) => list.id));
    return place.listIds.filter((listId) => mineListIds.has(listId));
  }

  function unsaveLocallyFromMineLists(place: MergedPlace) {
    markPlaceUnsaved(place.id, place.id, getOwnedListIdsForPlace(place));
  }

  function openSaveSheetForPlace(place: MergedPlace, status: PlaceStatus) {
    const isAlreadySaved = savedPlaceIds.has(place.id);
    setSelectedPlace(place);
    setSaveError(null);
    setSaveSheet({
      mode: isAlreadySaved ? "edit" : "create",
      status,
      note: isAlreadySaved ? place.personalNote ?? "" : "",
      rating: isAlreadySaved ? place.rating ?? null : null
    });
  }

  function openSaveSheet(status: PlaceStatus) {
    if (!selectedPlace) return;
    openSaveSheetForPlace(selectedPlace, status);
  }

  async function handleSaveSelectedPlace(status: PlaceStatus, note: string, rating: number | null) {
    if (!selectedPlace || savingPlaceId === selectedPlace.id || unsavingPlaceId === selectedPlace.id) {
      return;
    }

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
          status,
          savedNote: note,
          savedRating: status === "visited" ? rating : null
        })
      });

      const result = (await response.json().catch(() => null)) as SavePlaceResponse | null;
      if (!response.ok || !result?.saved || !result.listId) {
        const message = result?.error ?? "Could not save this place yet.";
        if (response.status === 503) {
          saveLocallyToDemoList(placeBeingSaved, status, note, rating);
          setSaveError(null);
          setSaveSheet(null);
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
      markPlaceSaved(placeBeingSaved.id, savedList, ownerName, status, note, rating);
      setSaveSheet(null);
    } catch {
      setSaveError("Could not save this place yet.");
    } finally {
      setSavingPlaceId((current) => (current === placeBeingSaved.id ? null : current));
    }
  }

  async function handleUnsaveSelectedPlace() {
    if (!selectedPlace || savingPlaceId === selectedPlace.id || unsavingPlaceId === selectedPlace.id) {
      return;
    }

    const placeBeingUnsaved = selectedPlace;
    const fallbackRemovedListIds = getOwnedListIdsForPlace(placeBeingUnsaved);
    setUnsavingPlaceId(placeBeingUnsaved.id);
    setSaveError(null);

    try {
      const response = await fetch("/api/places/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: placeBeingUnsaved.id,
          placeKey: placeKeyForFoodPlace(placeBeingUnsaved)
        })
      });

      const result = (await response.json().catch(() => null)) as UnsavePlaceResponse | null;
      if (!response.ok || !result?.unsaved || !result.placeId) {
        const message = result?.error ?? "Could not unsave this place yet.";
        if (response.status === 503) {
          unsaveLocallyFromMineLists(placeBeingUnsaved);
          setSaveError(null);
          setSaveSheet(null);
          return;
        }
        setSaveError(message);
        return;
      }

      const removedListIds = result.removedListIds?.length
        ? result.removedListIds
        : fallbackRemovedListIds;

      markPlaceUnsaved(placeBeingUnsaved.id, result.placeId, removedListIds);
      setSaveSheet(null);
    } catch {
      setSaveError("Could not unsave this place yet.");
    } finally {
      setUnsavingPlaceId((current) => (current === placeBeingUnsaved.id ? null : current));
    }
  }

  return (
    <main className="locco-map-page relative h-[calc(100dvh-41px)] overflow-hidden bg-cream">
      <div className="absolute inset-0">
        <MapView
          places={visiblePlaces}
          highlightedIds={highlightedIds}
          selectedPlace={selectedPlace}
          placeSheetSnapState={placeSheetSnapState}
          referencePoint={referencePoint}
          onSelectPlace={handleSelectPlace}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
        <MapTopControls
          isHidden={Boolean(selectedPlace && placeSheetSnapState === "expanded")}
          isFilterActive={isListFilterActive}
          filterButtonRef={filterButtonRef}
          onSelectLocation={setReferencePoint}
          onClearLocation={() => setReferencePoint(null)}
          onOpenFilters={() => setIsMapFiltersOpen(true)}
        />
      </div>

      {!selectedPlace && (!lists.length || !selectedListIds.length) ? (
        <div className="map-empty-state pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
          <section className="map-empty-state-card pointer-events-auto w-full max-w-xs rounded-3xl bg-white/95 p-4 text-center shadow-soft ring-1 ring-stone-200 backdrop-blur">
            <h1 className="text-base font-black text-ink">
              {lists.length ? "No lists selected" : "No lists available"}
            </h1>
            <p className="mt-1 text-sm leading-5 text-stone-600">
              {lists.length
                ? "Choose one or more lists in Map filters to show saved places."
                : "There are no accessible lists to show on the map yet."}
            </p>
            {lists.length ? (
              <button
                type="button"
                onClick={() => setIsMapFiltersOpen(true)}
                className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-ink px-4 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#575527] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B97D7B] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Choose lists
              </button>
            ) : null}
          </section>
        </div>
      ) : null}

      <aside className="pointer-events-auto absolute right-4 top-28 z-20 hidden max-h-[calc(100dvh-170px)] w-80 overflow-y-auto rounded-lg bg-white/95 p-3 shadow-soft ring-1 ring-stone-200 backdrop-blur xl:block">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-tomato">Visible</p>
          <h1 className="text-lg font-black text-ink">{visiblePlaces.length} saves</h1>
        </div>
        <div className="grid gap-2">
          {visiblePlaces.slice(0, 6).map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              lists={lists}
              onSelect={handleSelectPlace}
              onSelectStatus={openSaveSheetForPlace}
              showSaveStatusControls
              isSaved={savedPlaceIds.has(place.id)}
              isSaveBusy={savingPlaceId === place.id || unsavingPlaceId === place.id}
            />
          ))}
        </div>
      </aside>

      {!selectedPlace ? (
        <MapBottomControls
          onAskLocco={() => setIsChatOpen(true)}
          onAddPlace={() => setIsAddOpen(true)}
        />
      ) : null}

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

      <MapFiltersSheet
        lists={lists}
        appliedListIds={selectedListIds}
        isOpen={isMapFiltersOpen}
        triggerRef={filterButtonRef}
        onClose={() => setIsMapFiltersOpen(false)}
        onSelectionChange={updateMapListScope}
      />

      <PlaceBottomSheet
        place={selectedPlace}
        lists={lists}
        distanceMeters={selectedPlaceDistance}
        snapState={placeSheetSnapState}
        onSnapStateChange={setPlaceSheetSnapState}
        onClose={closeSelectedPlace}
        onStartSave={openSaveSheet}
        isSaving={savingPlaceId === selectedPlace?.id}
        isUnsaving={unsavingPlaceId === selectedPlace?.id}
        isSaved={selectedPlace ? savedPlaceIds.has(selectedPlace.id) : false}
        saveError={saveError}
        onViewRecommendations={recommendationSession.results.length ? viewRecommendations : undefined}
      />

      <SaveStatusSheet
        isOpen={Boolean(saveSheet && selectedPlace)}
        mode={saveSheet?.mode ?? "create"}
        placeName={selectedPlace?.name ?? ""}
        initialStatus={saveSheet?.status ?? "want_to_try"}
        initialNote={saveSheet?.note ?? ""}
        initialRating={saveSheet?.rating ?? null}
        isSaving={savingPlaceId === selectedPlace?.id}
        isRemoving={unsavingPlaceId === selectedPlace?.id}
        error={saveError}
        onClose={() => {
          if (savingPlaceId || unsavingPlaceId) return;
          setSaveSheet(null);
        }}
        onSave={handleSaveSelectedPlace}
        onRemove={saveSheet?.mode === "edit" ? handleUnsaveSelectedPlace : undefined}
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
