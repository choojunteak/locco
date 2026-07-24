"use client";

import dynamic from "next/dynamic";
import type {
  MapRendererCommonProps,
  PublicGoogleMapConfiguration
} from "@/types";
import { MapLibreMapView } from "@/components/MapLibreMapView";

const GoogleMapView = dynamic(
  () =>
    import("@/components/GoogleMapView").then((module) => ({
      default: module.GoogleMapView
    })),
  {
    ssr: false,
    loading: () => <div className="h-full min-h-0 w-full bg-[#FFF1B5]/30" />
  }
);

type Props = MapRendererCommonProps & {
  renderer: "google" | "maplibre";
  googleMapConfiguration: PublicGoogleMapConfiguration;
};

export function MapView({
  renderer,
  googleMapConfiguration,
  ...rendererProps
}: Props) {
  if (renderer === "google") {
    return (
      <GoogleMapView
        {...rendererProps}
        apiKey={googleMapConfiguration.browserApiKey}
        mapId={googleMapConfiguration.mapId}
      />
    );
  }

  return <MapLibreMapView {...rendererProps} />;
}
