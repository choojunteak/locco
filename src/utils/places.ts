import { foodLists } from "@/data/mockData";
import type { FoodCategory, FoodList, FoodPlace, MergedPlace, MoodTag, PlaceSource } from "@/types";

export function listNameById(listId: string) {
  return foodLists.find((list) => list.id === listId)?.name ?? listId;
}

export function listOwnerById(listId: string, lists: FoodList[] = foodLists) {
  return lists.find((list) => list.id === listId)?.ownerName ?? listId;
}

export function getVisiblePlaces(
  places: FoodPlace[],
  selectedListIds: string[],
  lists: FoodList[] = foodLists
): MergedPlace[] {
  return places
    .filter((place) => place.listIds.some((listId) => selectedListIds.includes(listId)))
    .map((place) => {
      const selectedIds = place.listIds.filter((listId) => selectedListIds.includes(listId));
      return {
        ...place,
        selectedListIds: selectedIds,
        savedBySelected: selectedIds.map((listId) => listOwnerById(listId, lists))
      };
    });
}

export function getCategoryClass(category?: string) {
  switch (category) {
    case "Cafe":
      return "bg-emerald-100 text-emerald-800";
    case "Dessert":
    case "Ice Cream":
      return "bg-amber-100 text-amber-800";
    case "Japanese":
      return "bg-rose-100 text-rose-800";
    case "Korean":
      return "bg-violet-100 text-violet-800";
    case "Local":
      return "bg-orange-100 text-orange-800";
    case "Cheap Eats":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export function getCategoryEmoji(category?: string) {
  switch (category) {
    case "Cafe":
      return "☕";
    case "Dessert":
    case "Ice Cream":
      return "🍨";
    case "Japanese":
      return "🍜";
    case "Korean":
      return "🥘";
    case "Local":
      return "🍛";
    case "Cheap Eats":
      return "💸";
    case "Bakery":
      return "🥐";
    default:
      return "📍";
  }
}

type MapsLinkPlace = Partial<Pick<FoodPlace, "name" | "address" | "latitude" | "longitude">>;

function cleanMapText(value?: string) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function hasCoordinates(place: MapsLinkPlace) {
  return Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
}

function coordinateQuery(place: MapsLinkPlace) {
  if (!hasCoordinates(place)) return null;
  return `${place.latitude},${place.longitude}`;
}

export function mapSearchQuery(place: MapsLinkPlace) {
  const name = cleanMapText(place.name);
  const address = cleanMapText(place.address);

  if (name && address) return `${name}, ${address}`;
  if (address) return address;
  if (name) return name;
  return coordinateQuery(place);
}

export function googleMapsLink(place: MapsLinkPlace) {
  const query = mapSearchQuery(place);
  if (!query) return "https://www.google.com/maps";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function appleMapsLink(place: MapsLinkPlace) {
  const name = cleanMapText(place.name);
  const address = cleanMapText(place.address);
  const coordinates = coordinateQuery(place);
  const params = new URLSearchParams();

  if (address) {
    params.set("address", address);
    params.set("q", name ?? address);
    return `https://maps.apple.com/?${params.toString()}`;
  }

  if (coordinates) {
    params.set("ll", coordinates);
    params.set("q", name ?? coordinates);
    return `https://maps.apple.com/?${params.toString()}`;
  }

  if (name) {
    params.set("q", name);
    return `https://maps.apple.com/?${params.toString()}`;
  }

  return "https://maps.apple.com/";
}

export function loccoMapLink(place: Pick<FoodPlace, "id" | "listIds">, listIds = place.listIds) {
  const params = new URLSearchParams();
  const uniqueListIds = [...new Set(listIds)].filter(Boolean);

  if (uniqueListIds.length) {
    params.set("lists", uniqueListIds.join(","));
  }

  params.set("place", place.id);
  return `/app/map?${params.toString()}`;
}

export function getCompactPlaceTags(
  categories: FoodCategory[],
  moodTags: MoodTag[],
  limit = 4
) {
  const tags = [...new Set([...categories, ...moodTags])];

  return {
    visibleTags: tags.slice(0, limit),
    hiddenTags: tags.slice(limit),
    hiddenCount: Math.max(tags.length - limit, 0)
  };
}

export function placeSourceLabel(source: PlaceSource) {
  switch (source.type) {
    case "manual":
      return "Added through Locco";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "google_maps":
      return "Google Maps";
    case "website":
      return "Website";
    default:
      return "Source";
  }
}
