import { describe, expect, it } from "vitest";
import { buildMapUrlSearchParams } from "@/lib/map/mapUrlState";
import { nextCanonicalPlaceSelection } from "@/lib/map/selection";

describe("map URL and canonical selection", () => {
  it("preserves unrelated query parameters while setting canonical list and place state", () => {
    const params = buildMapUrlSearchParams({
      currentQuery: "mode=compact&lists=old&place=old-place",
      selectedListIds: ["list-b", "list-a"],
      selectedPlaceId: "canonical-place-id"
    });

    expect(params.get("mode")).toBe("compact");
    expect(params.get("lists")).toBe("list-b,list-a");
    expect(params.get("place")).toBe("canonical-place-id");
  });

  it("preserves an explicit zero-list scope and removes only the place parameter", () => {
    const params = buildMapUrlSearchParams({
      currentQuery: "campaign=friend-share&place=old-place",
      selectedListIds: []
    });

    expect(params.get("campaign")).toBe("friend-share");
    expect(params.has("lists")).toBe(true);
    expect(params.get("lists")).toBe("");
    expect(params.has("place")).toBe(false);
  });

  it("opens a first pin at mid and preserves the current snap when switching pins", () => {
    expect(
      nextCanonicalPlaceSelection({
        currentPlace: null,
        nextPlace: { id: "place-a" },
        currentSnapState: "minimized"
      })
    ).toEqual({
      selectedPlace: { id: "place-a" },
      snapState: "mid"
    });

    expect(
      nextCanonicalPlaceSelection({
        currentPlace: { id: "place-a" },
        nextPlace: { id: "place-b" },
        currentSnapState: "minimized"
      })
    ).toEqual({
      selectedPlace: { id: "place-b" },
      snapState: "minimized"
    });
  });
});
