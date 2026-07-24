import type {
  ProviderStackDefinition,
  ProviderStackHealth,
  ProviderStackPreference,
  ProviderStackResolution,
  PublicProviderConfiguration
} from "@/types/providerStack";

export const GOOGLE_PROVIDER_STACK: ProviderStackDefinition = {
  id: "google",
  renderer: "google",
  // Google discovery is deliberately not part of this foundation branch.
  discoveryProvider: "onemap",
  acceptsGoogleTransientResults: true
};

export const FALLBACK_PROVIDER_STACK: ProviderStackDefinition = {
  id: "fallback",
  renderer: "maplibre",
  discoveryProvider: "onemap",
  acceptsGoogleTransientResults: false
};

export function isGoogleMapConfigured(configuration: PublicProviderConfiguration) {
  return Boolean(
    configuration.google.capabilities.map &&
      configuration.google.map.browserApiKey &&
      configuration.google.map.mapId
  );
}

export function resolveProviderStack({
  configuration,
  health,
  preference = "auto"
}: {
  configuration: PublicProviderConfiguration;
  health: ProviderStackHealth;
  preference?: ProviderStackPreference;
}): ProviderStackResolution {
  if (preference === "fallback" && configuration.developmentControlsEnabled) {
    return {
      stack: FALLBACK_PROVIDER_STACK,
      reason: "development-forced-fallback"
    };
  }

  if (!configuration.google.capabilities.map) {
    return {
      stack: FALLBACK_PROVIDER_STACK,
      reason: "google-map-disabled"
    };
  }

  if (!isGoogleMapConfigured(configuration)) {
    return {
      stack: FALLBACK_PROVIDER_STACK,
      reason: "google-map-unconfigured"
    };
  }

  if (health.googleMap === "fatal") {
    return {
      stack: FALLBACK_PROVIDER_STACK,
      reason: "google-map-fatal"
    };
  }

  return {
    stack: GOOGLE_PROVIDER_STACK,
    reason: "google-ready"
  };
}
