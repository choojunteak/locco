import "server-only";

import { cache } from "react";
import { foodLists, foodPlaces } from "@/data/mockData";
import type {
  FoodCategory,
  FoodList,
  FoodPlace,
  MoodTag,
  PlaceComment,
  PlaceSource,
  PlaceStatus
} from "@/types";
import { DEMO_LIST_ID } from "@/lib/demoIdentity";
import { createServerSupabaseAuthClient } from "@/lib/supabase/authServer";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "avatar_initials"
>;
type FoodListRow = Pick<
  Database["public"]["Tables"]["food_lists"]["Row"],
  "id" | "owner_id" | "name" | "description" | "color" | "created_at"
>;
type PlaceRow = Pick<
  Database["public"]["Tables"]["places"]["Row"],
  | "id"
  | "name"
  | "address"
  | "postal_code"
  | "latitude"
  | "longitude"
  | "price_range"
  | "notes"
  | "place_key"
  | "created_at"
>;
type SavedPlaceRow = Pick<
  Database["public"]["Tables"]["saved_places"]["Row"],
  "list_id" | "place_id" | "user_id" | "note" | "rating" | "created_at"
> & {
  status: PlaceStatus | "tried" | "favourite" | null;
};
type PlaceTagRow = Pick<
  Database["public"]["Tables"]["place_tags"]["Row"],
  "place_id" | "tag" | "tag_type"
>;
type CommentRow = Pick<
  Database["public"]["Tables"]["comments"]["Row"],
  "place_id" | "user_id" | "comment" | "created_at"
>;
type PlaceSourceRow = Pick<
  Database["public"]["Tables"]["place_sources"]["Row"],
  "place_id" | "source_type" | "url" | "created_at"
>;

export type SupabaseFoodData = {
  lists: FoodList[];
  places: FoodPlace[];
};

export type SupabaseFoodDataFallbackReason =
  | "missing_env"
  | "read_failed"
  | "no_session"
  | "mapping_failed";

export type SupabaseFoodDataResult = {
  data: SupabaseFoodData | null;
  fallbackReason: SupabaseFoodDataFallbackReason | null;
};

let hasWarnedSupabaseRead = false;

function warnSupabaseFallback(reason: string, error?: unknown) {
  if (hasWarnedSupabaseRead) return;
  hasWarnedSupabaseRead = true;

  const detail = error instanceof Error ? error.message : error;
  console.warn(
    `[Locco] ${reason}; using mock food data fallback.`,
    detail ? { detail } : undefined
  );
}

function groupByPlaceId<Row extends { place_id: string }>(rows: Row[]) {
  return rows.reduce<Record<string, Row[]>>((grouped, row) => {
    grouped[row.place_id] = grouped[row.place_id] ?? [];
    grouped[row.place_id].push(row);
    return grouped;
  }, {});
}

function getProfileName(profilesById: Map<string, ProfileRow>, userId: string) {
  return profilesById.get(userId)?.display_name ?? userId;
}

function mapSourceType(sourceType: PlaceSourceRow["source_type"]): PlaceSource["type"] {
  return sourceType;
}

function normalizeSavedPlaceStatus(status: SavedPlaceRow["status"]): PlaceStatus {
  if (status === "visited" || status === "tried" || status === "favourite") return "visited";
  return "want_to_try";
}

function choosePlaceStatus(saves: SavedPlaceRow[]): PlaceStatus {
  return saves.some((save) => normalizeSavedPlaceStatus(save.status) === "visited")
    ? "visited"
    : "want_to_try";
}

function choosePlaceRating(saves: SavedPlaceRow[]) {
  const ratings = saves
    .map((save) => (typeof save.rating === "number" ? save.rating : null))
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));

  if (!ratings.length) return undefined;
  const average = ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}

const validFoodCategories = new Set<FoodCategory>([
  "Cafe",
  "Dessert",
  "Japanese",
  "Korean",
  "Local",
  "Thai",
  "Brunch",
  "Supper",
  "Bakery",
  "Drinks",
  "Ice Cream",
  "Cheap Eats",
  "Date Spot"
]);

const validMoodTags = new Set<MoodTag>([
  "Date Spot",
  "Cheap Eats",
  "Aesthetic",
  "Good for Groups",
  "Solo Meal",
  "Study Cafe",
  "Late Night",
  "Near MRT",
  "Hidden Gem",
  "Overhyped",
  "Worth Queueing",
  "Takeaway Friendly",
  "Chill",
  "Comfort Food"
]);

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

