// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { foodLists, foodPlaces } from "@/data/mockData";
import type { MapRendererCommonProps, PublicProviderConfiguration } from "@/types";
import { DISABLED_GOOGLE_CAPABILITIES } from "@/lib/provider-stack/capabilities";

const fallbackMocks = vi.hoisted(() => ({
  loadGoogleMapsLibraries: vi.fn(),
  replace: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: fallbackMocks.replace }),
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/lib/google/mapsLoader.client", () => ({
  loadGoogleMapsLibraries: fallbackMocks.loadGoogleMapsLibraries
}));

vi.mock("@/components/MapView", async () => {
  const React = await import("react");
  const { GoogleMapView } = await import("@/components/GoogleMapView");

  return {
    MapView: ({
      renderer,
      googleMapConfiguration,
      ...rendererProps
    }: {
      renderer: "google" | "maplibre";
      googleMapConfiguration: {
        browserApiKey?: string;
        mapId?: string;
      };
    } & MapRendererCommonProps) =>
      renderer === "google"
        ? React.createElement(GoogleMapView, {
            ...rendererProps,
            apiKey: googleMapConfiguration.browserApiKey,
            mapId: googleMapConfiguration.mapId
          })
        : React.createElement("div", { "data-testid": "fallback-map" })
  };
});

import { FoodMapApp } from "@/components/FoodMapApp";

const providerConfiguration: PublicProviderConfiguration = {
  preferredStack: "google",
  developmentControlsEnabled: false,
  google: {
    capabilities: {
      ...DISABLED_GOOGLE_CAPABILITIES,
      map: true
    },
    map: {
      browserApiKey: "public-browser-key",
      mapId: "locco-map-id"
    }
  }
};

beforeAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("Google fatal-loader fallback boundary", () => {
  it("renders the fallback map after the Google loader rejects", async () => {
    fallbackMocks.loadGoogleMapsLibraries.mockRejectedValueOnce(
      new Error("sanitized loader failure")
    );
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(FoodMapApp, {
          foodLists,
          foodPlaces,
          providerConfiguration
        })
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fallbackMocks.loadGoogleMapsLibraries).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="fallback-map"]')).not.toBeNull();
    expect(container.textContent).toContain(
      "Google Maps was unavailable. Locco switched to its fallback map."
    );

    await act(async () => {
      root.unmount();
    });
  });
});
