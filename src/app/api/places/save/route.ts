import { NextResponse } from "next/server";
import { getOrCreateCurrentProfile } from "@/lib/auth/profile";
import { createServerSupabaseAuthClient } from "@/lib/supabase/authServer";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const DEFAULT_LIST_KEY = "default-saved-places";
const DEFAULT_LIST_NAME = "My saved places";
const DEFAULT_LIST_COLOR = "#B97D7B";
const VALID_PRICE_RANGES = new Set(["$", "$$", "$$$", "$$$$"]);
const VALID_STATUSES = new Set(["want_to_try", "visited"]);
const VALID_RATINGS = new Set([1, 3, 4, 5]);

type PlaceSnapshot = {
  placeId?: unknown;
  name?: unknown;
  address?: unknown;
  postalCode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  priceRange?: unknown;
  notes?: unknown;
  status?: unknown;
  savedNote?: unknown;
  savedRating?: unknown;
};

type UnsaveRequest = {
  placeId?: unknown;
  listId?: unknown;
  placeKey?: unknown;
};

type ValidatedPlaceSnapshot = {
  placeId: string;
  name: string;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  priceRange: Database["public"]["Tables"]["places"]["Insert"]["price_range"];
  notes: string;
  status: Database["public"]["Tables"]["saved_places"]["Insert"]["status"];
  savedNote: string | null;
  savedRating: number | null;
  placeKey: string;
};

type PlaceInsert = Database["public"]["Tables"]["places"]["Insert"];
type FoodListRow = Pick<
  Database["public"]["Tables"]["food_lists"]["Row"],
  "id" | "name" | "color"
>;
type FoodListIdRow = Pick<Database["public"]["Tables"]["food_lists"]["Row"], "id">;
type PlaceRow = Pick<
  Database["public"]["Tables"]["places"]["Row"],
  "id" | "place_key"
>;
type SavedPlaceListRow = Pick<
  Database["public"]["Tables"]["saved_places"]["Row"],
  "list_id"
>;
type SavedPlaceIdRow = Pick<Database["public"]["Tables"]["saved_places"]["Row"], "id">;

function jsonError(message: string, status: number, resultKey: "saved" | "unsaved" = "saved") {
  return NextResponse.json({ [resultKey]: false, error: message }, { status });
}

function cleanString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
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

function computePlaceKey(input: {
  name: string;
  postalCode: string | null;
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

function validateSnapshot(
  body: PlaceSnapshot
): { error: string } | { value: ValidatedPlaceSnapshot } {
  const placeId = cleanString(body.placeId, 120);
  if (placeId.startsWith("local-")) {
    return { error: "Local Add Place entries cannot be persisted yet." };
  }

  const name = cleanString(body.name, 200);
  const address = cleanString(body.address, 500);
  const postalCode = cleanString(body.postalCode, 20) || null;
  const latitude = parseNumber(body.latitude);
  const longitude = parseNumber(body.longitude);
  const notes = cleanString(body.notes, 1000);
  const savedNote = cleanString(body.savedNote, 1000) || null;
  const priceRange =
    typeof body.priceRange === "string" && VALID_PRICE_RANGES.has(body.priceRange)
      ? (body.priceRange as PlaceInsert["price_range"])
      : "$$";
  const status =
    typeof body.status === "string" && VALID_STATUSES.has(body.status)
      ? (body.status as Database["public"]["Tables"]["saved_places"]["Insert"]["status"])
      : "want_to_try";
  const parsedRating = parseNumber(body.savedRating);
  const savedRating =
    status === "visited" && VALID_RATINGS.has(parsedRating) ? parsedRating : null;

  if (!placeId) return { error: "Missing place id." };
  if (!name) return { error: "Missing place name." };
  if (!address) return { error: "Missing place address." };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: "Invalid place latitude." };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Invalid place longitude." };
  }

  return {
    value: {
      placeId,
      name,
      address,
      postalCode,
      latitude,
      longitude,
      priceRange,
      notes,
      status,
      savedNote,
      savedRating,
      placeKey: computePlaceKey({ name, postalCode, latitude, longitude })
    }
  };
}

async function findPlaceById(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  placeId: string
) {
  if (!isValidUuid(placeId)) return null;

  const { data, error } = await supabase
    .from("places")
    .select("id, place_key")
    .eq("id", placeId)
    .maybeSingle<PlaceRow>();

  if (error) throw error;
  return data;
}

