export type ProviderStackId = "google" | "fallback";

export type ProviderStackPreference = "auto" | ProviderStackId;

export type MapRendererId = "google" | "maplibre";

export type LocationDiscoveryProviderId = "google" | "onemap";

export type GoogleCapabilityId =
  | "map"
  | "autocomplete"
  | "textSearch"
  | "nearbySearch"
  | "detailsEssentials"
  | "detailsPro"
  | "detailsEnterprise"
  | "ratings"
  | "openingHours"
  | "photos"
  | "geocoding"
  | "routes"
  | "placeReconciliation";

export type GoogleCapabilities = Record<GoogleCapabilityId, boolean>;

export type PublicGoogleMapConfiguration = {
  browserApiKey?: string;
  mapId?: string;
};

export type PublicProviderConfiguration = {
  preferredStack: "google";
  google: {
    capabilities: GoogleCapabilities;
    map: PublicGoogleMapConfiguration;
  };
  developmentControlsEnabled: boolean;
};

export type ProviderStackHealth = {
  googleMap: "healthy" | "fatal";
};

export type ProviderStackDefinition = {
  id: ProviderStackId;
  renderer: MapRendererId;
  discoveryProvider: LocationDiscoveryProviderId;
  acceptsGoogleTransientResults: boolean;
};

export type ProviderStackResolutionReason =
  | "google-ready"
  | "google-map-disabled"
  | "google-map-unconfigured"
  | "google-map-fatal"
  | "development-forced-fallback";

export type ProviderStackResolution = {
  stack: ProviderStackDefinition;
  reason: ProviderStackResolutionReason;
};
