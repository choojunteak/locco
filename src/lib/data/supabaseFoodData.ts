import { cache } from "react";
import type {
  FoodCategory,
  FoodList,
  FoodPlace,
  MoodTag,
  PlaceComment,
  PlaceSource,
  PlaceStatus
} from "@/types";
import { DEMO_USER_ID } from "@/lib/demoIdentity";
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
  | "created_at"
>;
type SavedPlaceRow = Pick<
  Database["public"]["Tables"]["saved_places"]["Row"],
  "list_id" | "place_id" | "user_id" | "note" | "status" | "rating" | "created_at"
>;
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
  | "incomplete_demo_data"
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
  return sourceType === "website" ? "other" : sourceType;
}

function choosePlaceStatus(saves: SavedPlaceRow[]): PlaceStatus {
  const priority: PlaceStatus[] = ["favourite", "tried", "want_to_try"];
  return priority.find((status) => saves.some((save) => save.status === status)) ?? "want_to_try";
}

function choosePlaceRating(saves: SavedPlaceRow[]) {
  const ratings = saves
    .map((save) => (typeof save.rating === "number" ? save.rating : null))
    .filter((rating): rating is number => rating !== null);

  if (!ratings.length) return undefined;
  const average = ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}

function hasCompleteDemoData(data: {
  profiles: ProfileRow[];
  lists: FoodListRow[];
  places: PlaceRow[];
  savedPlaces: SavedPlaceRow[];
  tags: PlaceTagRow[];
  comments: CommentRow[];
  sources: PlaceSourceRow[];
}) {
  return (
    data.profiles.length > 0 &&
    data.lists.length > 0 &&
    data.places.length > 0 &&
    data.savedPlaces.length > 0 &&
    data.tags.length > 0 &&
    data.comments.length > 0 &&
    data.sources.length > 0
  );
}

function mapSupabaseRows(data: {
  profiles: ProfileRow[];
  lists: FoodListRow[];
  places: PlaceRow[];
  savedPlaces: SavedPlaceRow[];
  tags: PlaceTagRow[];
  comments: CommentRow[];
  sources: PlaceSourceRow[];
}): SupabaseFoodData {
  const profilesById = new Map(data.profiles.map((profile) => [profile.id, profile]));
  const listsById = new Map(data.lists.map((list) => [list.id, list]));
  const savesByPlaceId = groupByPlaceId(data.savedPlaces);
  const tagsByPlaceId = groupByPlaceId(data.tags);
  const commentsByPlaceId = groupByPlaceId(data.comments);
  const sourcesByPlaceId = groupByPlaceId(data.sources);

  const lists = data.lists.map((list) => {
    const profile = profilesById.get(list.owner_id);
    return {
      id: list.id,
      name: list.name,
      ownerName: profile?.display_name ?? list.owner_id,
      avatar: profile?.avatar_initials ?? list.name.slice(0, 2).toUpperCase(),
      description: list.description,
      color: list.color,
      isMine: list.owner_id === DEMO_USER_ID
    };
  });

  const places = data.places.flatMap<FoodPlace>((place) => {
    const saves = savesByPlaceId[place.id] ?? [];
    if (!saves.length) return [];

    const tags = tagsByPlaceId[place.id] ?? [];
    const categories = tags
      .filter((tag) => tag.tag_type === "category")
      .map((tag) => tag.tag as FoodCategory);
    const moodTags = tags
      .filter((tag) => tag.tag_type === "mood")
      .map((tag) => tag.tag as MoodTag);
    if (!categories.length || !moodTags.length) return [];

    const comments: PlaceComment[] = (commentsByPlaceId[place.id] ?? []).map((comment) => ({
      author: getProfileName(profilesById, comment.user_id),
      text: comment.comment
    }));

    const sources: PlaceSource[] = (sourcesByPlaceId[place.id] ?? []).map((source) => ({
      type: mapSourceType(source.source_type),
      url: source.url
    }));

    const savedBy = [
      ...new Set(
        saves.map((save) => {
          const list = listsById.get(save.list_id);
          return list ? getProfileName(profilesById, list.owner_id) : getProfileName(profilesById, save.user_id);
        })
      )
    ];

    return [
      {
        id: place.id,
        name: place.name,
        address: place.address,
        postalCode: place.postal_code ?? undefined,
        latitude: place.latitude,
        longitude: place.longitude,
        categories,
        moodTags,
        priceRange: place.price_range,
        sources,
        notes: place.notes || saves.find((save) => save.note)?.note || "",
        comments,
        savedBy,
        listIds: saves.map((save) => save.list_id),
        status: choosePlaceStatus(saves),
        rating: choosePlaceRating(saves)
      }
    ];
  });

  return { lists, places };
}

export const getSupabaseFoodDataResult = cache(async function getSupabaseFoodDataResult(): Promise<SupabaseFoodDataResult> {
  const supabase = await createServerSupabaseAuthClient();
  if (!supabase) return { data: null, fallbackReason: "missing_env" };

  try {
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
        .select("id, name, address, postal_code, latitude, longitude, price_range, notes, created_at")
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

    const rows = {
      profiles: profilesResult.data ?? [],
      lists: listsResult.data ?? [],
      places: placesResult.data ?? [],
      savedPlaces: savedPlacesResult.data ?? [],
      tags: tagsResult.data ?? [],
      comments: commentsResult.data ?? [],
      sources: sourcesResult.data ?? []
    };

    if (!hasCompleteDemoData(rows)) {
      warnSupabaseFallback("Supabase returned incomplete demo data");
      return { data: null, fallbackReason: "incomplete_demo_data" };
    }

    const mapped = mapSupabaseRows(rows);
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
