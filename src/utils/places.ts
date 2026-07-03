import { foodLists } from "@/data/mockData";
import type { FoodList, FoodPlace, MergedPlace } from "@/types";

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

export function googleMapsLink(place: Pick<FoodPlace, "name" | "latitude" | "longitude">) {
  const query = encodeURIComponent(`${place.name} ${place.latitude},${place.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function appleMapsLink(place: Pick<FoodPlace, "name" | "latitude" | "longitude">) {
  const query = encodeURIComponent(place.name);
  return `https://maps.apple.com/?ll=${place.latitude},${place.longitude}&q=${query}`;
}
