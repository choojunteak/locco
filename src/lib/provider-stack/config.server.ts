import "server-only";

import type {
  GoogleCapabilities,
  GoogleCapabilityId,
  PublicProviderConfiguration
} from "@/types/providerStack";
import {
  DISABLED_GOOGLE_CAPABILITIES,
  resolveGoogleCapabilities
} from "@/lib/provider-stack/capabilities";

const capabilityEnvironmentNames: Record<GoogleCapabilityId, string> = {
  map: "LOCCO_GOOGLE_MAP_ENABLED",
  autocomplete: "LOCCO_GOOGLE_AUTOCOMPLETE_ENABLED",
  textSearch: "LOCCO_GOOGLE_TEXT_SEARCH_ENABLED",
  nearbySearch: "LOCCO_GOOGLE_NEARBY_SEARCH_ENABLED",
  detailsEssentials: "LOCCO_GOOGLE_DETAILS_ESSENTIALS_ENABLED",
  detailsPro: "LOCCO_GOOGLE_DETAILS_PRO_ENABLED",
  detailsEnterprise: "LOCCO_GOOGLE_DETAILS_ENTERPRISE_ENABLED",
  ratings: "LOCCO_GOOGLE_RATINGS_ENABLED",
  openingHours: "LOCCO_GOOGLE_OPENING_HOURS_ENABLED",
  photos: "LOCCO_GOOGLE_PHOTOS_ENABLED",
  geocoding: "LOCCO_GOOGLE_GEOCODING_ENABLED",
  routes: "LOCCO_GOOGLE_ROUTES_ENABLED",
  placeReconciliation: "LOCCO_GOOGLE_PLACE_RECONCILIATION_ENABLED"
};

function isExplicitlyEnabled(name: string) {
  return process.env[name] === "true";
}

export function getPublicProviderConfiguration(): PublicProviderConfiguration {
  const browserApiKey = process.env.GOOGLE_MAPS_BROWSER_API_KEY?.trim();
  const mapId = process.env.GOOGLE_MAPS_MAP_ID?.trim();
  const hasBrowserMapConfiguration = Boolean(browserApiKey && mapId);
  const hasServerCredential = Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim());
  const isKilled = isExplicitlyEnabled("LOCCO_GOOGLE_KILL_SWITCH");
  const requested = Object.fromEntries(
    (Object.keys(DISABLED_GOOGLE_CAPABILITIES) as GoogleCapabilityId[]).map(
      (capability) => [
        capability,
        isExplicitlyEnabled(capabilityEnvironmentNames[capability])
      ]
    )
  ) as GoogleCapabilities;
  const capabilities = resolveGoogleCapabilities({
    requested,
    hasBrowserMapConfiguration,
    hasServerCredential,
    isKilled
  });

  return {
    preferredStack: "google",
    google: {
      capabilities,
      map: capabilities.map
        ? {
            browserApiKey,
            mapId
          }
        : {}
    },
    developmentControlsEnabled:
      process.env.NODE_ENV !== "production" &&
      isExplicitlyEnabled("LOCCO_PROVIDER_DEV_CONTROLS_ENABLED")
  };
}