async function findPlaceByKey(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  placeKey: string
) {
  const { data, error } = await supabase
    .from("places")
    .select("id, place_key")
    .eq("place_key", placeKey)
    .maybeSingle<PlaceRow>();

  if (error) throw error;
  return data;
}

async function resolveCanonicalPlaceForUnsave(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  input: { placeId: string; placeKey: string }
) {
  if (isValidUuid(input.placeId)) {
    const existingById = await findPlaceById(supabase, input.placeId);
    if (existingById) return existingById;
  }

  if (!input.placeKey) return null;
  return findPlaceByKey(supabase, input.placeKey);
}

async function findOrCreatePlace(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  snapshot: ValidatedPlaceSnapshot
) {
  const existingByKey = await findPlaceByKey(supabase, snapshot.placeKey);
  if (existingByKey) return existingByKey;

  const existingById = await findPlaceById(supabase, snapshot.placeId);
  if (existingById) return existingById;

  const placeInsert: PlaceInsert = {
    name: snapshot.name,
    address: snapshot.address,
    postal_code: snapshot.postalCode,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
    price_range: snapshot.priceRange,
    notes: snapshot.notes,
    place_key: snapshot.placeKey,
    normalized_key: snapshot.placeKey,
    source: "locco_visible_place",
    source_place_id: snapshot.placeKey
  };

  const { data, error } = await supabase
    .from("places")
    .insert(placeInsert as never)
    .select("id, place_key")
    .single<PlaceRow>();

  if (!error) return data;
  if (error.code !== "23505") throw error;

  const racedPlace = await findPlaceByKey(supabase, snapshot.placeKey);
  if (!racedPlace) throw error;
  return racedPlace;
}

async function findDefaultList(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  ownerId: string
) {
  const { data, error } = await supabase
    .from("food_lists")
    .select("id, name, color")
    .eq("owner_id", ownerId)
    .eq("list_key", DEFAULT_LIST_KEY)
    .maybeSingle<FoodListRow>();

  if (error) throw error;
  return data;
}

async function findOrCreateDefaultList(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  ownerId: string
) {
  const existingList = await findDefaultList(supabase, ownerId);
  if (existingList) return existingList;

  const { data, error } = await supabase
    .from("food_lists")
    .insert({
      owner_id: ownerId,
      list_key: DEFAULT_LIST_KEY,
      name: DEFAULT_LIST_NAME,
      description: "Your saved places from the map.",
      color: DEFAULT_LIST_COLOR,
      privacy: "private"
    } as never)
    .select("id, name, color")
    .single<FoodListRow>();

  if (!error) return data;
  if (error.code !== "23505") throw error;

  const racedList = await findDefaultList(supabase, ownerId);
  if (!racedList) throw error;
  return racedList;
}

