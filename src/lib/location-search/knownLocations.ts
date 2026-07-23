import type { LocationSearchProviderMetadata, LocationSearchResult } from "@/types";

const loccoLocationProvider: LocationSearchProviderMetadata = {
  id: "locco",
  displayName: "Locco"
};

export const knownLocations: LocationSearchResult[] = [
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Orchard MRT",
    displayAddress: "Orchard Road, Singapore",
    postalCode: "238882",
    coordinates: {
      latitude: 1.30398,
      longitude: 103.83225
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Somerset MRT",
    displayAddress: "Somerset Road, Singapore",
    postalCode: "238162",
    coordinates: {
      latitude: 1.30068,
      longitude: 103.8395
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "313 Somerset",
    displayAddress: "313 Orchard Road, Singapore 238895",
    postalCode: "238895",
    coordinates: {
      latitude: 1.30131,
      longitude: 103.83846
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Tanjong Pagar MRT",
    displayAddress: "Tanjong Pagar, Singapore",
    postalCode: "078884",
    coordinates: {
      latitude: 1.27639,
      longitude: 103.84575
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Bugis MRT",
    displayAddress: "Bugis, Singapore",
    postalCode: "188024",
    coordinates: {
      latitude: 1.30089,
      longitude: 103.85609
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Chinatown MRT",
    displayAddress: "Chinatown, Singapore",
    postalCode: "059443",
    coordinates: {
      latitude: 1.28436,
      longitude: 103.84331
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Holland Village MRT",
    displayAddress: "Holland Village, Singapore",
    postalCode: "278995",
    coordinates: {
      latitude: 1.3112,
      longitude: 103.79633
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Serangoon MRT",
    displayAddress: "Serangoon, Singapore",
    postalCode: "556083",
    coordinates: {
      latitude: 1.35053,
      longitude: 103.87239
    }
  },
  {
    provider: loccoLocationProvider,
    kind: "known_location",
    displayName: "Tampines MRT",
    displayAddress: "Tampines, Singapore",
    postalCode: "529538",
    coordinates: {
      latitude: 1.35339,
      longitude: 103.9457
    }
  }
];

export function searchKnownLocations(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return knownLocations.filter((location) => {
    const haystack =
      `${location.displayName} ${location.displayAddress} ${location.postalCode ?? ""}`.toLowerCase();
    return (
      haystack.includes(normalized) ||
      normalized.includes(location.displayName.toLowerCase().replace(" mrt", ""))
    );
  });
}
