import { describe, expect, it } from "vitest";
import type { FoodPlace, MergedPlace } from "@/types";
import { createCanonicalPlaceIdRemap } from "@/lib/map/canonicalPlaceIdentity";
import { buildMapUrlSearchParams } from "@/lib/map/mapUrlState";
import {
  buildSavePlacePayload,
  buildUnsavePlacePayload
} from "@/lib/map/placeSavePayload";

const oldId = "hatter-street";
const canonicalId = "c715f9ed-baa5-4ee7-b051-57874a7bea1f";

const place: FoodPlace = {
  id: oldId,
  name: "Hatter Street Bakehouse",
  address: "212 Hougang Street 21, Singapore 530212",
  postalCode: "530212",
  latitude: 1.3595,
  longitude: 103.8878,
  categories: ["Dessert"],
  moodTags: ["Hidden Gem"],
  priceRange: "$$",
  sources: [],
  notes: "Trusted-list note",
  comments: [],
  savedBy: ["Friend"],
  listIds: ["friend-list"],
  status: "want_to_try"
};

const selectedPlace: MergedPlace = {
  ...place,
  selectedListIds: ["friend-list"],
  savedBySelected: ["Friend"]
};

describe("canonical place ID handoff", () => {
  it("atomically remaps a different pre-save ID without duplicate place or marker state", () => {
    const remap = createCanonicalPlaceIdRemap(oldId, canonicalId);
    const places = remap.items([
      place,
      { ...place, id: canonicalId, notes: "Canonical record" },
      { ...place, id: "another-place" }
    ]);
    const selected = remap.item(selectedPlace);
    const savedIds = remap.idSet(new Set([oldId, canonicalId]));
    const highlightedIds = remap.idList([oldId, canonicalId, "another-place"]);
    const params = buildMapUrlSearchParams({
      currentQuery: "campaign=canonical-handoff-qa&lists=friend-list&mode=compact",
      selectedListIds: ["friend-list"],
      selectedPlaceId: selected?.id
    });

    expect(places.map((item) => item.id)).toEqual([canonicalId, "another-place"]);
    expect(places[0]?.notes).toBe("Canonical record");
    expect(new Set(places.map((item) => item.id)).size).toBe(places.length);
    expect(selected?.id).toBe(canonicalId);
    expect([...savedIds]).toEqual([canonicalId]);
    expect(highlightedIds).toEqual([canonicalId, "another-place"]);
    expect(params.get("place")).toBe(canonicalId);
    expect(params.get("campaign")).toBe("canonical-handoff-qa");
    expect(params.get("mode")).toBe("compact");
    expect(JSON.stringify({ places, selected, savedIds: [...savedIds], highlightedIds })).not
      .toContain(oldId);
  });

  it("leaves a canonical place resolvable for an immediate refresh", () => {
    const remap = createCanonicalPlaceIdRemap(oldId, canonicalId);
    const places = remap.items([place]);
    const selected = remap.item(selectedPlace);
    const params = buildMapUrlSearchParams({
      currentQuery: "campaign=canonical-handoff-qa",
      selectedListIds: ["friend-list"],
      selectedPlaceId: selected?.id
    });

    expect(places.find((item) => item.id === params.get("place"))).toEqual({
      ...place,
      id: canonicalId
    });
  });

  it("treats a same-ID save as a safe no-op without duplicate state", () => {
    const canonicalPlace = { ...place, id: canonicalId };
    const remap = createCanonicalPlaceIdRemap(canonicalId, canonicalId);

    expect(remap.changed).toBe(false);
    expect(remap.item(canonicalPlace)).toBe(canonicalPlace);
    expect(remap.items([canonicalPlace]).map((item) => item.id)).toEqual([canonicalId]);
    expect([...remap.idSet(new Set([canonicalId]))]).toEqual([canonicalId]);
  });

  it("uses the adopted canonical ID for later status updates and removal", () => {
    const remap = createCanonicalPlaceIdRemap(oldId, canonicalId);
    const selected = remap.item(selectedPlace);
    if (!selected) throw new Error("Expected a selected place.");

    const wantToTry = buildSavePlacePayload(selected, "want_to_try", "Try the waffles", 5);
    const visited = buildSavePlacePayload(selected, "visited", "Liked the waffles", 4);
    const returnedToWantToTry = buildSavePlacePayload(
      selected,
      "want_to_try",
      "Try another flavour",
      4
    );
    const removal = buildUnsavePlacePayload(selected);

    expect(wantToTry.placeId).toBe(canonicalId);
    expect(visited.placeId).toBe(canonicalId);
    expect(visited.savedRating).toBe(4);
    expect(returnedToWantToTry.placeId).toBe(canonicalId);
    expect(returnedToWantToTry.savedRating).toBeNull();
    expect(removal.placeId).toBe(canonicalId);
  });
});
