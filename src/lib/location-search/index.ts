import type { LocationSearchResult } from "@/types";
import {
  knownLocations,
  searchKnownLocations
} from "@/lib/location-search/knownLocations";
import { oneMapLocationSearchAdapter } from "@/lib/location-search/providers/onemap";

export const activeLocationSearchAdapter = oneMapLocationSearchAdapter;
export const LOCATION_SEARCH_SERVER_RESULT_LIMIT = 8;

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const known = searchKnownLocations(query);
  const providerResults = await activeLocationSearchAdapter.search(query);
  return [...known, ...providerResults].slice(0, LOCATION_SEARCH_SERVER_RESULT_LIMIT);
}

export { knownLocations, searchKnownLocations };