async function ensureSavedPlace(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  input: {
    listId: string;
    placeId: string;
    userId: string;
    status: Database["public"]["Tables"]["saved_places"]["Insert"]["status"];
    note: string | null;
    rating: number | null;
  }
) {
  const { data: existingSave, error: existingError } = await supabase
    .from("saved_places")
    .select("id")
    .eq("list_id", input.listId)
    .eq("place_id", input.placeId)
    .eq("user_id", input.userId)
    .maybeSingle<SavedPlaceIdRow>();

  if (existingError) throw existingError;
  if (existingSave) {
    const { error } = await supabase
      .from("saved_places")
      .update({
        status: input.status,
        note: input.note,
        rating: input.rating
      } as never)
      .eq("id", existingSave.id)
      .eq("user_id", input.userId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("saved_places").insert({
    list_id: input.listId,
    place_id: input.placeId,
    user_id: input.userId,
    status: input.status,
    note: input.note,
    rating: input.rating
  } as never);

  if (!error) return;
  if (error.code === "23505") {
    const { error: updateError } = await supabase
      .from("saved_places")
      .update({
        status: input.status,
        note: input.note,
        rating: input.rating
      } as never)
      .eq("list_id", input.listId)
      .eq("place_id", input.placeId)
      .eq("user_id", input.userId);

    if (!updateError) return;
    throw updateError;
  }
  throw error;
}

async function getOwnedListIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseAuthClient>>>,
  ownerId: string,
  listId?: string
) {
  let query = supabase.from("food_lists").select("id").eq("owner_id", ownerId);

  if (listId) {
    query = query.eq("id", listId);
  }

  const { data, error } = await query.returns<FoodListIdRow[]>();
  if (error) throw error;

  return (data ?? []).map((list) => list.id);
}

export async function POST(request: Request) {
  let body: PlaceSnapshot;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = validateSnapshot(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  const profileResult = await getOrCreateCurrentProfile();
  if (profileResult.reason === "missing_env") {
    return jsonError("Supabase Auth is not configured for this environment.", 503);
  }
  if (!profileResult.hasSession) {
    return jsonError("Sign in to save places.", 401);
  }
  if (!profileResult.profile) {
    return jsonError("Your profile is not ready yet.", 409);
  }

  const supabase = await createServerSupabaseAuthClient();
  if (!supabase) {
    return jsonError("Supabase Auth is not configured for this environment.", 503);
  }

  try {
    const place = await findOrCreatePlace(supabase, parsed.value);
    const list = await findOrCreateDefaultList(supabase, profileResult.profile.id);

    await ensureSavedPlace(supabase, {
      listId: list.id,
      placeId: place.id,
      userId: profileResult.profile.id,
      status: parsed.value.status,
      note: parsed.value.savedNote,
      rating: parsed.value.savedRating
    });

    return NextResponse.json({
      saved: true,
      placeId: place.id,
      listId: list.id,
      listName: list.name,
      listColor: list.color,
      savedByDisplayName: profileResult.profile.display_name,
      savedByAvatar: profileResult.profile.avatar_initials,
      status: parsed.value.status,
      note: parsed.value.savedNote,
      rating: parsed.value.savedRating,
      placeKey: place.place_key
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown save error";
    console.warn("[Locco] Save place failed.", { message });
    return jsonError("Could not save this place yet.", 500);
  }
}

export async function DELETE(request: Request) {
  let body: UnsaveRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400, "unsaved");
  }

  const placeId = cleanString(body.placeId, 120);
  const listId = cleanString(body.listId, 120);
  const placeKey = cleanString(body.placeKey, 200);

  if (!placeId) return jsonError("Missing place id.", 400, "unsaved");
  if (placeId.startsWith("local-")) {
    return jsonError("Local Add Place entries cannot be persisted yet.", 400, "unsaved");
  }
  if (listId && !isValidUuid(listId)) {
    return jsonError("Invalid list id.", 400, "unsaved");
  }
  if (!isValidUuid(placeId) && !placeKey) {
    return jsonError("Missing place identity.", 400, "unsaved");
  }

  const profileResult = await getOrCreateCurrentProfile();
  if (profileResult.reason === "missing_env") {
    return jsonError("Supabase Auth is not configured for this environment.", 503, "unsaved");
  }
  if (!profileResult.hasSession) {
    return jsonError("Sign in to unsave places.", 401, "unsaved");
  }
  if (!profileResult.profile) {
    return jsonError("Your profile is not ready yet.", 409, "unsaved");
  }

  const supabase = await createServerSupabaseAuthClient();
  if (!supabase) {
    return jsonError("Supabase Auth is not configured for this environment.", 503, "unsaved");
  }

  try {
    const place = await resolveCanonicalPlaceForUnsave(supabase, { placeId, placeKey });
    if (!place) return jsonError("Place was not found.", 404, "unsaved");

    const ownedListIds = await getOwnedListIds(supabase, profileResult.profile.id, listId || undefined);
    if (listId && !ownedListIds.length) {
      return jsonError("You can only remove saves from your own lists.", 403, "unsaved");
    }
    if (!ownedListIds.length) {
      return NextResponse.json({
        unsaved: true,
        placeId: place.id,
        removedListIds: []
      });
    }

    const { data: removedRows, error } = await supabase
      .from("saved_places")
      .delete()
      .eq("user_id", profileResult.profile.id)
      .eq("place_id", place.id)
      .in("list_id", ownedListIds)
      .select("list_id");

    if (error) throw error;

    const removedListIds = [
      ...new Set(
        ((removedRows ?? []) as SavedPlaceListRow[])
          .map((row) => row.list_id)
          .filter(Boolean)
      )
    ];

    return NextResponse.json({
      unsaved: true,
      placeId: place.id,
      removedListIds
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown unsave error";
    console.warn("[Locco] Unsave place failed.", { message });
    return jsonError("Could not unsave this place yet.", 500, "unsaved");
  }
}
