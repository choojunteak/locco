import type { LocationSearchResult, MergedPlace } from "@/types";

export type MapSheetSnapState = "minimized" | "mid" | "expanded";

export type MapViewport = {
  center: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
  bounds?: {
    north: number;
    east: number;
    south: number;
    west: number;
  };
};

export type MapCameraInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MapCameraIntent =
  | { kind: "rest" }
  | { kind: "focus-place"; placeId: string }
  | { kind: "focus-reference"; referenceKey: string };

export type TransientGoogleMapResult = {
  kind: "google-transient";
  externalPlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type MapRendererFatalError = {
  renderer: "google" | "maplibre";
  code: "initialization" | "script" | "configuration";
  message: string;
};

export type MapRendererCommonProps = {
  places: MergedPlace[];
  highlightedIds: string[];
  savedPlaceIds: ReadonlySet<string>;
  selectedPlace: MergedPlace | null;
  placeSheetSnapState: MapSheetSnapState;
  referencePoint: LocationSearchResult | null;
  viewport: MapViewport;
  cameraIntent: MapCameraIntent;
  onViewportChange: (viewport: MapViewport) => void;
  onSelectPlace: (place: MergedPlace) => void;
  onReady?: () => void;
  onFatalError?: (error: MapRendererFatalError) => void;
};
