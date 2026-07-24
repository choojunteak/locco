import { describe, expect, it } from "vitest";
import type {
  GoogleCapabilities,
  ProviderStackHealth,
  PublicProviderConfiguration
} from "@/types";
import {
  FALLBACK_PROVIDER_STACK,
  GOOGLE_PROVIDER_STACK,
  resolveProviderStack
} from "@/lib/provider-stack/stacks";

const disabledCapabilities: GoogleCapabilities = {
  map: false,
  autocomplete: false,
  textSearch: false,
  nearbySearch: false,
  detailsEssentials: false,
  detailsPro: false,
  detailsEnterprise: false,
  ratings: false,
  openingHours: false,
  photos: false,
  geocoding: false,
  routes: false,
  placeReconciliation: false
};

const healthy: ProviderStackHealth = { googleMap: "healthy" };

function configuration(
  overrides: Partial<PublicProviderConfiguration["google"]> = {}
): PublicProviderConfiguration {
  return {
    preferredStack: "google",
    developmentControlsEnabled: false,
    google: {
      capabilities: disabledCapabilities,
      map: {},
      ...overrides
    }
  };
}

describe("provider stack resolution", () => {
  it("fails closed to MapLibre when the Google map capability is disabled", () => {
    expect(resolveProviderStack({ configuration: configuration(), health: healthy })).toEqual({
      stack: FALLBACK_PROVIDER_STACK,
      reason: "google-map-disabled"
    });
  });

  it("uses the complete Google stack only when map capability and public config are present", () => {
    const result = resolveProviderStack({
      configuration: configuration({
        capabilities: { ...disabledCapabilities, map: true },
        map: { browserApiKey: "public-browser-key", mapId: "locco-map-id" }
      }),
      health: healthy
    });

    expect(result).toEqual({
      stack: GOOGLE_PROVIDER_STACK,
      reason: "google-ready"
    });
    expect(result.stack.renderer).toBe("google");
    expect(result.stack.acceptsGoogleTransientResults).toBe(true);
  });

  it("falls back only for a fatal Google renderer health state", () => {
    const config = configuration({
      capabilities: { ...disabledCapabilities, map: true },
      map: { browserApiKey: "public-browser-key", mapId: "locco-map-id" }
    });

    expect(
      resolveProviderStack({
        configuration: config,
        health: { googleMap: "fatal" }
      })
    ).toEqual({
      stack: FALLBACK_PROVIDER_STACK,
      reason: "google-map-fatal"
    });
  });

  it("does not let a development preference bypass missing capabilities", () => {
    const config = {
      ...configuration(),
      developmentControlsEnabled: true
    };

    expect(
      resolveProviderStack({
        configuration: config,
        health: healthy,
        preference: "google"
      }).stack
    ).toEqual(FALLBACK_PROVIDER_STACK);
  });

  it("keeps transient Google results out of the fallback renderer contract", () => {
    expect(GOOGLE_PROVIDER_STACK.acceptsGoogleTransientResults).toBe(true);
    expect(FALLBACK_PROVIDER_STACK.acceptsGoogleTransientResults).toBe(false);
    expect(FALLBACK_PROVIDER_STACK.renderer).toBe("maplibre");
    expect(FALLBACK_PROVIDER_STACK.discoveryProvider).toBe("onemap");
  });
});
