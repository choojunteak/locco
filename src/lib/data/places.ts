import { foodPlaces } from "@/data/mockData";
import type { FoodPlace, MergedPlace } from "@/types";
import { getVisiblePlaces } from "@/utils/places";
import { getFoodLists, getListById } from "@/lib/data/lists";
import { getSupabaseFoodData } from "@/lib/data/supabaseFoodData";

export async function getAllFoodPlaces(): Promise<FoodPlace[]> {
  const supabaseData = await getSupabaseFoodData();
  return supabaseData?.places.length ? supabaseData.places : foodPlaces;
}

export async function getPlaceById(placeId: string): Promise<FoodPlace | null> {
  const places = await getAllFoodPlaces();
  return places.find((place) => place.id === placeId) ?? null;
}

export async function getPlacesForSelectedLists(listIds: string[]): Promise<MergedPlace[]> {
  const [lists, places] = await Promise.all([getFoodLists(), getAllFoodPlaces()]);
  return getVisiblePlaces(places, listIds, lists);
}

export async function getPlacesByListId(listId: string): Promise<MergedPlace[]> {
  const list = await getListById(listId);
  const places = await getAllFoodPlaces();

  return places
    .filter((place) => place.listIds.includes(listId))
    .map((place) => ({
      ...place,
      selectedListIds: [listId],
      savedBySelected: [list?.ownerName ?? listId]
    }));
}

export async function getFavouritePlaces(limit = 3): Promise<MergedPlace[]> {
  const lists = await getFoodLists();
  const places = await getAllFoodPlaces();

  return places
    .filter((place) => place.status === "favourite")
    .slice(0, limit)
    .map((place) => ({
      ...place,
      selectedListIds: place.listIds,
      savedBySelected: place.listIds.map(
        (listId) => lists.find((list) => list.id === listId)?.ownerName ?? listId
      )
    }));
}
