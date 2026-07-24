import type { FoodPlace, PlaceStatus } from "@/types";

type SaveablePlace = Pick<
  FoodPlace,
  | "id"
  | "name"
  | "address"
  | "postalCode"
  | "latitude"
  | "longitude"
  | "priceRange"
  | "notes"
>;

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

export function placeKeyForFoodPlace(
  place: Pick<FoodPlace, "name" | "postalCode" | "latitude" | "longitude">
) {
  const namePart = slugPart(place.name);
  const postalPart = place.postalCode?.replace(/\D/g, "");

  if (postalPart) {
    return `${namePart}-${postalPart}`;
  }

  return `${namePart}-lat${coordinatePart(place.latitude)}-lng${coordinatePart(place.longitude)}`;
}

export function buildSavePlacePayload(
  place: SaveablePlace,
  status: PlaceStatus,
  note: string,
  rating: number | null
) {
  return {
    placeId: place.id,
    name: place.name,
    address: place.address,
    postalCode: place.postalCode,
    latitude: place.latitude,
    longitude: place.longitude,
    priceRange: place.priceRange,
    notes: place.notes,
    status,
    savedNote: note,
    savedRating: status === "visited" ? rating : null
  };
}

export function buildUnsavePlacePayload(place: SaveablePlace) {
  return {
    placeId: place.id,
    placeKey: placeKeyForFoodPlace(place)
  };
}