function computePlaceKey(input: {
  name: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}) {
  const namePart = slugPart(input.name);
  const postalPart = input.postalCode?.replace(/\D/g, "");

  if (postalPart) {
    return `${namePart}-${postalPart}`;
  }

  return `${namePart}-lat${coordinatePart(input.latitude)}-lng${coordinatePart(input.longitude)}`;
}

function getSocialMockLists() {
  return foodLists
    .filter((list) => list.id !== DEMO_LIST_ID)
    .map((list) => ({ ...list, isMine: false }));
}

function getSocialMockPlaces() {
  const socialLists = getSocialMockLists();
  const socialListIds = new Set(socialLists.map((list) => list.id));
  const socialListsById = new Map(socialLists.map((list) => [list.id, list]));

  return foodPlaces.flatMap<FoodPlace>((place) => {
    const listIds = place.listIds.filter((listId) => socialListIds.has(listId));
    if (!listIds.length) return [];

    return [
      {
        ...place,
        listIds,
        savedBy: listIds.map((listId) => socialListsById.get(listId)?.ownerName ?? listId)
      }
    ];
  });
}

function isFoodCategory(tag: string): tag is FoodCategory {
  return validFoodCategories.has(tag as FoodCategory);
}

function isMoodTag(tag: string): tag is MoodTag {
  return validMoodTags.has(tag as MoodTag);
}

function placeKeyForFoodPlace(place: Pick<FoodPlace, "name" | "postalCode" | "latitude" | "longitude">) {
  return computePlaceKey({
    name: place.name,
    postalCode: place.postalCode,
    latitude: place.latitude,
    longitude: place.longitude
  });
}

function mapSupabaseRows(data: {
  profiles: ProfileRow[];
  lists: FoodListRow[];
  places: PlaceRow[];
  savedPlaces: SavedPlaceRow[];
  tags: PlaceTagRow[];
  comments: CommentRow[];
  sources: PlaceSourceRow[];
  currentUserId: string;
}): SupabaseFoodData {
  const profilesById = new Map(data.profiles.map((profile) => [profile.id, profile]));
  const placesById = new Map(data.places.map((place) => [place.id, place]));
  const ownListRows = data.lists.filter((list) => list.owner_id === data.currentUserId);
  const ownListIds = new Set(ownListRows.map((list) => list.id));
  const ownSavedPlaces = data.savedPlaces.filter(
    (save) => save.user_id === data.currentUserId && ownListIds.has(save.list_id)
  );
  const ownSavesByPlaceId = groupByPlaceId(ownSavedPlaces);
  const tagsByPlaceId = groupByPlaceId(data.tags);
  const commentsByPlaceId = groupByPlaceId(data.comments);
  const sourcesByPlaceId = groupByPlaceId(data.sources);
  const socialLists = getSocialMockLists();
  const socialPlaces = getSocialMockPlaces();
  const socialPlacesByPlaceKey = new Map(
    socialPlaces.map((place) => [placeKeyForFoodPlace(place), place])
  );

  const ownLists = ownListRows.map((list) => {
    const profile = profilesById.get(list.owner_id);
    return {
      id: list.id,
      name: list.name,
      ownerName: profile?.display_name ?? list.owner_id,
      avatar: profile?.avatar_initials ?? list.name.slice(0, 2).toUpperCase(),
      description: list.description,
      color: list.color,
      isMine: true
    };
  });

  const lists = [...ownLists, ...socialLists];
  const listsForSavedBy = new Map(lists.map((list) => [list.id, list]));

  const persistedPlaces = Object.entries(ownSavesByPlaceId).flatMap<FoodPlace>(
    ([placeId, ownSaves]) => {
      const place = placesById.get(placeId);
      if (!place) return [];

      const matchingMockPlace = socialPlacesByPlaceKey.get(place.place_key);
      const socialListIds = matchingMockPlace?.listIds ?? [];
      const listIds = [...new Set([...ownSaves.map((save) => save.list_id), ...socialListIds])];
      const tags = tagsByPlaceId[place.id] ?? [];
      const categories = tags
        .filter((tag) => tag.tag_type === "category" && isFoodCategory(tag.tag))
        .map((tag) => tag.tag as FoodCategory);
      const moodTags = tags
        .filter((tag) => tag.tag_type === "mood" && isMoodTag(tag.tag))
        .map((tag) => tag.tag as MoodTag);
      const comments: PlaceComment[] = (commentsByPlaceId[place.id] ?? []).map((comment) => ({
        author: getProfileName(profilesById, comment.user_id),
        text: comment.comment
      }));
      const sources: PlaceSource[] = (sourcesByPlaceId[place.id] ?? []).map((source) => ({
        type: mapSourceType(source.source_type),
        url: source.url
      }));
      const savedBy = listIds.map((listId) => listsForSavedBy.get(listId)?.ownerName ?? listId);

      return [
        {
          id: place.id,
          name: place.name,
          address: place.address,
          postalCode: place.postal_code ?? matchingMockPlace?.postalCode,
          latitude: place.latitude,
          longitude: place.longitude,
          categories: categories.length ? categories : matchingMockPlace?.categories ?? ["Saved Spot"],
          moodTags: moodTags.length ? moodTags : matchingMockPlace?.moodTags ?? [],
          priceRange: place.price_range,
          sources: sources.length ? sources : matchingMockPlace?.sources ?? [],
          notes:
            ownSaves.find((save) => save.note)?.note ||
            place.notes ||
            matchingMockPlace?.notes ||
            "Saved to your Locco list.",
          comments: comments.length ? comments : matchingMockPlace?.comments ?? [],
          savedBy,
          listIds,
          status: choosePlaceStatus(ownSaves),
          rating: choosePlaceRating(ownSaves) ?? matchingMockPlace?.rating
        }
      ];
    }
  );

  const persistedPlaceKeys = new Set(persistedPlaces.map(placeKeyForFoodPlace));
  const unsavedSocialPlaces = socialPlaces.filter(
    (place) => !persistedPlaceKeys.has(placeKeyForFoodPlace(place))
  );

  return { lists, places: [...persistedPlaces, ...unsavedSocialPlaces] };
}

