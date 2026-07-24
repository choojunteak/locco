import { beforeAll, describe, expect, it, vi } from "vitest";

const loaderMocks = vi.hoisted(() => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn(async (library: string) => ({ library }))
}));

vi.mock("@googlemaps/js-api-loader", () => loaderMocks);

import { loadGoogleMapsLibraries } from "@/lib/google/mapsLoader.client";

describe("Google Maps singleton loader", () => {
  beforeAll(() => {
    loaderMocks.setOptions.mockClear();
    loaderMocks.importLibrary.mockClear();
  });

  it("does not initialize without complete public map configuration", async () => {
    await expect(
      loadGoogleMapsLibraries({
        apiKey: undefined,
        mapId: undefined
      })
    ).rejects.toThrow("incomplete");
    expect(loaderMocks.setOptions).not.toHaveBeenCalled();
    expect(loaderMocks.importLibrary).not.toHaveBeenCalled();
  });

  it("deduplicates initialization across renderer remounts", async () => {
    const first = loadGoogleMapsLibraries({
      apiKey: "public-browser-key",
      mapId: "locco-map-id"
    });
    const second = loadGoogleMapsLibraries({
      apiKey: "public-browser-key",
      mapId: "locco-map-id"
    });

    await expect(first).resolves.toEqual({
      maps: { library: "maps" },
      marker: { library: "marker" }
    });
    await expect(second).resolves.toEqual({
      maps: { library: "maps" },
      marker: { library: "marker" }
    });
    expect(loaderMocks.setOptions).toHaveBeenCalledTimes(1);
    expect(loaderMocks.importLibrary).toHaveBeenCalledTimes(2);
  });

  it("rejects conflicting configuration after initialization", async () => {
    await expect(
      loadGoogleMapsLibraries({
        apiKey: "different-public-key",
        mapId: "different-map-id"
      })
    ).rejects.toThrow("different public configuration");
    expect(loaderMocks.setOptions).toHaveBeenCalledTimes(1);
  });
});
