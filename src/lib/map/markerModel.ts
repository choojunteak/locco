import type { MergedPlace, PlaceStatus } from "@/types";

export type LoccoMarkerVisualState =
  | "normal"
  | "want-to-try"
  | "visited"
  | "highlighted"
  | "selected"
  | "transient";

export type LoccoMarkerModel = {
  key: string;
  placeId: string;
  label: string;
  state: Exclude<LoccoMarkerVisualState, "transient">;
  latitude: number;
  longitude: number;
};

export function canonicalMarkerKey(placeId: string) {
  return `locco:${placeId}`;
}

export function transientGoogleMarkerKey(externalPlaceId: string) {
  return `google:${externalPlaceId}`;
}

export function resolveLoccoMarkerState({
  isSelected,
  isHighlighted,
  isSaved,
  status
}: {
  isSelected: boolean;
  isHighlighted: boolean;
  isSaved: boolean;
  status: PlaceStatus;
}): Exclude<LoccoMarkerVisualState, "transient"> {
  if (isSelected) return "selected";
  if (isHighlighted) return "highlighted";
  if (isSaved) return status === "visited" ? "visited" : "want-to-try";
  return "normal";
}

export function createCanonicalMarkerModels({
  places,
  selectedPlaceId,
  highlightedIds,
  savedPlaceIds
}: {
  places: MergedPlace[];
  selectedPlaceId?: string;
  highlightedIds: readonly string[];
  savedPlaceIds: ReadonlySet<string>;
}): LoccoMarkerModel[] {
  const highlighted = new Set(highlightedIds);

  return places.map((place) => ({
    key: canonicalMarkerKey(place.id),
    placeId: place.id,
    label: place.name,
    state: resolveLoccoMarkerState({
      isSelected: selectedPlaceId === place.id,
      isHighlighted: highlighted.has(place.id),
      isSaved: savedPlaceIds.has(place.id),
      status: place.status
    }),
    latitude: place.latitude,
    longitude: place.longitude
  }));
}