export const getSupabaseFoodDataResult = cache(async function getSupabaseFoodDataResult(): Promise<SupabaseFoodDataResult> {
  const supabase = await createServerSupabaseAuthClient();
  if (!supabase) return { data: null, fallbackReason: "missing_env" };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { data: null, fallbackReason: "no_session" };
    }

    const [
      profilesResult,
      listsResult,
      placesResult,
      savedPlacesResult,
      tagsResult,
      commentsResult,
      sourcesResult
    ] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_initials").order("created_at"),
      supabase
        .from("food_lists")
        .select("id, owner_id, name, description, color, created_at")
        .order("created_at"),
      supabase
        .from("places")
        .select(
          "id, name, address, postal_code, latitude, longitude, price_range, notes, place_key, created_at"
        )
        .order("created_at"),
      supabase
        .from("saved_places")
        .select("list_id, place_id, user_id, note, status, rating, created_at")
        .order("created_at"),
      supabase.from("place_tags").select("place_id, tag, tag_type"),
      supabase.from("comments").select("place_id, user_id, comment, created_at").order("created_at"),
      supabase
        .from("place_sources")
        .select("place_id, source_type, url, created_at")
        .order("created_at")
    ]);

    const failedResult = [
      profilesResult,
      listsResult,
      placesResult,
      savedPlacesResult,
      tagsResult,
      commentsResult,
      sourcesResult
    ].find((result) => result.error);

    if (failedResult?.error) {
      warnSupabaseFallback("Supabase read failed", failedResult.error);
      return { data: null, fallbackReason: "read_failed" };
    }

    const mapped = mapSupabaseRows({
      profiles: profilesResult.data ?? [],
      lists: listsResult.data ?? [],
      places: placesResult.data ?? [],
      savedPlaces: savedPlacesResult.data ?? [],
      tags: tagsResult.data ?? [],
      comments: commentsResult.data ?? [],
      sources: sourcesResult.data ?? [],
      currentUserId: userData.user.id
    });

    if (!mapped.lists.length || !mapped.places.length) {
      warnSupabaseFallback("Supabase rows could not be mapped into Locco food data");
      return { data: null, fallbackReason: "mapping_failed" };
    }

    return { data: mapped, fallbackReason: null };
  } catch (error) {
    warnSupabaseFallback("Supabase read failed", error);
    return { data: null, fallbackReason: "read_failed" };
  }
});

export const getSupabaseFoodData = cache(async function getSupabaseFoodData(): Promise<SupabaseFoodData | null> {
  return (await getSupabaseFoodDataResult()).data;
});
