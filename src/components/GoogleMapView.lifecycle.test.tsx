// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { foodPlaces } from "@/data/mockData";
import type { MergedPlace } from "@/types";

const lifecycleMocks = vi.hoisted(() => {
  const mapInstances: FakeMap[] = [];
  const markerInstances: FakeAdvancedMarker[] = [];
  const clustererInstances: FakeMarkerClusterer[] = [];

  class FakeMap {
    listener = { remove: vi.fn() };
    addListener = vi.fn(() => this.listener);
    getCenter = vi.fn(() => ({ lat: () => 1.302, lng: () => 103.84 }));
    getBounds = vi.fn(() => null);
    getZoom = vi.fn(() => 12);
    panTo = vi.fn();
    panBy = vi.fn();
    setZoom = vi.fn();

    constructor() {
      mapInstances.push(this);
    }
  }

  class FakeAdvancedMarker {
    map: google.maps.Map | null;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();

    constructor(options: google.maps.marker.AdvancedMarkerElementOptions = {}) {
      this.map = options.map ?? null;
      markerInstances.push(this);
    }
  }

  class FakeMarkerClusterer {
    clearMarkers = vi.fn();
    setMap = vi.fn();

    constructor({
      map,
      markers
    }: {
      map: google.maps.Map;
      markers: google.maps.marker.AdvancedMarkerElement[];
    }) {
      markers.forEach((marker) => {
        marker.map = map;
      });
      clustererInstances.push(this);
    }
  }

  return {
    mapInstances,
    markerInstances,
    clustererInstances,
    FakeMap,
    FakeAdvancedMarker,
    FakeMarkerClusterer,
    setOptions: vi.fn(),
    importLibrary: vi.fn(),
    clearInstanceListeners: vi.fn(),
    trigger: vi.fn()
  };
});

vi.mock("@googlemaps/js-api-loader", () => ({
  setOptions: lifecycleMocks.setOptions,
  importLibrary: lifecycleMocks.importLibrary
}));

vi.mock("@googlemaps/markerclusterer", () => ({
  MarkerClusterer: lifecycleMocks.FakeMarkerClusterer
}));

vi.mock("@/lib/map/loccoMarkerContent.client", () => ({
  createLoccoMarkerContent: () => document.createElement("div"),
  createLoccoClusterContent: () => document.createElement("div"),
  createLoccoReferencePointContent: () => document.createElement("div")
}));

import { GoogleMapView } from "@/components/GoogleMapView";

const places = foodPlaces.slice(0, 2).map<MergedPlace>((place) => ({
  ...place,
  selectedListIds: [...place.listIds],
  savedBySelected: []
}));

function renderRenderer(renderer: "google" | "fallback", visiblePlaces: MergedPlace[]): ReactNode {
  if (renderer === "fallback") {
    return createElement("div", { "data-testid": "fallback-map" });
  }

  return createElement(GoogleMapView, {
    apiKey: "public-browser-key",
    mapId: "locco-map-id",
    places: visiblePlaces,
    highlightedIds: [],
    savedPlaceIds: new Set<string>(),
    selectedPlace: null,
    placeSheetSnapState: "mid",
    referencePoint: null,
    viewport: {
      center: { latitude: 1.302, longitude: 103.84 },
      zoom: 12
    },
    cameraIntent: { kind: "rest" },
    onViewportChange: vi.fn(),
    onSelectPlace: vi.fn(),
    onReady: vi.fn(),
    onFatalError: vi.fn()
  });
}

