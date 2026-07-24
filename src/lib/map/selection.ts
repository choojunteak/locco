import type { MapSheetSnapState } from "@/types/mapRenderer";

export function nextCanonicalPlaceSelection<T extends { id: string }>({
  currentPlace,
  nextPlace,
  currentSnapState
}: {
  currentPlace: T | null;
  nextPlace: T;
  currentSnapState: MapSheetSnapState;
}) {
  return {
    selectedPlace: nextPlace,
    snapState: currentPlace ? currentSnapState : ("mid" as const)
  };
}
