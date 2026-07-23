export type LocationSearchProviderId = "locco" | "onemap" | "google";

export type ExternalLocationSearchProviderId = Exclude<LocationSearchProviderId, "locco">;

export type LocationSearchResultKind = "known_location" | "address" | "place";

export type ValidatedCoordinates = {
  latitude: number;
  longitude: number;
};

export type ExternalProviderReference = {
  provider: ExternalLocationSearchProviderId;
  id: string;
};

export type LocationSearchProviderMetadata = {
  id: LocationSearchProviderId;
  displayName: string;
  attributionLabel?: string;
};

export type LocationSearchResult = {
  provider: LocationSearchProviderMetadata;
  kind: LocationSearchResultKind;
  externalReference?: ExternalProviderReference;
  displayName: string;
  displayAddress: string;
  postalCode?: string;
  coordinates: ValidatedCoordinates;
};

export type LocationSearchAdapter = {
  provider: LocationSearchProviderMetadata & {
    id: ExternalLocationSearchProviderId;
  };
  search: (query: string) => Promise<LocationSearchResult[]>;
};

export type MapRendererMode = "onemap-maplibre" | "google";
