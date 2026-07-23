import "server-only";

import type {
  LocationSearchAdapter,
  LocationSearchProviderMetadata,
  LocationSearchResult
} from "@/types";
import { toValidatedCoordinates } from "@/lib/location-search/coordinates";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

const oneMapProvider: LocationSearchProviderMetadata & { id: "onemap" } = {
  id: "onemap",
  displayName: "OneMap",
  attributionLabel: "OneMap"
};

export const oneMapLocationSearchAdapter: LocationSearchAdapter = {
  provider: oneMapProvider,
  async search(query) {
    const url = new URL("https://www.onemap.gov.sg/api/common/elastic/search");
    url.searchParams.set("searchVal", query);
    url.searchParams.set("returnGeom", "Y");
    url.searchParams.set("getAddrDetails", "Y");
    url.searchParams.set("pageNum", "1");

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`OneMap search failed with ${response.status}`);
    }

    const payload: unknown = await response.json();
    const results = isRecord(payload) && Array.isArray(payload.results) ? payload.results : [];

    return results.flatMap((result): LocationSearchResult[] => {
      if (!isRecord(result)) return [];

      const coordinates = toValidatedCoordinates(result.LATITUDE, result.LONGITUDE);
      if (!coordinates) return [];

      return [
        {
          provider: oneMapProvider,
          kind: "address",
          displayName:
            toOptionalString(result.SEARCHVAL) ?? toOptionalString(result.ADDRESS) ?? query,
          displayAddress: toOptionalString(result.ADDRESS) ?? "",
          postalCode: toOptionalString(result.POSTAL),
          coordinates
        }
      ];
    });
  }
};

// Deferred before OneMap becomes a dependable production fallback: authenticated
// requests, multi-page fetching, retry policy, timeout/backoff, and richer error handling.