async function renderAndSettle(root: Root, node: ReactNode) {
  await act(async () => {
    root.render(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  class FakeResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver = FakeResizeObserver;
  Object.defineProperty(globalThis, "google", {
    configurable: true,
    value: {
      maps: {
        event: {
          clearInstanceListeners: lifecycleMocks.clearInstanceListeners,
          trigger: lifecycleMocks.trigger
        }
      }
    }
  });

  lifecycleMocks.importLibrary.mockImplementation(async (library: string) => {
    if (library === "maps") {
      return { Map: lifecycleMocks.FakeMap };
    }
    if (library === "marker") {
      return { AdvancedMarkerElement: lifecycleMocks.FakeAdvancedMarker };
    }
    throw new Error(`Unexpected Google library: ${library}`);
  });
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("Google renderer component lifecycle", () => {
  it("cleans marker and cluster resources across prop replacement, fallback, and return", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await renderAndSettle(root, renderRenderer("google", [places[0]]));

    expect(lifecycleMocks.mapInstances).toHaveLength(1);
    expect(lifecycleMocks.markerInstances).toHaveLength(1);
    expect(lifecycleMocks.clustererInstances).toHaveLength(1);

    const firstMarker = lifecycleMocks.markerInstances[0];
    const firstClusterer = lifecycleMocks.clustererInstances[0];
    const firstListener = firstMarker.addEventListener.mock.calls[0]?.[1];

    expect(firstMarker.addEventListener).toHaveBeenCalledWith("gmp-click", firstListener);

    await renderAndSettle(root, renderRenderer("google", [places[1]]));

    expect(firstMarker.removeEventListener).toHaveBeenCalledWith(
      "gmp-click",
      firstListener
    );
    expect(firstMarker.map).toBeNull();
    expect(firstClusterer.clearMarkers).toHaveBeenCalledTimes(1);
    expect(firstClusterer.setMap).toHaveBeenCalledWith(null);
    expect(lifecycleMocks.mapInstances).toHaveLength(1);
    expect(lifecycleMocks.markerInstances).toHaveLength(2);
    expect(lifecycleMocks.clustererInstances).toHaveLength(2);

    const secondMarker = lifecycleMocks.markerInstances[1];
    const secondClusterer = lifecycleMocks.clustererInstances[1];
    const secondListener = secondMarker.addEventListener.mock.calls[0]?.[1];
    const firstMap = lifecycleMocks.mapInstances[0];

    await renderAndSettle(root, renderRenderer("fallback", []));

    expect(container.querySelector('[data-testid="fallback-map"]')).not.toBeNull();
    expect(secondMarker.removeEventListener).toHaveBeenCalledWith(
      "gmp-click",
      secondListener
    );
    expect(secondMarker.map).toBeNull();
    expect(secondClusterer.clearMarkers).toHaveBeenCalled();
    expect(secondClusterer.setMap).toHaveBeenCalledWith(null);
    expect(firstMap.listener.remove).toHaveBeenCalledTimes(1);
    expect(lifecycleMocks.clearInstanceListeners).toHaveBeenCalledWith(firstMap);

    await renderAndSettle(root, renderRenderer("google", [places[0]]));

    expect(lifecycleMocks.setOptions).toHaveBeenCalledTimes(1);
    expect(lifecycleMocks.importLibrary).toHaveBeenCalledTimes(2);
    expect(lifecycleMocks.mapInstances).toHaveLength(2);
    expect(lifecycleMocks.markerInstances).toHaveLength(3);
    expect(lifecycleMocks.clustererInstances).toHaveLength(3);
    lifecycleMocks.markerInstances.forEach((marker) => {
      expect(marker.addEventListener).toHaveBeenCalledTimes(1);
    });

    const returnedMarker = lifecycleMocks.markerInstances[2];
    const returnedClusterer = lifecycleMocks.clustererInstances[2];
    const returnedMap = lifecycleMocks.mapInstances[1];
    const returnedListener = returnedMarker.addEventListener.mock.calls[0]?.[1];

    await act(async () => {
      root.unmount();
    });

    expect(returnedMarker.removeEventListener).toHaveBeenCalledWith(
      "gmp-click",
      returnedListener
    );
    expect(returnedMarker.map).toBeNull();
    expect(returnedClusterer.clearMarkers).toHaveBeenCalled();
    expect(returnedClusterer.setMap).toHaveBeenCalledWith(null);
    expect(returnedMap.listener.remove).toHaveBeenCalledTimes(1);
    expect(lifecycleMocks.clearInstanceListeners).toHaveBeenCalledWith(returnedMap);
  });
});
